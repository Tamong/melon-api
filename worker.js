import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import app from "./src/index";

// Re-export your Hono app
export default app;
