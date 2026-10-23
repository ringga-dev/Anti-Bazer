import { describe, expect, test } from "bun:test";
import { getMissingCredentials, getPlatform, platforms } from "../../main/ts/platforms/registry";
import { youtubeAdapter } from "../../main/ts/platforms/youtube/adapter";

describe("platform setup", () => {
  test("registers each supported provider exactly once", () => {
    expect(platforms.map((platform) => platform.id)).toEqual([
      "x",
      "instagram",
      "tiktok",
      "youtube",
      "facebook",
    ]);
  });

  test("reports missing provider credentials without exposing values", () => {
    const platform = getPlatform("instagram");

    expect(getMissingCredentials(platform, {
      INSTAGRAM_ACCESS_TOKEN: "configured-token",
      INSTAGRAM_USER_ID: "",
      META_GRAPH_API_VERSION: "v23.0",
    })).toEqual(["INSTAGRAM_USER_ID"]);
  });

  test("returns no missing credentials when provider setup is complete", () => {
    const platform = getPlatform("youtube");

    expect(getMissingCredentials(platform, {
      YOUTUBE_API_KEY: "configured-key",
    })).toEqual([]);
  });

  test("collects YouTube video metadata and paginated comments through the official API", async () => {
    const previousApiKey = Bun.env.YOUTUBE_API_KEY;
    const previousPageLimit = Bun.env.YOUTUBE_MAX_COMMENT_PAGES;
    Bun.env.YOUTUBE_API_KEY = "test-key";
    Bun.env.YOUTUBE_MAX_COMMENT_PAGES = "2";
    const originalFetch = globalThis.fetch;
    const requests: URL[] = [];
    globalThis.fetch = (async (input: URL | RequestInfo) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      requests.push(url);
      if (url.pathname.endsWith("/videos")) {
        return Response.json({
          items: [{
            id: "video-1",
            snippet: { title: "Test video", channelId: "channel-1", channelTitle: "Test channel" },
            statistics: { commentCount: "2", likeCount: "3" },
          }],
        });
      }
      if (url.pathname.endsWith("/channels")) {
        return Response.json({
          items: [{ id: "channel-1", snippet: { title: "Test channel", customUrl: "@test" } }],
        });
      }
      if (url.pathname.endsWith("/commentThreads") && url.searchParams.get("pageToken") === "page-2") {
        return Response.json({
          items: [{
            id: "thread-2",
            snippet: {
              topLevelComment: { id: "comment-2", snippet: { textDisplay: "Second comment" } },
              totalReplyCount: 0,
            },
          }],
        });
      }
      if (url.pathname.endsWith("/commentThreads")) {
        return Response.json({
          items: [{
            id: "thread-1",
            snippet: {
              topLevelComment: { id: "comment-1", snippet: { textDisplay: "First comment" } },
              totalReplyCount: 0,
            },
          }],
          nextPageToken: "page-2",
        });
      }
      return Response.json({ error: { message: "Unexpected test request" } }, { status: 500 });
    }) as typeof fetch;

    try {
      const result = await youtubeAdapter.scan({
        type: "post",
        value: new URL("https://www.youtube.com/watch?v=video-1"),
      });

      expect(result.sourceAccount?.id).toBe("channel-1");
      expect(result.posts[0]?.text).toBe("Test video");
      expect(result.comments.map((comment) => comment.text)).toEqual(["First comment", "Second comment"]);
      expect(requests).toHaveLength(4);
      expect(requests.every((url) => url.searchParams.get("key") === "test-key")).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
      if (previousApiKey === undefined) delete Bun.env.YOUTUBE_API_KEY;
      else Bun.env.YOUTUBE_API_KEY = previousApiKey;
      if (previousPageLimit === undefined) delete Bun.env.YOUTUBE_MAX_COMMENT_PAGES;
      else Bun.env.YOUTUBE_MAX_COMMENT_PAGES = previousPageLimit;
    }
  });
});
