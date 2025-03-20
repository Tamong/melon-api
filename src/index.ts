import { Hono } from "hono";
import { analytics } from "@/middleware/analytics";
import routes from "@/routes";
import { logger } from "hono/logger";

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

export default app;
