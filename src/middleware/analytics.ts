import { createMiddleware } from "hono/factory";
import { nanoid } from "nanoid"; // You might need to install this package

export const analytics = createMiddleware(async (c, next) => {
  // Start time for calculating response time
  const startTime = Date.now();

  // Generate a unique request ID
  const requestId = nanoid();

  // Get basic request data
  const method = c.req.method;
  const path = c.req.path;
  const url = c.req.url;
  const userAgent = c.req.header("user-agent");
  const referer = c.req.header("referer");
  const acceptLanguage = c.req.header("accept-language");

  // Get IP address - fixing the IP extraction
  // Option 1: From X-Forwarded-For header (if behind a proxy/load balancer)
  let ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();

  // Option 2: From the request object itself
  if (!ip) {
    // Try to get from the raw request
    const conn = c.env?.requestIP?.(c.req.raw);
    ip = conn || "unknown";
  }

  // Wait for the request to finish
  await next();

  // Calculate response time
  const responseTime = Date.now() - startTime;

  // Get status code from the response
  const status = c.res?.status;

  // Log or store the analytics data
  const analyticsData = {
    timestamp: new Date().toISOString(),
    requestId,
    method,
    path,
    url,
    ip,
    userAgent,
    referer,
    acceptLanguage,
    status,
    responseTime,
  };

  // You can log to console for development
  console.log("Analytics:", analyticsData);

  // In production, you might want to:
  // 1. Send to a database (MongoDB, PostgreSQL, etc.)
  // 2. Use a logging service (Datadog, New Relic, etc.)
  // 3. Write to log files

  // Example database save (pseudocode)
  // await db.collection('analytics').insertOne(analyticsData);
});
