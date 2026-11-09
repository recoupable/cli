import { getApiKey, getBaseUrl } from "./config.js";

export interface ApiResponse {
  status?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

async function request(
  url: URL,
  options: Pick<RequestInit, "method" | "body">,
): Promise<ApiResponse> {
  const response = await fetch(url.toString(), {
    ...options,
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

export async function get(
  path: string,
  params?: Record<string, string>,
): Promise<ApiResponse> {
  const url = new URL(path, getBaseUrl());
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }

  return request(url, { method: "GET" });
}

export async function post(
  path: string,
  body: Record<string, unknown>,
): Promise<ApiResponse> {
  return request(new URL(path, getBaseUrl()), {
    method: "POST",
    body: JSON.stringify(body),
  });
}
