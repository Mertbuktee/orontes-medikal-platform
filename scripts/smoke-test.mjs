const baseUrl = (
  process.env.SMOKE_BASE_URL ||
  process.env.APP_ORIGIN ||
  'http://localhost:3000'
).replace(/\/$/, '');
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 10_000);

const checks = [
  { path: '/', statuses: [200] },
  { path: '/hizmetler', statuses: [200] },
  { path: '/cihazlar', statuses: [200] },
  { path: '/blog', statuses: [200] },
  { path: '/servis-talebi', statuses: [200] },
  { path: '/sitemap.xml', statuses: [200] },
  { path: '/robots.txt', statuses: [200] },
  { path: '/api/health/live', statuses: [200] },
  { path: '/admin/login', statuses: [200] },
  { path: '/admin/dashboard', statuses: [200, 307, 308] },
  {
    path: '/admin/service-requests/example/attachments/example',
    statuses: [307, 401, 404],
  },
];

const results = [];
for (const checkConfig of checks) {
  const result = await check(checkConfig);
  results.push(result);
}

const failed = results.filter((result) => !result.ok);
console.log(JSON.stringify({ baseUrl, results }, null, 2));
if (failed.length) process.exit(1);

async function check({ path, statuses }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      redirect: 'manual',
      signal: controller.signal,
    });
    const ok = statuses.includes(response.status);
    return { path, status: response.status, expectedStatuses: statuses, ok };
  } catch (error) {
    return {
      path,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    };
  } finally {
    clearTimeout(timeout);
  }
}
