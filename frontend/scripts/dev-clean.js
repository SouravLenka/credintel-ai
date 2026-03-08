const fs = require("fs");
const path = require("path");

const nextDir = path.join(process.cwd(), ".next");

function safeRm(target) {
  try {
    fs.rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  } catch {
    // Keep going even if OneDrive/file locks prevent deletion.
  }
}

function safeMkdir(target) {
  try {
    fs.mkdirSync(target, { recursive: true });
  } catch {
    // Best-effort only.
  }
}

safeRm(nextDir);
safeMkdir(nextDir);
console.log("[dev-clean] Prepared .next directory");
