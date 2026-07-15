import { spawn } from "node:child_process";

const requiredNode = "22.13.1";
const requiredMajor = 22;
const current = process.versions.node;
const isWindows = process.platform === "win32";
const npmVersion = await getCommandVersion(isWindows ? "npm.cmd" : "npm", ["--version"]);
const dockerVersion = await getCommandVersion("docker", ["version", "--format", "{{.Server.Version}}"]);
const ciOrProduction = process.env.CI === "true" || process.env.APP_ENV === "production";
const errors = [];
const warnings = [];

const [major] = current.split(".").map(Number);

if (current !== requiredNode) {
  const message = `Node ${requiredNode} is the project standard; current Node is ${current}.`;
  if (ciOrProduction || process.env.ENV_CHECK_STRICT === "true") errors.push(message);
  else warnings.push(message);
}

if (major !== requiredMajor) {
  const message = `Node major ${requiredMajor} is required for CI/production; current major is ${major}.`;
  if (ciOrProduction || process.env.ENV_CHECK_STRICT === "true") errors.push(message);
  else warnings.push(message);
}

if (!npmVersion.ok) warnings.push("npm is not available on PATH.");
if (!dockerVersion.ok) warnings.push("Docker is not available or the daemon is not running.");

console.log(
  JSON.stringify(
    {
      status: errors.length ? "failed" : "ok",
      node: { required: requiredNode, current },
      npm: npmVersion,
      docker: dockerVersion,
      warnings,
      errors,
    },
    null,
    2
  )
);

if (errors.length) process.exit(1);

function getCommandVersion(command, args) {
  return new Promise((resolve) => {
    const child = spawnCommand(command, args);
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => (stdout += String(chunk)));
    child.stderr?.on("data", (chunk) => (stderr += String(chunk)));
    child.on("error", () => resolve({ ok: false }));
    child.on("close", (code) => {
      resolve({
        ok: code === 0,
        version: code === 0 ? stdout.trim() : undefined,
        error: code === 0 ? undefined : stderr.trim().slice(0, 160),
      });
    });
  });
}

function spawnCommand(command, args) {
  if (isWindows && command.endsWith(".cmd")) {
    return spawn("cmd.exe", ["/d", "/s", "/c", [command, ...args].join(" ")], {
      stdio: ["ignore", "pipe", "pipe"],
    });
  }

  return spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
}
