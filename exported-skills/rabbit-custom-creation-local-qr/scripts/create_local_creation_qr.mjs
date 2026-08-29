#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const required = ["title", "url", "description", "iconUrl", "themeColor"];
const forbiddenPatterns = [
  /token/i,
  /secret/i,
  /\bpassword\b/i,
  /\bauthorization\b/i,
  /x-rabbit-relay-token/i,
  /\bsession[_-]?token\b/i,
  /\/private\/tmp/i,
  /\bsk-[a-z0-9_-]+/i,
  /\badb\b/i,
  /\bfastboot\b/i,
  /\bflash\b/i,
  /\berase\b/i,
  /\broot\b/i,
];

function usage() {
  return [
    "Usage:",
    "  node create_local_creation_qr.mjs --title <name> --url <appUrl> --description <text> --icon-url <iconUrl> [--theme-color #FE5000] [--out /private/tmp/rabbit-creation-qr] [--name slug] [--check-urls]",
    "",
    "Creates a Rabbit Custom Creation JSON payload and a local QR PNG.",
  ].join("\n");
}

function parseArgs(argv) {
  const args = {
    themeColor: "#FE5000",
    out: "/private/tmp/rabbit-creation-qr",
    checkUrls: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--help" || item === "-h") {
      args.help = true;
    } else if (item === "--check-urls") {
      args.checkUrls = true;
    } else if (item.startsWith("--")) {
      const key = item.slice(2);
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${item}`);
      }
      index += 1;
      if (key === "icon-url") {
        args.iconUrl = value;
      } else if (key === "theme-color") {
        args.themeColor = value;
      } else {
        args[key] = value;
      }
    } else {
      throw new Error(`Unexpected argument: ${item}`);
    }
  }

  return args;
}

function slugify(value) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || "rabbit-creation";
}

function requireString(name, value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing required --${name}`);
  }
  if ([...value].some((character) => character.charCodeAt(0) < 32)) {
    throw new Error(`Invalid control character in --${name}`);
  }
  return value.trim();
}

function validateUrl(name, value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute URL`);
  }
  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error(`${name} must use https:// or explicitly approved http://`);
  }
  if (parsed.protocol === "http:" && !/^(127\.0\.0\.1|localhost|10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/.test(parsed.hostname)) {
    throw new Error(`${name} uses http:// but is not localhost or a private LAN host`);
  }
  if (parsed.username || parsed.password) {
    throw new Error(`${name} must not include embedded credentials`);
  }
}

function validatePayload(payload) {
  const keys = Object.keys(payload);
  if (keys.join(",") !== required.join(",")) {
    throw new Error(`Payload keys must be exactly: ${required.join(", ")}`);
  }

  for (const key of required) {
    requireString(key, payload[key]);
  }

  validateUrl("url", payload.url);
  validateUrl("iconUrl", payload.iconUrl);

  if (!/^#[0-9a-f]{6}$/i.test(payload.themeColor)) {
    throw new Error("themeColor must be a six-digit hex color such as #FE5000");
  }

  const serialized = JSON.stringify(payload);
  const blocked = forbiddenPatterns.find((pattern) => pattern.test(serialized));
  if (blocked) {
    throw new Error(`Refusing to encode secret-looking or privileged content: ${blocked}`);
  }

  if (serialized.length > 1800) {
    throw new Error(`Payload is too large for reliable Rabbit scanning: ${serialized.length} bytes`);
  }
}

async function checkReachable(label, targetUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(targetUrl, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`${label} returned HTTP ${response.status}`);
    }
    return `${label}: HTTP ${response.status}`;
  } catch (error) {
    throw new Error(`${label} reachability check failed: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function swiftQrSource() {
  return String.raw`
import AppKit
import CoreImage
import Foundation

if CommandLine.arguments.count != 4 {
  fputs("usage: swift qr.swift <payload-file> <png-output> <scale>\n", stderr)
  exit(2)
}

let payloadURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let scale = CGFloat(Int(CommandLine.arguments[3]) ?? 12)
let data = try Data(contentsOf: payloadURL)

guard let filter = CIFilter(name: "CIQRCodeGenerator") else {
  fputs("CIQRCodeGenerator is unavailable\n", stderr)
  exit(3)
}

filter.setValue(data, forKey: "inputMessage")
filter.setValue("M", forKey: "inputCorrectionLevel")

guard let qrImage = filter.outputImage else {
  fputs("Could not generate QR image\n", stderr)
  exit(4)
}

guard let colorFilter = CIFilter(name: "CIFalseColor") else {
  fputs("CIFalseColor is unavailable\n", stderr)
  exit(5)
}

colorFilter.setValue(qrImage, forKey: "inputImage")
colorFilter.setValue(CIColor(red: 0, green: 0, blue: 0, alpha: 1), forKey: "inputColor0")
colorFilter.setValue(CIColor(red: 1, green: 1, blue: 1, alpha: 1), forKey: "inputColor1")

guard let colored = colorFilter.outputImage else {
  fputs("Could not color QR image\n", stderr)
  exit(6)
}

let scaled = colored.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
let context = CIContext(options: [.workingColorSpace: NSNull(), .useSoftwareRenderer: true])

guard let cgImage = context.createCGImage(scaled, from: scaled.extent.integral) else {
  fputs("Could not render QR image\n", stderr)
  exit(7)
}

let bitmap = NSBitmapImageRep(cgImage: cgImage)
guard let png = bitmap.representation(using: .png, properties: [:]) else {
  fputs("Could not encode PNG\n", stderr)
  exit(8)
}

try png.write(to: outputURL)
`;
}

async function generatePngWithSwift(payloadPath, pngPath) {
  const tempDir = await mkdtemp(join(tmpdir(), "rabbit-local-qr-swift-"));
  const swiftPath = join(tempDir, "qr.swift");
  await writeFile(swiftPath, swiftQrSource(), "utf8");
  const result = spawnSync("/usr/bin/swift", [swiftPath, payloadPath, pngPath, "12"], {
    encoding: "utf8",
    env: {
      ...process.env,
      CLANG_MODULE_CACHE_PATH: join(tempDir, "ModuleCache"),
      TMPDIR: tempDir,
    },
  });
  await rm(tempDir, { recursive: true, force: true });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Swift QR generation failed");
  }
}

async function generatePngWithNodeQrcode(payload, pngPath) {
  let qrcode;
  try {
    const module = await import("qrcode");
    qrcode = module.default || module;
  } catch (error) {
    const requireFromCwd = createRequire(resolve(process.cwd(), "package.json"));
    qrcode = requireFromCwd("qrcode");
    if (!qrcode) {
      throw error;
    }
  }
  await qrcode.toFile(pngPath, payload, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 3,
    scale: 10,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

function generatePngWithQrencode(payload, pngPath) {
  const result = spawnSync("qrencode", ["-o", pngPath, "-t", "PNG", "-s", "12", "-m", "2", payload], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "qrencode QR generation failed");
  }
}

async function writeReviewHtml({ htmlPath, pngFile, payload, payloadPath, jsonPath }) {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(payload.title)} Rabbit Creation QR</title>
    <style>
      body { margin: 0; background: #111; color: #f7f7f7; font: 16px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      main { max-width: 720px; margin: 0 auto; padding: 24px; }
      img { width: min(78vw, 360px); height: auto; background: white; padding: 16px; border-radius: 8px; }
      pre { white-space: pre-wrap; word-break: break-word; background: #1d1d1f; padding: 14px; border-radius: 8px; border: 1px solid #333; }
      code { color: #fff; }
      .note { color: #cfcfcf; }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(payload.title)}</h1>
      <p class="note">Scan this QR only from Rabbit r1 Creations add via QR. It encodes Rabbit Creation JSON, not a manifest URL.</p>
      <img src="${escapeHtml(basename(pngFile))}" alt="Rabbit Custom Creation install QR" />
      <h2>Payload</h2>
      <pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>
      <p class="note">Files: <code>${escapeHtml(jsonPath)}</code> and <code>${escapeHtml(payloadPath)}</code>. Do not upload this QR if it was created for local-only access.</p>
    </main>
  </body>
</html>
`;
  await writeFile(htmlPath, html, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }

  const payload = {
    title: requireString("title", args.title),
    url: requireString("url", args.url),
    description: requireString("description", args.description),
    iconUrl: requireString("icon-url", args.iconUrl),
    themeColor: requireString("theme-color", args.themeColor).toUpperCase(),
  };
  validatePayload(payload);

  if (args.checkUrls) {
    const checks = await Promise.all([
      checkReachable("url", payload.url),
      checkReachable("iconUrl", payload.iconUrl),
    ]);
    for (const check of checks) {
      console.log(check);
    }
  }

  const outDir = resolve(args.out);
  const name = slugify(args.name || payload.title);
  const jsonPath = join(outDir, `${name}.creation.json`);
  const payloadPath = join(outDir, `${name}.payload.txt`);
  const pngPath = join(outDir, `${name}.qr.png`);
  const htmlPath = join(outDir, `${name}.scan.html`);
  const payloadText = JSON.stringify(payload);

  await mkdir(outDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await writeFile(payloadPath, `${payloadText}\n`, "utf8");

  try {
    await generatePngWithNodeQrcode(payloadText, pngPath);
  } catch (nodeQrcodeError) {
    try {
      await generatePngWithSwift(payloadPath, pngPath);
    } catch (swiftError) {
      try {
        generatePngWithQrencode(payloadText, pngPath);
      } catch (qrencodeError) {
        await rm(pngPath, { force: true });
        throw new Error([
          "Could not generate a local QR PNG.",
          `qrcode package error: ${nodeQrcodeError.message}`,
          `Swift error: ${swiftError.message}`,
          `qrencode error: ${qrencodeError.message}`,
          "Run npm install in the project or install qrencode, then rerun this command.",
        ].join("\n"));
      }
    }
  }

  await writeReviewHtml({ htmlPath, pngFile: pngPath, payload, payloadPath, jsonPath });

  const writtenPayload = JSON.parse(await readFile(jsonPath, "utf8"));
  validatePayload(writtenPayload);

  console.log("Rabbit Custom Creation QR ready");
  console.log(`Payload: ${jsonPath}`);
  console.log(`QR PNG: ${pngPath}`);
  console.log(`Review page: ${htmlPath}`);
  console.log(`Install payload bytes: ${Buffer.byteLength(payloadText, "utf8")}`);
}

main().catch((error) => {
  console.error(error.message);
  console.error("");
  console.error(usage());
  process.exit(1);
});
