import type { PlatformId } from "./types";

export interface PlatformDefinition {
  id: PlatformId;
  title: string;
  auth: "bearer" | "oauth" | "api-key" | "bearer-and-version";
  credentialNames: string[];
  accessNote: string;
  documentationUrl: string;
}

export const platforms: PlatformDefinition[] = [
  {
    id: "x",
    title: "X",
    auth: "bearer",
    credentialNames: ["X_BEARER_TOKEN"],
    accessNote: "Read-only post/user lookup and recent replies are available only when the app tier grants those endpoints. API usage may be paid.",
    documentationUrl: "https://docs.x.com/x-api/users/lookup/introduction",
  },
  {
    id: "instagram",
    title: "Instagram Graph API",
    auth: "bearer",
    credentialNames: ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_USER_ID", "META_GRAPH_API_VERSION"],
    accessNote: "Reads media/comments for the authorized professional account. It cannot scan arbitrary public accounts.",
    documentationUrl: "https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/",
  },
  {
    id: "tiktok",
    title: "TikTok",
    auth: "oauth",
    credentialNames: ["TIKTOK_ACCESS_TOKEN"],
    accessNote: "Display API reads the authorizing user's profile and videos. It does not expose public video comments or arbitrary account lookup.",
    documentationUrl: "https://developers.tiktok.com/docs/en/display-api-overview",
  },
  {
    id: "youtube",
    title: "YouTube Data API",
    auth: "api-key",
    credentialNames: ["YOUTUBE_API_KEY"],
    accessNote: "Public data is available subject to quota. Comments may be disabled, deleted, or unavailable for a video.",
    documentationUrl: "https://developers.google.com/youtube/v3/docs/commentThreads/list",
  },
  {
    id: "facebook",
    title: "Facebook Graph API",
    auth: "bearer",
    credentialNames: ["FACEBOOK_ACCESS_TOKEN", "META_GRAPH_API_VERSION"],
    accessNote: "Reads only objects the token is permitted to access. Page/post permissions and Meta App Review may be required.",
    documentationUrl: "https://developers.facebook.com/docs/graph-api/",
  },
];

export function getPlatform(id: PlatformId): PlatformDefinition {
  const platform = platforms.find((item) => item.id === id);
  if (!platform) {
    throw new Error(`Platform is not registered: ${id}`);
  }
  return platform;
}

export function getMissingCredentials(
  platform: PlatformDefinition,
  environment: Record<string, string | undefined> = Bun.env,
): string[] {
  return platform.credentialNames.filter((name) => !environment[name]?.trim());
}
