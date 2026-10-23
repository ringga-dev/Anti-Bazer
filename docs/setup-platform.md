# Social Platform API Setup

Anti Bazer uses official platform APIs. Adding a platform to the CLI does not grant API access. Each platform requires its own developer app, credentials, permissions, and sometimes review or a paid access tier.

## Local setup

1. Copy `.env.example` to `.env`.
2. Create a developer app on each platform you plan to use.
3. Add credentials to your local `.env` file. Never share tokens in chat or commit `.env`.
4. Run `bun run antibazer` to see the configuration status of all providers.
5. Run `bun run antibazer platforms check <platform>` to check whether the required environment variables are present.
6. Start a scan from a URL:

```text
bun run antibazer --platform=auto target="https://www.youtube.com/watch?v=VIDEO_ID"
bun run antibazer --platform=instagram akun="https://www.instagram.com/USERNAME/"
bun run antibazer --platform=x post="https://x.com/USERNAME/status/POST_ID"
```

`platform=auto` detects the provider from the URL hostname. Supported target keys are `target=`, `akun=`, and `post=`. The application detects whether a URL appears to be an account or a post based on its path.

The `antibazer` executable is declared in `package.json`. To use it globally, install or link the package so Bun can find the executable on `PATH`. From the project directory, `bun run antibazer --platform=...` works without a global install.

## HTTP API

The CLI and HTTP API call the same scan and analysis flow. Start the server with:

```text
bun run api
```

For complete endpoint documentation, request/response schemas, examples, status codes, and CLI commands, see [api-cli.md](./api-cli.md).

## Credential status

At startup, the CLI lists all providers and reports whether their required environment variables are present in the environment or `.env`. A configured status only means the values are non-empty. It does not verify the token, permissions, endpoint access, or API availability.

## AI analysis setup

AI is opt-in. Without AI settings, the application uses a small local keyword heuristic for aggregate comment stance and deterministic content indicators.

To use an API or a local server that implements the OpenAI-compatible Chat Completions API, set:

```dotenv
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://your-provider.example/v1
AI_API_KEY=your-key
AI_MODEL=your-model-name
```

`AI_API_KEY` may be empty when using a local endpoint that does not require authentication. Hermes or OpenClaw can be used only if the particular server exposes a compatible `/chat/completions` endpoint; the application does not connect to those tools' private protocols. Keep local endpoints on localhost or use HTTPS. Do not expose an unauthenticated local model server to the public internet.

AI receives post context and comment text in bounded batches (up to 25 comments per request), grouped by post so stance percentages can also be reported per post. Comments without a matching collected post are counted as unclear without sending those comments to AI. The model does not receive comment author IDs. URLs, email addresses, and @handles are redacted before sending. If AI is enabled, collected comment text is sent to the configured endpoint. Review its privacy/retention policy. A failed or partial AI response stops the report rather than silently treating it as a complete analysis.

The score is an explainable **coordination signal**, not a probability that an account is a buzzer or fake. Comment agree/disagree percentages are aggregated for the scanned content and are not reported per commenter.

Collection limits can be adjusted with `MAX_SCAN_POSTS`, `MAX_SCAN_COMMENTS`, `X_MAX_SEARCH_PAGES`, `YOUTUBE_MAX_COMMENT_PAGES`, and `META_MAX_COMMENT_PAGES`. API pricing/quota still applies.

## Required environment variables

| Platform | Required variables | Access notes |
|---|---|---|
| X | `X_BEARER_TOKEN` | Create a developer Project/App. Available endpoints depend on the app's tier and permissions. |
| Instagram | `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID`, `META_GRAPH_API_VERSION` | Instagram Graph API requires a professional account and appropriate Meta permissions. |
| TikTok | `TIKTOK_ACCESS_TOKEN` | Display API uses OAuth and access granted by the authorizing user; it is not a general search API for all accounts. |
| YouTube | `YOUTUBE_API_KEY` | Enable YouTube Data API v3 in a Google Cloud project. API quota applies. |
| Facebook | `FACEBOOK_ACCESS_TOKEN`, `META_GRAPH_API_VERSION` | Permissions, token/object type, and App Review determine access. |

Use `.env.example` as the list of required variable names. Do not put secret values in that template.

## Official documentation

- [X API user lookup](https://docs.x.com/x-api/users/lookup/introduction)
- [Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/)
- [TikTok Display API](https://developers.tiktok.com/docs/en/display-api-overview)
- [YouTube commentThreads.list](https://developers.google.com/youtube/v3/docs/commentThreads/list)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api/)

## Provider coverage and limitations

- **YouTube:** can read public channel/video metadata and available comments/replies via YouTube Data API v3, subject to quota, comment settings, and collection caps.
- **X:** can read user/post data and recent replies only if the app's tier and token permit the endpoints. Recent search has a limited window.
- **Instagram:** can scan media/comments for the authorized professional account; it cannot scan arbitrary accounts.
- **TikTok:** Display API can read the authorizing user's profile/videos; it does not expose public comment text for stance analysis.
- **Facebook:** can read posts/comments only for objects the token and app permissions allow, commonly Pages; arbitrary personal profiles are not supported.

The current report does **not** enumerate commenter identities, discover every account that interacted, or classify individual commenters. It analyzes the collected source posts and aggregate comment text only. The platform APIs and permissions do not provide consistent access to all likes, shares, commenters, or their histories, so account-level network analysis is not implemented. Not every provider exposes every kind of interaction. The report lists unavailable/limited data. Only use endpoints the app is authorized to access; do not scrape or bypass authentication, rate limits, or access controls.
