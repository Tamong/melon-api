import { MelonScraper } from "@/services/scraper";
import { ChartType, ChartTypes, MelonTrack } from "@/types/charts";

export class MelonChartService {
  private scraper: MelonScraper;
  public CHART_TYPES: ChartTypes;

  constructor() {
    this.scraper = new MelonScraper("https://www.melon.com");

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
   * @returns - List of tracks with their details
   */
  async getChart(chartType: string = "top100"): Promise<MelonTrack[]> {
    if (!this.CHART_TYPES.hasOwnProperty(chartType)) {
      throw new Error(
        `Invalid chart type. Choose from: ${Object.keys(this.CHART_TYPES).join(
          ", "
        )}`
      );
    }

    const path = this.CHART_TYPES[chartType] + "/";
    const $ = await this.scraper.fetchHtml(path);

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
          const value = Number($(element).find("span.up").text().trim()) || 0;
          rankChange = { direction: "up", value };
        }
        // Check for rank down
        else if ($(element).find("span.bullet_icons.rank_down").length) {
          const value = Number($(element).find("span.down").text().trim()) || 0;
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
        if (error instanceof Error) {
          console.error(`Error parsing track: ${error.message}`);
        }
      }
    });

    return tracks;
  }
}

// Cache storage
interface CacheItem {
  data: MelonTrack[];
  timestamp: number;
}

const cache: Record<string, CacheItem> = {};
const CACHE_TTL = 1 * 60 * 1000; // 1 minute in milliseconds
const chartService = new MelonChartService();

/**
 * Get Melon chart data with caching
 * @param chartType The type of chart to fetch
 * @returns Array of track objects
 */
export async function getMelonChart(chartType: string): Promise<MelonTrack[]> {
  // Validate chart type
  if (!Object.keys(chartService.CHART_TYPES).includes(chartType)) {
    throw new Error(
      `Invalid chart type. Choose from: ${Object.keys(
        chartService.CHART_TYPES
      ).join(", ")}`
    );
  }

  const now = Date.now();

  // Check if we have a valid cache entry
  if (cache[chartType] && now - cache[chartType].timestamp < CACHE_TTL) {
    console.log(`Using cached data for ${chartType} chart`);
    return cache[chartType].data;
  }

  // Otherwise fetch fresh data
  console.log(
    `Cache miss or expired for ${chartType} chart, fetching fresh data`
  );
  const data = await chartService.getChart(chartType);

  // Update cache
  cache[chartType] = {
    data,
    timestamp: now,
  };

  return data;
}
