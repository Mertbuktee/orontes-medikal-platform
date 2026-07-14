const baseUrl = (process.env.SMOKE_BASE_URL || process.env.APP_ORIGIN || "http://localhost:3000").replace(/\/$/, "");
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 10_000);

const checks = [
  ["/", 200],
  ["/hizmetler", 200],
  ["/cihazlar", 200],
  ["/blog", 200],
  ["/servis-talebi", 200],
  ["/sitemap.xml", 200],
  ["/robots.txt", 200],
  ["/api/health/live", 200],
  ["/admin/login", 200],
  ["/admin/dashboard", 200, 399],
  ["/admin/service-requests/example/attachments/example", 401, 404],
];

const results = [];
for (const [path, minStatus, maxStatus = minStatus] of checks) {
  const result = await check(path, minStatus, maxStatus);
  results.push(result);
}

const failed = results.filter((result) => !result.ok);
console.log(JSON.stringify({ baseUrl, results }, null, 2));
if (failed.length) process.exit(1);

async function check(path, minStatus, maxStatus) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      redirect: "manual",
      signal: controller.signal,
    });
    const ok = response.status >= minStatus && response.status <= maxStatus;
    return { path, status: response.status, ok };
  } catch (error) {
    return {
      path,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.name : "UNKNOWN_ERROR",
    };
  } finally {
    clearTimeout(timeout);
  }
}
