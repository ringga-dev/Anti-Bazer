import { z } from "zod";
import { platformIds, type PlatformId } from "../../platforms/types";

export const scanInputSchema = z.object({
  platform: z.enum(platformIds),
  username: z.string().trim().min(1).optional(),
  post: z.url("The account or post URL is invalid.").optional(),
}).refine((input) => Boolean(input.username) !== Boolean(input.post), {
  message: "Provide exactly one account URL or post URL.",
});

export type ScanInput = z.infer<typeof scanInputSchema>;

const platformAliases: Record<string, PlatformId> = {
  x: "x",
  twitter: "x",
  instagram: "instagram",
  ig: "instagram",
  tiktok: "tiktok",
  youtube: "youtube",
  yt: "youtube",
  facebook: "facebook",
  fb: "facebook",
};

export function inferPlatformFromUrl(value: string): PlatformId | undefined {
  let hostname: string;
  try {
    hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return undefined;
  }

  if (hostname === "x.com" || hostname === "twitter.com" || hostname === "t.co") return "x";
  if (hostname === "instagram.com") return "instagram";
  if (hostname === "tiktok.com") return "tiktok";
  if (hostname === "youtube.com" || hostname === "youtu.be") return "youtube";
  if (hostname === "facebook.com" || hostname === "fb.watch") return "facebook";
  return undefined;
}

export function inferTargetType(platform: PlatformId, value: string): "account" | "post" | undefined {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  const path = url.pathname.toLowerCase();

  switch (platform) {
    case "x":
      return /\/status\/[^/]+/.test(path) ? "post" : "account";
    case "instagram":
      return /^\/(p|reel|reels|tv)\//.test(path) ? "post" : "account";
    case "tiktok":
      return /\/video\/\d+/.test(path) ? "post" : "account";
    case "youtube":
      return url.hostname === "youtu.be" || path === "/watch" || /^\/(shorts|live|embed)\//.test(path)
        ? "post"
        : "account";
    case "facebook":
      return /\/(posts|permalink|videos|reel)\//.test(path) || url.searchParams.has("story_fbid")
        ? "post"
        : "account";
  }
}

export function parseScanEntries(entries: string[], platformOption?: string) {
  const values = new Map<string, string>();
  if (platformOption !== undefined) {
    values.set("platform", platformOption.trim());
  }
  for (const entry of entries) {
    const separator = entry.indexOf("=");
    if (separator < 1) {
      return { success: false as const, error: `Arguments must use name=value format: ${entry}` };
    }
    const key = entry.slice(0, separator).toLowerCase();
    const value = entry.slice(separator + 1).trim();
    if (!["platform", "target", "url", "akun", "post"].includes(key)) {
      return { success: false as const, error: `Unknown argument: ${key}` };
    }
    if (values.has(key)) {
      return { success: false as const, error: `Argument ${key} was provided more than once.` };
    }
    values.set(key, value);
  }

  const targetKeys = ["target", "url", "akun", "post"].filter((key) => values.has(key));
  if (targetKeys.length !== 1) {
    return { success: false as const, error: "Provide exactly one target=, url=, akun=, or post= value." };
  }
  const target = values.get(targetKeys[0]!)!;
  const specifiedPlatform = values.get("platform");
  const inferredPlatform = inferPlatformFromUrl(target);
  const platform = specifiedPlatform === "auto"
    ? inferredPlatform
    : specifiedPlatform
      ? platformAliases[specifiedPlatform.toLowerCase()]
      : inferredPlatform;

  if (!platform) {
    return {
      success: false as const,
      error: "Could not detect the platform from this URL. Use --platform=x|instagram|tiktok|youtube|facebook.",
    };
  }
  if (specifiedPlatform && specifiedPlatform !== "auto" && inferredPlatform && platform !== inferredPlatform) {
    return { success: false as const, error: `This URL belongs to ${inferredPlatform}, not ${platform}.` };
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return { success: false as const, error: "Target must be a valid account or post URL." };
  }
  const targetType = inferTargetType(platform, target);
  if (!targetType) {
    return { success: false as const, error: "Could not determine whether the target URL is an account or a post." };
  }
  return { success: true as const, data: { platform, targetType, targetUrl } };
}
