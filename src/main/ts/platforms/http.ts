import { PlatformApiError, type PlatformId } from "./types";

export async function requestJson<T>(
  platform: PlatformId,
  url: URL,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    signal: options.signal ?? AbortSignal.timeout(20_000),
    headers: {
      accept: "application/json",
      ...options.headers,
    },
  });
  const body = await response.text();
  let parsed: unknown;
  try {
    parsed = body ? JSON.parse(body) : {};
  } catch {
    throw new PlatformApiError(`${platform} returned a non-JSON response (HTTP ${response.status}).`, response.status, platform);
  }

  if (!response.ok) {
    const record = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
    const providerError = record.error && typeof record.error === "object"
      ? record.error as Record<string, unknown>
      : record;
    const message = typeof providerError.message === "string"
      ? providerError.message
      : typeof providerError.error_description === "string"
        ? providerError.error_description
        : response.statusText;
    const hint = response.status === 401 || response.status === 403
      ? " Check token validity, required scopes, app review, and access tier."
      : response.status === 429
        ? " The provider rate limit or quota was reached. Retry only after the reset window."
        : "";
    throw new PlatformApiError(`${platform} API request failed (HTTP ${response.status}): ${message}.${hint}`, response.status, platform);
  }
  return parsed as T;
}

export function requiredEnv(name: string): string {
  const value = Bun.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function envNumber(name: string, fallback: number, min: number, max: number): number {
  const raw = Bun.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return value;
}
