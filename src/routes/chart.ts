import { Hono } from "hono";
import { getMelonChart } from "@/services/chart";

const charts = new Hono();

charts.get("/:chartType", async (c) => {
  try {
    const chartType = c.req.param("chartType");
    const data = await getMelonChart(chartType);
    return c.json(data);
  } catch (error) {
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Unknown error occurred" }, 500);
  }
});

export { charts as chartRoutes };
