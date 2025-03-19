import { Hono } from "hono";
import { getSongData } from "@/services/song";

export const songRoutes = new Hono();

songRoutes.get("/:songId", async (c) => {
  try {
    const songId = c.req.param("songId");

    if (!songId || !/^\d+$/.test(songId)) {
      return c.json({ error: "Invalid song ID. Must be a number." }, 400);
    }

    const songData = await getSongData(songId);
    return c.json(songData);
  } catch (error) {
    console.error("Error fetching song data:", error);
    return c.json({ error: "Failed to fetch song data" }, 500);
  }
});
