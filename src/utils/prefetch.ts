import { getMelonChart } from "@/services/chart";
import { CacheService } from "@/utils/cache";

// Chart types available for pre-fetching
const CHART_TYPES = ["top100", "hot100", "day", "week", "month"];

// Configuration for the pre-fetcher
interface PrefetchConfig {
  enabled: boolean;
  intervalMs: number;
  onSuccess?: (type: string) => void;
  onError?: (type: string, error: Error) => void;
}

// Default configuration
const DEFAULT_CONFIG: PrefetchConfig = {
  enabled: true,
  intervalMs: 50000, // Slightly less than cache TTL (which defaults to 1 minute)
  onSuccess: (type) => console.log(`Pre-fetched chart data: ${type}`),
  onError: (type, error) =>
    console.error(`Error pre-fetching ${type} chart:`, error),
};

export class ChartPrefetcher {
  private config: PrefetchConfig;
  private intervalIds: ReturnType<typeof setInterval>[] = [];
  private isRunning = false;

  constructor(config: Partial<PrefetchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start pre-fetching chart data at regular intervals
   */
  start(): void {
    if (!this.config.enabled || this.isRunning) return;

    this.isRunning = true;

    // Immediately fetch all chart types
    this.prefetchAllCharts();

    // Set up periodic pre-fetching
    CHART_TYPES.forEach((chartType) => {
      const intervalId = setInterval(() => {
        this.prefetchChart(chartType);
      }, this.config.intervalMs);

      this.intervalIds.push(intervalId);
    });

    console.log(
      `Chart pre-fetcher started. Interval: ${this.config.intervalMs}ms`
    );
  }

  /**
   * Stop pre-fetching chart data
   */
  stop(): void {
    if (!this.isRunning) return;

    this.intervalIds.forEach((intervalId) => clearInterval(intervalId));
    this.intervalIds = [];
    this.isRunning = false;

    console.log("Chart pre-fetcher stopped");
  }

  /**
   * Pre-fetch a specific chart type
   */
  async prefetchChart(chartType: string): Promise<void> {
    try {
      const result = await getMelonChart(chartType);
      if (result.isOk() && this.config.onSuccess) {
        this.config.onSuccess(chartType);
      } else if (result.isErr() && this.config.onError) {
        this.config.onError(chartType, result.error);
      }
    } catch (error) {
      if (this.config.onError) {
        this.config.onError(
          chartType,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  /**
   * Pre-fetch all chart types at once
   */
  async prefetchAllCharts(): Promise<void> {
    await Promise.allSettled(
      CHART_TYPES.map((chartType) => this.prefetchChart(chartType))
    );
  }

  /**
   * Check if pre-fetcher is currently running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PrefetchConfig>): void {
    const wasRunning = this.isRunning;

    if (wasRunning) {
      this.stop();
    }

    this.config = { ...this.config, ...config };

    if (wasRunning && this.config.enabled) {
      this.start();
    }
  }
}

// Singleton instance for app-wide use
export const chartPrefetcher = new ChartPrefetcher();
