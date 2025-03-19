import { Hono } from "hono";
import { chartRoutes } from "@/routes/charts";

const api = new Hono();
api.route("/chart", chartRoutes);

export { api as chartRoutes };
