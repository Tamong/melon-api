import { Hono } from "hono";
import { getSongData } from "@/services/song";

const song = new Hono();

song.get("/:songId", async (c) => {
  const songId = c.req.param("songId");

  if (!songId || !/^\d+$/.test(songId)) {
    return c.json({ error: "Invalid song ID. Must be a number." }, 400);
  }

  const result = await getSongData(songId);

  return result.match(
    (data) => c.json(data),
    (error) => {
      console.error("Error fetching song data:", error);
      return c.json({ error: error.message }, 404);
    }
  );
});

export { song as songRoutes };
