import { createServer } from "node:http";
import { execFile, spawn } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { readFileSync, readdirSync } from "node:fs";
import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import { hostname, homedir } from "node:os";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";

const port = Number.parseInt(process.env.IMESSAGE_BROKER_PORT || "8796", 10);
const host = process.env.IMESSAGE_BROKER_HOST || "127.0.0.1";
const brokerId = process.env.IMESSAGE_BROKER_ID || `imessage-hermes-${hostname()}`;
const tokenFile = process.env.IMESSAGE_BROKER_TOKEN_FILE || "";
const token = process.env.IMESSAGE_BROKER_TOKEN || "";
const requireToken = process.env.IMESSAGE_BROKER_REQUIRE_TOKEN !== "false";
const requireTokenForSend = process.env.IMESSAGE_BROKER_REQUIRE_SEND_TOKEN !== "false";
const stateRoot = process.env.IMESSAGE_BROKER_STATE_ROOT || process.cwd();
const allowSend = process.env.IMESSAGE_BROKER_ALLOW_SEND === "true";
const hermesUrl = (process.env.HERMES_IMESSAGE_UPSTREAM || "").replace(/\/$/, "");
const hermesMessagePath = process.env.HERMES_IMESSAGE_MESSAGE_PATH || "/rabbit-gateway/imessage";
const hermesDescribePath = process.env.HERMES_IMESSAGE_DESCRIBE_PATH || "/agent/describe-attachment";
const maxThumbnailBytes = Number.parseInt(process.env.IMESSAGE_BROKER_MAX_THUMBNAIL_BYTES || "350000", 10);
const messagesDbPath = process.env.IMESSAGE_BROKER_MESSAGES_DB || join(homedir(), "Library/Messages/chat.db");
const contactsDbPath = process.env.IMESSAGE_BROKER_CONTACTS_DB || defaultContactsDbPath();
const auditPath = join(stateRoot, "public/broker/imessage-audit-log.jsonl");
const messagesPath = join(stateRoot, "public/broker/imessage-messages.jsonl");
const execFileAsync = promisify(execFile);

function defaultContactsDbPath() {
  const addressBookRoot = join(homedir(), "Library/Application Support/AddressBook");
  const sourceRoot = join(addressBookRoot, "Sources");
  try {
    for (const source of readdirSync(sourceRoot)) {
      const sourceDb = join(sourceRoot, source, "AddressBook-v22.abcddb");
      if (existsSync(sourceDb)) {
        return sourceDb;
      }
    }
  } catch {
    // Fall through to the top-level Contacts database used on some macOS installs.
  }
  return join(addressBookRoot, "AddressBook-v22.abcddb");
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "access-control-allow-headers": "content-type, x-imessage-broker-token",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
    "content-type": "application/json",
  });
  response.end(JSON.stringify(body, null, 2));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  if (!chunks.length) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function tokenMatches(request, url) {
  const activeToken = getBrokerToken();
  if (!activeToken) {
    return true;
  }
  return request.headers["x-imessage-broker-token"] === activeToken || url.searchParams.get("token") === activeToken;
}

function requestRequiresAuth(request, url) {
  const isSendRequest =
    request.method === "POST" && ["/imessage/send", "/imessage/hermes-response"].includes(url.pathname);
  return isSendRequest && allowSend && requireTokenForSend && Boolean(getBrokerToken())
    ? true
    : requireToken && Boolean(getBrokerToken());
}

function hasAuth(request, url) {
  return !requestRequiresAuth(request, url) || tokenMatches(request, url);
}

function getBrokerToken() {
  if (tokenFile) {
    try {
      return readFileSync(tokenFile, "utf8").trim();
    } catch {
      return "";
    }
  }
  return token;
}

async function appendAudit(action, status, detail, requestId = null) {
  await mkdir(join(stateRoot, "public/broker"), { recursive: true });
  const record = {
    id: `imsg-audit-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${randomUUID().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
    brokerId,
    source: "imessage-hermes-broker",
    action,
    status,
    detail,
    requestId,
    result: {
      messagesSent: allowSend && status === "sent",
      hermesForwarded: status === "forwarded_to_hermes",
      privilegedExecutionPerformed: false,
      persistentRabbitChange: false,
      secretsExposed: false,
    },
  };
  await writeFile(auditPath, `${JSON.stringify(record)}\n`, { flag: "a" });
  return record;
}

async function appendMessageRecord(payload, deliveryStatus) {
  await mkdir(join(stateRoot, "public/broker"), { recursive: true });
  const record = {
    cursor: `${Date.now()}-${randomUUID().slice(0, 8)}`,
    storedAt: new Date().toISOString(),
    deliveryStatus,
    ...payload,
  };
  await writeFile(messagesPath, `${JSON.stringify(record)}\n`, { flag: "a" });
  return record;
}

async function readMessageRecords({ since = "", limit = 25, conversationId = "" } = {}) {
  let text = "";
  try {
    text = await readFile(messagesPath, "utf8");
  } catch {
    return {
      messages: [],
      nextCursor: since || null,
      hasMore: false,
    };
  }

  const max = Math.min(Math.max(Number.parseInt(String(limit), 10) || 25, 1), 100);
  const records = text
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((record) => !since || String(record.cursor) > String(since))
    .filter((record) => !conversationId || record.conversationId === conversationId)
    .sort((a, b) => String(a.cursor).localeCompare(String(b.cursor)));
  const page = records.slice(0, max);
  return {
    messages: page,
    nextCursor: page.at(-1)?.cursor || since || null,
    hasMore: records.length > page.length,
  };
}

function parseBoundedInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

function normalizeAppleMessageDate(value) {
  const raw = Number(value || 0);
  if (!raw) {
    return null;
  }
  const appleEpochMs = 978307200000;
  const messageMs = raw > 1000000000000 ? Math.floor(raw / 1000000) : raw * 1000;
  return new Date(appleEpochMs + messageMs).toISOString();
}

function sqlStringLiteral(value) {
  return `'${String(value || "").replaceAll("'", "''")}'`;
}

function normalizeContactLabel(value) {
  return String(value || "")
    .replace(/^_\$!<|>!\$_$/g, "")
    .replace(/^_\$!<|>!\$_/g, "")
    .replace(/^_+|_+$/g, "")
    .replaceAll("_", " ")
    .trim();
}

async function searchContacts({ q = "", limit = 40 } = {}) {
  const safeLimit = parseBoundedInteger(limit, 40, 1, 100);
  const query = String(q || "").trim();
  const like = `%${query.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  const filter = query
    ? `AND (
        COALESCE(r.ZFIRSTNAME, '') || ' ' || COALESCE(r.ZLASTNAME, '') LIKE ${sqlStringLiteral(like)} ESCAPE '\\'
        OR COALESCE(r.ZORGANIZATION, '') LIKE ${sqlStringLiteral(like)} ESCAPE '\\'
        OR COALESCE(r.ZNAME, '') LIKE ${sqlStringLiteral(like)} ESCAPE '\\'
        OR h.value LIKE ${sqlStringLiteral(like)} ESCAPE '\\'
      )`
    : "";
  const sql = `
WITH handles AS (
  SELECT COALESCE(ZOWNER, Z22_OWNER) AS owner, ZFULLNUMBER AS value, ZLABEL AS label, ZISPRIMARY AS is_primary, 'phone' AS kind
  FROM ZABCDPHONENUMBER
  WHERE ZFULLNUMBER IS NOT NULL AND TRIM(ZFULLNUMBER) != ''
  UNION ALL
  SELECT COALESCE(ZOWNER, Z22_OWNER) AS owner, ZADDRESS AS value, ZLABEL AS label, ZISPRIMARY AS is_primary, 'email' AS kind
  FROM ZABCDEMAILADDRESS
  WHERE ZADDRESS IS NOT NULL AND TRIM(ZADDRESS) != ''
)
SELECT
  r.Z_PK AS contact_id,
  COALESCE(NULLIF(TRIM(COALESCE(r.ZFIRSTNAME, '') || ' ' || COALESCE(r.ZLASTNAME, '')), ''), r.ZORGANIZATION, r.ZNAME, r.ZNICKNAME, h.value) AS display_name,
  r.ZFIRSTNAME AS first_name,
  r.ZLASTNAME AS last_name,
  r.ZORGANIZATION AS organization,
  h.kind,
  h.value,
  h.label,
  h.is_primary
FROM ZABCDRECORD r
JOIN handles h ON h.owner = r.Z_PK
WHERE COALESCE(r.ZISALL, 0) = 0
  AND h.value IS NOT NULL
  ${filter}
ORDER BY LOWER(display_name), h.kind DESC, h.is_primary DESC, h.value
LIMIT ${safeLimit * 4};
`;

  const { stdout } = await execFileAsync("sqlite3", ["-readonly", "-json", contactsDbPath, sql], {
    maxBuffer: 1024 * 1024 * 10,
  });
  const rows = stdout.trim() ? JSON.parse(stdout) : [];
  const contacts = [];
  const byId = new Map();

  for (const row of rows) {
    const id = String(row.contact_id);
    if (!byId.has(id)) {
      const contact = {
        id,
        displayName: row.display_name || row.value,
        firstName: row.first_name || null,
        lastName: row.last_name || null,
        organization: row.organization || null,
        handles: [],
      };
      byId.set(id, contact);
      contacts.push(contact);
    }
    byId.get(id).handles.push({
      type: row.kind,
      value: row.value,
      label: normalizeContactLabel(row.label),
      primary: Boolean(row.is_primary),
    });
  }

  return {
    databasePath: contactsDbPath,
    query,
    limit: safeLimit,
    contacts: contacts.slice(0, safeLimit),
  };
}

function normalizeHandleLookupKey(value) {
  const handle = String(value || "").trim().toLowerCase();
  if (!handle) {
    return "";
  }
  if (handle.includes("@")) {
    return handle;
  }
  const digits = handle.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }
  return digits || handle;
}

async function contactNamesByHandle() {
  const sql = `
WITH handles AS (
  SELECT COALESCE(ZOWNER, Z22_OWNER) AS owner, ZFULLNUMBER AS value, ZLABEL AS label, ZISPRIMARY AS is_primary, 'phone' AS kind
  FROM ZABCDPHONENUMBER
  WHERE ZFULLNUMBER IS NOT NULL AND TRIM(ZFULLNUMBER) != ''
  UNION ALL
  SELECT COALESCE(ZOWNER, Z22_OWNER) AS owner, ZADDRESS AS value, ZLABEL AS label, ZISPRIMARY AS is_primary, 'email' AS kind
  FROM ZABCDEMAILADDRESS
  WHERE ZADDRESS IS NOT NULL AND TRIM(ZADDRESS) != ''
)
SELECT
  COALESCE(NULLIF(TRIM(COALESCE(r.ZFIRSTNAME, '') || ' ' || COALESCE(r.ZLASTNAME, '')), ''), r.ZORGANIZATION, r.ZNAME, r.ZNICKNAME, h.value) AS display_name,
  h.kind,
  h.value,
  h.label,
  h.is_primary
FROM ZABCDRECORD r
JOIN handles h ON h.owner = r.Z_PK
WHERE COALESCE(r.ZISALL, 0) = 0
  AND h.value IS NOT NULL;
`;
  const { stdout } = await execFileAsync("sqlite3", ["-readonly", "-json", contactsDbPath, sql], {
    maxBuffer: 1024 * 1024 * 20,
  });
  const rows = stdout.trim() ? JSON.parse(stdout) : [];
  const lookup = new Map();
  for (const row of rows) {
    const key = normalizeHandleLookupKey(row.value);
    if (!key || lookup.has(key)) {
      continue;
    }
    lookup.set(key, {
      displayName: row.display_name || row.value,
      handle: row.value,
      handleType: row.kind,
      handleLabel: normalizeContactLabel(row.label),
      primary: Boolean(row.is_primary),
    });
  }
  return lookup;
}

async function enrichThreadsWithContacts(threads) {
  let lookup;
  try {
    lookup = await contactNamesByHandle();
  } catch (error) {
    return {
      status: "unavailable",
      error: error instanceof Error ? error.message : "Unable to read Contacts database.",
      matchedThreadCount: 0,
    };
  }

  let matchedThreadCount = 0;
  for (const thread of threads) {
    const candidates = [
      thread.chatIdentifier,
      ...(thread.participantHandles || []),
      ...(thread.received || []).map((message) => message.handle),
    ];
    const match = candidates
      .map((candidate) => lookup.get(normalizeHandleLookupKey(candidate)))
      .find(Boolean);
    if (!match) {
      continue;
    }
    matchedThreadCount += 1;
    thread.contactName = match.displayName;
    thread.contactMatchedHandle = match.handle;
    thread.contactHandleType = match.handleType;
    thread.contactHandleLabel = match.handleLabel;
    thread.displayName = match.displayName;
  }

  return {
    status: "ok",
    matchedThreadCount,
  };
}

async function readRecentMessageThreads({ threadLimit = 15, perDirection = 25 } = {}) {
  const safeThreadLimit = parseBoundedInteger(threadLimit, 15, 1, 50);
  const safePerDirection = parseBoundedInteger(perDirection, 25, 1, 100);
  const sql = `
WITH recent_chats AS (
  SELECT
    c.ROWID AS chat_rowid,
    c.guid AS chat_guid,
    c.chat_identifier,
    c.display_name,
    c.service_name,
    (
      SELECT GROUP_CONCAT(h2.id, char(31))
      FROM chat_handle_join chj
      JOIN handle h2 ON h2.ROWID = chj.handle_id
      WHERE chj.chat_id = c.ROWID
    ) AS participant_handles,
    MAX(m.date) AS last_date
  FROM chat c
  JOIN chat_message_join cmj ON cmj.chat_id = c.ROWID
  JOIN message m ON m.ROWID = cmj.message_id
  WHERE COALESCE(m.is_empty, 0) = 0
    AND COALESCE(m.is_system_message, 0) = 0
  GROUP BY c.ROWID
  ORDER BY last_date DESC
  LIMIT ${safeThreadLimit}
),
ranked_messages AS (
  SELECT
    rc.chat_rowid,
    rc.chat_guid,
    rc.chat_identifier,
    rc.display_name,
    rc.service_name,
    rc.participant_handles,
    rc.last_date,
    m.ROWID AS message_rowid,
    m.guid AS message_guid,
    m.text,
    m.date,
    m.is_from_me,
    m.is_sent,
    m.is_read,
    m.cache_has_attachments,
    h.id AS handle,
    ROW_NUMBER() OVER (
      PARTITION BY rc.chat_rowid, m.is_from_me
      ORDER BY m.date DESC, m.ROWID DESC
    ) AS direction_rank
  FROM recent_chats rc
  JOIN chat_message_join cmj ON cmj.chat_id = rc.chat_rowid
  JOIN message m ON m.ROWID = cmj.message_id
  LEFT JOIN handle h ON h.ROWID = m.handle_id
  WHERE COALESCE(m.is_empty, 0) = 0
    AND COALESCE(m.is_system_message, 0) = 0
)
SELECT *
FROM ranked_messages
WHERE direction_rank <= ${safePerDirection}
ORDER BY last_date DESC, chat_rowid, date DESC, message_rowid DESC;
`;

  const { stdout } = await execFileAsync("sqlite3", ["-readonly", "-json", messagesDbPath, sql], {
    maxBuffer: 1024 * 1024 * 20,
  });
  const rows = stdout.trim() ? JSON.parse(stdout) : [];
  const threads = [];
  const byChat = new Map();

  for (const row of rows) {
    const chatKey = row.chat_guid || String(row.chat_rowid);
    if (!byChat.has(chatKey)) {
      const thread = {
        chatGuid: row.chat_guid,
        chatIdentifier: row.chat_identifier,
        participantHandles: String(row.participant_handles || "").split("\u001f").filter(Boolean),
        displayName: row.display_name || row.chat_identifier || row.chat_guid,
        serviceName: row.service_name,
        lastMessageAt: normalizeAppleMessageDate(row.last_date),
        receivedLimit: safePerDirection,
        sentLimit: safePerDirection,
        received: [],
        sent: [],
      };
      byChat.set(chatKey, thread);
      threads.push(thread);
    }
    const message = {
      guid: row.message_guid,
      rowId: row.message_rowid,
      at: normalizeAppleMessageDate(row.date),
      direction: Number(row.is_from_me) === 1 ? "sent" : "received",
      handle: Number(row.is_from_me) === 1 ? "me" : row.handle,
      text: row.text || "",
      textAvailable: Boolean(row.text),
      isRead: Boolean(row.is_read),
      isSent: Boolean(row.is_sent),
      hasAttachments: Boolean(row.cache_has_attachments),
    };
    byChat.get(chatKey)[message.direction].push(message);
  }
  const contacts = await enrichThreadsWithContacts(threads);

  return {
    databasePath: messagesDbPath,
    threadLimit: safeThreadLimit,
    perDirection: safePerDirection,
    contacts,
    threads,
  };
}

async function pathSize(path) {
  try {
    return (await stat(path)).size;
  } catch {
    return null;
  }
}

function attachmentName(attachment) {
  return String(attachment.name || attachment.fileName || (attachment.path ? basename(attachment.path) : "attachment"));
}

async function normalizeAttachment(attachment) {
  const filePath = attachment.path || attachment.filePath || null;
  const thumbnailPath = attachment.thumbnailPath || attachment.thumbnail || null;
  const size = Number.isFinite(attachment.size) ? attachment.size : filePath ? await pathSize(filePath) : null;
  const thumbnailSize = thumbnailPath ? await pathSize(thumbnailPath) : null;
  const thumbnailSendable = Boolean(thumbnailPath && thumbnailSize !== null && thumbnailSize <= maxThumbnailBytes);

  return {
    id: String(attachment.id || randomUUID()),
    name: attachmentName(attachment),
    mimeType: attachment.mimeType || attachment.type || "application/octet-stream",
    path: filePath,
    size,
    thumbnailPath,
    thumbnailSize,
    thumbnailSendable,
    description: attachment.description || null,
  };
}

function localAttachmentDescription(attachment) {
  const sizeLabel = attachment.size === null ? "unknown size" : `${attachment.size} bytes`;
  return `Attachment ${attachment.name}: ${attachment.mimeType}, ${sizeLabel}. Hermes visual description was unavailable.`;
}

async function askHermesForDescription(attachment, messageContext) {
  if (!hermesUrl) {
    return {
      description: localAttachmentDescription(attachment),
      source: "local_metadata_fallback",
    };
  }

  const body = {
    schemaVersion: 1,
    brokerId,
    attachment: {
      id: attachment.id,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
      path: attachment.path,
      thumbnailPath: attachment.thumbnailPath,
    },
    messageContext,
    instruction:
      "Describe this iMessage attachment clearly and briefly for a recipient when the original file or thumbnail cannot be forwarded.",
  };

  try {
    const response = await fetch(`${hermesUrl}${hermesDescribePath}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    const parsed = text ? JSON.parse(text) : {};
    const description = parsed.description || parsed.text || parsed.message || parsed.response?.description;
    if (response.ok && description) {
      return { description: String(description), source: "hermes_agent" };
    }
    return {
      description: localAttachmentDescription(attachment),
      source: "local_metadata_fallback",
      hermesStatus: response.status,
    };
  } catch (error) {
    return {
      description: localAttachmentDescription(attachment),
      source: "local_metadata_fallback",
      error: error.message,
    };
  }
}

async function prepareAttachments(attachments = [], messageContext = {}) {
  const normalized = [];
  for (const rawAttachment of attachments) {
    const attachment = await normalizeAttachment(rawAttachment);
    if (!attachment.thumbnailSendable && !attachment.description) {
      const described = await askHermesForDescription(attachment, messageContext);
      attachment.description = described.description;
      attachment.descriptionSource = described.source;
      attachment.descriptionError = described.error || null;
    } else if (attachment.thumbnailSendable) {
      attachment.descriptionSource = "thumbnail_preferred";
    } else {
      attachment.descriptionSource = "provided";
    }
    normalized.push(attachment);
  }
  return normalized;
}

function messageTextWithAttachmentDescriptions(text, attachments) {
  const descriptions = attachments
    .filter((attachment) => !attachment.thumbnailSendable && attachment.description)
    .map((attachment) => `[${attachment.name}] ${attachment.description}`);
  return [String(text || "").trim(), ...descriptions].filter(Boolean).join("\n\n");
}

function runOsascript(args) {
  const source = `
on run argv
  set targetBuddy to item 1 of argv
  set messageText to item 2 of argv
  tell application "Messages"
    set targetService to 1st service whose service type = iMessage
    set targetRecipient to buddy targetBuddy of targetService
    send messageText to targetRecipient
  end tell
end run
`;
  return new Promise((resolve, reject) => {
    const child = spawn("osascript", ["-e", source, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    const stderr = [];
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(Buffer.concat(stderr).toString("utf8").trim() || `osascript exited ${code}`));
      }
    });
  });
}

function validateRecipient(value) {
  const recipient = String(value || "").trim();
  if (!recipient || recipient.length > 128) {
    throw new Error("recipient must be a non-empty iMessage handle up to 128 characters");
  }
  return recipient;
}

async function sendIMessage(body) {
  const requestId = String(body.requestId || `imsg-${randomUUID()}`);
  const recipient = validateRecipient(body.to || body.recipient || body.phone || body.email);
  const attachments = await prepareAttachments(body.attachments || [], {
    requestId,
    direction: "outbound_to_imessage",
    recipient,
    text: body.text || body.message || "",
  });
  const text = messageTextWithAttachmentDescriptions(body.text || body.message || "", attachments);
  const thumbnails = attachments.filter((attachment) => attachment.thumbnailSendable).map((attachment) => attachment.thumbnailPath);

  if (!text && !thumbnails.length) {
    throw new Error("message text or a sendable thumbnail is required");
  }

  if (!allowSend) {
    const audit = await appendAudit(
      "iMessage send dry run",
      "dry_run_only",
      "Prepared iMessage payload but did not call macOS Messages because IMESSAGE_BROKER_ALLOW_SEND is not true.",
      requestId,
    );
    return {
      statusCode: 202,
      body: {
        schemaVersion: 1,
        brokerId,
        status: "dry_run_only",
        requestId,
        recipient,
        preparedText: text,
        thumbnails,
        attachments,
        audit,
        messagesSent: false,
        privilegedExecutionPerformed: false,
      },
    };
  }

  await runOsascript([recipient, text]);
  const audit = await appendAudit("iMessage sent", "sent", "Sent text through macOS Messages iMessage service.", requestId);
  return {
    statusCode: 200,
    body: {
      schemaVersion: 1,
      brokerId,
      status: "sent",
      requestId,
      recipient,
      attachmentPolicy: thumbnails.length
        ? "Text was sent. Thumbnail file paths are prepared for a future file-send adapter."
        : "Attachments were represented in text descriptions.",
      attachments,
      audit,
      messagesSent: true,
      privilegedExecutionPerformed: false,
    },
  };
}

async function forwardInboundToHermes(body) {
  const requestId = String(body.requestId || `imsg-in-${randomUUID()}`);
  const attachments = await prepareAttachments(body.attachments || [], {
    requestId,
    direction: "inbound_from_imessage",
    sender: body.from || body.sender || "unknown",
    conversationId: body.conversationId || null,
    text: body.text || body.message || "",
  });
  const payload = {
    schemaVersion: 1,
    brokerId,
    requestId,
    direction: "imessage_to_hermes_rabbit_gateway",
    receivedAt: new Date().toISOString(),
    conversationId: body.conversationId || null,
    from: body.from || body.sender || null,
    text: body.text || body.message || "",
    attachments,
    attachmentSummary: attachments.map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      thumbnailSendable: attachment.thumbnailSendable,
      description: attachment.description,
      descriptionSource: attachment.descriptionSource,
    })),
  };
  const storedMessage = await appendMessageRecord(payload, "prepared_for_hermes");

  if (!hermesUrl) {
    const audit = await appendAudit(
      "iMessage inbound staged",
      "staged_without_hermes",
      "Prepared inbound iMessage payload but HERMES_IMESSAGE_UPSTREAM is not configured.",
      requestId,
    );
    return {
      statusCode: 202,
      body: {
        schemaVersion: 1,
        brokerId,
        status: "staged_without_hermes",
        requestId,
        payload,
        storedMessage,
        audit,
        hermesForwarded: false,
        privilegedExecutionPerformed: false,
      },
    };
  }

  const hermesResponse = await fetch(`${hermesUrl}${hermesMessagePath}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await hermesResponse.text();
  let parsed = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }
  const audit = await appendAudit(
    "iMessage inbound forwarded",
    "forwarded_to_hermes",
    `Forwarded inbound iMessage payload to Hermes with HTTP ${hermesResponse.status}.`,
    requestId,
  );
  return {
    statusCode: hermesResponse.ok ? 202 : 502,
    body: {
      schemaVersion: 1,
      brokerId,
      status: hermesResponse.ok ? "forwarded_to_hermes" : "hermes_returned_error",
      requestId,
      hermesStatus: hermesResponse.status,
      hermesResponse: parsed,
      storedMessage,
      audit,
      hermesForwarded: hermesResponse.ok,
      privilegedExecutionPerformed: false,
    },
  };
}

async function handleRequest(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }
  if (!hasAuth(request, url)) {
    sendJson(response, 401, {
      schemaVersion: 1,
      brokerId,
      status: "blocked",
      error: "imessage_broker_auth_required",
      privilegedExecutionPerformed: false,
    });
    return;
  }
  if (request.method === "GET" && url.pathname === "/imessage/health") {
    sendJson(response, 200, {
      schemaVersion: 1,
      brokerId,
      status: "running",
      role: "imessage_hermes_rabbit_gateway_bridge",
      endpoint: `http://${host}:${port}`,
      hermesUpstreamConfigured: Boolean(hermesUrl),
      macMessagesSendEnabled: allowSend,
      requiresAuth: requireToken && Boolean(getBrokerToken()),
      readRequiresAuth: requireToken && Boolean(getBrokerToken()),
      sendRequiresAuth: allowSend && requireTokenForSend && Boolean(getBrokerToken()),
      tokenSource: requireToken
        ? tokenFile
          ? "local_token_file"
          : token
            ? "environment"
            : "not_configured"
        : "disabled_for_tailnet_read_mode",
      accessMode: requireToken ? "token_required" : "tailnet_read_no_token_send_token_required",
      attachmentPolicy: {
        preferSmallThumbnail: true,
        maxThumbnailBytes,
        describeViaHermesWhenNoThumbnail: true,
      },
      routes: [
        "GET /imessage/health",
        "GET /imessage/messages",
        "GET /imessage/threads",
        "GET /imessage/contacts",
        "POST /imessage/inbound",
        "POST /imessage/send",
        "POST /imessage/hermes-response",
      ],
      privilegedExecutionPerformed: false,
    });
    return;
  }
  if (request.method === "GET" && url.pathname === "/imessage/messages") {
    const page = await readMessageRecords({
      since: url.searchParams.get("since") || "",
      limit: url.searchParams.get("limit") || "25",
      conversationId: url.searchParams.get("conversationId") || "",
    });
    const audit = await appendAudit(
      "iMessage messages retrieved",
      "read",
      `Returned ${page.messages.length} stored broker message records.`,
    );
    sendJson(response, 200, {
      schemaVersion: 1,
      brokerId,
      status: "ok",
      source: "broker_captured_inbound_messages",
      ...page,
      audit,
      privilegedExecutionPerformed: false,
    });
    return;
  }
  if (request.method === "GET" && url.pathname === "/imessage/threads") {
    try {
      const result = await readRecentMessageThreads({
        threadLimit: url.searchParams.get("threadLimit") || "15",
        perDirection: url.searchParams.get("perDirection") || "25",
      });
      const totalMessages = result.threads.reduce(
        (sum, thread) => sum + thread.received.length + thread.sent.length,
        0,
      );
      const audit = await appendAudit(
        "iMessage database threads retrieved",
        "read",
        `Returned ${result.threads.length} Messages database threads and ${totalMessages} messages.`,
      );
      sendJson(response, 200, {
        schemaVersion: 1,
        brokerId,
        status: "ok",
        source: "macos_messages_database_read_only",
        ...result,
        audit,
        privilegedExecutionPerformed: false,
      });
    } catch (error) {
      const audit = await appendAudit(
        "iMessage database threads blocked",
        "blocked",
        error instanceof Error ? error.message : "Unable to read Messages database.",
      );
      sendJson(response, 503, {
        schemaVersion: 1,
        brokerId,
        status: "blocked",
        source: "macos_messages_database_read_only",
        error: "messages_database_unavailable",
        detail: error instanceof Error ? error.message : "Unable to read Messages database.",
        audit,
        privilegedExecutionPerformed: false,
      });
    }
    return;
  }
  if (request.method === "GET" && url.pathname === "/imessage/contacts") {
    try {
      const result = await searchContacts({
        q: url.searchParams.get("q") || "",
        limit: url.searchParams.get("limit") || "40",
      });
      const audit = await appendAudit(
        "iMessage contacts retrieved",
        "read",
        `Returned ${result.contacts.length} contact suggestions.`,
      );
      sendJson(response, 200, {
        schemaVersion: 1,
        brokerId,
        status: "ok",
        source: "macos_contacts_database_read_only",
        ...result,
        audit,
        privilegedExecutionPerformed: false,
      });
    } catch (error) {
      const audit = await appendAudit(
        "iMessage contacts blocked",
        "blocked",
        error instanceof Error ? error.message : "Unable to read Contacts database.",
      );
      sendJson(response, 503, {
        schemaVersion: 1,
        brokerId,
        status: "blocked",
        source: "macos_contacts_database_read_only",
        error: "contacts_database_unavailable",
        detail: error instanceof Error ? error.message : "Unable to read Contacts database.",
        audit,
        privilegedExecutionPerformed: false,
      });
    }
    return;
  }
  if (request.method === "POST" && url.pathname === "/imessage/inbound") {
    const result = await forwardInboundToHermes(await readBody(request));
    sendJson(response, result.statusCode, result.body);
    return;
  }
  if (request.method === "POST" && (url.pathname === "/imessage/send" || url.pathname === "/imessage/hermes-response")) {
    const result = await sendIMessage(await readBody(request));
    sendJson(response, result.statusCode, result.body);
    return;
  }
  sendJson(response, 404, {
    schemaVersion: 1,
    brokerId,
    status: "blocked",
    error: "route_not_found",
    privilegedExecutionPerformed: false,
  });
}

if (allowSend && !existsSync("/System/Applications/Messages.app")) {
  console.warn("Messages.app was not found at the expected system path. Sends may fail.");
}
if (!hermesUrl) {
  console.warn("HERMES_IMESSAGE_UPSTREAM is not configured. Inbound messages will stage locally.");
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    sendJson(response, 500, {
      schemaVersion: 1,
      brokerId,
      status: "broker_error",
      error: error.message,
      privilegedExecutionPerformed: false,
    });
  });
});

server.listen(port, host, () => {
  console.log(`iMessage Hermes broker listening on http://${host}:${port}`);
  console.log("macOS Messages sends are disabled unless IMESSAGE_BROKER_ALLOW_SEND=true.");
});
