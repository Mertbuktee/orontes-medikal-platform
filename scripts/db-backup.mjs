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

  try {
    await run("pg_dump", ["--format=custom", "--compress=9", "--file", backupPath, databaseUrl]);
  } catch (error) {
    if (!isMissingExecutableError(error, "pg_dump")) throw error;
    await runDockerPgDump({ databaseUrl, backupPath, stamp });
  }
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

async function runDockerPgDump({ databaseUrl, backupPath, stamp }) {
  const container = process.env.BACKUP_DOCKER_CONTAINER || "orontes-medikal-postgres";
  const parsed = parseDatabaseUrl(databaseUrl);
  const containerPath = `/tmp/orontes-${stamp}.dump`;

  await run("docker", [
    "exec",
    "-e",
    `PGPASSWORD=${parsed.password}`,
    container,
    "pg_dump",
    "--format=custom",
    "--compress=9",
    "--file",
    containerPath,
    "-h",
    "127.0.0.1",
    "-U",
    parsed.user,
    "-d",
    parsed.database,
  ]);
  await run("docker", ["cp", `${container}:${containerPath}`, backupPath]);
  await run("docker", ["exec", container, "rm", "-f", containerPath]);
}

function parseDatabaseUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  const database = url.pathname.replace(/^\//, "");

  if (!url.username || !database) {
    throw new Error("DATABASE_URL must include username and database name for Docker backup fallback.");
  }

  return {
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(database),
  };
}

function isMissingExecutableError(error, command) {
  return error instanceof Error && error.message.includes(`${command} failed to start`);
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
  const password = databaseUrl ? new URL(databaseUrl).password : "";
  return value
    .replaceAll(databaseUrl, "[DATABASE_URL]")
    .replaceAll(password, password ? "[PASSWORD]" : "");
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
