import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const backupFile = process.argv[2] || process.env.BACKUP_FILE;
if (!backupFile) {
  console.error("Usage: npm run backup:verify -- <backup.dump>");
  process.exit(1);
}

await access(backupFile);
try {
  await run("pg_restore", ["--list", backupFile]);
} catch (error) {
  if (!isMissingExecutableError(error, "pg_restore")) throw error;
  await runDockerPgRestoreList(backupFile);
}
console.log(JSON.stringify({ status: "ok", checked: backupFile }));

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      reject(new Error(`${command} failed to start: ${error.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} failed with exit code ${code}: ${stderr.slice(0, 500)}`));
    });
  });
}

async function runDockerPgRestoreList(backupFile) {
  const container = process.env.BACKUP_DOCKER_CONTAINER || "orontes-medikal-postgres";
  const containerPath = `/tmp/${path.basename(backupFile)}`;

  await run("docker", ["cp", backupFile, `${container}:${containerPath}`]);
  try {
    await run("docker", ["exec", container, "pg_restore", "--list", containerPath]);
  } finally {
    await run("docker", ["exec", container, "rm", "-f", containerPath]).catch(() => undefined);
  }
}

function isMissingExecutableError(error, command) {
  return error instanceof Error && error.message.includes(`${command} failed to start`);
}
