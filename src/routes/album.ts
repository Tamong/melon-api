import { Hono } from "hono";
import { getAlbumData } from "@/services/album";

export const albumRoutes = new Hono();

albumRoutes.get("/:albumId", async (c) => {
  try {
    const albumId = c.req.param("albumId");

    if (!albumId || !/^\d+$/.test(albumId)) {
      return c.json({ error: "Invalid album ID. Must be a number." }, 400);
    }

    const albumData = await getAlbumData(albumId);
    return c.json(albumData);
  } catch (error) {
    console.error("Error fetching album data:", error);
    return c.json({ error: "Failed to fetch album data" }, 500);
  }
});
