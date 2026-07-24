import { env } from "./env";

export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  if (!env.apiBaseUrl) {
    throw new Error("VITE_API_BASE_URL is not configured yet. This template is frontend-only in phase 1.");
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}
