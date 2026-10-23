import { analyzeContent } from "../analysis/ai";
import { formatReport } from "../reports/print";
import { collectPlatformData } from "../collection/collect";
import type { PlatformId, ScanSeed } from "../../platforms/types";
import type { AnalysisResult } from "../analysis/analyze";

export interface ScanRunResult {
  collection: Awaited<ReturnType<typeof collectPlatformData>>;
  analysis: AnalysisResult;
  scope: {
    targetType: ScanSeed["type"];
    analysisUnit: "account_content_sample" | "post_comment_sample";
    postsCollected: number;
    commentsCollected: number;
    interactionRecordsCollected: number;
    interactingAccountAssessment: {
      status: "not_implemented";
      accountsAnalyzed: 0;
      explanation: string;
    };
  };
  report: string;
}

export async function runScan(platform: PlatformId, seed: ScanSeed): Promise<ScanRunResult> {
  const collection = await collectPlatformData(platform, seed);
  const analysis = await analyzeContent(collection.posts, collection.comments);
  const scope: ScanRunResult["scope"] = {
    targetType: seed.type,
    analysisUnit: seed.type === "account" ? "account_content_sample" : "post_comment_sample",
    postsCollected: collection.posts.length,
    commentsCollected: collection.comments.length,
    interactionRecordsCollected: collection.interactions.length,
    interactingAccountAssessment: {
      status: "not_implemented",
      accountsAnalyzed: 0,
      explanation: "The current platform adapters do not enumerate and analyze interacting accounts individually.",
    },
  };
  return { collection, analysis, scope, report: formatReport(collection, analysis) };
}

export async function scanAndReport(platform: PlatformId, seed: ScanSeed): Promise<string> {
  return (await runScan(platform, seed)).report;
}
