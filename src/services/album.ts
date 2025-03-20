import { MelonScraper } from "@/services/scraper";
import { CacheService } from "@/utils/cache";
import { Result, ok, err } from "neverthrow";

interface AlbumArtist {
  name: string;
  id: string;
}

interface AlbumSong {
  songId: string;
  title: string;
  artists: AlbumArtist[];
  isTitle: boolean;
}

interface AlbumData {
  albumId: string;
  type: string;
  title: string;
  artists: AlbumArtist[];
  releaseDate: string;
  genre: string;
  publisher: string;
  agency: string;
  imageUrl: string;
  songs: AlbumSong[];
  introduction: string;
}

export async function getAlbumData(
  albumId: string
): Promise<Result<AlbumData, Error>> {
  return CacheService.getOrFetchResult(`album_${albumId}`, async () => {
    const scraper = new MelonScraper();
    const path = `/album/detail.htm?albumId=${albumId}`;

    const htmlResult = await scraper.fetchHtml(path);

    // The problem is here - we need to use the cheerio object correctly
    return htmlResult.andThen(($) => {
      try {
        let type = $(".gubun").text().trim();
        type = type.replace(/\[|\]/g, "").trim();

        // Extract album title - get only the text node content directly under song_name div
        // This handles cases where the HTML is: <div class="song_name"><strong class="none">앨범명</strong>ALBUM TITLE</div>
        let title = "";
        const songNameDiv = $(
          ".section_info .wrap_info .entry .info .song_name"
        );

        // Clone the element to work with it
        const clonedDiv = songNameDiv.clone();
        // Remove any child elements like <strong> to leave only direct text nodes
        clonedDiv.children().remove();
        // Get the remaining text which should be just the album title
        title = clonedDiv.text().trim();

        // If title is still empty, fall back to meta tag
        if (!title) {
          title = $("meta[property='og:title']").attr("content") || "";
          if (title && title.includes(" - ")) {
            title = title.split(" - ")[0]?.trim() ?? "";
          }
        }

        // Extract album artists
        const artists: AlbumArtist[] = [];
        $(".section_info .wrap_info .artist .artist_name").each((i, el) => {
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

        // Extract metadata from the list element
        const metaList = $(".section_info .meta .list");
        let releaseDate = "";
        let genre = "";
        let publisher = "";
        let agency = "";

        metaList.find("dt").each((i, el) => {
          const label = $(el).text().trim();
          const value = $(el).next("dd").text().trim();

          if (label === "발매일") {
            releaseDate = value;
          } else if (label === "장르") {
            genre = value;
          } else if (label === "발매사") {
            publisher = value;
          } else if (label === "기획사") {
            agency = value;
          }
        });

        // Extract image URL
        const imageUrl = $(".section_info .thumb img").attr("src") || "";

        // Extract album introduction with proper HTML handling
        let introduction = "";
        $(".section_albuminfo .cont_albuminfo .dtl_albuminfo div").each(
          (i, el) => {
            introduction +=
              $(el)
                .html()
                ?.replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments
                .replace(/<br\s*\/?>/gi, "\n") // Replace <br> tags with newlines
                .trim() || "";
          }
        );

        // Clean up HTML entities in introduction
        introduction = introduction
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");

        // Extract songs list
        const songs: AlbumSong[] = [];
        $("div.service_list_song table tbody tr[data-group-items]").each(
          (i, el) => {
            // Extract song ID
            let songId =
              ($(el)
                .find('input[type="checkbox"][name="input_check"]')
                .val() as string) || "";

            if (!songId) {
              const songInfoLink = $(el).find('a[href*="goSongDetail"]');
              if (songInfoLink.length) {
                const href = songInfoLink.attr("href") || "";
                const songIdMatch = href.match(/goSongDetail\('(\d+)'\)/);
                if (songIdMatch && songIdMatch[1]) {
                  songId = songIdMatch[1];
                }
              }
            }

            if (!songId) return; // Skip if we can't find a song ID

            // Extract song title and check if it's a title song
            const isTitle =
              $(el).find(".wrap_song_info .ellipsis span .bullet_icons.title")
                .length > 0;

            // Get title directly from the anchor tag that contains just the song title
            // This avoids getting extra text that might be in the parent span
            let title = "";
            const titleAnchor = $(el).find(
              ".wrap_song_info .ellipsis:not(.rank02) span a"
            );
            if (titleAnchor.length) {
              title = titleAnchor.text().trim();
            } else {
              // For cases where song title might not be a link (disabled songs)
              // Get all text but exclude any text from special elements like bullet_icons
              const spanEl = $(el).find(".wrap_song_info .ellipsis span");
              spanEl.find(".bullet_icons, .none").remove();
              title = spanEl.text().trim();
            }

            // Extract song artists
            const songArtists: AlbumArtist[] = [];
            $(el)
              .find(".wrap_song_info .ellipsis.rank02 a")
              .each((j, artistEl) => {
                const artistName = $(artistEl).text().trim();
                let artistId = "";
                const artistLink = $(artistEl).attr("href");
                if (artistLink) {
                  const artistIdMatch = artistLink.match(
                    /goArtistDetail\('(\d+)'\)/
                  );
                  if (artistIdMatch && artistIdMatch[1]) {
                    artistId = artistIdMatch[1];
                  }
                }

                if (
                  artistName &&
                  !songArtists.some((a) => a.name === artistName)
                ) {
                  songArtists.push({ name: artistName, id: artistId });
                }
              });

            songs.push({
              songId,
              title,
              artists: songArtists,
              isTitle,
            });
          }
        );

        return ok({
          albumId,
          type,
          title,
          artists,
          releaseDate,
          genre,
          publisher,
          agency,
          imageUrl,
          songs,
          introduction,
        });
      } catch (error) {
        return err(
          error instanceof Error
            ? error
            : new Error("Failed to parse album data")
        );
      }
    });
  });
}
