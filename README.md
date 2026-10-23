# Anti Bazer

[![CI](https://github.com/ringga-dev/Anti-Bazer/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ringga-dev/Anti-Bazer/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/ringga-dev/Anti-Bazer)](https://github.com/ringga-dev/Anti-Bazer/releases)
[![MIT License](https://img.shields.io/github/license/ringga-dev/Anti-Bazer)](./LICENSE)

**Anti Bazer** is an open-source research tool for collecting publicly or explicitly authorized social-media content through official platform APIs and presenting explainable content-pattern and aggregate comment-stance signals.

The project is intended to support investigation and human review. It does **not** determine whether a person is real, fake, a “buzzer,” or acting with a particular motive. A signal is not proof, and the current implementation does not discover or assess every account that interacts with a post.

> **Project status:** early-stage implementation. Provider access depends on API credentials, permissions, quotas, and platform policy. Read [feature status and limitations](./docs/status-fitur.md) before relying on a result or planning an integration.

## Vision

Make social-content research more transparent and reproducible by showing what data was available, which patterns were observed, how those observations were produced, and what remains unknown.

## Mission

- Help researchers inspect content and comment samples using authorized data sources.
- Present explainable signals and evidence rather than unsupported labels or opaque scores.
- Make scope, missing data, uncertainty, and API limitations visible in every analysis.
- Provide a modular, documented foundation that developers can extend and operators can configure responsibly.
- Keep people in the decision loop and minimize unnecessary collection and retention.

## What it does today

- Accepts account/profile or post/video URLs from supported providers.
- Collects the content and comments that a configured official API actually makes available.
- Reports deterministic local content-pattern indicators, including repeated text and comment timing concentration when enough dated comments exist.
- Summarizes comment stance as aggregate counts and percentages, overall and per post. An optional AI endpoint can assist with stance classification and summaries.
- Provides both a command-line interface (CLI) and an HTTP API using the same scan flow.
- Reports collection scope and limitations; interacting-account assessment is explicitly marked as not implemented.

See [feature status, strengths, and limitations](./docs/status-fitur.md) for the provider matrix and known gaps.

## Quick start

### Requirements

- [Bun](https://bun.sh/) (the project uses Bun runtime and package scripts)
- API credentials for the provider you intend to use
- Optional: an OpenAI-compatible chat-completions endpoint for AI-assisted analysis

### Install and configure

```powershell
git clone <repository-url>
cd "Anti Bazer"
bun install
Copy-Item .env.example .env
```

Edit `.env` locally and set only credentials you are authorized to use. Do not commit or share `.env`. See [platform and AI setup](./docs/setup-platform.md) for required scopes, limitations, and configuration.

### Check configuration

```powershell
bun run antibazer platforms list
bun run antibazer platforms check youtube
```

These commands check that required environment values are present; they do not validate credentials with the provider or guarantee that a scan is permitted.

### Run a scan

```powershell
bun run antibazer --platform=auto target="https://www.youtube.com/watch?v=VIDEO_ID"
bun run antibazer --platform=instagram akun="https://www.instagram.com/USERNAME/"
bun run antibazer --platform=x post="https://x.com/USERNAME/status/POST_ID"
```

Supported target keys are `target=`, `url=`, `akun=`, and `post=`. The URL hostname can be used to infer the platform with `--platform=auto`. A valid credential alone does not imply that a provider supports arbitrary public account lookup or the requested content type.

### Start the HTTP API

```powershell
bun run api
```

By default, the server binds to `127.0.0.1:3000`. When binding to a non-loopback interface, configure a strong `API_ACCESS_TOKEN` (at least 32 characters), and deploy behind appropriate network controls and HTTPS. The API stores scan jobs in process memory; it is not a persistent job service.

See [API and CLI reference](./docs/api-cli.md) for endpoint schemas, examples, status codes, and complete command usage.

## Development

```powershell
bun install
bun run typecheck
bun test
```

Before contributing, read the [developer guide](./docs/developer-guide.md) for architecture, data flow, provider-adapter responsibilities, testing expectations, and responsible-analysis principles.

## Documentation

| Document | Contents |
|---|---|
| [Documentation index](./docs/README.md) | Guide to all project documentation |
| [Vision, mission, and scope](./docs/tujuan-dan-ruang-lingkup.md) | Product purpose, principles, current scope, and out-of-scope claims |
| [Feature status and limitations](./docs/status-fitur.md) | Implemented vs. planned capabilities, strengths, weaknesses, and provider constraints |
| [Developer guide](./docs/developer-guide.md) | Setup, architecture, extension workflow, testing, and contribution practices |
| [API and CLI reference](./docs/api-cli.md) | HTTP API and terminal commands, request/response shapes, and errors |
| [Platform and AI setup](./docs/setup-platform.md) | Credentials, AI endpoint setup, data handling, and provider access notes |
| [Project structure](./docs/struktur-proyek.md) | Source layout and module responsibilities |
| [Analysis indicators](./docs/indikator-analisis.md) | Signal definitions, interpretation, and evaluation |
| [Risks and mitigations](./docs/batasan-dan-risiko.md) | API, privacy, cost, accuracy, and misuse considerations |
| [Roadmap](./docs/rencana-kerja.md) | Future development stages and acceptance criteria |
| [Release process](./docs/release-process.md) | Versioning, tags, CI/CD, and GitHub source releases |
| [Contributing](./CONTRIBUTING.md) | Pull request, testing, provider, and analysis expectations |
| [Security policy](./SECURITY.md) | Supported versions and private vulnerability reporting |
| [Code of Conduct](./CODE_OF_CONDUCT.md) | Community participation standards |

## Responsible use

Use only official APIs and data you are authorized to access. Respect provider terms, privacy expectations, applicable law, rate limits, and retention requirements. Do not use a score as a basis for accusing, targeting, or taking action against a person. AI processing may send collected comment text to the configured model endpoint; review that provider's privacy and retention terms before enabling it.

## License

This project is licensed under the [MIT License](./LICENSE). Third-party services and APIs remain subject to their own terms and licenses. Versions follow Semantic Versioning; see the [release process](./docs/release-process.md).
