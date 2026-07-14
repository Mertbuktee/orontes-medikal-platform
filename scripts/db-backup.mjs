import { createHash } from "node:crypto";
import { createReadStream, existsSync, readFileSync } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Backup failed.");
  process.exit(1);
});

async function main() {
  loadLocalEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const backupDir = path.resolve(process.env.BACKUP_DIR || "backups/database");
  await mkdir(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `orontes-${stamp}.dump`);
  const metadataPath = `${backupPath}.json`;

  await run("pg_dump", ["--format=custom", "--compress=9", "--file", backupPath, databaseUrl]);
  const checksum = await sha256File(backupPath);
  const size = (await stat(backupPath)).size;

  await writeFile(
    metadataPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        format: "pg_dump-custom",
        file: path.basename(backupPath),
        size,
        sha256: checksum,
        commit: process.env.GIT_COMMIT_SHA || null,
      },
      null,
      2
    )
  );

  console.log(JSON.stringify({ status: "ok", backup: backupPath, metadata: metadataPath }));
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "ignore", "pipe"],
      env: process.env,
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      reject(new Error(`${command} failed to start: ${redact(error.message)}`));
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} failed with exit code ${code}: ${redact(stderr)}`));
    });
  });
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", () => resolve(hash.digest("hex")));
  });
}

function redact(value) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return value;
  return value.replaceAll(databaseUrl, "[DATABASE_URL]");
}

function loadLocalEnv() {
  if (process.env.DATABASE_URL || !existsSync(".env.local")) return;

  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}
