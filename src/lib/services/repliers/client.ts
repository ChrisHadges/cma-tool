import type {
  RepliersSearchParams,
  RepliersSearchResponse,
  RepliersListing,
  RepliersAutocompleteResult,
  RepliersEstimateRequest,
  RepliersEstimateResponse,
} from "./types";

const API_BASE = process.env.REPLIERS_API_BASE_URL || "https://api.repliers.io";
const API_KEY = process.env.REPLIERS_API_KEY || "";
const IMAGE_CDN = "https://cdn.repliers.io/";

/** Prefix relative image paths with the CDN base URL */
function resolveImageUrls(images: string[] | undefined): string[] {
  if (!images) return [];
  return images.map((img) =>
    img.startsWith("http") ? img : `${IMAGE_CDN}${img}`
  );
}

/** Transform all image paths in a listing to full URLs */
function transformListingImages(listing: RepliersListing): RepliersListing {
  if (listing.images && Array.isArray(listing.images)) {
    return { ...listing, images: resolveImageUrls(listing.images) };
  }
  return listing;
}

/** Transform all listings in a search response */
function transformSearchResponse(response: RepliersSearchResponse): RepliersSearchResponse {
  if (response.listings) {
    return {
      ...response,
      listings: response.listings.map(transformListingImages),
    };
  }
  return response;
}

class RepliersApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = "RepliersApiError";
  }
}

async function request<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    params?: Record<string, unknown>;
    body?: unknown;
  } = {}
): Promise<T> {
  const { method = "GET", params, body } = options;

  const url = new URL(`${API_BASE}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        url.searchParams.set(key, value.join(","));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    "REPLIERS-API-KEY": API_KEY,
    "Content-Type": "application/json",
  };

  const fetchOptions: RequestInit = { method, headers };
  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  let retries = 3;
  let lastError: Error | null = null;

  while (retries > 0) {
    try {
      const response = await fetch(url.toString(), fetchOptions);

      if (response.status === 429) {
        // Rate limited — wait and retry
        const retryAfter = response.headers.get("Retry-After");
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 2000;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        retries--;
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new RepliersApiError(
          response.status,
          `Repliers API error ${response.status}: ${errorBody}`,
          errorBody
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof RepliersApiError && error.status !== 429) {
        throw error;
      }
      lastError = error as Error;
      retries--;
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError || new Error("Repliers API request failed after retries");
}

// ─── Public API Methods ──────────────────────────────────────────

export async function searchListings(
  params: RepliersSearchParams
): Promise<RepliersSearchResponse> {
  const { ...queryParams } = params;
  const result = await request<RepliersSearchResponse>("/listings", { params: queryParams as Record<string, unknown> });
  return transformSearchResponse(result);
}

export async function searchListingsPost(
  params: RepliersSearchParams,
  body?: {
    queries?: RepliersSearchParams[];
    imageSearchItems?: unknown[];
  }
): Promise<RepliersSearchResponse> {
  const result = await request<RepliersSearchResponse>("/listings", {
    method: "POST",
    params: params as Record<string, unknown>,
    body,
  });
  return transformSearchResponse(result);
}

export async function getListing(
  mlsNumber: string,
  boardId?: number
): Promise<RepliersListing> {
  const params: Record<string, unknown> = {};
  if (boardId) params.boardId = boardId;
  const listing = await request<RepliersListing>(`/listings/${mlsNumber}`, { params });
  return transformListingImages(listing);
}

export async function getSimilarListings(
  mlsNumber: string,
  options?: {
    radius?: number;
    fields?: string;
    sortBy?: string;
    boardId?: number;
  }
): Promise<RepliersSearchResponse> {
  const result = await request<RepliersSearchResponse>(`/listings/${mlsNumber}/similar`, {
    params: options as Record<string, unknown>,
  });
  return transformSearchResponse(result);
}

export async function autocompleteLocations(
  search: string
): Promise<RepliersAutocompleteResult[]> {
  return request<RepliersAutocompleteResult[]>("/locations/autocomplete", {
    params: { search },
  });
}

export async function searchLocations(
  params: { area?: string; city?: string; class?: string; neighborhood?: string; search?: string }
): Promise<unknown> {
  return request("/locations", { params: params as Record<string, unknown> });
}

export async function createEstimate(
  data: RepliersEstimateRequest
): Promise<RepliersEstimateResponse> {
  return request<RepliersEstimateResponse>("/estimates", {
    method: "POST",
    body: data,
  });
}

export async function getPlaces(
  lat: string,
  lng: string
): Promise<unknown> {
  return request("/places", { params: { lat, long: lng } });
}

export async function getMarketStatistics(
  params: RepliersSearchParams
): Promise<RepliersSearchResponse> {
  return searchListings({
    ...params,
    listings: false,
    statistics: params.statistics || "listPrice,soldPrice",
  });
}

export async function getAggregates(
  params: RepliersSearchParams
): Promise<RepliersSearchResponse> {
  return searchListings({
    ...params,
    listings: false,
    aggregates: params.aggregates || "details.propertyType,address.city",
  });
}

// ─── Utility: Parse sqft range string ────────────────────────────
export function parseSqftRange(sqft: string): { min: number; max: number; avg: number } {
  if (!sqft) return { min: 0, max: 0, avg: 0 };
  const parts = sqft.split("-").map((s) => parseInt(s.trim(), 10));
  if (parts.length === 2) {
    return { min: parts[0], max: parts[1], avg: Math.round((parts[0] + parts[1]) / 2) };
  }
  const val = parseInt(sqft, 10) || 0;
  return { min: val, max: val, avg: val };
}

// ─── Utility: Format full address ────────────────────────────────
export function formatAddress(address: RepliersListing["address"]): string {
  const parts = [
    address.unitNumber ? `${address.unitNumber}-` : "",
    address.streetNumber,
    address.streetName,
    address.streetSuffix,
    address.streetDirection,
  ].filter(Boolean);

  return `${parts.join(" ")}, ${address.city}, ${address.state} ${address.zip}`;
}
