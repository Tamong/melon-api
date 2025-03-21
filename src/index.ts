import { Hono } from "hono";
import { analytics } from "@/middleware/analytics";
import routes from "@/routes";
import { logger } from "hono/logger";
import { chartPrefetcher } from "@/utils/prefetch";

const app = new Hono();

// Middleware
app.use("*", logger());

// app.use("/api/*", (c, next) => analytics(c, next)); // Enable if you want to see Analytics

// Routes
app.route("/api", routes);

// Base route
app.get("/", (c) => {
  return c.json({
    message: "Melon Music API",
    endpoints: [
      "/api/chart/top100",
      "/api/chart/hot100",
      "/api/chart/day",
      "/api/chart/week",
      "/api/chart/month",
      "/api/song/:songId",
      "/api/album/:albumId",
    ],
  });
});

// Initialize chart pre-fetching if enabled
// This helps with performance in standalone server mode
const enablePrefetch = process.env.ENABLE_CHART_PREFETCH === "true"; // Default to false if not specified
const prefetchInterval = parseInt(
  process.env.PREFETCH_INTERVAL_MS || "60000", // Default to 1 minute
  10
);

if (enablePrefetch) {
  chartPrefetcher.updateConfig({
    enabled: true,
    intervalMs: prefetchInterval,
    onSuccess: (type) => console.log(`[Prefetch] Chart data updated: ${type}`),
    onError: (type, error) =>
      console.error(
        `[Prefetch] Failed to update ${type} chart:`,
        error.message
      ),
  });

  chartPrefetcher.start();

  // Add shutdown handler for clean process termination
  const shutdownHandler = () => {
    console.log("Stopping chart pre-fetcher...");
    chartPrefetcher.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdownHandler);
  process.on("SIGTERM", shutdownHandler);
}

export default app;
