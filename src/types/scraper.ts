/**
 * Configuration options for the MelonScraper
 */
export interface ScraperConfig {
  baseUrl: string;
  timeout: number;
  headers?: Record<string, string>;
}

/**
 * Default scraper configuration
 */
export const DEFAULT_SCRAPER_CONFIG: ScraperConfig = {
  baseUrl: "https://www.melon.com",
  timeout: 10000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    Referer: "https://www.melon.com/",
    Connection: "keep-alive",
  },
};
