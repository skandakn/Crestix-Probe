import type { ApiResponse, ApiError, ApiRequestOptions } from "@/types/api";

function getBaseUrl(): string {
  // In Vercel serverless functions / SSR runtime, use internal service binding URL if injected
  if (typeof window === "undefined" && process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, "");
  }
  return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
}

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

  const baseUrl = getBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  let url: string;
  if (cleanEndpoint.startsWith("http://") || cleanEndpoint.startsWith("https://")) {
    url = cleanEndpoint;
  } else if (baseUrl) {
    // If endpoint doesn't have /api prefix, add it so it routes to backend domain routers
    const apiPath = cleanEndpoint.startsWith("/api") ? cleanEndpoint : `/api${cleanEndpoint}`;
    // Avoid double /api prefix if baseUrl ends with /api
    if (baseUrl.endsWith("/api") && apiPath.startsWith("/api")) {
      url = `${baseUrl.slice(0, -4)}${apiPath}`;
    } else {
      url = `${baseUrl}${apiPath}`;
    }
  } else {
    // In browser client: ensure /api prefix is present for Vercel rewrite
    url = cleanEndpoint.startsWith("/api") ? cleanEndpoint : `/api${cleanEndpoint}`;
  }

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
  post: <T>(endpoint: string, data?: unknown, options?: ApiRequestOptions) =>
    fetchWithEnvelope<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),
  put: <T>(endpoint: string, data?: unknown, options?: ApiRequestOptions) =>
    fetchWithEnvelope<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }),
  delete: <T>(endpoint: string, options?: ApiRequestOptions) =>
    fetchWithEnvelope<T>(endpoint, { method: "DELETE", ...options }),
};
