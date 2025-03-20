import { Hono } from "hono";
import { getAlbumData } from "@/services/album";

const album = new Hono();

album.get("/:albumId", async (c) => {
  const albumId = c.req.param("albumId");

  if (!albumId || !/^\d+$/.test(albumId)) {
    return c.json({ error: "Invalid album ID. Must be a number." }, 400);
  }

  const result = await getAlbumData(albumId);

  return result.match(
    (data) => c.json(data),
    (error) => {
      console.error("Error fetching album data:", error);
      return c.json({ error: error.message }, 404);
    }
  );
});

export { album as albumRoutes };
