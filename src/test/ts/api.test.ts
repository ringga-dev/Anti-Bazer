import { describe, expect, test } from "bun:test";
import { createLocalAnalysis } from "../../main/ts/features/analysis/analyze";
import { createApiHandler } from "../../main/ts/api/server";
import type { ScanRunResult } from "../../main/ts/features/scan/run";
import type { PlatformId } from "../../main/ts/platforms/types";

function mockResult(): ScanRunResult {
  const seed = {
    type: "post" as const,
    value: new URL("https://www.youtube.com/watch?v=video-1"),
  };
  const collection = {
    seed,
    posts: [{ id: "video-1", text: "Test video" }],
    comments: [{ id: "comment-1", text: "I agree with this.", postId: "video-1" }],
    interactions: [],
    collectedAt: new Date("2026-01-01T00:00:00.000Z"),
    limitations: [],
  };
  return {
    collection,
    analysis: createLocalAnalysis(collection.posts, collection.comments),
    scope: {
      targetType: seed.type,
      analysisUnit: "post_comment_sample",
      postsCollected: 1,
      commentsCollected: 1,
      interactionRecordsCollected: 0,
      interactingAccountAssessment: {
        status: "not_implemented",
        accountsAnalyzed: 0,
        explanation: "Interacting-account analysis is not implemented.",
      },
    },
    report: "Test analysis report",
  };
}

async function waitForResult(
  handler: (request: Request) => Promise<Response>,
  id: string,
): Promise<Response> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await handler(new Request(`http://localhost/api/v1/scans/${id}/result`));
    if (response.status !== 409) return response;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error("Scan did not complete before the test timeout.");
}

describe("HTTP API", () => {
  test("submits a scan, reports its status, and returns its analysis", async () => {
    let receivedPlatform: PlatformId | undefined;
    const handler = createApiHandler({
      validateConfiguration: () => undefined,
      scan: async (platform) => {
        receivedPlatform = platform;
        return mockResult();
      },
    });
    const submitted = await handler(new Request("http://localhost/api/v1/scans", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        platform: "auto",
        target: "https://www.youtube.com/watch?v=video-1",
      }),
    }));
    const submission = await submitted.json() as {
      scan: { id: string; status: string };
      statusUrl: string;
    };

    expect(submitted.status).toBe(202);
    expect(submission.scan.status).toMatch(/queued|running/);
    expect(submission.statusUrl).toBe(`/api/v1/scans/${submission.scan.id}`);
    const resultResponse = await waitForResult(handler, submission.scan.id);
    const result = await resultResponse.json() as {
      scan: { status: string };
      report: string;
      scope: {
        targetType: string;
        postsCollected: number;
        interactingAccountAssessment: { status: string; accountsAnalyzed: number };
      };
      analysis: {
        commentStances: { agree: { count: number } };
        commentStancesByPost: Array<{
          postId: string | null;
          stances: { agree: { percent: number } };
        }>;
      };
    };

    expect(receivedPlatform).toBe("youtube");
    expect(resultResponse.status).toBe(200);
    expect(result.scan.status).toBe("succeeded");
    expect(result.report).toBe("Test analysis report");
    expect(result.scope.targetType).toBe("post");
    expect(result.scope.postsCollected).toBe(1);
    expect(result.scope.interactingAccountAssessment.status).toBe("not_implemented");
    expect(result.scope.interactingAccountAssessment.accountsAnalyzed).toBe(0);
    expect(result.analysis.commentStances.agree.count).toBe(1);
    expect(result.analysis.commentStancesByPost[0]?.postId).toBe("video-1");
    expect(result.analysis.commentStancesByPost[0]?.stances.agree.percent).toBe(100);
  });

  test("requires a bearer token when configured and rejects invalid JSON requests", async () => {
    const handler = createApiHandler({ token: "test-api-token" });
    const unauthorized = await handler(new Request("http://localhost/api/v1/scans", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    }));
    expect(unauthorized.status).toBe(401);

    const invalid = await handler(new Request("http://localhost/api/v1/scans", {
      method: "POST",
      headers: {
        authorization: "Bearer test-api-token",
        "content-type": "application/json",
      },
      body: "{",
    }));
    expect(invalid.status).toBe(400);
  });

  test("restricts browser requests to the configured CORS origin", async () => {
    const handler = createApiHandler({ corsOrigin: "http://localhost:5173" });
    const allowed = await handler(new Request("http://localhost/health", {
      headers: { origin: "http://localhost:5173" },
    }));
    const denied = await handler(new Request("http://localhost/health", {
      headers: { origin: "http://evil.example" },
    }));

    expect(allowed.status).toBe(200);
    expect(allowed.headers.get("access-control-allow-origin")).toBe("http://localhost:5173");
    expect(denied.status).toBe(403);
  });
});
