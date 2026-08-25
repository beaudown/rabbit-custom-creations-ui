import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFile, spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

function listen(server, port) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });
}

async function waitForBroker(url, token) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < 5000) {
    try {
      const response = await fetch(`${url}/imessage/health`, {
        headers: { "x-imessage-broker-token": token },
      });
      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError || new Error("iMessage broker health check timed out");
}

test("iMessage Hermes broker stages, describes, and forwards without sending by default", async () => {
  const repoRoot = fileURLToPath(new URL("..", import.meta.url));
  const stateRoot = await mkdtemp(join(tmpdir(), "imessage-broker-state-"));
  const attachmentPath = join(stateRoot, "photo.jpg");
  const tokenPath = join(stateRoot, "imessage-token.txt");
  const token = "imessage-test-token";
  await writeFile(attachmentPath, "fake-image");
  await writeFile(tokenPath, `${token}\n`);
  const hermesPort = 23100 + Math.floor(Math.random() * 1000);
  const brokerPort = 24100 + Math.floor(Math.random() * 1000);
  const hermesRequests = [];

  const hermes = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString("utf8");
    const parsed = body ? JSON.parse(body) : {};
    hermesRequests.push({ method: request.method, path: request.url, body: parsed });
    response.writeHead(200, { "content-type": "application/json" });
    if (request.url === "/agent/describe-attachment") {
      response.end(JSON.stringify({ description: "Hermes sees a small test image attachment." }));
    } else {
      response.end(JSON.stringify({ ok: true, acceptedBy: "hermes-test" }));
    }
  });

  await listen(hermes, hermesPort);

  const child = spawn(process.execPath, [join(repoRoot, "scripts/imessage-hermes-broker.mjs")], {
    cwd: repoRoot,
    env: {
      ...process.env,
      IMESSAGE_BROKER_HOST: "127.0.0.1",
      IMESSAGE_BROKER_PORT: String(brokerPort),
      IMESSAGE_BROKER_TOKEN_FILE: tokenPath,
      IMESSAGE_BROKER_STATE_ROOT: stateRoot,
      HERMES_IMESSAGE_UPSTREAM: `http://127.0.0.1:${hermesPort}`,
    },
    stdio: "ignore",
  });

  const baseUrl = `http://127.0.0.1:${brokerPort}`;

  try {
    const health = await waitForBroker(baseUrl, token);
    assert.equal(health.role, "imessage_hermes_rabbit_gateway_bridge");
    assert.equal(health.macMessagesSendEnabled, false);
    assert.equal(health.hermesUpstreamConfigured, true);
    assert.equal(health.tokenSource, "local_token_file");
    assert.ok(health.routes.includes("GET /imessage/messages"));
    assert.ok(health.routes.includes("GET /imessage/contacts"));

    const blocked = await fetch(`${baseUrl}/imessage/health`);
    assert.equal(blocked.status, 401);

    const inboundResponse = await fetch(`${baseUrl}/imessage/inbound`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-imessage-broker-token": token,
      },
      body: JSON.stringify({
        requestId: "inbound-001",
        conversationId: "chat-1",
        from: "+15555550100",
        text: "What is this?",
        attachments: [
          {
            id: "att-1",
            name: "photo.jpg",
            mimeType: "image/jpeg",
            path: attachmentPath,
          },
        ],
      }),
    });
    assert.equal(inboundResponse.status, 202);
    const inbound = await inboundResponse.json();
    assert.equal(inbound.status, "forwarded_to_hermes");
    assert.equal(inbound.hermesForwarded, true);
    assert.equal(inbound.privilegedExecutionPerformed, false);
    assert.equal(hermesRequests[0].path, "/agent/describe-attachment");
    assert.equal(hermesRequests[1].path, "/rabbit-gateway/imessage");
    assert.equal(hermesRequests[1].body.attachmentSummary[0].description, "Hermes sees a small test image attachment.");
    assert.equal(inbound.storedMessage.requestId, "inbound-001");

    const messagesResponse = await fetch(`${baseUrl}/imessage/messages?limit=10`, {
      headers: {
        "x-imessage-broker-token": token,
      },
    });
    assert.equal(messagesResponse.status, 200);
    const messages = await messagesResponse.json();
    assert.equal(messages.status, "ok");
    assert.equal(messages.source, "broker_captured_inbound_messages");
    assert.equal(messages.messages.length, 1);
    assert.equal(messages.messages[0].requestId, "inbound-001");
    assert.equal(messages.messages[0].text, "What is this?");
    assert.equal(messages.messages[0].attachmentSummary[0].descriptionSource, "hermes_agent");

    const emptyMessagesResponse = await fetch(`${baseUrl}/imessage/messages?since=${messages.nextCursor}`, {
      headers: {
        "x-imessage-broker-token": token,
      },
    });
    assert.equal(emptyMessagesResponse.status, 200);
    const emptyMessages = await emptyMessagesResponse.json();
    assert.equal(emptyMessages.messages.length, 0);

    const sendResponse = await fetch(`${baseUrl}/imessage/hermes-response`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-imessage-broker-token": token,
      },
      body: JSON.stringify({
        requestId: "outbound-001",
        to: "+15555550100",
        text: "Rabbit response",
        attachments: [
          {
            id: "att-2",
            name: "diagram.png",
            mimeType: "image/png",
            description: "A diagram generated by Hermes.",
          },
        ],
      }),
    });
    assert.equal(sendResponse.status, 202);
    const send = await sendResponse.json();
    assert.equal(send.status, "dry_run_only");
    assert.equal(send.messagesSent, false);
    assert.match(send.preparedText, /Rabbit response/);
    assert.match(send.preparedText, /A diagram generated by Hermes/);

    const auditLog = await readFile(join(stateRoot, "public/broker/imessage-audit-log.jsonl"), "utf8");
    assert.match(auditLog, /inbound-001/);
    assert.match(auditLog, /outbound-001/);
  } finally {
    child.kill("SIGTERM");
    await new Promise((resolve) => hermes.close(resolve));
    await rm(stateRoot, { recursive: true, force: true });
  }
});

test("iMessage Hermes broker can expose tokenless reads while protecting real sends", async () => {
  const repoRoot = fileURLToPath(new URL("..", import.meta.url));
  const stateRoot = await mkdtemp(join(tmpdir(), "imessage-broker-open-state-"));
  const tokenPath = join(stateRoot, "imessage-token.txt");
  const token = "send-still-needs-token";
  await writeFile(tokenPath, `${token}\n`);
  const brokerPort = 25100 + Math.floor(Math.random() * 1000);

  const child = spawn(process.execPath, [join(repoRoot, "scripts/imessage-hermes-broker.mjs")], {
    cwd: repoRoot,
    env: {
      ...process.env,
      IMESSAGE_BROKER_HOST: "127.0.0.1",
      IMESSAGE_BROKER_PORT: String(brokerPort),
      IMESSAGE_BROKER_TOKEN_FILE: tokenPath,
      IMESSAGE_BROKER_REQUIRE_TOKEN: "false",
      IMESSAGE_BROKER_REQUIRE_SEND_TOKEN: "true",
      IMESSAGE_BROKER_ALLOW_SEND: "true",
      IMESSAGE_BROKER_STATE_ROOT: stateRoot,
      HERMES_IMESSAGE_UPSTREAM: "",
    },
    stdio: "ignore",
  });

  const baseUrl = `http://127.0.0.1:${brokerPort}`;

  try {
    const started = Date.now();
    let health;
    while (Date.now() - started < 5000) {
      const response = await fetch(`${baseUrl}/imessage/health`).catch(() => null);
      if (response?.ok) {
        health = await response.json();
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.equal(health?.accessMode, "tailnet_read_no_token_send_token_required");
    assert.equal(health.requiresAuth, false);
    assert.equal(health.readRequiresAuth, false);
    assert.equal(health.sendRequiresAuth, true);
    assert.equal(health.tokenSource, "disabled_for_tailnet_read_mode");

    const messagesResponse = await fetch(`${baseUrl}/imessage/messages?limit=1`);
    assert.equal(messagesResponse.status, 200);
    const messages = await messagesResponse.json();
    assert.equal(messages.status, "ok");

    const unauthenticatedSend = await fetch(`${baseUrl}/imessage/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to: "+15555550100", text: "blocked" }),
    });
    assert.equal(unauthenticatedSend.status, 401);
  } finally {
    child.kill("SIGTERM");
    await rm(stateRoot, { recursive: true, force: true });
  }
});

test("iMessage Hermes broker reads recent Messages threads with sent and received limits", async () => {
  const repoRoot = fileURLToPath(new URL("..", import.meta.url));
  const stateRoot = await mkdtemp(join(tmpdir(), "imessage-broker-db-state-"));
  const dbPath = join(stateRoot, "chat.db");
  const contactsDbPath = join(stateRoot, "AddressBook-v22.abcddb");
  const tokenPath = join(stateRoot, "imessage-token.txt");
  const token = "thread-db-token";
  await writeFile(tokenPath, `${token}\n`);
  const brokerPort = 26100 + Math.floor(Math.random() * 1000);

  await execFileAsync("sqlite3", [dbPath, `
CREATE TABLE chat (ROWID INTEGER PRIMARY KEY, guid TEXT, chat_identifier TEXT, display_name TEXT, service_name TEXT);
CREATE TABLE handle (ROWID INTEGER PRIMARY KEY, id TEXT);
CREATE TABLE message (
  ROWID INTEGER PRIMARY KEY,
  guid TEXT,
  text TEXT,
  handle_id INTEGER,
  date INTEGER,
  is_from_me INTEGER,
  is_empty INTEGER DEFAULT 0,
  is_system_message INTEGER DEFAULT 0,
  is_sent INTEGER DEFAULT 0,
  is_read INTEGER DEFAULT 0,
  cache_has_attachments INTEGER DEFAULT 0
);
CREATE TABLE chat_message_join (chat_id INTEGER, message_id INTEGER, message_date INTEGER);
INSERT INTO chat VALUES (1, 'chat-guid-1', 'iMessage;-;chat-guid-1', 'Test Thread', 'iMessage');
INSERT INTO handle VALUES (1, '+15555550100');
INSERT INTO message VALUES (1, 'recv-old', 'received old', 1, 700000000000000000, 0, 0, 0, 0, 1, 0);
INSERT INTO message VALUES (2, 'recv-new', 'received new', 1, 700000001000000000, 0, 0, 0, 0, 1, 0);
INSERT INTO message VALUES (3, 'sent-old', 'sent old', 0, 700000002000000000, 1, 0, 0, 1, 1, 0);
INSERT INTO message VALUES (4, 'sent-new', 'sent new', 0, 700000003000000000, 1, 0, 0, 1, 1, 0);
INSERT INTO chat_message_join VALUES (1, 1, 700000000000000000);
INSERT INTO chat_message_join VALUES (1, 2, 700000001000000000);
INSERT INTO chat_message_join VALUES (1, 3, 700000002000000000);
INSERT INTO chat_message_join VALUES (1, 4, 700000003000000000);
CREATE TABLE chat_handle_join (chat_id INTEGER, handle_id INTEGER);
INSERT INTO chat_handle_join VALUES (1, 1);
`]);

  await execFileAsync("sqlite3", [contactsDbPath, `
CREATE TABLE ZABCDRECORD (
  Z_PK INTEGER PRIMARY KEY,
  ZISALL INTEGER DEFAULT 0,
  ZFIRSTNAME VARCHAR,
  ZLASTNAME VARCHAR,
  ZORGANIZATION VARCHAR,
  ZNAME VARCHAR,
  ZNICKNAME VARCHAR
);
CREATE TABLE ZABCDPHONENUMBER (
  ZOWNER INTEGER,
  Z22_OWNER INTEGER,
  ZFULLNUMBER VARCHAR,
  ZLABEL VARCHAR,
  ZISPRIMARY INTEGER
);
CREATE TABLE ZABCDEMAILADDRESS (
  ZOWNER INTEGER,
  Z22_OWNER INTEGER,
  ZADDRESS VARCHAR,
  ZLABEL VARCHAR,
  ZISPRIMARY INTEGER
);
INSERT INTO ZABCDRECORD VALUES (1, 0, 'Jason', 'Fields', NULL, NULL, NULL);
INSERT INTO ZABCDPHONENUMBER VALUES (1, NULL, '+15555550100', '_$!<Mobile>!$_', 1);
`]);

  const child = spawn(process.execPath, [join(repoRoot, "scripts/imessage-hermes-broker.mjs")], {
    cwd: repoRoot,
    env: {
      ...process.env,
      IMESSAGE_BROKER_HOST: "127.0.0.1",
      IMESSAGE_BROKER_PORT: String(brokerPort),
      IMESSAGE_BROKER_TOKEN_FILE: tokenPath,
      IMESSAGE_BROKER_STATE_ROOT: stateRoot,
      IMESSAGE_BROKER_MESSAGES_DB: dbPath,
      IMESSAGE_BROKER_CONTACTS_DB: contactsDbPath,
      HERMES_IMESSAGE_UPSTREAM: "",
    },
    stdio: "ignore",
  });

  const baseUrl = `http://127.0.0.1:${brokerPort}`;

  try {
    await waitForBroker(baseUrl, token);

    const blocked = await fetch(`${baseUrl}/imessage/threads?threadLimit=15&perDirection=1`);
    assert.equal(blocked.status, 401);

    const response = await fetch(`${baseUrl}/imessage/threads?threadLimit=15&perDirection=1`, {
      headers: { "x-imessage-broker-token": token },
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.source, "macos_messages_database_read_only");
    assert.equal(body.threadLimit, 15);
    assert.equal(body.perDirection, 1);
    assert.equal(body.contacts.status, "ok");
    assert.equal(body.contacts.matchedThreadCount, 1);
    assert.equal(body.threads.length, 1);
    assert.equal(body.threads[0].displayName, "Jason Fields");
    assert.equal(body.threads[0].contactName, "Jason Fields");
    assert.equal(body.threads[0].contactMatchedHandle, "+15555550100");
    assert.equal(body.threads[0].received.length, 1);
    assert.equal(body.threads[0].sent.length, 1);
    assert.equal(body.threads[0].received[0].text, "received new");
    assert.equal(body.threads[0].sent[0].text, "sent new");
  } finally {
    child.kill("SIGTERM");
    await rm(stateRoot, { recursive: true, force: true });
  }
});

test("iMessage Hermes broker searches macOS contacts handles read-only", async () => {
  const repoRoot = fileURLToPath(new URL("..", import.meta.url));
  const stateRoot = await mkdtemp(join(tmpdir(), "imessage-broker-contacts-state-"));
  const contactsDbPath = join(stateRoot, "AddressBook-v22.abcddb");
  const tokenPath = join(stateRoot, "imessage-token.txt");
  const token = "contacts-token";
  await writeFile(tokenPath, `${token}\n`);
  const brokerPort = 27100 + Math.floor(Math.random() * 1000);

  await execFileAsync("sqlite3", [contactsDbPath, `
CREATE TABLE ZABCDRECORD (
  Z_PK INTEGER PRIMARY KEY,
  ZISALL INTEGER DEFAULT 0,
  ZFIRSTNAME VARCHAR,
  ZLASTNAME VARCHAR,
  ZORGANIZATION VARCHAR,
  ZNAME VARCHAR,
  ZNICKNAME VARCHAR
);
CREATE TABLE ZABCDPHONENUMBER (
  ZOWNER INTEGER,
  Z22_OWNER INTEGER,
  ZFULLNUMBER VARCHAR,
  ZLABEL VARCHAR,
  ZISPRIMARY INTEGER
);
CREATE TABLE ZABCDEMAILADDRESS (
  ZOWNER INTEGER,
  Z22_OWNER INTEGER,
  ZADDRESS VARCHAR,
  ZLABEL VARCHAR,
  ZISPRIMARY INTEGER
);
INSERT INTO ZABCDRECORD VALUES (1, 0, 'Jason', 'Fields', NULL, NULL, NULL);
INSERT INTO ZABCDPHONENUMBER VALUES (1, NULL, '+15555550123', '_$!<Mobile>!$_', 1);
INSERT INTO ZABCDEMAILADDRESS VALUES (1, NULL, 'jason@example.com', '_$!<Home>!$_', 0);
`]);

  const child = spawn(process.execPath, [join(repoRoot, "scripts/imessage-hermes-broker.mjs")], {
    cwd: repoRoot,
    env: {
      ...process.env,
      IMESSAGE_BROKER_HOST: "127.0.0.1",
      IMESSAGE_BROKER_PORT: String(brokerPort),
      IMESSAGE_BROKER_TOKEN_FILE: tokenPath,
      IMESSAGE_BROKER_STATE_ROOT: stateRoot,
      IMESSAGE_BROKER_CONTACTS_DB: contactsDbPath,
      HERMES_IMESSAGE_UPSTREAM: "",
    },
    stdio: "ignore",
  });

  const baseUrl = `http://127.0.0.1:${brokerPort}`;

  try {
    await waitForBroker(baseUrl, token);
    const response = await fetch(`${baseUrl}/imessage/contacts?q=Jason&limit=10`, {
      headers: { "x-imessage-broker-token": token },
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.source, "macos_contacts_database_read_only");
    assert.equal(body.contacts.length, 1);
    assert.equal(body.contacts[0].displayName, "Jason Fields");
    assert.deepEqual(
      body.contacts[0].handles.map((handle) => handle.value).sort(),
      ["+15555550123", "jason@example.com"],
    );
    assert.equal(body.contacts[0].handles[0].label, "Mobile");
  } finally {
    child.kill("SIGTERM");
    await rm(stateRoot, { recursive: true, force: true });
  }
});
