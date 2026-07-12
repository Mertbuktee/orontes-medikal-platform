import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const localEnv = loadDotEnvLocal();

const qaPort = process.env.PORT ?? "3100";
const qaBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${qaPort}`;

const env = {
  ...process.env,
  ...localEnv,
  APP_ORIGIN: qaBaseUrl,
  PORT: qaPort,
  PLAYWRIGHT_BASE_URL: qaBaseUrl,
  PLAYWRIGHT_EXTERNAL_SERVER: "true",
  VISUAL_QA_ADMIN_EMAIL: "visual-qa-admin@orontes.local",
  VISUAL_QA_ADMIN_PASSWORD: `VisualQa-${randomBytes(18).toString("base64url")}`,
};

function loadDotEnvLocal() {
  const path = ".env.local";

  if (!existsSync(path)) {
    return {};
  }

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const separator = line.indexOf("=");
        if (separator === -1) {
          return null;
        }

        const key = line.slice(0, separator).trim();
        const value = line
          .slice(separator + 1)
          .trim()
          .replace(/^["']|["']$/g, "");

        return [key, value];
      })
      .filter(Boolean)
  );
}

await provisionVisualQaAdmin();

if (!existsSync(".next/BUILD_ID")) {
  console.error(
    "Visual QA requires a completed production build. Run `npm run build` before `npm run qa:visual`, and do not run them in parallel."
  );
  process.exit(1);
}

const server = spawn(process.execPath, ["scripts/visual-qa-server.mjs"], {
  env,
  stdio: ["ignore", "pipe", "pipe"],
});

let serverReady = false;

function waitForServerReady() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Visual QA server did not become ready in time."));
    }, 60_000);

    server.stdout.on("data", (chunk) => {
      const text = String(chunk);
      process.stdout.write(text);

      if (text.includes("Visual QA server ready")) {
        serverReady = true;
        clearTimeout(timeout);
        resolve();
      }
    });

    server.stderr.on("data", (chunk) => {
      process.stderr.write(String(chunk));
    });

    server.once("exit", (code) => {
      if (!serverReady) {
        clearTimeout(timeout);
        reject(new Error(`Visual QA server exited early with code ${code}.`));
      }
    });
  });
}

function runPlaywright() {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [
        "node_modules/playwright/cli.js",
        "test",
        "tests/visual/homepage-responsive.spec.ts",
      ],
      {
        env,
        stdio: "inherit",
      }
    );

    child.once("exit", (code) => {
      resolve(code ?? 1);
    });
  });
}

function provisionVisualQaAdmin() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "--experimental-strip-types",
        "scripts/visual-qa-admin.ts",
      ],
      {
        env,
        stdio: ["ignore", "inherit", "inherit"],
      }
    );

    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Visual QA admin provisioning failed with code ${code}.`));
    });
  });
}

async function stopServer() {
  if (server.exitCode !== null || server.killed) {
    return;
  }

  server.kill();

  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 2_000);
    server.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

try {
  await waitForServerReady();
  const code = await runPlaywright();
  await stopServer();
  process.exit(code);
} catch (error) {
  await stopServer();
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
