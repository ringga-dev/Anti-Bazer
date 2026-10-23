import type { PlatformComment, PlatformPost } from "../../platforms/types";

export type Stance = "agree" | "disagree" | "neutral" | "unclear";

export interface CommentStance {
  stance: Stance;
  count: number;
  percent: number;
}

export type StanceCounts = Record<Stance, number>;

export interface CommentStancesByPost {
  postId: string | null;
  postUrl?: string;
  commentCount: number;
  stances: Record<Stance, CommentStance>;
}

export interface Indicator {
  source: "local" | "ai";
  name: string;
  score: number;
  explanation: string;
  evidence: string;
}

export interface AnalysisResult {
  coordinationSignalPercent: number;
  scoreMeaning: string;
  indicators: Indicator[];
  commentStances: Record<Stance, CommentStance>;
  commentStancesByPost: CommentStancesByPost[];
  stanceMethod: "ai" | "local-heuristic";
  aiEnabled: boolean;
  aiModel?: string;
  aiSummary?: string;
  aiLimitations: string[];
  analyzedCommentCount: number;
}

const positiveTokens = new Set([
  "agree", "agreed", "correct", "exactly", "true", "support", "yes", "setuju", "benar", "tepat", "dukung", "sepakat",
]);
const negativeTokens = new Set([
  "disagree", "wrong", "false", "oppose", "no", "not", "against", "tidak", "bukan", "salah", "tolak", "menolak",
]);

function normalize(text: string): string {
  return text.toLowerCase().replace(/https?:\/\/\S+/g, " ").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function localStance(text: string): Stance {
  const tokens = normalize(text).split(" ");
  const positive = tokens.filter((token) => positiveTokens.has(token)).length;
  const negative = tokens.filter((token) => negativeTokens.has(token)).length;
  if (positive === 0 && negative === 0) return "unclear";
  if (positive > negative) return "agree";
  if (negative > positive) return "disagree";
  return "neutral";
}

export function summarizeStances(counts: StanceCounts, total: number): Record<Stance, CommentStance> {
  const stances: Stance[] = ["agree", "disagree", "neutral", "unclear"];
  return Object.fromEntries(stances.map((stance) => [
    stance,
    {
      stance,
      count: counts[stance],
      percent: total === 0 ? 0 : Math.round(counts[stance] / total * 1000) / 10,
    },
  ])) as Record<Stance, CommentStance>;
}

export function summarizeStancesByPost(
  posts: PlatformPost[],
  countsByPost: Map<string | null, StanceCounts>,
): CommentStancesByPost[] {
  const knownPostIds = new Set(posts.map((post) => post.id));
  const results: CommentStancesByPost[] = posts.map((post) => {
    const counts = countsByPost.get(post.id) ?? emptyStanceCounts();
    return {
      postId: post.id,
      postUrl: post.url,
      commentCount: Object.values(counts).reduce((sum, count) => sum + count, 0),
      stances: summarizeStances(counts, Object.values(counts).reduce((sum, count) => sum + count, 0)),
    };
  });

  for (const [postId, counts] of countsByPost) {
    if (postId !== null && knownPostIds.has(postId)) continue;
    const commentCount = Object.values(counts).reduce((sum, count) => sum + count, 0);
    results.push({
      postId,
      commentCount,
      stances: summarizeStances(counts, commentCount),
    });
  }
  return results;
}

export function emptyStanceCounts(): StanceCounts {
  return { agree: 0, disagree: 0, neutral: 0, unclear: 0 };
}

function createIndicators(posts: PlatformPost[], comments: PlatformComment[]): Indicator[] {
  const indicators: Indicator[] = [];
  const texts = [...posts.map((post) => post.text), ...comments.map((comment) => comment.text)]
    .map(normalize)
    .filter((text) => text.length >= 20);
  const counts = new Map<string, number>();
  for (const text of texts) counts.set(text, (counts.get(text) ?? 0) + 1);
  const repeated = [...counts.entries()].filter(([, count]) => count > 1);
  const duplicateItems = repeated.reduce((total, [, count]) => total + count - 1, 0);
  if (duplicateItems > 0) {
    const percentage = Math.round(duplicateItems / Math.max(texts.length, 1) * 100);
    indicators.push({
      source: "local",
      name: "Repeated text",
      score: Math.min(40, percentage),
      explanation: "Some collected content has identical normalized text. This may indicate repetition, but can also result from quotes, templates, or common phrases.",
      evidence: `${duplicateItems} repeated item(s) among ${texts.length} non-empty text item(s).`,
    });
  }

  const datedComments = comments.flatMap((comment) => {
    const time = comment.createdAt ? Date.parse(comment.createdAt) : Number.NaN;
    return Number.isFinite(time) ? [time] : [];
  }).sort((a, b) => a - b);
  if (datedComments.length >= 5) {
    let burstCount = 0;
    for (let index = 1; index < datedComments.length; index += 1) {
      if (datedComments[index]! - datedComments[index - 1]! <= 60_000) burstCount += 1;
    }
    const score = Math.min(30, Math.round(burstCount / (datedComments.length - 1) * 30));
    if (score >= 5) {
      indicators.push({
        source: "local",
        name: "Comment timing concentration",
        score,
        explanation: "A portion of available comments arrived within one-minute intervals. Popular posts and live events can naturally cause bursts.",
        evidence: `${burstCount} of ${datedComments.length - 1} adjacent comment intervals were at most one minute.`,
      });
    }
  }

  const total = posts.length + comments.length;
  if (total < 10) {
    indicators.push({
      source: "local",
      name: "Limited evidence",
      score: 0,
      explanation: "There is not enough collected content to assess recurring behavior with confidence.",
      evidence: `Only ${total} post/comment item(s) were collected.`,
    });
  }
  return indicators;
}

export function createLocalAnalysis(posts: PlatformPost[], comments: PlatformComment[]): AnalysisResult {
  const counts = emptyStanceCounts();
  const countsByPost = new Map<string | null, StanceCounts>();
  for (const post of posts) countsByPost.set(post.id, emptyStanceCounts());
  for (const comment of comments) {
    const stance = localStance(comment.text);
    counts[stance] += 1;
    const postId = comment.postId ?? null;
    const postCounts = countsByPost.get(postId) ?? emptyStanceCounts();
    postCounts[stance] += 1;
    countsByPost.set(postId, postCounts);
  }
  const indicators = createIndicators(posts, comments);
  const score = Math.min(100, indicators.reduce((sum, item) => sum + item.score, 0));
  return {
    coordinationSignalPercent: score,
    scoreMeaning: "A deterministic local pattern-strength score, not a probability that an account is a buzzer, fake, or coordinated.",
    indicators,
    commentStances: summarizeStances(counts, comments.length),
    commentStancesByPost: summarizeStancesByPost(posts, countsByPost),
    stanceMethod: "local-heuristic",
    aiEnabled: false,
    aiLimitations: ["AI is disabled. Local stance matching is a rough keyword heuristic and may misread sarcasm, context, or mixed-language comments."],
    analyzedCommentCount: comments.length,
  };
}
