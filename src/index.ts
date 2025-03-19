import { Hono } from "hono";
import { analytics } from "@/middleware/analytics";
import routes from "@/routes";

const app = new Hono();

// Middleware
app.use("/api/*", (c, next) => analytics(c, next));

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
    ],
  });
});

export default app;
