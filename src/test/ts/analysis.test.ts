import { describe, expect, test } from "bun:test";
import type { PlatformComment, PlatformPost } from "../../main/ts/platforms/types";
import { createLocalAnalysis } from "../../main/ts/features/analysis/analyze";
import { analyzeContent } from "../../main/ts/features/analysis/ai";
import { formatReport } from "../../main/ts/features/reports/print";

const posts: PlatformPost[] = [{
  id: "video-1",
  text: "The proposal is presented in this video.",
}];

describe("content analysis", () => {
  test("keeps local stance percentages aggregate and labels the heuristic", () => {
    const comments: PlatformComment[] = [
      { id: "1", text: "I agree, this is correct.", postId: "video-1" },
      { id: "2", text: "I disagree, this is wrong.", postId: "video-1" },
      { id: "3", text: "Interesting video.", postId: "video-1" },
    ];
    const result = createLocalAnalysis(posts, comments);

    expect(result.aiEnabled).toBe(false);
    expect(result.stanceMethod).toBe("local-heuristic");
    expect(result.commentStances.agree.count).toBe(1);
    expect(result.commentStances.disagree.percent).toBe(33.3);
    expect(result.commentStances.unclear.count).toBe(1);
    expect(result.commentStancesByPost[0]?.postId).toBe("video-1");
    expect(result.commentStancesByPost[0]?.commentCount).toBe(3);
    expect(result.commentStancesByPost[0]?.stances.agree.percent).toBe(33.3);
    expect(Object.keys(result.commentStances)).not.toContain("authors");
  });

  test("uses a compatible AI endpoint and sends sanitized comment text without identifiers", async () => {
    let sentText = "";
    const sentContexts: string[] = [];
    const mockFetch = async (_input: URL, init?: RequestInit): Promise<Response> => {
      const payload = JSON.parse(String(init?.body)) as {
        messages: Array<{ role: string; content: string }>;
      };
      const userMessage = payload.messages.find((message) => message.role === "user")!;
      const requestData = JSON.parse(userMessage.content) as {
        postContext: string;
        comments: Array<{ text: string }>;
      };
      sentText = requestData.comments[0]?.text ?? "";
      sentContexts.push(requestData.postContext);

      return Response.json({
        choices: [{
          message: {
            content: JSON.stringify({
              summary: "Comments show mixed reactions.",
              stanceCounts: { agree: requestData.comments.length, disagree: 0, neutral: 0, unclear: 0 },
              indicators: [],
            }),
          },
        }],
      });
    };
    const result = await analyzeContent(
      [...posts, { id: "video-2", text: "The counter proposal is presented here." }],
      [
        {
          id: "private-comment-id",
          text: "@someuser agrees https://example.com/secret",
          postId: "video-1",
        },
        {
          id: "private-comment-id-2",
          text: "This second proposal is correct.",
          postId: "video-2",
        },
      ],
      {
        AI_PROVIDER: "openai-compatible",
        AI_BASE_URL: "http://localhost:1234/v1",
        AI_MODEL: "local-test-model",
      },
      mockFetch,
    );

    expect(result.aiEnabled).toBe(true);
    expect(result.aiModel).toBe("local-test-model");
    expect(result.commentStances.agree.count).toBe(2);
    expect(result.commentStancesByPost[0]?.postId).toBe("video-1");
    expect(result.commentStancesByPost[0]?.stances.agree.count).toBe(1);
    expect(result.commentStancesByPost[1]?.postId).toBe("video-2");
    expect(result.commentStancesByPost[1]?.stances.agree.count).toBe(1);
    expect(sentContexts).toHaveLength(2);
    expect(sentContexts[0]).toContain("proposal");
    expect(sentContexts[1]).toContain("counter proposal");
    expect(sentText).not.toContain("@someuser");
    expect(sentText).not.toContain("example.com");
    expect(sentText).not.toContain("private-comment-id");
  });

  test("returns zero counts for posts without comments and separates unassigned comments", () => {
    const result = createLocalAnalysis(
      [...posts, { id: "video-2", text: "Another post", url: "https://example.com/video-2" }],
      [
        { id: "1", text: "I agree", postId: "video-1" },
        { id: "2", text: "I disagree", postId: "unknown-post" },
        { id: "3", text: "Nice video" },
      ],
    );

    expect(result.commentStancesByPost).toHaveLength(4);
    expect(result.commentStancesByPost[0]?.stances.agree.count).toBe(1);
    expect(result.commentStancesByPost[1]?.postId).toBe("video-2");
    expect(result.commentStancesByPost[1]?.commentCount).toBe(0);
    expect(result.commentStancesByPost[1]?.stances.unclear.percent).toBe(0);
    expect(result.commentStancesByPost[2]?.postId).toBe("unknown-post");
    expect(result.commentStancesByPost[2]?.stances.disagree.count).toBe(1);
    expect(result.commentStancesByPost[3]?.postId).toBeNull();
    expect(result.commentStancesByPost[3]?.stances.unclear.count).toBe(1);
  });

  test("prints scan scope and post-level aggregate comment stances", () => {
    const collection = {
      seed: { type: "post" as const, value: new URL("https://youtube.com/watch?v=video-1") },
      sourceAccount: { id: "channel-1", username: "@channel" },
      posts: [{ id: "video-1", url: "https://youtube.com/watch?v=video-1", text: "Video text" }],
      comments: [{ id: "1", text: "I agree", postId: "video-1" }],
      interactions: [],
      collectedAt: new Date("2026-01-01T00:00:00.000Z"),
      limitations: [],
    };
    const report = formatReport(collection, createLocalAnalysis(collection.posts, collection.comments));

    expect(report).toContain("Analysis scope: Target post/video and its accessible comments");
    expect(report).toContain("Interacting account assessments: not performed");
    expect(report).toContain("Comment stance by post:");
    expect(report).toContain("https://youtube.com/watch?v=video-1 (1 comments)");
  });

  test("does not silently fall back when AI endpoint fails", async () => {
    const mockFetch = async (): Promise<Response> => new Response(null, { status: 503 });

    await expect(analyzeContent(
      posts,
      [{ id: "1", text: "I agree with this.", postId: "video-1" }],
      {
        AI_PROVIDER: "openai-compatible",
        AI_BASE_URL: "http://localhost:1234/v1",
        AI_MODEL: "local-test-model",
      },
      mockFetch,
    )).rejects.toThrow("AI endpoint returned HTTP 503");
  });
});
