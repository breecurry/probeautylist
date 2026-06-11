const defaultPort = process.env.PORT || '3000';
const healthUrl = process.env.APP_HEALTH_URL || `http://127.0.0.1:${defaultPort}/api/health`;

const timeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS || '5000', 10);
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) ? timeoutMs : 5000);

try {
  const response = await fetch(healthUrl, { signal: controller.signal });
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Health check failed with HTTP ${response.status}: ${body.slice(0, 300)}`);
  }

  console.log(`Health check passed: ${healthUrl}`);
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown health check failure';
  console.error(`Health check failed: ${message}`);
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
}
