import { envNumber, requestJson, requiredEnv } from "../http";
import type { PlatformAdapter, PlatformPost, PlatformScanResult, ScanSeed } from "../types";

interface TikTokResponse<T> {
  data?: T;
  error?: { code?: string; message?: string };
}

interface TikTokVideo {
  id: string;
  title?: string;
  video_description?: string;
  share_url?: string;
  create_time?: number;
  comment_count?: number;
  like_count?: number;
  share_count?: number;
}

interface TikTokUser {
  open_id?: string;
  display_name?: string;
  bio_description?: string;
  profile_deep_link?: string;
  is_verified?: boolean;
  follower_count?: number;
  likes_count?: number;
  video_count?: number;
}

async function api<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await requestJson<TikTokResponse<T>>(
    "tiktok",
    new URL(`https://open.tiktokapis.com${path}`),
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${requiredEnv("TIKTOK_ACCESS_TOKEN")}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  if (response.error && response.error.code !== "ok") {
    throw new Error(`TikTok API error ${response.error.code ?? "unknown"}: ${response.error.message ?? "Request failed."}`);
  }
  return response.data ?? ({} as T);
}

export const tiktokAdapter: PlatformAdapter = {
  id: "tiktok",
  capabilities: {
    usernameLookup: false,
    postLookup: false,
    comments: false,
    replies: false,
    reposts: false,
    likes: false,
  },
  async scan(seed: ScanSeed): Promise<PlatformScanResult> {
    const userData = await api<{ user?: TikTokUser }>("/v2/user/info/?fields=open_id,display_name,bio_description,profile_deep_link,is_verified,follower_count,likes_count,video_count", {});
    const user = userData.user;
    if (!user?.open_id) throw new Error("TikTok did not return an authorized user. Check OAuth token and user.info.basic scope.");

    const requestedPath = seed.value.pathname.replace(/\/+$/, "").toLowerCase();
    const authorizedPath = user.profile_deep_link ? new URL(user.profile_deep_link).pathname.replace(/\/+$/, "").toLowerCase() : "";
    if (seed.type === "account" && authorizedPath && requestedPath !== authorizedPath) {
      throw new Error("TikTok Display API can scan only the account that authorized this app.");
    }

    const maxPosts = envNumber("MAX_SCAN_POSTS", 5, 1, 20);
    const videosData = await api<{ videos?: TikTokVideo[]; cursor?: number; has_more?: boolean }>(
      "/v2/video/list/?fields=id,title,video_description,share_url,create_time,comment_count,like_count,share_count",
      { max_count: Math.min(maxPosts, 20) },
    );
    const videoId = seed.type === "post" ? seed.value.pathname.match(/\/video\/([^/]+)/)?.[1] : undefined;
    let videos = videosData.videos ?? [];
    if (seed.type === "post") {
      if (!videoId) throw new Error("Could not read a TikTok video ID from this URL.");
      videos = videos.filter((video) => video.id === videoId || video.share_url === seed.value.href);
      if (videos.length === 0) {
        throw new Error("This TikTok video was not returned by the authorized user's Display API.");
      }
    }

    const posts: PlatformPost[] = videos.map((video) => ({
      id: video.id,
      url: video.share_url,
      text: [video.title, video.video_description].filter(Boolean).join("\n"),
      createdAt: video.create_time ? new Date(video.create_time * 1000).toISOString() : undefined,
      replyCount: video.comment_count,
      likeCount: video.like_count,
      shareCount: video.share_count,
      author: {
        id: user.open_id!,
        username: user.profile_deep_link ?? user.open_id!,
        displayName: user.display_name,
        description: user.bio_description,
        followers: user.follower_count,
        profileUrl: user.profile_deep_link,
      },
    }));

    return {
      seed,
      sourceAccount: {
        id: user.open_id,
        username: user.profile_deep_link ?? user.open_id,
        displayName: user.display_name,
        description: user.bio_description,
        followers: user.follower_count,
        profileUrl: user.profile_deep_link,
      },
      posts,
      comments: [],
      interactions: [],
      collectedAt: new Date(),
      limitations: [
        "TikTok Display API scans only the user who authorized the app.",
        "The Display API does not return public comment text or commenter accounts; comment sentiment is unavailable.",
      ],
    };
  },
};
