import type { ApiResponse, ApiError, ApiRequestOptions } from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export class ProbeApiError extends Error implements ApiError {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(message: string, statusCode: number = 500, code: string = "INTERNAL_ERROR", details?: Record<string, unknown>) {
    super(message);
    this.name = "ProbeApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Standard API client for Crestix Probe frontend modules.
 * Ensures uniform error handling, authorization headers, and JSON formatting.
 */
export async function fetchWithEnvelope<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, headers, ...restOptions } = options;

  let url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    const response = await fetch(url, {
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      ...restOptions,
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json() : null;

    if (!response.ok) {
      throw new ProbeApiError(
        payload?.message || response.statusText || "Request failed",
        response.status,
        payload?.code || `HTTP_${response.status}`,
        payload?.details
      );
    }

    // Wrap plain data in ApiResponse envelope if not already enveloped
    if (payload && typeof payload === "object" && "data" in payload && "success" in payload) {
      return payload as ApiResponse<T>;
    }

    return {
      data: payload as T,
      success: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof ProbeApiError) {
      throw error;
    }
    throw new ProbeApiError(
      error instanceof Error ? error.message : "Network error occurred",
      0,
      "NETWORK_ERROR"
    );
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: ApiRequestOptions) =>
    fetchWithEnvelope<T>(endpoint, { method: "GET", ...options }),

  post: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    fetchWithEnvelope<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) =>
    fetchWithEnvelope<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T>(endpoint: string, options?: ApiRequestOptions) =>
    fetchWithEnvelope<T>(endpoint, { method: "DELETE", ...options }),
};
