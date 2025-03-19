import * as cheerio from "cheerio";

export class MelonScraper {
  private BASE_URL: string;
  private timeout: number;
  private HEADERS: Record<string, string>;

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
   * Fetch HTML content from a given URL path
   * @param path - The path to fetch from the base URL
   * @returns - CheerioAPI instance loaded with the HTML
   */
  async fetchHtml(path: string): Promise<cheerio.CheerioAPI> {
    const url = `${this.BASE_URL}${path}`;

    try {
      console.log(`Fetching data from: ${url}`);

      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        headers: this.HEADERS,
        signal: controller.signal,
      });

      // Clear the timeout
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const html = await response.text();
      return cheerio.load(html);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch data: ${error.message}`);
      }
      throw new Error("Unknown error occurred while fetching data");
    }
  }
}
