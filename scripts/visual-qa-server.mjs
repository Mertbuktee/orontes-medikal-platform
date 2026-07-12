import { createServer } from "node:http";

import next from "next";

const port = Number(process.env.PORT ?? 3000);
const hostname = "0.0.0.0";
const app = next({ dev: false, dir: process.cwd() });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer((request, response) => {
  handle(request, response);
});

let closing = false;

function shutdown() {
  if (closing) return;
  closing = true;

  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => process.exit(0), 1_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

server.listen(port, hostname, () => {
  console.log(`Visual QA server ready on http://localhost:${port}`);
});
