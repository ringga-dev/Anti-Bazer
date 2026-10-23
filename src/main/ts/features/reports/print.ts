import type { AnalysisResult } from "../analysis/analyze";
import type { PlatformScanResult } from "../../platforms/types";

function printPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatReport(collection: PlatformScanResult, analysis: AnalysisResult): string {
  const lines = [
    "",
    "=== Anti Bazer Analysis Report ===",
    `Collected at: ${collection.collectedAt.toISOString()}`,
    `Target type: ${collection.seed.type}`,
    `Analysis scope: ${collection.seed.type === "account" ? "Accessible sample of source-account posts and comments" : "Target post/video and its accessible comments"}`,
    `Source account: ${collection.sourceAccount?.displayName ?? collection.sourceAccount?.username ?? "Not available"}`,
    `Posts analyzed: ${collection.posts.length}`,
    `Comments analyzed: ${analysis.analyzedCommentCount}`,
    `Interaction records collected: ${collection.interactions.length}`,
    "Interacting account assessments: not performed",
    `Analysis mode: ${analysis.aiEnabled ? `AI-assisted (${analysis.aiModel})` : "Local heuristic only"}`,
    `Comment stance method: ${analysis.stanceMethod}`,
    `Coordination signal: ${analysis.coordinationSignalPercent}%`,
    `Score meaning: ${analysis.scoreMeaning}`,
    "",
    "Comment stance (aggregate; not per commenter):",
  ];

  for (const stance of ["agree", "disagree", "neutral", "unclear"] as const) {
    const item = analysis.commentStances[stance];
    lines.push(`  ${stance}: ${item.count} (${printPercent(item.percent)})`);
  }

  if (analysis.commentStancesByPost.length > 0) {
    lines.push("", "Comment stance by post:");
    for (const item of analysis.commentStancesByPost) {
      lines.push(`  Post: ${item.postUrl ?? item.postId ?? "Unassigned comments"} (${item.commentCount} comments)`);
      for (const stance of ["agree", "disagree", "neutral", "unclear"] as const) {
        const value = item.stances[stance];
        lines.push(`    ${stance}: ${value.count} (${printPercent(value.percent)})`);
      }
    }
  }

  if (analysis.aiSummary) {
    lines.push("", "AI summary:", analysis.aiSummary);
  }
  lines.push("", "Indicators:");
  if (analysis.indicators.length === 0) {
    lines.push("  No notable indicators were found in the available sample.");
  } else {
    for (const indicator of analysis.indicators) {
      lines.push(
        `  - [${indicator.source.toUpperCase()}] ${indicator.name}: ${indicator.score}/100 signal`,
        `    ${indicator.explanation}`,
        `    Evidence: ${indicator.evidence}`,
      );
    }
  }

  lines.push("", "Limitations:");
  for (const limitation of [
    ...collection.limitations,
    "Interacting account identities are not enumerated or individually classified by this version.",
    "The analysis describes a limited sample of source content; it does not determine account authenticity, identity, affiliation, or motive.",
    ...analysis.aiLimitations,
  ]) {
    lines.push(`  - ${limitation}`);
  }
  lines.push(
    "",
    "Important: This report describes observed content patterns. It does not determine whether a person is a buzzer, fake, or acting with a particular motive.",
  );
  return lines.join("\n");
}
