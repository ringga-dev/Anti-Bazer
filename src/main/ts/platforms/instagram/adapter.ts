import { envNumber, requestJson, requiredEnv } from "../http";
import type { PlatformAdapter, PlatformComment, PlatformPost, PlatformScanResult, ScanSeed } from "../types";

interface InstagramPage<T> {
  data?: T[];
  paging?: { next?: string };
}

interface InstagramMedia {
  id: string;
  caption?: string;
  media_type?: string;
  permalink?: string;
  timestamp?: string;
  comments_count?: number;
  like_count?: number;
}

function endpoint(path: string): URL {
  const version = requiredEnv("META_GRAPH_API_VERSION");
  const url = new URL(`https://graph.instagram.com/${version}/${path}`);
  url.searchParams.set("access_token", requiredEnv("INSTAGRAM_ACCESS_TOKEN"));
  return url;
}

async function readAuthorizedMedia(maxPosts: number): Promise<InstagramMedia[]> {
  const accountId = requiredEnv("INSTAGRAM_USER_ID");
  let next: URL | undefined = endpoint(`${encodeURIComponent(accountId)}/media`);
  next.searchParams.set("fields", "id,caption,media_type,permalink,timestamp,comments_count,like_count");
  next.searchParams.set("limit", String(Math.min(maxPosts, 50)));
  const result: InstagramMedia[] = [];

  while (next && result.length < maxPosts) {
    const page: InstagramPage<InstagramMedia> = await requestJson("instagram", next);
    result.push(...(page.data ?? []).slice(0, maxPosts - result.length));
    next = page.paging?.next ? new URL(page.paging.next) : undefined;
    if (next && next.hostname !== "graph.instagram.com") {
      throw new Error("Instagram returned an unexpected pagination host; refusing to forward credentials.");
    }
  }
  return result;
}

async function readComments(mediaId: string, maxComments: number): Promise<PlatformComment[]> {
  const limit = envNumber("MAX_SCAN_COMMENTS", 500, 1, 2000);
  const pageLimit = envNumber("META_MAX_COMMENT_PAGES", 5, 1, 20);
  let next: URL | undefined = endpoint(`${encodeURIComponent(mediaId)}/comments`);
  next.searchParams.set("fields", "id,text,timestamp,username");
  next.searchParams.set("limit", "100");
  const comments: PlatformComment[] = [];

  for (let pageIndex = 0; next && pageIndex < pageLimit && comments.length < Math.min(limit, maxComments); pageIndex += 1) {
    const page: InstagramPage<{
      id: string;
      text?: string;
      timestamp?: string;
    }> = await requestJson("instagram", next);
    for (const comment of page.data ?? []) {
      if (comment.text) comments.push({ id: comment.id, text: comment.text, createdAt: comment.timestamp, postId: mediaId });
      if (comments.length >= Math.min(limit, maxComments)) break;
    }
    next = page.paging?.next ? new URL(page.paging.next) : undefined;
    if (next && next.hostname !== "graph.instagram.com") {
      throw new Error("Instagram returned an unexpected pagination host; refusing to forward credentials.");
    }
  }
  return comments;
}

export const instagramAdapter: PlatformAdapter = {
  id: "instagram",
  capabilities: {
    usernameLookup: false,
    postLookup: true,
    comments: true,
    replies: false,
    reposts: false,
    likes: false,
  },
  async scan(seed: ScanSeed): Promise<PlatformScanResult> {
    const maxPosts = envNumber("MAX_SCAN_POSTS", 5, 1, 20);
    const media = await readAuthorizedMedia(maxPosts);
    const accountId = requiredEnv("INSTAGRAM_USER_ID");
    const profile = await requestJson<{ id: string; username?: string; name?: string }>(
      "instagram",
      endpoint(encodeURIComponent(accountId) + "?fields=id,username,name"),
    );
    const limitations = [
      "Instagram Login API access is limited to the authorized professional account and its media.",
      "Arbitrary public usernames and posts owned by other accounts cannot be scanned by this adapter.",
      "Only comments returned by the API are included; moderation, permissions, pagination, and API limits may reduce coverage.",
    ];
    let selectedMedia = media;

    if (seed.type === "account") {
      const requested = seed.value.pathname.split("/").filter(Boolean)[0]?.replace(/^@/, "").toLowerCase();
      if (requested && profile.username?.toLowerCase() !== requested) {
        throw new Error(`This Instagram token can only scan its authorized account (@${profile.username ?? "unknown"}).`);
      }
    } else {
      const shortcode = seed.value.pathname.split("/").filter(Boolean)[1];
      const match = media.find((item) => item.permalink && new URL(item.permalink).pathname.split("/").filter(Boolean)[1] === shortcode);
      if (!match) {
        throw new Error("This Instagram post is not in the authorized account's accessible media. Instagram API does not allow arbitrary post lookup here.");
      }
      selectedMedia = [match];
    }

    const posts: PlatformPost[] = selectedMedia.map((item) => ({
      id: item.id,
      url: item.permalink,
      text: item.caption ?? "",
      createdAt: item.timestamp,
      replyCount: item.comments_count,
      likeCount: item.like_count,
    }));
    const comments: PlatformComment[] = [];
    const maxComments = envNumber("MAX_SCAN_COMMENTS", 500, 1, 2000);
    for (const post of posts) {
      if (comments.length >= maxComments) break;
      comments.push(...await readComments(post.id, maxComments - comments.length));
    }
    if (comments.length >= maxComments) limitations.push("MAX_SCAN_COMMENTS limit reached.");

    return {
      seed,
      sourceAccount: {
        id: accountId,
        username: profile.username ?? accountId,
        displayName: profile.name,
        profileUrl: profile.username ? `https://www.instagram.com/${profile.username}/` : undefined,
      },
      posts,
      comments: comments.slice(0, maxComments),
      interactions: [],
      collectedAt: new Date(),
      limitations,
    };
  },
};
