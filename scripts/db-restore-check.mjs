import { access } from "node:fs/promises";
import { spawn } from "node:child_process";

const backupFile = process.argv[2] || process.env.BACKUP_FILE;
if (!backupFile) {
  console.error("Usage: npm run backup:verify -- <backup.dump>");
  process.exit(1);
}

await access(backupFile);
await run("pg_restore", ["--list", backupFile]);
console.log(JSON.stringify({ status: "ok", checked: backupFile }));

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} failed with exit code ${code}: ${stderr.slice(0, 500)}`));
    });
  });
}
