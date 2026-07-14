import fs from "node:fs";
import path from "node:path";

for (const envFile of [".env.local", ".env"]) {
  loadEnvFile(path.join(process.cwd(), envFile));
}

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = parseEnvValue(
      line.slice(separatorIndex + 1).trim()
    );
  }
}

function parseEnvValue(value: string) {
  const quoted =
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"));

  return quoted ? value.slice(1, -1) : value;
}
