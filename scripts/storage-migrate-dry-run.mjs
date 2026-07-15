import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const privateRoot = path.resolve(process.env.PRIVATE_STORAGE_ROOT || "storage/private");
const domains = [
  { name: "service-requests", root: path.join(privateRoot, "service-requests") },
  { name: "media", root: path.join(privateRoot, "media") },
  { name: "mail-capture", root: path.join(privateRoot, "mail-capture") },
];

const results = [];

for (const domain of domains) {
  results.push(await inspectDomain(domain));
}

console.log(
  JSON.stringify(
    {
      status: "dry-run",
      privateRoot,
      provider: process.env.STORAGE_PROVIDER || "local",
      domains: results,
      note: "No files were copied, modified or deleted.",
    },
    null,
    2
  )
);

async function inspectDomain(domain) {
  const summary = {
    name: domain.name,
    root: domain.root,
    exists: false,
    files: 0,
    bytes: 0,
    errors: [],
  };

  try {
    const rootStat = await stat(domain.root);
    summary.exists = rootStat.isDirectory();
    if (!summary.exists) return summary;
    await walk(domain.root, summary);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      summary.errors.push(error instanceof Error ? error.message : "UNKNOWN_ERROR");
    }
  }

  return summary;
}

async function walk(directory, summary) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(entryPath, summary);
      continue;
    }

    if (!entry.isFile()) continue;
    const fileStat = await stat(entryPath);
    summary.files += 1;
    summary.bytes += fileStat.size;
  }
}
