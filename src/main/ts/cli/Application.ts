import { cancel, intro, isCancel, log, outro, select, text } from "@clack/prompts";
import { Command } from "commander";
import { startApiServer } from "../api/server";
import { getAiStatus } from "../features/analysis/ai";
import { parseScanEntries, scanInputSchema } from "../features/scan/input";
import { scanAndReport } from "../features/scan/run";
import { platformIds, type PlatformId } from "../platforms/types";
import { getMissingCredentials, getPlatform, platforms } from "../platforms/registry";
import packageMetadata from "../../../../package.json";

export async function runCli(): Promise<void> {
  const program = new Command();

  program
    .name("antibazer")
    .description("Analyze account and interaction signals using social media APIs.")
    .version(packageMetadata.version)
    .argument("[entries...]", "Target URL as target=<URL>, akun=<URL>, or post=<URL>")
    .option("--platform <platform>", "Platform: auto, x, instagram, tiktok, youtube, or facebook")
    .option("--target <url>", "Account or post URL")
    .option("--akun <url>", "Account URL")
    .option("--post <url>", "Post URL")
    .action(async (entries: string[] | undefined, options: {
      platform?: string;
      target?: string;
      akun?: string;
      post?: string;
    }) => {
      const targetOptions = [
        options.target === undefined ? undefined : `target=${options.target}`,
        options.akun === undefined ? undefined : `akun=${options.akun}`,
        options.post === undefined ? undefined : `post=${options.post}`,
      ].filter((entry): entry is string => entry !== undefined);
      const allEntries = [...(entries ?? []), ...targetOptions];
      if (!entries?.length) {
        if (options.platform || targetOptions.length > 0) {
          await runShorthandScan(allEntries, options.platform);
          return;
        }
        intro("Anti Bazer");
        showPlatformStatus();
        log.info("Example: bun run antibazer --platform=auto target=https://www.youtube.com/watch?v=VIDEO_ID");
        log.info("Run antibazer --help to see all commands.");
        outro("CLI is ready.");
        return;
      }
      await runShorthandScan(allEntries, options.platform);
    });

  program
    .command("api")
    .description("Start the HTTP API server.")
    .action(() => startApiServer());

  program
    .command("platforms")
    .description("List supported API providers and check their configuration.")
    .argument("[action]", "Action: list or check")
    .argument("[platform]", "Provider to check")
    .action((action?: string, platformId?: string) => {
      if (!action || action === "list") {
        showPlatformStatus(true);
        return;
      }

      if (action !== "check" || !platformId || !platformIds.includes(platformId as PlatformId)) {
        log.error("Usage: antibazer platforms [list] or antibazer platforms check <x|instagram|tiktok|youtube|facebook>");
        process.exitCode = 1;
        return;
      }

      const platform = getPlatform(platformId as PlatformId);
      const missing = getMissingCredentials(platform);
      if (missing.length > 0) {
        log.error(`Configuration for ${platform.title} is incomplete: ${missing.join(", ")}`);
        log.info("Set these values in your local .env file. This check does not validate the token with the platform.");
        process.exitCode = 1;
        return;
      }

      log.success(`Configuration variables for ${platform.title} are present.`);
      log.info(platform.accessNote);
      log.warn("The token has not been tested with the API. Credentials alone do not enable scanning.");
    });

  program
    .command("scan")
    .description("Start a scan from an account username or post URL.")
    .option("--platform <name>", "Social media platform")
    .option("--username <username>", "Starting account username")
    .option("--post <url>", "Starting post URL")
    .action(async (options: { platform?: string; username?: string; post?: string }) => {
      intro("Anti Bazer");
      showPlatformStatus();

      const platform = options.platform ?? await promptPlatform();
      const targetType = options.username || options.post
        ? options.username
          ? "username"
          : "post"
        : await promptTargetType();

      const username = options.username ?? (targetType === "username"
        ? await promptText("Account username or profile URL to scan?")
        : undefined);
      const post = options.post ?? (targetType === "post"
        ? await promptText("Post URL to scan?")
        : undefined);

      const result = scanInputSchema.safeParse({ platform, username, post });
      if (!result.success) {
        log.error(result.error.issues.map((issue) => issue.message).join("\n"));
        process.exitCode = 1;
        return;
      }

      const provider = getPlatform(result.data.platform);
      const target = result.data.username
        ? {
          type: "account" as const,
          value: new URL(`https://${platformHost(provider.id)}/${result.data.username.replace(/^@/, "")}`),
        }
        : { type: "post" as const, value: new URL(result.data.post!) };
      await runConfiguredScan(provider.id, provider.title, target);
    });

  await program.parseAsync();
}

function platformHost(platformId: PlatformId): string {
  switch (platformId) {
    case "x": return "x.com";
    case "youtube": return "youtube.com";
    case "instagram": return "instagram.com";
    case "tiktok": return "tiktok.com";
    case "facebook": return "facebook.com";
  }
}

function showPlatformStatus(includeDetails = false): void {
  log.info("Platform configuration status from environment/.env:");
  for (const platform of platforms) {
    const missing = getMissingCredentials(platform);
    const status = missing.length === 0 ? "credentials present" : `inactive (missing ${missing.join(", ")})`;
    log.message(`  ${platform.id}: ${status}`);
    if (includeDetails) {
      log.message(`    ${platform.accessNote}`);
      log.message(`    ${platform.documentationUrl}`);
    }
  }
  try {
    const ai = getAiStatus();
    log.message(ai.enabled
      ? `  AI: enabled (${ai.model}) at ${ai.endpoint}`
      : "  AI: disabled; local heuristic analysis will be used.");
  } catch (error) {
    log.error(error instanceof Error ? `AI configuration error: ${error.message}` : "AI configuration is invalid.");
    process.exitCode = 1;
  }
  log.warn("Credential status does not verify tokens, permissions, or endpoint availability.");
}

async function runShorthandScan(entries: string[], platformOption?: string): Promise<void> {
  intro("Anti Bazer");
  showPlatformStatus();

  const result = parseScanEntries(entries, platformOption);
  if (!result.success) {
    log.error(result.error);
    log.info("Example: bun run antibazer --platform=x post=https://x.com/username/status/POST_ID");
    process.exitCode = 1;
    return;
  }

  const provider = getPlatform(result.data.platform);
  log.info(`Detected ${result.data.targetType} target: ${result.data.targetUrl.href}`);
  await runConfiguredScan(provider.id, provider.title, {
    type: result.data.targetType,
    value: result.data.targetUrl,
  });
}

async function runConfiguredScan(
  platformId: PlatformId,
  title: string,
  seed: { type: "account" | "post"; value: URL },
): Promise<void> {
  const provider = getPlatform(platformId);
  const missing = getMissingCredentials(provider);
  if (missing.length > 0) {
    log.error(`${title} is inactive because these configuration values are missing: ${missing.join(", ")}`);
    log.info("Add them to your local .env file, then run the command again.");
    outro("Scan was not started.");
    process.exitCode = 1;
    return;
  }

  try {
    getAiStatus();
  } catch (error) {
    log.error(error instanceof Error ? `AI configuration error: ${error.message}` : "AI configuration is invalid.");
    outro("Scan was not started.");
    process.exitCode = 1;
    return;
  }

  log.success(`${title} credentials are configured.`);
  try {
    const report = await scanAndReport(platformId, seed);
    log.message(report);
    outro("Analysis complete.");
  } catch (error) {
    log.error(error instanceof Error ? error.message : "An unexpected scan error occurred.");
    outro("Analysis failed; no result was reported.");
    process.exitCode = 1;
  }
}

async function promptText(message: string): Promise<string> {
  const value = await text({
    message,
    validate: (input) => input.trim().length > 0 ? undefined : "This value is required.",
  });

  if (isCancel(value)) {
    cancel("Scan cancelled.");
    process.exit(0);
  }

  return value;
}

async function promptPlatform(): Promise<PlatformId> {
  const value = await select({
    message: "Select a social media platform:",
    options: platformIds.map((id) => ({ value: id, label: id })),
  });

  if (isCancel(value)) {
    cancel("Scan cancelled.");
    process.exit(0);
  }

  return value;
}

async function promptTargetType(): Promise<"username" | "post"> {
  const value = await select({
    message: "What would you like to scan?",
    options: [
      { value: "username", label: "Account username" },
      { value: "post", label: "Post URL" },
    ],
  });

  if (isCancel(value)) {
    cancel("Scan cancelled.");
    process.exit(0);
  }

  return value;
}
