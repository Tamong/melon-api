import { Hono } from "hono";
import { analytics } from "@/middleware/analytics";
import { chartRoutes } from "@/routes";

const app = new Hono();

// Middleware
app.use("/api/*", (c, next) => analytics(c, next));

// Routes
app.route("/api", chartRoutes);

// Base route
app.get("/", (c) => {
  return c.json({
    message: "Music Charts API",
    endpoints: [
      "/api/chart/top100",
      "/api/chart/hot100",
      "/api/chart/day",
      "/api/chart/week",
      "/api/chart/month",
    ],
  });
});

// Start the server
const port = process.env.PORT || 3000;
console.log(`Melon Chart API server running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
