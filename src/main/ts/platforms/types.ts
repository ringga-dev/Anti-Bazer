export const platformIds = [
  "x",
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
] as const;

export type PlatformId = (typeof platformIds)[number];

export type ScanSeed =
  | { type: "account"; value: URL }
  | { type: "post"; value: URL };

export interface PlatformCapabilities {
  usernameLookup: boolean;
  postLookup: boolean;
  comments: boolean;
  replies: boolean;
  reposts: boolean;
  likes: boolean;
}

export { getMissingCredentials, getPlatform, platforms } from "./registry";
export type { PlatformDefinition } from "./registry";

export interface PlatformAccount {
  id: string;
  username: string;
  displayName?: string;
  profileUrl?: string;
  description?: string;
  createdAt?: string;
  followers?: number;
}

export interface PlatformPost {
  id: string;
  url?: string;
  text: string;
  createdAt?: string;
  author?: PlatformAccount;
  replyCount?: number;
  likeCount?: number;
  shareCount?: number;
}

export interface PlatformComment {
  id: string;
  text: string;
  createdAt?: string;
  replyCount?: number;
  postId?: string;
}

export interface PlatformInteraction {
  type: "comment" | "reply" | "repost" | "like" | "mention";
  account: PlatformAccount;
  contentId: string;
  occurredAt: Date;
  text?: string;
}

export interface PlatformScanResult {
  seed: ScanSeed;
  sourceAccount?: PlatformAccount;
  posts: PlatformPost[];
  comments: PlatformComment[];
  interactions: PlatformInteraction[];
  collectedAt: Date;
  limitations: string[];
}

export interface PlatformAdapter {
  readonly id: PlatformId;
  readonly capabilities: PlatformCapabilities;
  scan(seed: ScanSeed): Promise<PlatformScanResult>;
}

export class PlatformApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly provider?: PlatformId,
  ) {
    super(message);
    this.name = "PlatformApiError";
  }
}
