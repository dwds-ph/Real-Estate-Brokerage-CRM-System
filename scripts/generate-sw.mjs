/**
 * Generate Firebase Cloud Messaging Service Worker
 *
 * Reads `.env.production` and the template from `public/firebase-messaging-sw.js`,
 * replaces `__VITE_FIREBASE_*__` placeholders with real values, and writes
 * the result to `dist/firebase-messaging-sw.js`.
 *
 * Usage: node scripts/generate-sw.mjs
 * Called automatically as part of `npm run build`.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const ENV_PATH = resolve(ROOT, ".env.production");
const TEMPLATE_PATH = resolve(ROOT, "public", "firebase-messaging-sw.js");
const OUTPUT_PATH = resolve(ROOT, "dist", "firebase-messaging-sw.js");

// ─── Parse .env.production ──────────────────────────────────────────────
function parseEnv(filePath) {
  if (!existsSync(filePath)) {
    console.warn("⚠️  .env.production not found — using environment variables as fallback.");
    return {};
  }

  const content = readFileSync(filePath, "utf-8");
  const vars = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();

    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    vars[key] = value;
  }

  return vars;
}

// ─── Main ────────────────────────────────────────────────────────────────
function main() {
  // 1. Read env vars (from file or process.env fallback)
  const envFile = parseEnv(ENV_PATH);
  const env = new Proxy(envFile, {
    get(target, prop) {
      return target[prop] ?? process.env[prop] ?? `__${prop}__`;
    },
  });

  // 2. Read template
  if (!existsSync(TEMPLATE_PATH)) {
    console.error("❌ Template not found:", TEMPLATE_PATH);
    process.exit(1);
  }

  let swContent = readFileSync(TEMPLATE_PATH, "utf-8");

  // 3. Replace placeholders
  const replacements = {
    __VITE_FIREBASE_API_KEY__: env.VITE_FIREBASE_API_KEY,
    __VITE_FIREBASE_AUTH_DOMAIN__: env.VITE_FIREBASE_AUTH_DOMAIN,
    __VITE_FIREBASE_PROJECT_ID__: env.VITE_FIREBASE_PROJECT_ID,
    __VITE_FIREBASE_STORAGE_BUCKET__: env.VITE_FIREBASE_STORAGE_BUCKET,
    __VITE_FIREBASE_MESSAGING_SENDER_ID__: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    __VITE_FIREBASE_APP_ID__: env.VITE_FIREBASE_APP_ID,
  };

  let replaced = false;
  for (const [placeholder, value] of Object.entries(replacements)) {
    if (swContent.includes(placeholder)) {
      swContent = swContent.replaceAll(placeholder, value);
      replaced = true;

      if (placeholder.startsWith("__") && value.startsWith("__")) {
        console.warn(`⚠️  ${placeholder} was not replaced — check .env.production`);
      }
    }
  }

  if (!replaced) {
    console.warn("⚠️  No placeholders found in template — nothing to replace.");
  }

  // 4. Ensure dist/ directory exists
  const distDir = dirname(OUTPUT_PATH);
  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  // 5. Write output
  writeFileSync(OUTPUT_PATH, swContent, "utf-8");
  console.log("✅ Generated dist/firebase-messaging-sw.js");
}

main();
