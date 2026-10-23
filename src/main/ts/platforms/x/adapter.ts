import { envNumber, requestJson, requiredEnv } from "../http";
import type {
  PlatformAccount,
  PlatformAdapter,
  PlatformComment,
  PlatformPost,
  PlatformScanResult,
  ScanSeed,
} from "../types";

const apiRoot = "https://api.x.com/2";

interface XUser {
  id: string;
  username: string;
  name?: string;
  description?: string;
  created_at?: string;
  public_metrics?: { followers_count?: number };
}

interface XPost {
  id: string;
  text: string;
  author_id?: string;
  created_at?: string;
  conversation_id?: string;
  public_metrics?: { like_count?: number; reply_count?: number; retweet_count?: number };
}

interface XResponse<T> {
  data?: T | T[];
  includes?: { users?: XUser[] };
  meta?: { next_token?: string };
}

function headers(): HeadersInit {
  return { authorization: `Bearer ${requiredEnv("X_BEARER_TOKEN")}` };
}

function endpoint(path: string, params: Record<string, string> = {}): URL {
  const url = new URL(`${apiRoot}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url;
}

function toAccount(user: XUser): PlatformAccount {
  return {
    id: user.id,
    username: user.username,
    displayName: user.name,
    description: user.description,
    createdAt: user.created_at,
    followers: user.public_metrics?.followers_count,
    profileUrl: `https://x.com/${user.username}`,
  };
}

function toPost(post: XPost, author?: PlatformAccount): PlatformPost {
  return {
    id: post.id,
    url: `https://x.com/i/status/${post.id}`,
    text: post.text,
    createdAt: post.created_at,
    author,
    replyCount: post.public_metrics?.reply_count,
    likeCount: post.public_metrics?.like_count,
    shareCount: post.public_metrics?.retweet_count,
  };
}

async function lookupUser(username: string): Promise<XUser> {
  const clean = username.replace(/^@/, "");
  const result = await requestJson<XResponse<XUser>>(
    "x",
    endpoint(`users/by/username/${encodeURIComponent(clean)}`, {
      "user.fields": "created_at,description,public_metrics",
    }),
    { headers: headers() },
  );
  if (!result.data || Array.isArray(result.data)) throw new Error(`X user @${clean} was not found or is not accessible.`);
  return result.data;
}

async function searchConversation(conversationId: string, maximum: number): Promise<PlatformComment[]> {
  const comments: PlatformComment[] = [];
  const maxPages = envNumber("X_MAX_SEARCH_PAGES", 5, 1, 20);
  let nextToken: string | undefined;
  for (let page = 0; page < maxPages && comments.length < maximum; page += 1) {
    const params: Record<string, string> = {
      query: `conversation_id:${conversationId}`,
      max_results: String(Math.max(10, Math.min(maximum - comments.length, 100))),
      "tweet.fields": "author_id,created_at,conversation_id",
      expansions: "author_id",
      "user.fields": "username,name",
    };
    if (nextToken) params.next_token = nextToken;
    const result = await requestJson<XResponse<XPost>>(
      "x",
      endpoint("tweets/search/recent", params),
      { headers: headers() },
    );
    const posts = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
    comments.push(...posts
      .filter((post) => post.id !== conversationId)
      .slice(0, maximum - comments.length)
      .map((post) => ({
        id: post.id,
        text: post.text,
        createdAt: post.created_at,
        postId: conversationId,
      })));
    nextToken = result.meta?.next_token;
    if (!nextToken) break;
  }
  return comments;
}

async function getUserPosts(userId: string, maximum: number): Promise<{ posts: XPost[]; users: XUser[] }> {
  const result = await requestJson<XResponse<XPost>>(
    "x",
    endpoint(`users/${userId}/tweets`, {
      max_results: String(Math.max(5, Math.min(maximum, 100))),
      exclude: "retweets",
      "tweet.fields": "author_id,created_at,public_metrics,conversation_id",
      expansions: "author_id",
      "user.fields": "created_at,description,public_metrics",
    }),
    { headers: headers() },
  );
  return {
    posts: Array.isArray(result.data) ? result.data : result.data ? [result.data] : [],
    users: result.includes?.users ?? [],
  };
}

export const xAdapter: PlatformAdapter = {
  id: "x",
  capabilities: {
    usernameLookup: true,
    postLookup: true,
    comments: true,
    replies: true,
    reposts: false,
    likes: false,
  },
  async scan(seed: ScanSeed): Promise<PlatformScanResult> {
    const maxPosts = envNumber("MAX_SCAN_POSTS", 5, 1, 20);
    const maxComments = envNumber("MAX_SCAN_COMMENTS", 500, 1, 2000);
    const limitations = [
      "X API access tier and usage pricing apply. Recent search only covers the documented recent window.",
      "This collector reads posts and replies returned by the API; it does not enumerate likes or all reposting accounts.",
      "Recent replies are capped by MAX_SCAN_COMMENTS and X_MAX_SEARCH_PAGES.",
    ];
    let sourceAccount: PlatformAccount;
    let posts: PlatformPost[] = [];
    let comments: PlatformComment[] = [];

    if (seed.type === "post") {
      const postId = seed.value.pathname.match(/\/status\/([^/]+)/)?.[1];
      if (!postId) throw new Error("X post URL must contain /status/<post-id>.");
      const result = await requestJson<XResponse<XPost>>(
        "x",
        endpoint(`tweets/${encodeURIComponent(postId)}`, {
          "tweet.fields": "author_id,created_at,public_metrics,conversation_id",
          expansions: "author_id",
          "user.fields": "created_at,description,public_metrics",
        }),
        { headers: headers() },
      );
      const post = result.data && !Array.isArray(result.data) ? result.data : undefined;
      if (!post) throw new Error("X post was not found or is not accessible.");
      const user = result.includes?.users?.find((candidate) => candidate.id === post.author_id);
      sourceAccount = user
        ? toAccount(user)
        : { id: post.author_id ?? "unknown", username: "unknown" };
      posts = [toPost(post, sourceAccount)];
      comments = await searchConversation(post.conversation_id ?? post.id, maxComments);
    } else {
      const username = seed.value.pathname.split("/").filter(Boolean)[0];
      if (!username) throw new Error("Could not read an X username from the account URL.");
      const user = await lookupUser(username);
      sourceAccount = toAccount(user);
      const result = await getUserPosts(user.id, maxPosts);
      posts = result.posts.slice(0, maxPosts).map((post) => toPost(post, sourceAccount));
      if (posts.length === 0) limitations.push("No recent posts were returned for this account.");
      comments = [];
      for (const post of result.posts.slice(0, maxPosts)) {
        if (comments.length >= maxComments) break;
        comments.push(...await searchConversation(post.conversation_id ?? post.id, maxComments - comments.length));
      }
    }

    return {
      seed,
      sourceAccount,
      posts,
      comments: comments.slice(0, maxComments),
      interactions: [],
      collectedAt: new Date(),
      limitations,
    };
  },
};
