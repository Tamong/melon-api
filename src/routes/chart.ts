import { Hono } from "hono";
import { getMelonChart } from "@/services/chart";

const chart = new Hono();

chart.get("/:chartType", async (c) => {
  const chartType = c.req.param("chartType");

  const result = await getMelonChart(chartType);

  return result.match(
    (data) => c.json(data),
    (error) => {
      console.error("Error fetching chart data:", error.message);
      return c.json({ error: error.message }, 404);
    }
  );
});

export { chart as chartRoutes };
