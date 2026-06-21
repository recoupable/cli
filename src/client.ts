import { getApiKey, getBaseUrl } from "./config.js";

export interface ApiResponse {
  status?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, getBaseUrl());
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.toString();
}

async function parseResponse(response: Response): Promise<ApiResponse> {
  const text = await response.text();
  let data: ApiResponse;
  try {
    data = text ? (JSON.parse(text) as ApiResponse) : {};
  } catch {
    // Non-JSON response (e.g. plain text error pages)
    data = { message: text };
  }

  if (!response.ok || data.status === "error") {
    throw new Error(
      data.error || data.message || `Request failed: ${response.status}`,
    );
  }

  return data;
}

export async function get(
  path: string,
  params?: Record<string, string>,
): Promise<ApiResponse> {
  const response = await fetch(buildUrl(path, params), {
    method: "GET",
    headers: {
      "x-api-key": getApiKey(),
      "Content-Type": "application/json",
    },
  });
  return parseResponse(response);
}

async function sendBody(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
): Promise<ApiResponse> {
  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      "x-api-key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parseResponse(response);
}

export function post(
  path: string,
  body: Record<string, unknown>,
): Promise<ApiResponse> {
  return sendBody("POST", path, body);
}

export function patch(
  path: string,
  body: Record<string, unknown>,
): Promise<ApiResponse> {
  return sendBody("PATCH", path, body);
}

export function put(
  path: string,
  body: Record<string, unknown>,
): Promise<ApiResponse> {
  return sendBody("PUT", path, body);
}

export function del(
  path: string,
  body?: Record<string, unknown>,
): Promise<ApiResponse> {
  return sendBody("DELETE", path, body);
}
