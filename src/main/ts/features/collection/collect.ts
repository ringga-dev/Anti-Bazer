import { facebookAdapter } from "../../platforms/facebook/adapter";
import { instagramAdapter } from "../../platforms/instagram/adapter";
import { tiktokAdapter } from "../../platforms/tiktok/adapter";
import { xAdapter } from "../../platforms/x/adapter";
import { youtubeAdapter } from "../../platforms/youtube/adapter";
import type { PlatformAdapter, PlatformId, PlatformScanResult, ScanSeed } from "../../platforms/types";

const adapters = new Map<PlatformId, PlatformAdapter>([
  ["x", xAdapter],
  ["instagram", instagramAdapter],
  ["tiktok", tiktokAdapter],
  ["youtube", youtubeAdapter],
  ["facebook", facebookAdapter],
]);

export async function collectPlatformData(
  platform: PlatformId,
  seed: ScanSeed,
): Promise<PlatformScanResult> {
  const adapter = adapters.get(platform);
  if (!adapter) throw new Error(`No API adapter is registered for ${platform}.`);
  return adapter.scan(seed);
}
