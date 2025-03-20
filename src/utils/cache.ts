import { Result, ok } from "neverthrow";

/**
 * Generic cache item interface
 */
export interface CacheItem<T> {
  data: T;
  timestamp: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
}

// Create a cache service for use across the application
export class CacheService {
  private static cache: Record<string, CacheItem<any>> = {};
  private static defaultTTL: number = 1 * 60 * 1000; // 1 minute in milliseconds

  /**
   * Get or fetch data with caching
   * @param key The cache key
   * @param fetchFn The function to call to fetch fresh data
   * @param ttl Optional TTL for this specific item
   * @returns The data, either from cache or freshly fetched
   */
  static async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CacheService.defaultTTL
  ): Promise<T> {
    const now = Date.now();

    // Check if we have a valid cache entry
    if (
      CacheService.cache[key] &&
      now - CacheService.cache[key].timestamp < ttl
    ) {
      return CacheService.cache[key].data;
    }

    // Otherwise fetch fresh data
    const data = await fetchFn();

    // Update cache
    CacheService.cache[key] = {
      data,
      timestamp: now,
    };

    return data;
  }

  /**
   * Get or fetch data with caching, supporting Result type
   * @param key The cache key
   * @param fetchFn The function to call to fetch fresh data (returns Result)
   * @param ttl Optional TTL for this specific item
   * @returns The Result, either from cache or freshly fetched
   */
  static async getOrFetchResult<T, E = Error>(
    key: string,
    fetchFn: () => Promise<Result<T, E>>,
    ttl: number = CacheService.defaultTTL
  ): Promise<Result<T, E>> {
    const now = Date.now();

    // Check if we have a valid cache entry
    if (
      CacheService.cache[key] &&
      now - CacheService.cache[key].timestamp < ttl
    ) {
      // Return the cached data wrapped in an ok Result
      return ok(CacheService.cache[key].data) as Result<T, E>;
    }

    // Otherwise fetch fresh data
    const result = await fetchFn();

    // Only cache successful results
    if (result.isOk()) {
      CacheService.cache[key] = {
        data: result.value,
        timestamp: now,
      };
    }

    return result;
  }

  /**
   * Set the default TTL for the cache
   */
  static setDefaultTTL(ttl: number): void {
    CacheService.defaultTTL = ttl;
  }

  /**
   * Clear all cache entries
   */
  static clear(): void {
    CacheService.cache = {};
  }

  /**
   * Manually invalidate a cache entry
   */
  static invalidate(key: string): boolean {
    if (CacheService.cache[key]) {
      delete CacheService.cache[key];
      return true;
    }
    return false;
  }
}
