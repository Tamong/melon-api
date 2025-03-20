import * as cheerio from "cheerio";
import { MelonScraper } from "./scraper";
import { CacheService } from "@/utils/cache";
import { Result, ok, err } from "neverthrow";

export interface SongData {
  title: string;
  artists: Array<{
    name: string;
    id: string;
  }>;
  album: {
    name: string;
    id: string;
  };
  releaseDate: string;
  genre: string;
  lyrics: string;
  producers: Array<{
    name: string;
    id: string;
    roles: string[];
  }>;
}

export async function getSongData(
  songId: string
): Promise<Result<SongData, Error>> {
  return CacheService.getOrFetchResult<SongData>(`song_${songId}`, async () => {
    const scraper = new MelonScraper();
    const path = `/song/detail.htm?songId=${songId}`;

    const htmlResult = await scraper.fetchHtml(path);

    // Fix using andThen instead of map
    return htmlResult.andThen(($) => {
      try {
        // Extract title
        const title = $(".song_name").text().replace("곡명", "").trim();

        // Extract all main artists from the section_info
        const artists: SongData["artists"] = [];
        $(".section_info .artist a.artist_name").each((i, el) => {
          const artistName = $(el).text().trim();
          let artistId = "";

          const artistLink = $(el).attr("href");
          if (artistLink) {
            const artistIdMatch = artistLink.match(/goArtistDetail\('(\d+)'\)/);
            if (artistIdMatch && artistIdMatch[1]) {
              artistId = artistIdMatch[1];
            }
          }

          if (artistName && !artists.some((a) => a.name === artistName)) {
            artists.push({ name: artistName, id: artistId });
          }
        });

        // Extract album info
        let albumName = "";
        let albumId = "";

        const albumElement = $(".section_info .list dd").eq(0).find("a");
        if (albumElement.length) {
          albumName = albumElement.text().trim();
          const albumLink = albumElement.attr("href");
          if (albumLink) {
            const albumIdMatch = albumLink.match(/goAlbumDetail\('(\d+)'\)/);
            if (albumIdMatch && albumIdMatch[1]) {
              albumId = albumIdMatch[1];
            }
          }
        }

        // Extract release date
        const releaseDateElement = $(".section_info .list dd").eq(1);
        const releaseDate = releaseDateElement.length
          ? releaseDateElement.text().trim()
          : "";

        // Extract genre
        const genreElement = $(".section_info .list dd").eq(2);
        const genre = genreElement.length ? genreElement.text().trim() : "";

        // Extract lyrics
        let lyrics = "";
        $(".section_lyric .lyric").each((i, el) => {
          lyrics +=
            $(el)
              .html()
              ?.replace(/<!--[\s\S]*?-->/g, "")
              .replace(/<br\s*\/?>/gi, "\n")
              .trim() || "";
        });

        // Clean up HTML entities in lyrics
        lyrics = lyrics
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");

        const producers: SongData["producers"] = [];
        $(".section_prdcr .list_person li").each((i, el) => {
          const name = $(el)
            .find(".ellipsis.artist .artist_name")
            .text()
            .trim();
          const role = $(el).find(".meta .type").text().trim();
          let id = "";

          const artistLink = $(el)
            .find(".ellipsis.artist .artist_name")
            .attr("href");
          if (artistLink) {
            const idMatch = artistLink.match(/goArtistDetail\((\d+)\)/);
            if (idMatch && idMatch[1]) {
              id = idMatch[1];
            }
          }

          if (name && role) {
            const existingProducer = producers.find((p) => p.name === name);

            if (existingProducer) {
              if (!existingProducer.roles.includes(role)) {
                existingProducer.roles.push(role);
              }
            } else {
              producers.push({ name, id, roles: [role] });
            }
          }
        });

        return ok({
          title,
          artists,
          album: {
            name: albumName,
            id: albumId,
          },
          releaseDate,
          genre,
          lyrics,
          producers,
        });
      } catch (error) {
        return err(
          error instanceof Error
            ? error
            : new Error("Failed to parse song data")
        );
      }
    });
  });
}
