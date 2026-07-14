import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

loadLocalEnv();

async function main() {
  const [{ NotificationService }, { mailWorkerSchema }] = await Promise.all([
    import("../src/lib/notifications/notification-service.ts"),
    import("../src/lib/notifications/notification-validation.ts"),
  ]);
  const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [key, value] = arg.replace(/^--/, "").split("=");
      return [key, value ?? "true"];
    })
  );
  const parsed = mailWorkerSchema.parse({
    batchSize: args.batchSize ?? process.env.MAIL_WORKER_BATCH_SIZE,
  });
  const result = await new NotificationService().processDueEmails({
    batchSize: parsed.batchSize,
  });

  console.log(
    [
      "mail_process_complete",
      `claimed=${result.claimed}`,
      `sent=${result.sent}`,
      `retry=${result.retryScheduled}`,
      `failed=${result.failed}`,
    ].join(" ")
  );
}

function loadLocalEnv() {
  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(process.cwd(), fileName);
    if (!existsSync(filePath)) continue;
    const content = readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator <= 0) continue;
      const key = trimmed.slice(0, separator).trim();
      const rawValue = trimmed.slice(separator + 1).trim();
      if (process.env[key] !== undefined) continue;
      process.env[key] = rawValue.replace(/^"(.*)"$/, "$1");
    }
  }
}

main().catch((error) => {
  console.error(
    `mail_process_failed code=${error instanceof Error ? error.message.slice(0, 120) : "UNKNOWN"}`
  );
  process.exitCode = 1;
});
