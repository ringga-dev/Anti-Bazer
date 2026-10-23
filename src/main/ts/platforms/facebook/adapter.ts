import { envNumber, requestJson, requiredEnv } from "../http";
import type { PlatformAdapter, PlatformComment, PlatformPost, PlatformScanResult, ScanSeed } from "../types";

interface GraphPage<T> {
  data?: T[];
  paging?: { next?: string };
  error?: { message?: string; type?: string; code?: number };
}

interface GraphPost {
  id: string;
  message?: string;
  created_time?: string;
  permalink_url?: string;
  from?: { id: string; name?: string };
  comments?: { summary?: { total_count?: number } };
  likes?: { summary?: { total_count?: number } };
}

interface GraphPageAccount {
  id: string;
  name?: string;
  about?: string;
  link?: string;
  fan_count?: number;
}

function graphUrl(path: string, params: Record<string, string> = {}): URL {
  const version = requiredEnv("META_GRAPH_API_VERSION");
  const url = new URL(`https://graph.facebook.com/${version}/${path}`);
  url.searchParams.set("access_token", requiredEnv("FACEBOOK_ACCESS_TOKEN"));
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url;
}

async function readComments(postId: string, maxComments: number): Promise<PlatformComment[]> {
  const limit = envNumber("MAX_SCAN_COMMENTS", 500, 1, 2000);
  const pageLimit = envNumber("META_MAX_COMMENT_PAGES", 5, 1, 20);
  let next: URL | undefined = graphUrl(`${encodeURIComponent(postId)}/comments`, {
    fields: "id,message,created_time",
    limit: "100",
  });
  const comments: PlatformComment[] = [];
  const cap = Math.min(maxComments, limit);

  for (let pageIndex = 0; next && pageIndex < pageLimit && comments.length < cap; pageIndex += 1) {
    const page: GraphPage<{ id: string; message?: string; created_time?: string }> =
      await requestJson("facebook", next);
    for (const comment of page.data ?? []) {
      if (comment.message) comments.push({ id: comment.id, text: comment.message, createdAt: comment.created_time, postId });
      if (comments.length >= cap) break;
    }
    next = page.paging?.next ? new URL(page.paging.next) : undefined;
    if (next && next.hostname !== "graph.facebook.com") {
      throw new Error("Facebook returned an unexpected pagination host; refusing to forward credentials.");
    }
  }
  return comments;
}

function postIdFromUrl(url: URL): string | undefined {
  const queryId = url.searchParams.get("post_id") ?? url.searchParams.get("story_fbid");
  if (queryId) {
    const pageId = url.searchParams.get("id");
    return pageId ? `${pageId}_${queryId}` : queryId;
  }
  const pathMatch = url.pathname.match(/\/(?:posts|videos|reel)\/([^/?]+)/);
  if (pathMatch) return pathMatch[1];
  const numericId = url.pathname.match(/\/(\d{8,})(?:\/|$)/);
  return numericId?.[1];
}

export const facebookAdapter: PlatformAdapter = {
  id: "facebook",
  capabilities: {
    usernameLookup: true,
    postLookup: true,
    comments: true,
    replies: false,
    reposts: false,
    likes: false,
  },
  async scan(seed: ScanSeed): Promise<PlatformScanResult> {
    const maxComments = envNumber("MAX_SCAN_COMMENTS", 500, 1, 2000);
    let page: GraphPageAccount | undefined;
    let post: GraphPost | undefined;

    if (seed.type === "post") {
      const id = postIdFromUrl(seed.value);
      if (!id) {
        throw new Error("Could not extract a Facebook post ID. The post must be accessible to this token and use a supported URL format.");
      }
      post = await requestJson<GraphPost>(
        "facebook",
        graphUrl(encodeURIComponent(id), {
          fields: "id,message,created_time,permalink_url,from{id,name},comments.summary(true),likes.summary(true)",
        }),
      );
      if (!post.id) throw new Error("Facebook post was not found or is not accessible.");
    } else {
      const requestedPage = seed.value.searchParams.get("id")
        ?? seed.value.pathname.split("/").filter(Boolean)[0];
      if (!requestedPage || ["profile.php", "watch"].includes(requestedPage)) {
        throw new Error("Use a Facebook Page URL with a resolvable Page username or ID.");
      }
      page = await requestJson<GraphPageAccount>(
        "facebook",
        graphUrl(encodeURIComponent(requestedPage), { fields: "id,name,about,link,fan_count" }),
      );
      if (!page.id) throw new Error("Facebook Page was not found or is not accessible to this token.");
    }

    if (post) {
      const comments = await readComments(post.id, maxComments);
      return {
        seed,
        sourceAccount: post.from
          ? { id: post.from.id, username: post.from.name ?? post.from.id, displayName: post.from.name }
          : undefined,
        posts: [{
          id: post.id,
          url: post.permalink_url,
          text: post.message ?? "",
          createdAt: post.created_time,
          replyCount: post.comments?.summary?.total_count,
          likeCount: post.likes?.summary?.total_count,
        }],
        comments,
        interactions: [],
        collectedAt: new Date(),
        limitations: ["Facebook post/comment access depends on token permissions, object visibility, and app review."],
      };
    }

    const postsPage = await requestJson<GraphPage<GraphPost>>(
      "facebook",
      graphUrl(`${encodeURIComponent(page!.id)}/posts`, {
        fields: "id,message,created_time,permalink_url,comments.summary(true),likes.summary(true)",
        limit: String(Math.min(envNumber("MAX_SCAN_POSTS", 5, 1, 20), 25)),
      }),
    );
    const posts: PlatformPost[] = (postsPage.data ?? []).map((item) => ({
      id: item.id,
      url: item.permalink_url,
      text: item.message ?? "",
      createdAt: item.created_time,
      replyCount: item.comments?.summary?.total_count,
      likeCount: item.likes?.summary?.total_count,
    }));
    const comments: PlatformComment[] = [];
    for (const item of postsPage.data ?? []) {
      if (comments.length >= maxComments) break;
      comments.push(...await readComments(item.id, maxComments - comments.length));
    }

    return {
      seed,
      sourceAccount: {
        id: page!.id,
        username: page!.link ?? page!.id,
        displayName: page!.name,
        description: page!.about,
        followers: page!.fan_count,
        profileUrl: page!.link,
      },
      posts,
      comments,
      interactions: [],
      collectedAt: new Date(),
      limitations: [
        "Facebook access is restricted to objects and Pages available to this token.",
        "Comment collection is capped by MAX_SCAN_COMMENTS and META_MAX_COMMENT_PAGES; API permissions may further restrict results.",
        "Commenter identities are not collected or analyzed.",
      ],
    };
  },
};
