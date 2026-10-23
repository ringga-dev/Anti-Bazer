import { envNumber, requestJson, requiredEnv } from "../http";
import type {
  PlatformAccount,
  PlatformAdapter,
  PlatformComment,
  PlatformPost,
  PlatformScanResult,
  ScanSeed,
} from "../types";

const apiRoot = "https://www.googleapis.com/youtube/v3";

interface YouTubeList<T> {
  items?: T[];
  nextPageToken?: string;
}

interface ChannelItem {
  id: string;
  snippet?: { title?: string; customUrl?: string; description?: string };
  statistics?: { subscriberCount?: string };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
}

interface VideoItem {
  id: string;
  snippet?: { title?: string; description?: string; channelId?: string; channelTitle?: string; publishedAt?: string };
  statistics?: { commentCount?: string; likeCount?: string };
}

interface ThreadItem {
  id: string;
  snippet?: {
    topLevelComment?: {
      id?: string;
      snippet?: { textDisplay?: string; publishedAt?: string; authorChannelId?: { value?: string } };
    };
    totalReplyCount?: number;
  };
  replies?: {
    comments?: Array<{
      id?: string;
      snippet?: { textDisplay?: string; publishedAt?: string; authorChannelId?: { value?: string } };
    }>;
  };
}

interface ReplyItem {
  id: string;
  snippet?: { textDisplay?: string; publishedAt?: string };
}

function apiUrl(resource: string, params: Record<string, string>): URL {
  const url = new URL(`${apiRoot}/${resource}`);
  url.searchParams.set("key", requiredEnv("YOUTUBE_API_KEY"));
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url;
}

function videoIdFromUrl(url: URL): string | undefined {
  if (url.hostname === "youtu.be") return url.pathname.split("/").filter(Boolean)[0];
  if (url.pathname === "/watch") return url.searchParams.get("v") ?? undefined;
  const match = url.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/);
  return match?.[1];
}

function accountFromChannel(channel: ChannelItem): PlatformAccount {
  return {
    id: channel.id,
    username: channel.snippet?.customUrl ?? channel.id,
    displayName: channel.snippet?.title,
    description: channel.snippet?.description,
    followers: Number(channel.statistics?.subscriberCount) || undefined,
    profileUrl: `https://www.youtube.com/channel/${channel.id}`,
  };
}

async function getChannel(seedUrl: URL): Promise<ChannelItem> {
  const parts = seedUrl.pathname.split("/").filter(Boolean);
  const params: Record<string, string> = { part: "snippet,statistics,contentDetails" };
  if (parts[0] === "channel" && parts[1]) {
    params.id = parts[1];
  } else if (parts[0] === "user" && parts[1]) {
    params.forUsername = parts[1];
  } else if (parts[0]?.startsWith("@")) {
    params.forHandle = parts[0];
  } else {
    throw new Error("Unsupported YouTube account URL. Use a /@handle, /channel/ID, or /user/NAME URL.");
  }
  const result = await requestJson<YouTubeList<ChannelItem>>(
    "youtube",
    apiUrl("channels", params),
  );
  const channel = result.items?.[0];
  if (!channel) throw new Error("YouTube did not return a channel for this URL.");
  return channel;
}

async function getVideosForChannel(channel: ChannelItem, limit: number): Promise<VideoItem[]> {
  const uploadsId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) return [];
  const playlist = await requestJson<YouTubeList<{ contentDetails?: { videoId?: string } }>>(
    "youtube",
    apiUrl("playlistItems", { part: "contentDetails", playlistId: uploadsId, maxResults: String(limit) }),
  );
  const ids = (playlist.items ?? []).map((item) => item.contentDetails?.videoId).filter((id): id is string => Boolean(id));
  if (ids.length === 0) return [];
  const videos = await requestJson<YouTubeList<VideoItem>>(
    "youtube",
    apiUrl("videos", { part: "snippet,statistics", id: ids.join(",") }),
  );
  return videos.items ?? [];
}

async function getComments(videoId: string, remaining: number): Promise<PlatformComment[]> {
  const comments: PlatformComment[] = [];
  const pageLimit = envNumber("YOUTUBE_MAX_COMMENT_PAGES", 3, 1, 10);
  let pageToken: string | undefined;

  for (let page = 0; page < pageLimit && comments.length < remaining; page += 1) {
    const params: Record<string, string> = {
      part: "snippet,replies",
      videoId,
      maxResults: String(Math.min(100, remaining - comments.length)),
      textFormat: "plainText",
      order: "time",
    };
    if (pageToken) params.pageToken = pageToken;
    const result = await requestJson<YouTubeList<ThreadItem>>(
      "youtube",
      apiUrl("commentThreads", params),
    );
    for (const thread of result.items ?? []) {
      const top = thread.snippet?.topLevelComment;
      if (top?.snippet?.textDisplay) {
        comments.push({
          id: top.id ?? thread.id,
          text: top.snippet.textDisplay,
          createdAt: top.snippet.publishedAt,
          postId: videoId,
        });
      }
      for (const reply of thread.replies?.comments ?? []) {
        if (comments.length >= remaining) break;
        if (reply.snippet?.textDisplay) {
          comments.push({
            id: reply.id ?? `${thread.id}-reply-${comments.length}`,
            text: reply.snippet.textDisplay,
            createdAt: reply.snippet.publishedAt,
            postId: videoId,
          });
        }
      }
      const totalReplyCount = thread.snippet?.totalReplyCount ?? 0;
      const knownReplyCount = thread.replies?.comments?.length ?? 0;
      const parentId = top?.id;
      if (parentId && totalReplyCount > knownReplyCount && comments.length < remaining) {
        const knownReplyIds = new Set((thread.replies?.comments ?? []).map((reply) => reply.id));
        let replyToken: string | undefined;
        for (let replyPage = 0; replyPage < pageLimit && comments.length < remaining; replyPage += 1) {
          const replyParams: Record<string, string> = {
            part: "snippet",
            parentId,
            maxResults: String(Math.min(100, remaining - comments.length)),
            textFormat: "plainText",
          };
          if (replyToken) replyParams.pageToken = replyToken;
          const replyResult = await requestJson<YouTubeList<ReplyItem>>(
            "youtube",
            apiUrl("comments", replyParams),
          );
          for (const reply of replyResult.items ?? []) {
            if (reply.id === parentId || knownReplyIds.has(reply.id) || !reply.snippet?.textDisplay) continue;
            knownReplyIds.add(reply.id);
            comments.push({
              id: reply.id,
              text: reply.snippet.textDisplay,
              createdAt: reply.snippet.publishedAt,
              postId: videoId,
            });
            if (comments.length >= remaining) break;
          }
          replyToken = replyResult.nextPageToken;
          if (!replyToken) break;
        }
      }
      if (comments.length >= remaining) break;
    }
    pageToken = result.nextPageToken;
    if (!pageToken) break;
  }
  return comments;
}

export const youtubeAdapter: PlatformAdapter = {
  id: "youtube",
  capabilities: {
    usernameLookup: true,
    postLookup: true,
    comments: true,
    replies: true,
    reposts: false,
    likes: false,
  },
  async scan(seed: ScanSeed): Promise<PlatformScanResult> {
    const maxVideos = envNumber("MAX_SCAN_POSTS", 5, 1, 20);
    const maxComments = envNumber("MAX_SCAN_COMMENTS", 500, 1, 2000);
    let channel: ChannelItem | undefined;
    let videos: VideoItem[];
    const limitations: string[] = [
      "YouTube API quota applies. Comment threads may be disabled, moderated, or unavailable.",
      "Collection is capped by MAX_SCAN_POSTS and MAX_SCAN_COMMENTS; this is not a complete account history.",
    ];

    if (seed.type === "post") {
      const videoId = videoIdFromUrl(seed.value);
      if (!videoId) throw new Error("Could not extract a YouTube video ID from the URL.");
      const response = await requestJson<YouTubeList<VideoItem>>(
        "youtube",
        apiUrl("videos", { part: "snippet,statistics", id: videoId }),
      );
      videos = response.items ?? [];
      if (videos.length === 0) throw new Error("YouTube video was not found or is not accessible.");
      const channelId = videos[0]?.snippet?.channelId;
      if (channelId) {
        const channelResult = await requestJson<YouTubeList<ChannelItem>>(
          "youtube",
          apiUrl("channels", { part: "snippet,statistics", id: channelId }),
        );
        channel = channelResult.items?.[0];
      }
    } else {
      channel = await getChannel(seed.value);
      videos = await getVideosForChannel(channel, maxVideos);
    }

    const posts: PlatformPost[] = videos.slice(0, maxVideos).map((video) => ({
      id: video.id,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      text: [video.snippet?.title, video.snippet?.description].filter(Boolean).join("\n"),
      createdAt: video.snippet?.publishedAt,
      replyCount: Number(video.statistics?.commentCount) || 0,
      likeCount: Number(video.statistics?.likeCount) || 0,
      author: channel
        ? accountFromChannel(channel)
        : video.snippet?.channelId
          ? {
            id: video.snippet.channelId,
            username: video.snippet.channelTitle ?? video.snippet.channelId,
            displayName: video.snippet.channelTitle,
          }
          : undefined,
    }));

    const comments: PlatformComment[] = [];
    for (const video of videos.slice(0, maxVideos)) {
      if (comments.length >= maxComments) break;
      try {
        comments.push(...await getComments(video.id, maxComments - comments.length));
      } catch (error) {
        if (error instanceof Error && /disabled|commentsDisabled|commentThreadsDisabled/i.test(error.message)) {
          limitations.push(`Comments are unavailable for video ${video.id}.`);
          continue;
        }
        throw error;
      }
    }
    if (comments.length >= maxComments) limitations.push("The configured comment limit was reached.");

    return {
      seed,
      sourceAccount: channel ? accountFromChannel(channel) : posts[0]?.author,
      posts,
      comments,
      interactions: [],
      collectedAt: new Date(),
      limitations,
    };
  },
};
