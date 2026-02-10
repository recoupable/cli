import { getApiKey, getBaseUrl } from "./config.js";

export interface ApiResponse {
  status?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export async function get(
  path: string,
  params?: Record<string, string>,
): Promise<ApiResponse> {
  const baseUrl = getBaseUrl();
  const url = new URL(path, baseUrl);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": getApiKey(),
      "Content-Type": "application/json",
    },
  });

  const data: ApiResponse = await response.json();

  if (!response.ok || data.status === "error") {
    throw new Error(data.error || data.message || `Request failed: ${response.status}`);
  }

  return data;
}

export async function post(
  path: string,
  body: Record<string, unknown>,
): Promise<ApiResponse> {
  const baseUrl = getBaseUrl();
  const url = new URL(path, baseUrl);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "x-api-key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data: ApiResponse = await response.json();

  if (!response.ok || data.status === "error") {
    throw new Error(data.error || data.message || `Request failed: ${response.status}`);
  }

  return data;
}
