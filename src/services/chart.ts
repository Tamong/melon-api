import { MelonScraper } from "@/services/scraper";
import { ChartTypes, MelonTrack } from "@/types/charts";
import { CacheService } from "@/utils/cache";
import { Result, ok, err } from "neverthrow";

export class MelonChartService {
  private scraper: MelonScraper;
  public CHART_TYPES: ChartTypes;

  constructor() {
    // Fix: Pass an object with baseUrl property instead of a string
    this.scraper = new MelonScraper();

    this.CHART_TYPES = {
      top100: "/chart",
      hot100: "/chart/hot100",
      day: "/chart/day",
      week: "/chart/week",
      month: "/chart/month",
    };
  }

  /**
   * Fetch and parse the specified Melon chart
   * @param chartType - Type of chart to fetch ('top100', 'hot100', 'day', 'week', 'month')
   * @returns - Result containing list of tracks or an error
   */
  async getChart(
    chartType: string = "top100"
  ): Promise<Result<MelonTrack[], Error>> {
    if (!this.CHART_TYPES.hasOwnProperty(chartType)) {
      return err(
        new Error(
          `Invalid chart type. Choose from: ${Object.keys(
            this.CHART_TYPES
          ).join(", ")}`
        )
      );
    }

    const path = this.CHART_TYPES[chartType] + "/";
    const htmlResult = await this.scraper.fetchHtml(path);

    // Fix using andThen instead of map
    return htmlResult.andThen(($) => {
      try {
        const chartList = $("tbody > tr");
        const tracks: MelonTrack[] = [];

        chartList.each((index, element) => {
          try {
            const rank = $(element).find("span.rank").text().trim();

            // Get song ID from the melon URL
            let songId: string | null = null;
            const songLink = $(element).find('a[href*="playSong"]');
            if (songLink.length) {
              const href = songLink.attr("href") || "";
              if (href.includes("playSong") && href.includes(",")) {
                const splitResult = href.split(",")[1]?.split("'")[0];
                if (splitResult) {
                  songId = splitResult;
                  // remove special characters from songId
                  songId = songId.replace(/[^0-9]/g, "");
                }
              }
            }

            // Get title and artist
            const titleTag = $(element).find("div.ellipsis.rank01 > span > a");
            const title = titleTag.length
              ? titleTag.text().trim()
              : "Unknown Title";

            const artistTags = $(element).find("div.ellipsis.rank02 > a");
            const artists: string[] = [];
            artistTags.each((i, artist) => {
              artists.push($(artist).text().trim());
            });

            // Get album info
            const albumTag = $(element).find("div.ellipsis.rank03 > a");
            const album = albumTag.length
              ? albumTag.text().trim()
              : "Unknown Album";

            // Get album ID if available
            let albumId: string | null = null;
            if (albumTag.length) {
              const href = albumTag.attr("href") || "";
              if (href.includes("goAlbumDetail") && href.includes("'")) {
                const albumIdValue = href.split("'")[1];
                albumId = albumIdValue ? albumIdValue : null;
              }
            }

            // Try to get image URL
            const imgTag = $(element).find('img[src*="album"]');
            const imageUrl = imgTag.length ? imgTag.attr("src") || "" : "";

            // Extract rank change information
            let rankChange: {
              direction: "up" | "down" | "static";
              value: number;
            } | null = null;

            // Check for rank up
            const rankUpElement = $(element).find("span.bullet_icons.rank_up");
            if (rankUpElement.length) {
              const value =
                Number($(element).find("span.up").text().trim()) || 0;
              rankChange = { direction: "up", value };
            }
            // Check for rank down
            else if ($(element).find("span.bullet_icons.rank_down").length) {
              const value =
                Number($(element).find("span.down").text().trim()) || 0;
              rankChange = { direction: "down", value };
            }
            // Check for rank static
            else if ($(element).find("span.bullet_icons.rank_static").length) {
              rankChange = { direction: "static", value: 0 };
            }

            // Add to tracks list
            const track = {
              rank,
              songId,
              title,
              artists,
              album,
              albumId,
              imageUrl,
              rankChange,
            };

            tracks.push(track);
          } catch (error) {
            console.error(
              `Error parsing track: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        });

        return ok(tracks);
      } catch (error) {
        return err(
          error instanceof Error
            ? error
            : new Error("Failed to parse chart data")
        );
      }
    });
  }
}

const chartService = new MelonChartService();

/**
 * Get Melon chart data with caching
 * @param chartType The type of chart to fetch
 * @returns Result containing array of track objects or an error
 */
export async function getMelonChart(
  chartType: string
): Promise<Result<MelonTrack[], Error>> {
  // Validate chart type
  if (!Object.keys(chartService.CHART_TYPES).includes(chartType)) {
    const errorMessage = `Invalid chart type '${chartType}'. Choose from: ${Object.keys(
      chartService.CHART_TYPES
    ).join(", ")}`;
    console.error(`Error: ${errorMessage}`);
    return err(new Error(errorMessage));
  }

  try {
    return await CacheService.getOrFetchResult<MelonTrack[]>(
      `chart_${chartType}`,
      async () => {
        try {
          const chartResult = await chartService.getChart(chartType);
          if (chartResult.isErr()) {
            console.error(
              `Error fetching ${chartType} chart:`,
              chartResult.error
            );
          }
          return chartResult;
        } catch (error) {
          console.error(
            `Unexpected error fetching ${chartType} chart:`,
            error instanceof Error ? error.message : String(error)
          );
          return err(
            error instanceof Error
              ? error
              : new Error(`Failed to fetch ${chartType} chart`)
          );
        }
      }
    );
  } catch (cacheError) {
    console.error(
      `Cache service error for ${chartType} chart:`,
      cacheError instanceof Error ? cacheError.message : String(cacheError)
    );
    return err(
      cacheError instanceof Error
        ? cacheError
        : new Error("Cache service failed")
    );
  }
}
