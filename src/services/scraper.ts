import * as cheerio from "cheerio";
import { Result, ok, err } from "neverthrow";
import { ErrorTargetId, ERROR_MESSAGES } from "@/types/errors";
import { ScraperConfig, DEFAULT_SCRAPER_CONFIG } from "@/types/scraper";

export class MelonScraper {
  private baseUrl: string;
  private timeout: number;
  private headers: Record<string, string>;

  /**
   * Creates a new MelonScraper instance
   *
   * @param config - Configuration options for the scraper
   */
  constructor(config: Partial<ScraperConfig> = {}) {
    const mergedConfig = { ...DEFAULT_SCRAPER_CONFIG, ...config };

    this.baseUrl = mergedConfig.baseUrl;
    this.timeout = mergedConfig.timeout;
    this.headers = mergedConfig.headers || {};
  }

  /**
   * Check if HTML is an error page and get the appropriate error message
   *
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
      ERROR_MESSAGES[targetId as ErrorTargetId] ||
      "Invalid request: An unknown error occurred"
    );
  }

  /**
   * Fetch HTML content from a given URL path
   *
   * @param path - The path to fetch from the base URL
   * @returns - Result containing CheerioAPI instance or an error
   */
  async fetchHtml(path: string): Promise<Result<cheerio.CheerioAPI, Error>> {
    const url = `${this.baseUrl}${path}`;

    try {
      const result = await this.fetchWithTimeout(url, this.timeout);

      if (!result.ok) {
        return err(new Error(`HTTP error! Status: ${result.status}`));
      }

      const html = await result.text();
      const $ = cheerio.load(html);

      // Check if this is an error page
      const errorMessage = this.getErrorMessage($);
      if (errorMessage) {
        return err(new Error(errorMessage));
      }

      return ok($);
    } catch (error) {
      if (error instanceof Error) {
        return err(new Error(`Failed to fetch data: ${error.message}`));
      }
      return err(new Error("Unknown error occurred while fetching data"));
    }
  }

  /**
   * Helper method to fetch with timeout
   *
   * @param url - The URL to fetch
   * @param timeoutMs - Timeout in milliseconds
   * @returns - Response or throws error
   */
  private async fetchWithTimeout(
    url: string,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: this.headers,
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
