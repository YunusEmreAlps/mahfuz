import { QURAN_API_BASE_URL } from "@mahfuz/shared/constants";
import type { ApiError } from "@mahfuz/shared/types";

export interface QuranApiClientOptions {
  baseUrl?: string;
  language?: string;
  defaultHeaders?: Record<string, string>;
}

type CacheAdapter = {
  get<T>(key: string, ttl: number): Promise<T | null>;
  set<T>(key: string, data: T): Promise<void>;
};

export class QuranApiClient {
  private baseUrl: string;
  private language: string;
  private defaultHeaders: Record<string, string>;
  private cacheAdapter: CacheAdapter | null = null;
  private cacheAdapterLoaded = false;

  constructor(options: QuranApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? QURAN_API_BASE_URL;
    this.language = options.language ?? "tr";
    this.defaultHeaders = {
      "Accept": "application/json",
      ...options.defaultHeaders,
    };
  }

  private async getCache(): Promise<CacheAdapter | null> {
    if (this.cacheAdapterLoaded) return this.cacheAdapter;
    this.cacheAdapterLoaded = true;

    if (typeof window === "undefined") return null;

    try {
      const { cacheRepository } = await import("@mahfuz/db");
      this.cacheAdapter = cacheRepository;
    } catch {
      // @mahfuz/db not available — proceed without cache
    }

    return this.cacheAdapter;
  }

  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    cacheTtl?: number,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    // Always include language
    if (!url.searchParams.has("language")) {
      url.searchParams.set("language", this.language);
    }

    const cacheKey = url.toString();

    // Check cache first
    if (cacheTtl) {
      const cache = await this.getCache();
      if (cache) {
        const cached = await cache.get<T>(cacheKey, cacheTtl);
        if (cached !== null) return cached;
      }
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.defaultHeaders,
    });

    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        message: `API request failed: ${response.statusText}`,
      };

      try {
        const body = await response.json();
        if (body.message) error.message = body.message;
        if (body.errors) error.errors = body.errors;
      } catch {
        // ignore json parse errors
      }

      throw error;
    }

    const data = (await response.json()) as T;

    // Store in cache
    if (cacheTtl) {
      const cache = await this.getCache();
      if (cache) {
        cache.set(cacheKey, data).catch(() => {});
      }
    }

    return data;
  }

  setLanguage(language: string): void {
    this.language = language;
  }

  getLanguage(): string {
    return this.language;
  }

  /** Read from cache (exposed for QDC API calls that bypass get()) */
  async getCached<T>(key: string, ttl: number): Promise<T | null> {
    const cache = await this.getCache();
    if (!cache) return null;
    return cache.get<T>(key, ttl);
  }

  /** Write to cache (exposed for QDC API calls that bypass get()) */
  async setCached<T>(key: string, data: T): Promise<void> {
    const cache = await this.getCache();
    if (cache) {
      cache.set(key, data).catch(() => {});
    }
  }
}
