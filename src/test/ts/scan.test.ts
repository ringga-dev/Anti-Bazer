import { describe, expect, test } from "bun:test";
import { inferPlatformFromUrl, inferTargetType, parseScanEntries, scanInputSchema } from "../../main/ts/features/scan/input";

describe("scan input", () => {
  test("accepts a username seed", () => {
    expect(scanInputSchema.safeParse({
      platform: "x",
      username: "sample-user",
    }).success).toBe(true);
  });

  test("accepts a post URL seed", () => {
    expect(scanInputSchema.safeParse({
      platform: "x",
      post: "https://social.example/posts/123",
    }).success).toBe(true);
  });

  test("rejects a missing or ambiguous seed", () => {
    expect(scanInputSchema.safeParse({ platform: "x" }).success).toBe(false);
    expect(scanInputSchema.safeParse({
      platform: "x",
      username: "sample-user",
      post: "https://social.example/posts/123",
    }).success).toBe(false);
  });

  test("rejects an invalid post URL", () => {
    expect(scanInputSchema.safeParse({
      platform: "x",
      post: "not-a-url",
    }).success).toBe(false);
  });

  test("parses the terminal key=value shorthand and detects platform from target URL", () => {
    const result = parseScanEntries(["platform=auto", "target=https://www.youtube.com/watch?v=abc"]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.platform).toBe("youtube");
      expect(result.data.targetType).toBe("post");
      expect(result.data.targetUrl.href).toBe("https://www.youtube.com/watch?v=abc");
    }
  });

  test("accepts Commander platform option with account and post target keys", () => {
    const youtube = parseScanEntries(
      ["target=https://www.youtube.com/watch?v=abc"],
      "auto",
    );
    const instagram = parseScanEntries(
      ["akun=https://www.instagram.com/sample/"],
      "instagram",
    );
    const xPost = parseScanEntries(
      ["post=https://x.com/sample/status/123"],
      "x",
    );

    expect(youtube.success && youtube.data.platform).toBe("youtube");
    expect(instagram.success && instagram.data.targetType).toBe("account");
    expect(xPost.success && xPost.data.targetType).toBe("post");
  });

  test("accepts an account URL as a target and rejects a mismatched platform", () => {
    expect(parseScanEntries(["platform=instagram", "akun=https://instagram.com/example"]).success).toBe(true);
    expect(parseScanEntries(["platform=x", "post=https://instagram.com/example"]).success).toBe(false);
  });

  test("detects account and post URL forms", () => {
    expect(inferTargetType("x", "https://x.com/person")).toBe("account");
    expect(inferTargetType("x", "https://x.com/person/status/POST_ID")).toBe("post");
    expect(inferTargetType("instagram", "https://instagram.com/person")).toBe("account");
    expect(inferTargetType("instagram", "https://instagram.com/p/abc")).toBe("post");
    expect(inferTargetType("tiktok", "https://www.tiktok.com/@person")).toBe("account");
    expect(inferTargetType("tiktok", "https://www.tiktok.com/@person/video/123")).toBe("post");
    expect(inferTargetType("youtube", "https://youtube.com/@person")).toBe("account");
    expect(inferTargetType("facebook", "https://facebook.com/person/posts/123")).toBe("post");
  });

  test("recognizes supported social platform URL hosts", () => {
    expect(inferPlatformFromUrl("https://x.com/sample")).toBe("x");
    expect(inferPlatformFromUrl("https://www.instagram.com/sample/")).toBe("instagram");
    expect(inferPlatformFromUrl("https://www.tiktok.com/@sample")).toBe("tiktok");
    expect(inferPlatformFromUrl("https://youtu.be/abc")).toBe("youtube");
    expect(inferPlatformFromUrl("https://facebook.com/sample")).toBe("facebook");
    expect(inferPlatformFromUrl("https://example.org/sample")).toBeUndefined();
  });
});
