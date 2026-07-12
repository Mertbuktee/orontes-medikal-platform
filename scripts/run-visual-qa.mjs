import { spawn } from "node:child_process";

const env = {
  ...process.env,
  ADMIN_DEV_BYPASS: "true",
  PLAYWRIGHT_EXTERNAL_SERVER: "true",
};

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
