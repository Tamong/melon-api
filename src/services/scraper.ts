import * as cheerio from "cheerio";
import { Result, ok, err } from "neverthrow";

// Define types for error handling
type ErrorTargetId =
  | "artist"
  | "album"
  | "song"
  | "video"
  | "hidden_video"
  | "playlist"
  | "hidden_playlist"
  | "perf"
  | "mstory"
  | "entnews"
  | "private"
  | "theme"
  | "story"
  | "nowplaying"
  | "fanMagaz"
  | "tsSong";

export class MelonScraper {
  private BASE_URL: string;
  private timeout: number;
  private HEADERS: Record<string, string>;

  // Error message mapping
  private ERROR_MESSAGES: Record<ErrorTargetId, string> = {
    artist: "Artist not found: The requested artist does not exist",
    album: "Album not found: The requested album does not exist",
    song: "Song not found: The requested song does not exist",
    video: "Video not found: The requested video does not exist",
    hidden_video: "Private content: This content is private",
    playlist: "Playlist not found: The requested playlist does not exist",
    hidden_playlist: "Private playlist: This playlist is private",
    perf: "Performance not found: The requested performance does not exist",
    mstory: "Deleted page: This page has been deleted",
    entnews: "Deleted article: This article has been deleted",
    private: "Fan-only content: This content is only available to fans",
    theme: "Theme not found: The requested theme does not exist",
    story: "Story not found: The requested story does not exist",
    nowplaying:
      "Now Playing not found: The requested Now Playing does not exist",
    fanMagaz: "Mobile only: This content is only available on mobile",
    tsSong:
      "Temporarily unavailable: This song is temporarily unavailable due to a rights violation report",
  };

  constructor(baseUrl = "https://www.melon.com", timeout = 10000) {
    this.BASE_URL = baseUrl;
    this.timeout = timeout;

    this.HEADERS = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      Referer: "https://www.melon.com/",
      Connection: "keep-alive",
    };
  }

  /**
   * Check if HTML is an error page and get the appropriate error message
   * @param $ - Cheerio instance loaded with HTML
   * @returns An error message if it's an error page, null otherwise
   */
  private getErrorMessage($: cheerio.CheerioAPI): string | null {
    // Check if this is the error page structure
    const contsDiv = $("#conts[data-targetId]");
    if (!contsDiv.length) return null;

    const targetIdInput = $("#targetId");
    if (!targetIdInput.length) return null;

    const targetId = targetIdInput.val() as string;

    // Return the error message from the map or a default message
    return (
      this.ERROR_MESSAGES[targetId as ErrorTargetId] ||
      "Invalid request: An unknown error occurred"
    );
  }

  /**
   * Fetch HTML content from a given URL path
   * @param path - The path to fetch from the base URL
   * @returns - Result containing CheerioAPI instance or an error
   */
  async fetchHtml(path: string): Promise<Result<cheerio.CheerioAPI, Error>> {
    const url = `${this.BASE_URL}${path}`;
    console.log(`Fetching data from: ${url}`);

    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        headers: this.HEADERS,
        signal: controller.signal,
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      if (!response.ok) {
        return err(new Error(`HTTP error! Status: ${response.status}`));
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Check if this is an error page
      const errorMessage = this.getErrorMessage($);
      if (errorMessage) {
        return err(new Error(errorMessage));
      }

      return ok($);
    } catch (error) {
      // Clear the timeout if there's an error
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        return err(new Error(`Failed to fetch data: ${error.message}`));
      }
      return err(new Error("Unknown error occurred while fetching data"));
    }
  }
}
