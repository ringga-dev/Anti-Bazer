import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getAiStatus } from "../features/analysis/ai";
import { runScan, type ScanRunResult } from "../features/scan/run";
import { parseScanEntries } from "../features/scan/input";
import { envNumber } from "../platforms/http";
import { getMissingCredentials, getPlatform } from "../platforms/registry";
import { platformIds, type PlatformId, type ScanSeed } from "../platforms/types";

const maxRequestBytes = 16 * 1024;
const maxRetainedJobs = 20;
const scanRequestSchema = z.object({
  platform: z.enum([...platformIds, "auto"]).optional().default("auto"),
  target: z.url(),
}).strict();

type JobStatus = "queued" | "running" | "succeeded" | "failed";

interface ScanJob {
  id: string;
  platform: PlatformId;
  target: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  result?: ScanRunResult;
  error?: string;
}

type ScanExecutor = (platform: PlatformId, seed: ScanSeed) => Promise<ScanRunResult>;
type ConfigurationValidator = (platform: PlatformId) => string | undefined;

interface ApiHandlerOptions {
  token?: string;
  corsOrigin?: string;
  maxConcurrentScans?: number;
  scan?: ScanExecutor;
  validateConfiguration?: ConfigurationValidator;
}

function defaultConfigurationError(platformId: PlatformId): string | undefined {
  const platform = getPlatform(platformId);
  const missing = getMissingCredentials(platform);
  if (missing.length > 0) {
    return `${platform.title} is not configured. Missing: ${missing.join(", ")}.`;
  }
  try {
    getAiStatus();
  } catch (error) {
    return error instanceof Error ? `AI configuration error: ${error.message}` : "AI configuration is invalid.";
  }
  return undefined;
}

function isAuthorized(request: Request, token?: string): boolean {
  if (!token) return true;
  const supplied = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!supplied) return false;
  const expectedBytes = Buffer.from(token);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

function json(data: unknown, status = 200, extraHeaders?: HeadersInit): Response {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store", ...extraHeaders },
  });
}

function jobSummary(job: ScanJob) {
  return {
    id: job.id,
    platform: job.platform,
    target: job.target,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    ...(job.error ? { error: job.error } : {}),
    ...(job.status === "succeeded" ? { resultUrl: `/api/v1/scans/${job.id}/result` } : {}),
  };
}

export function createApiHandler(options: ApiHandlerOptions = {}): (request: Request) => Promise<Response> {
  const jobs = new Map<string, ScanJob>();
  const scan = options.scan ?? runScan;
  const validateConfiguration = options.validateConfiguration ?? defaultConfigurationError;
  const maxConcurrentScans = options.maxConcurrentScans ?? 2;
  let activeScans = 0;

  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin");
    if (origin && options.corsOrigin && origin !== options.corsOrigin) {
      return json({ error: "Origin is not allowed." }, 403);
    }
    if (origin && !options.corsOrigin) {
      return json({ error: "Cross-origin requests are disabled." }, 403);
    }

    const corsHeaders: Record<string, string> = origin && options.corsOrigin
      ? {
        "access-control-allow-origin": options.corsOrigin,
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "authorization, content-type",
        "access-control-max-age": "600",
        vary: "Origin",
      }
      : {};

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
    if (request.method === "GET" && path === "/health") {
      return json({ status: "ok" }, 200, corsHeaders);
    }
    if (!isAuthorized(request, options.token)) {
      return json({ error: "A valid Bearer API token is required." }, 401, corsHeaders);
    }

    if (request.method === "POST" && path === "/api/v1/scans") {
      const contentLength = Number(request.headers.get("content-length") ?? 0);
      if (contentLength > maxRequestBytes) {
        return json({ error: `Request body must not exceed ${maxRequestBytes} bytes.` }, 413, corsHeaders);
      }
      if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
        return json({ error: "Content-Type must be application/json." }, 415, corsHeaders);
      }
      let body: unknown;
      try {
        const raw = await request.text();
        if (Buffer.byteLength(raw, "utf8") > maxRequestBytes) {
          return json({ error: `Request body must not exceed ${maxRequestBytes} bytes.` }, 413, corsHeaders);
        }
        body = JSON.parse(raw);
      } catch {
        return json({ error: "Request body must contain valid JSON." }, 400, corsHeaders);
      }
      const parsed = scanRequestSchema.safeParse(body);
      if (!parsed.success) {
        return json({ error: "Invalid scan request.", details: parsed.error.issues.map(({ path: issuePath, message }) => ({
          path: issuePath.join("."),
          message,
        })) }, 400, corsHeaders);
      }
      const resolved = parseScanEntries([`target=${parsed.data.target}`], parsed.data.platform);
      if (!resolved.success) return json({ error: resolved.error }, 400, corsHeaders);

      const configurationError = validateConfiguration(resolved.data.platform);
      if (configurationError) return json({ error: configurationError }, 503, corsHeaders);
      if (activeScans >= maxConcurrentScans) {
        return json({ error: "Scan capacity is busy. Retry after an active scan completes." }, 429, corsHeaders);
      }

      while (jobs.size >= maxRetainedJobs) {
        const oldestFinished = [...jobs.values()].find((job) => job.status === "succeeded" || job.status === "failed");
        if (!oldestFinished) return json({ error: "The in-memory scan queue is full." }, 503, corsHeaders);
        jobs.delete(oldestFinished.id);
      }

      const now = new Date().toISOString();
      const job: ScanJob = {
        id: crypto.randomUUID(),
        platform: resolved.data.platform,
        target: resolved.data.targetUrl.href,
        status: "queued",
        createdAt: now,
        updatedAt: now,
      };
      jobs.set(job.id, job);
      activeScans += 1;

      void (async () => {
        job.status = "running";
        job.updatedAt = new Date().toISOString();
        try {
          job.result = await scan(job.platform, {
            type: resolved.data.targetType,
            value: resolved.data.targetUrl,
          });
          job.status = "succeeded";
        } catch (error) {
          job.error = error instanceof Error ? error.message : "An unexpected scan error occurred.";
          job.status = "failed";
        } finally {
          job.updatedAt = new Date().toISOString();
          activeScans -= 1;
        }
      })();

      return json({
        scan: jobSummary(job),
        statusUrl: `/api/v1/scans/${job.id}`,
      }, 202, corsHeaders);
    }

    const jobRoute = path.match(/^\/api\/v1\/scans\/([0-9a-f-]+)(\/result)?$/i);
    if (request.method === "GET" && jobRoute) {
      const job = jobs.get(jobRoute[1]!);
      if (!job) return json({ error: "Scan not found. Results are held in memory for this server process only." }, 404, corsHeaders);
      if (jobRoute[2] === "/result") {
        if (job.status === "queued" || job.status === "running") {
          return json({ error: "Scan is still running.", scan: jobSummary(job) }, 409, corsHeaders);
        }
        if (job.status === "failed") {
          return json({ error: job.error ?? "Scan failed.", scan: jobSummary(job) }, 422, corsHeaders);
        }
        return json({ scan: jobSummary(job), ...job.result }, 200, corsHeaders);
      }
      return json({ scan: jobSummary(job) }, 200, corsHeaders);
    }

    return json({ error: "Route not found." }, 404, corsHeaders);
  };
}

function isLoopback(host: string): boolean {
  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(host.toLowerCase());
}

export function startApiServer(): void {
  const hostname = Bun.env.API_HOST?.trim() || "127.0.0.1";
  const port = envNumber("API_PORT", 3000, 1, 65535);
  const token = Bun.env.API_ACCESS_TOKEN?.trim() || undefined;
  const corsOrigin = Bun.env.API_CORS_ORIGIN?.trim() || undefined;
  if (!isLoopback(hostname) && !token) {
    throw new Error("API_ACCESS_TOKEN is required when API_HOST is not a loopback address.");
  }
  if (token && token.length < 32) {
    throw new Error("API_ACCESS_TOKEN must be at least 32 characters long.");
  }
  if (corsOrigin) {
    let parsedOrigin: URL;
    try {
      parsedOrigin = new URL(corsOrigin);
    } catch {
      throw new Error("API_CORS_ORIGIN must be a valid origin URL, for example http://localhost:5173.");
    }
    if (parsedOrigin.origin !== corsOrigin || !["http:", "https:"].includes(parsedOrigin.protocol)) {
      throw new Error("API_CORS_ORIGIN must contain only an HTTP(S) origin, without a path.");
    }
  }
  const maxConcurrentScans = envNumber("API_MAX_CONCURRENT_SCANS", 2, 1, 10);
  const server = Bun.serve({
    hostname,
    port,
    maxRequestBodySize: maxRequestBytes,
    fetch: createApiHandler({ token, corsOrigin, maxConcurrentScans }),
  });
  console.log(`Anti Bazer API listening on http://${server.hostname}:${server.port}`);
  console.log("Health: GET /health | Submit: POST /api/v1/scans");
}
