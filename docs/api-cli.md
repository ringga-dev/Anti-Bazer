# Anti Bazer API and CLI Reference

Dokumen ini menjelaskan cara menggunakan Anti Bazer dari HTTP API maupun CLI, dengan fokus pada alur produk yang diminta: pengguna memasukkan URL akun atau URL postingan/video, aplikasi mengumpulkan data yang tersedia melalui API platform, lalu menampilkan analisis dan alasannya.

> **Penting — kondisi implementasi saat ini:** aplikasi dapat menganalisis postingan/konten dan komentar yang berhasil dikumpulkan, termasuk opini komentar secara agregat. Aplikasi belum menemukan seluruh akun yang berinteraksi, belum mengambil riwayat masing-masing komentator, dan belum menghitung skor fake/buzzer/orang asli untuk tiap akun. API platform juga membatasi data yang bisa diakses. Skor yang tersedia adalah indikator pola pada sampel konten, bukan probabilitas atau vonis tentang identitas maupun motif akun. Dokumen ini membedakan dengan jelas hasil yang tersedia sekarang dari tujuan lanjutan.

This document also contains the complete technical reference for the currently implemented HTTP API and CLI. Both interfaces invoke the same provider collection and analysis flow.

## Alur produk: masukan dan hasil

### A. Pengguna memasukkan URL akun

Contoh masukan: `https://www.youtube.com/@CHANNEL` atau `https://x.com/USERNAME`.

Alur yang **saat ini dijalankan**:

1. Aplikasi mengenali platform dan tipe URL akun.
2. Adapter memanggil API resmi untuk membaca akun sumber dan sejumlah posting terbaru yang dapat diakses.
3. Aplikasi membaca komentar pada posting yang didukung API dan izin token, hingga batas koleksi.
4. Analisis berjalan pada posting dan kumpulan komentar tersebut.
5. Hasil mengembalikan akun sumber, posting yang dikumpulkan, komentar, indikator pola, opini komentar agregat, dan keterbatasan.

Hasil akun **bukan** daftar semua komentator. Contoh bentuk ringkasnya:

```json
{
  "scan": {
    "id": "SCAN_ID",
    "platform": "youtube",
    "target": "https://www.youtube.com/@CHANNEL",
    "status": "succeeded",
    "createdAt": "2026-10-23T04:30:00.000Z",
    "updatedAt": "2026-10-23T04:30:04.000Z",
    "resultUrl": "/api/v1/scans/SCAN_ID/result"
  },
  "scope": {
    "targetType": "account",
    "analysisUnit": "account_content_sample",
    "postsCollected": 1,
    "commentsCollected": 1,
    "interactionRecordsCollected": 0,
    "interactingAccountAssessment": {
      "status": "not_implemented",
      "accountsAnalyzed": 0,
      "explanation": "The current platform adapters do not enumerate and analyze interacting accounts individually."
    }
  },
  "collection": {
    "seed": {
      "type": "account",
      "value": "https://www.youtube.com/@CHANNEL"
    },
    "sourceAccount": {
      "id": "CHANNEL_ID",
      "username": "@CHANNEL",
      "displayName": "Nama Channel"
    },
    "posts": [
      {
        "id": "VIDEO_ID",
        "url": "https://www.youtube.com/watch?v=VIDEO_ID",
        "text": "Judul dan deskripsi video",
        "replyCount": 12
      }
    ],
    "comments": [
      {
        "id": "COMMENT_ID",
        "text": "Setuju, ini benar.",
        "postId": "VIDEO_ID"
      }
    ],
    "interactions": [],
    "collectedAt": "2026-10-23T04:30:04.000Z",
    "limitations": [
      "Data dibatasi kuota API, izin, dan batas jumlah posting/komentar."
    ]
  },
  "analysis": {
    "coordinationSignalPercent": 0,
    "scoreMeaning": "A deterministic local pattern-strength score, not a probability that an account is a buzzer, fake, or coordinated.",
    "indicators": [
      {
        "source": "local",
        "name": "Limited evidence",
        "score": 0,
        "explanation": "There is not enough collected content to assess recurring behavior with confidence.",
        "evidence": "Only 2 post/comment item(s) were collected."
      }
    ],
    "commentStances": {
      "agree": { "stance": "agree", "count": 1, "percent": 100 },
      "disagree": { "stance": "disagree", "count": 0, "percent": 0 },
      "neutral": { "stance": "neutral", "count": 0, "percent": 0 },
      "unclear": { "stance": "unclear", "count": 0, "percent": 0 }
    },
    "commentStancesByPost": [
      {
        "postId": "VIDEO_ID",
        "postUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
        "commentCount": 1,
        "stances": {
          "agree": { "stance": "agree", "count": 1, "percent": 100 },
          "disagree": { "stance": "disagree", "count": 0, "percent": 0 },
          "neutral": { "stance": "neutral", "count": 0, "percent": 0 },
          "unclear": { "stance": "unclear", "count": 0, "percent": 0 }
        }
      }
    ],
    "stanceMethod": "local-heuristic",
    "aiEnabled": false,
    "aiLimitations": [
      "AI is disabled. Local stance matching is a rough keyword heuristic and may misread sarcasm, context, or mixed-language comments."
    ],
    "analyzedCommentCount": 1
  },
  "report": "Laporan teks untuk dibaca manusia."
}
```

Nilai pada contoh adalah ilustrasi format, bukan hasil pengukuran sungguhan. Array `interactions` saat ini kosong. `comments` berisi teks komentar yang tersedia, bukan profil atau penilaian individual penulis komentar. Karena contoh ini hanya berisi satu posting dan satu komentar, hasil analisis menampilkan indikator `Limited evidence`.

**Tujuan lanjutan untuk pencarian akun** adalah memeriksa akun-akun yang benar-benar dikembalikan oleh API interaksi, mengumpulkan bukti per akun sesuai izin dan batas, dan menunjukkan indikator perilaku beserta penjelasannya. Fitur itu belum diimplementasikan. Jangan menafsirkan `coordinationSignalPercent` sebagai peluang bahwa akun sumber atau akun komentator adalah buzzer/fake.

#### Bentuk hasil yang dibutuhkan untuk tujuan lanjutan (belum tersedia)

Agar tujuan penelusuran akun dapat dipenuhi, kontrak hasil nantinya perlu menambahkan daftar akun hasil interaksi dan cakupan penelusurannya. Ilustrasi di bawah adalah **spesifikasi arah pengembangan, bukan response yang dihasilkan server sekarang**:

```json
{
  "accountDiscovery": {
    "status": "planned",
    "accountsDiscovered": 1,
    "accountsAnalyzed": 1,
    "truncated": false,
    "depthReached": 1,
    "coverageNotes": [
      "Akun pemberi komentar/like hanya dapat ditampilkan jika API provider mengembalikan identitasnya dan aplikasi memiliki izin."
    ]
  },
  "interactingAccounts": [
    {
      "platformAccountId": "PROVIDER_ACCOUNT_ID",
      "profileUrl": "https://platform.example/account",
      "observedInteractions": {
        "comments": 3,
        "replies": 0,
        "reposts": 0,
        "likes": 0
      },
      "evidenceCoverage": {
        "postsReviewed": 4,
        "commentsReviewed": 3,
        "timeRange": {
          "from": "2026-10-01T00:00:00.000Z",
          "to": "2026-10-23T00:00:00.000Z"
        }
      },
      "behaviorAssessment": {
        "status": "insufficient_evidence",
        "coordinationSignal": null,
        "automationSignal": null,
        "indicators": [],
        "explanation": "Belum ada cukup data yang diizinkan untuk menilai pola aktivitas akun."
      },
      "identityConclusion": null
    }
  ]
}
```

Dalam implementasi kelak, `coordinationSignal`/`automationSignal` harus didefinisikan, diuji, dan dijelaskan sebagai indikator pola; bukan otomatis menjadi probabilitas bahwa orang tersebut palsu atau buzzer. `identityConclusion` sengaja tidak menyatakan “orang asli” atau “buzzer”. Nilai `null`/`insufficient_evidence` wajib dibedakan dari “tidak ditemukan pola”. Jumlah akun, kedalaman, rentang waktu, data yang tidak tersedia, dan pemotongan hasil harus dilaporkan agar kata “semua akun” tidak dijanjikan bila provider hanya memberi sebagian.

### B. Pengguna memasukkan URL postingan atau video

Contoh masukan: URL video YouTube, post X, post Facebook, atau media Instagram yang dapat diakses token.

Alur yang **saat ini dijalankan**:

1. Aplikasi membaca metadata konten dan akun pembuat bila API mengembalikannya.
2. Aplikasi mengambil komentar/balasan yang tersedia dan diizinkan.
3. Komentar dikelompokkan menurut `postId` dalam data koleksi.
4. Analisis menghitung agree/disagree/neutral/unclear secara agregat untuk sampel komentar; analisis AI (jika diaktifkan) juga mengembalikan hitungan agregat, bukan label tiap penulis.
5. Hasil memuat akun sumber jika tersedia, postingan, komentar, indikator, ringkasan, dan keterbatasan.

Dengan demikian, hasil saat ini dapat menjawab secara terbatas: **“Bagaimana pola dan opini agregat pada komentar yang berhasil dikumpulkan untuk konten ini?”** Hasil belum dapat menjawab: **“Siapa setiap orang yang berkomentar, apakah mereka akun fake/buzzer, dan berapa skor masing-masing?”**

Persentase opini dihitung terhadap jumlah komentar yang dianalisis. Untuk nol komentar, semua hitungan dan persentase bernilai `0`; itu berarti tidak ada sampel komentar untuk dianalisis, bukan bahwa semua orang netral atau setuju. Hasil API memuat `analysis.commentStancesByPost`, sehingga scan akun dapat menunjukkan opini agregat per postingan/video selain total seluruh sampel.

Objek `scope` pada response API menjelaskan target (`account` atau `post`), satuan analisis, jumlah data terkumpul, dan status penilaian akun interaksi. `interactingAccountAssessment.status` saat ini selalu `not_implemented`; angka `accountsAnalyzed: 0` bukan bukti bahwa tidak ada akun yang berinteraksi.

### Arti skor dan penjelasan

- `coordinationSignalPercent`: kekuatan gabungan indikator pola deterministik lokal (0–100), bukan akurasi model, probabilitas, confidence, atau label buzzer.
- `indicators[]`: alasan yang dapat diperiksa, berisi sumber (`local` atau `ai`), nama pola, nilai sinyal, penjelasan, dan bukti ringkas.
- `commentStances`: jumlah dan persentase komentar yang dikategorikan agree, disagree, neutral, atau unclear. Tidak ada ID penulis pada klasifikasi ini.
- `aiSummary`: tersedia bila AI aktif dan endpoint mengembalikan ringkasan. AI tidak mengubah skor koordinasi lokal.
- `limitations[]` dan `aiLimitations[]`: batas cakupan data dan metode yang harus dibaca bersama skor.

Jika tujuan produk nantinya mencakup “fake/buzzer/orang asli”, hasil harus tetap ditampilkan sebagai **indikator aktivitas yang perlu ditinjau**, disertai bukti dan ketidakpastian. Konten saja tidak membuktikan identitas, afiliasi, kendali bersama, atau motif; jangan mengubah skor pola menjadi label faktual tentang seseorang.

## Before you start

1. Install Bun and the project dependencies.
2. Copy `.env.example` to `.env`.
3. Add credentials only for the platforms you are authorized to access.
4. Start either the CLI directly or the HTTP API server as described below.

An empty credential value is not a working credential. Without the requested platform credentials, a scan cannot begin. The API server and health check can still run without platform credentials.

Platform access is not uniform:

| Platform | Current access constraints |
|---|---|
| X | Endpoint access depends on API tier and token; reply search covers only data the API returns and its recent-search window. |
| Instagram | The adapter is limited to media for the authorized professional account; arbitrary public profiles/posts are not supported. |
| TikTok | Display API is limited to the user who authorized the app; public comment text is not available through this integration. |
| YouTube | Public channel/video data and available comments/replies are subject to API quota and comment availability. |
| Facebook | Only objects available to the configured token and permissions can be read; arbitrary personal profiles are not supported. |

This version analyzes collected source content and aggregate comment text. It does not enumerate or individually classify every account that interacted with a post.

## HTTP API

### Run the server

Start the server from the project directory:

```powershell
bun run api
```

Defaults:

| Variable | Default | Description |
|---|---:|---|
| `API_HOST` | `127.0.0.1` | Interface to bind. Default is local-only. |
| `API_PORT` | `3000` | TCP port; integer from 1 to 65535. |
| `API_ACCESS_TOKEN` | empty | Optional on loopback; required for any non-loopback bind and must be at least 32 characters. |
| `API_CORS_ORIGIN` | empty | Optional single exact browser origin, e.g. `http://localhost:5173`. |
| `API_MAX_CONCURRENT_SCANS` | `2` | Maximum active scans; integer from 1 to 10. |

For browser clients, configure `API_CORS_ORIGIN` to the frontend's exact origin. Wildcard origins are not accepted. When an origin is not configured, requests carrying an `Origin` header are rejected. CORS is a browser policy, not authentication.

For a non-loopback interface, configure a long random token in `.env` and send it as `Authorization: Bearer <token>`. The API does not provide TLS itself. Do not expose it directly to the public internet; use a trusted private network or a properly configured TLS reverse proxy. The health endpoint is intentionally unauthenticated.

### Common response headers

JSON responses use `Content-Type: application/json` and `Cache-Control: no-store`. Successful preflight requests use HTTP `204 No Content`.

### `GET /health`

Unauthenticated liveness check. It does not test social-platform credentials, AI configuration, or provider API availability.

Response — `200 OK`:

```json
{
  "status": "ok"
}
```

### `POST /api/v1/scans`

Submit one scan. The operation runs asynchronously: the request returns a job identifier, which the client then polls.

Headers:

```http
Content-Type: application/json
Authorization: Bearer YOUR_API_ACCESS_TOKEN
```

The `Authorization` header is only required if `API_ACCESS_TOKEN` is configured.

Request body:

```json
{
  "platform": "auto",
  "target": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

Contoh request untuk URL akun:

```json
{
  "platform": "youtube",
  "target": "https://www.youtube.com/@CHANNEL"
}
```

Contoh request untuk URL posting:

```json
{
  "platform": "x",
  "target": "https://x.com/USERNAME/status/POST_ID"
}
```

| Field | Type | Required | Description |
|---|---|---:|---|
| `target` | string (absolute URL) | Yes | Social account or post URL. When the host is recognized as a supported platform, it must match the requested platform. |
| `platform` | string | No | `auto` (default), `x`, `instagram`, `tiktok`, `youtube`, or `facebook`. With `auto`, the platform is inferred from the URL host. |

Unknown JSON fields are rejected. The JSON request body is limited to 16 KiB. The API detects whether the URL looks like an account or post using the platform-specific URL path; it does not accept a separate target-type field.

Accepted response — `202 Accepted`:

```json
{
  "scan": {
    "id": "2a89ba8e-27bc-4aa8-b2ab-6f9348f81891",
    "platform": "youtube",
    "target": "https://www.youtube.com/watch?v=VIDEO_ID",
    "status": "running",
    "createdAt": "2026-10-23T04:30:00.000Z",
    "updatedAt": "2026-10-23T04:30:00.000Z"
  },
  "statusUrl": "/api/v1/scans/2a89ba8e-27bc-4aa8-b2ab-6f9348f81891"
}
```

The initial status may already be `running` because the job starts immediately after acceptance; clients should not depend on seeing `queued`.

PowerShell example:

```powershell
$body = @{
  platform = 'auto'
  target = 'https://www.youtube.com/watch?v=VIDEO_ID'
} | ConvertTo-Json

$submitted = Invoke-RestMethod -Method Post `
  -Uri 'http://127.0.0.1:3000/api/v1/scans' `
  -ContentType 'application/json' `
  -Body $body

$scanId = $submitted.scan.id
$submitted
```

If the API is configured with an access token, include this request header:

```powershell
$headers = @{ Authorization = "Bearer $env:ANTIBAZER_API_TOKEN" }
```

Pass `-Headers $headers` to each request. Keep the token in a protected local environment variable; do not paste it into source control or logs.

### `GET /api/v1/scans/{id}`

Retrieve the current job status. The ID is the `scan.id` returned by the submit endpoint.

In-progress response — `200 OK`:

```json
{
  "scan": {
    "id": "2a89ba8e-27bc-4aa8-b2ab-6f9348f81891",
    "platform": "youtube",
    "target": "https://www.youtube.com/watch?v=VIDEO_ID",
    "status": "running",
    "createdAt": "2026-10-23T04:30:00.000Z",
    "updatedAt": "2026-10-23T04:30:02.000Z"
  }
}
```

Finished status values are `succeeded` and `failed`. A succeeded status includes `resultUrl`; a failed status includes an `error` message:

```json
{
  "scan": {
    "id": "2a89ba8e-27bc-4aa8-b2ab-6f9348f81891",
    "platform": "youtube",
    "target": "https://www.youtube.com/watch?v=VIDEO_ID",
    "status": "succeeded",
    "createdAt": "2026-10-23T04:30:00.000Z",
    "updatedAt": "2026-10-23T04:30:04.000Z",
    "resultUrl": "/api/v1/scans/2a89ba8e-27bc-4aa8-b2ab-6f9348f81891/result"
  }
}
```

### `GET /api/v1/scans/{id}/result`

Retrieve a completed job. The result includes collected post/comment text, analysis, and a human-readable report. Treat it as potentially sensitive data.

Success response — `200 OK`:

```json
{
  "scan": {
    "id": "2a89ba8e-27bc-4aa8-b2ab-6f9348f81891",
    "platform": "youtube",
    "target": "https://www.youtube.com/watch?v=VIDEO_ID",
    "status": "succeeded",
    "createdAt": "2026-10-23T04:30:00.000Z",
    "updatedAt": "2026-10-23T04:30:04.000Z",
    "resultUrl": "/api/v1/scans/2a89ba8e-27bc-4aa8-b2ab-6f9348f81891/result"
  },
  "scope": {
    "targetType": "post",
    "analysisUnit": "post_comment_sample",
    "postsCollected": 1,
    "commentsCollected": 1,
    "interactionRecordsCollected": 0,
    "interactingAccountAssessment": {
      "status": "not_implemented",
      "accountsAnalyzed": 0,
      "explanation": "The current platform adapters do not enumerate and analyze interacting accounts individually."
    }
  },
  "collection": {
    "seed": {
      "type": "post",
      "value": "https://www.youtube.com/watch?v=VIDEO_ID"
    },
    "sourceAccount": {
      "id": "CHANNEL_ID",
      "username": "@example",
      "displayName": "Example Channel",
      "profileUrl": "https://www.youtube.com/channel/CHANNEL_ID",
      "followers": 1200
    },
    "posts": [
      {
        "id": "VIDEO_ID",
        "url": "https://www.youtube.com/watch?v=VIDEO_ID",
        "text": "Video title and description",
        "createdAt": "2026-10-20T12:00:00.000Z",
        "author": {
          "id": "CHANNEL_ID",
          "username": "@example",
          "displayName": "Example Channel"
        },
        "replyCount": 12,
        "likeCount": 80
      }
    ],
    "comments": [
      {
        "id": "COMMENT_ID",
        "text": "Example comment text",
        "createdAt": "2026-10-20T12:30:00.000Z",
        "postId": "VIDEO_ID"
      }
    ],
    "interactions": [],
    "collectedAt": "2026-10-23T04:30:04.000Z",
    "limitations": [
      "Collection is capped by MAX_SCAN_POSTS and MAX_SCAN_COMMENTS."
    ]
  },
  "analysis": {
    "coordinationSignalPercent": 0,
    "scoreMeaning": "A deterministic local pattern-strength score, not a probability that an account is a buzzer, fake, or coordinated.",
    "indicators": [
      {
        "source": "local",
        "name": "Limited evidence",
        "score": 0,
        "explanation": "There is not enough collected content to assess recurring behavior with confidence.",
        "evidence": "Only 2 post/comment item(s) were collected."
      }
    ],
    "commentStances": {
      "agree": { "stance": "agree", "count": 1, "percent": 100 },
      "disagree": { "stance": "disagree", "count": 0, "percent": 0 },
      "neutral": { "stance": "neutral", "count": 0, "percent": 0 },
      "unclear": { "stance": "unclear", "count": 0, "percent": 0 }
    },
    "stanceMethod": "local-heuristic",
    "commentStancesByPost": [
      {
        "postId": "VIDEO_ID",
        "postUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
        "commentCount": 1,
        "stances": {
          "agree": { "stance": "agree", "count": 1, "percent": 100 },
          "disagree": { "stance": "disagree", "count": 0, "percent": 0 },
          "neutral": { "stance": "neutral", "count": 0, "percent": 0 },
          "unclear": { "stance": "unclear", "count": 0, "percent": 0 }
        }
      }
    ],
    "aiEnabled": false,
    "aiLimitations": [
      "AI is disabled. Local stance matching is a rough keyword heuristic and may misread sarcasm, context, or mixed-language comments."
    ],
    "analyzedCommentCount": 1
  },
  "report": "=== Anti Bazer Analysis Report ===\n..."
}
```

Fields that have no value for a provider may be omitted. `collection.seed.value` is serialized as the target URL string. Account/post/comment entries are provider-normalized data; fields vary with what the provider returns. `interactions` is currently empty for these adapters—the response does not list all interacting accounts.

When AI is enabled, `analysis` may also contain `aiModel` and `aiSummary`, and AI-generated indicators use `"source": "ai"`. AI classifies comments in per-post batches of up to 25 so the aggregate breakdown is tied to each post's context. A comment without a matching post in the collected sample is marked `unclear` because its context cannot be checked. AI failures fail the scan rather than silently falling back to local analysis.

Result polling example:

```powershell
$status = Invoke-RestMethod -Uri "http://127.0.0.1:3000$($submitted.statusUrl)"
$status

$result = Invoke-RestMethod `
  -Uri "http://127.0.0.1:3000/api/v1/scans/$scanId/result"
$result.analysis
$result.report
```

If a result request returns `409`, the scan is still running; poll the status endpoint and retry. Add a short delay between polls in production clients.

### API error responses

Error responses have this general format:

```json
{
  "error": "Human-readable error message."
}
```

Invalid scan body responses can also include field details:

```json
{
  "error": "Invalid scan request.",
  "details": [
    {
      "path": "target",
      "message": "Invalid URL"
    }
  ]
}
```

| HTTP status | Meaning |
|---:|---|
| `400` | Malformed JSON, invalid fields/URL, failed automatic platform detection, or a recognized platform/URL mismatch. |
| `401` | The configured bearer token is missing or does not match. |
| `403` | Request `Origin` is not the configured CORS origin, or CORS is disabled for a browser-origin request. |
| `404` | Unknown route or job ID. A job ID may no longer exist after server restart/eviction. |
| `409` | Result requested while its scan is still running. |
| `413` | Request body exceeds 16 KiB. |
| `415` | Scan request does not use `Content-Type: application/json`. |
| `422` | Scan job finished with an error, commonly a platform API failure. |
| `429` | Configured concurrent scan capacity is currently busy. Retry later. |
| `503` | Provider/AI configuration is missing or invalid, or the in-memory job store cannot evict a finished job. |

### API lifecycle and limits

- Scan jobs are stored only in process memory. Restarting the server deletes all jobs and results.
- At most 20 jobs are retained. When full, the oldest finished job is evicted to make room; active jobs are not evicted.
- The default maximum is two concurrent scans. Configure `API_MAX_CONCURRENT_SCANS` to adjust it.
- Results are not persisted in a database. Clients must store any result they need to keep.
- A platform scan still requires the relevant platform API credentials and permissions.
- The server reports errors from provider/AI calls, but does not provide a durable queue or retry scheduler.

## CLI reference

Run commands from the project directory. The terminal UI and messages are in English.

### `bun run antibazer`

With no arguments, displays platform/AI configuration status and an example command. This is a status screen; it does not perform a scan.

### Shorthand scan

General form:

```powershell
bun run antibazer --platform=PLATFORM target="SOCIAL_URL"
```

Examples:

```powershell
bun run antibazer --platform=auto target="https://www.youtube.com/watch?v=VIDEO_ID"
bun run antibazer --platform=instagram akun="https://www.instagram.com/USERNAME/"
bun run antibazer --platform=x post="https://x.com/USERNAME/status/POST_ID"
```

You can also pass values as options:

```powershell
bun run antibazer --platform=auto --target="https://www.youtube.com/watch?v=VIDEO_ID"
bun run antibazer --platform=x --post="https://x.com/USERNAME/status/POST_ID"
bun run antibazer --platform=instagram --akun="https://www.instagram.com/USERNAME/"
```

Supported target keys are `target=`, `url=`, `akun=`, and `post=` (or the corresponding `--target`, `--akun`, `--post` options). Provide exactly one target. The account/post type is inferred from the URL path and provider host. The `akun=` and `post=` spellings are accepted input-key aliases; they do not override path-based detection. Use a real account or post URL with a recognizable platform path.

`--platform=auto` detects the provider from the URL host. If omitted, shorthand mode also attempts detection. Supported platform IDs are `x`, `instagram`, `tiktok`, `youtube`, and `facebook`. Shorthand parsing also accepts aliases `twitter`, `ig`, `yt`, and `fb`. If a non-`auto` platform is supplied and the URL host identifies a different provider, the command rejects it. If the host is not recognized, detection requires an explicit platform and the provider may still reject the URL.

### `scan` interactive command

```powershell
bun run antibazer scan
bun run antibazer scan --platform youtube --post "https://www.youtube.com/watch?v=VIDEO_ID"
bun run antibazer scan --platform x --username example_user
```

Without options, the command prompts for platform and target type. `--platform` accepts one of the five platform IDs (not `auto`). Use `--username` for an account handle/name, not a full profile URL; the command constructs a platform profile URL from the username. Use `--post` for a full post/video URL. Exactly one of username or post is needed.

### Bentuk keluaran CLI

CLI saat ini mengeluarkan teks untuk dibaca manusia, **bukan JSON**, dan belum mempunyai opsi `--json`. Untuk integrasi program, gunakan HTTP API. Contoh berikut menggambarkan bentuk laporan scan posting (angka dan konten adalah ilustrasi):

```text
Anti Bazer Analysis Report
Collected at: 2026-10-23T04:30:04.000Z
Target type: post
Analysis scope: Target post/video and its accessible comments
Source account: Example Channel
Posts analyzed: 1
Comments analyzed: 3
Interaction records collected: 0
Interacting account assessments: not performed
Analysis mode: Local heuristic only
Comment stance method: local-heuristic
Coordination signal: 0%
Score meaning: A deterministic local pattern-strength score, not a probability that an account is a buzzer, fake, or coordinated.

Comment stance (aggregate; not per commenter):
  agree: 1 (33.3%)
  disagree: 1 (33.3%)
  neutral: 0 (0.0%)
  unclear: 1 (33.3%)

Comment stance by post:
  Post: https://www.youtube.com/watch?v=VIDEO_ID (3 comments)
    agree: 1 (33.3%)
    disagree: 1 (33.3%)
    neutral: 0 (0.0%)
    unclear: 1 (33.3%)

Indicators:
  - [LOCAL] Limited evidence: 0/100 signal
    There is not enough collected content to assess recurring behavior with confidence.
    Evidence: Only 4 post/comment item(s) were collected.

Limitations:
  - Comments may be limited by API permissions and collection caps.
  - Interacting account identities are not enumerated or individually classified by this version.
  - The analysis describes a limited sample of source content; it does not determine account authenticity, identity, affiliation, or motive.
  - AI is disabled. Local stance matching is a rough keyword heuristic and may misread sarcasm, context, or mixed-language comments.

Important: This report describes observed content patterns. It does not determine whether a person is a buzzer, fake, or acting with a particular motive.
```

Output aktual mencetak judul `=== Anti Bazer Analysis Report ===` dan mengikuti data yang dikembalikan provider. Bagian indikator dapat kosong atau berisi pola lain. Nilai `Limited evidence` di atas hanya ilustrasi; implementasi menambah indikator tersebut jika jumlah gabungan item posting+komentar kurang dari 10. Untuk target akun, `Target type` menjadi `account` dan `Posts analyzed` menunjukkan posting yang berhasil diambil. Laporan tetap merangkum komentar secara agregat, tanpa daftar atau skor tiap komentator.

### `platforms` command

```powershell
bun run antibazer platforms
bun run antibazer platforms list
bun run antibazer platforms check youtube
bun run antibazer platforms check instagram
```

`list` displays provider setup notes and credential presence. `check <platform>` reports whether the required environment values are non-empty. It does not validate credentials with the provider or guarantee endpoint access. A failed check exits with a non-zero process status.

### `api` command

```powershell
bun run antibazer api
```

Equivalent package script:

```powershell
bun run api
```

Starts the HTTP server; see the API section above for environment settings and endpoints.

### Help and exit behavior

```powershell
bun run antibazer --help
bun run antibazer scan --help
bun run antibazer platforms --help
bun run antibazer api --help
```

The CLI exits with a non-zero status when input is invalid, required provider credentials are missing, AI configuration is invalid, or a scan fails. A normal startup/status screen does not contact the provider APIs.

## Interpreting results

- `coordinationSignalPercent` is a deterministic pattern-strength score, **not** the probability that an account is fake, a bot, or a buzzer.
- Comment stance categories (`agree`, `disagree`, `neutral`, `unclear`) are aggregates for the collected sample, never per commenter.
- Local stance analysis uses keyword matching and can misread context, sarcasm, and mixed-language text.
- AI is optional. When enabled, collected post/comment text is sent to the configured AI endpoint after URLs, email addresses, and `@handles` are redacted. Review the endpoint's privacy and retention policies.
- Provider permissions, quotas, target visibility, and configured collection limits can reduce coverage. A successful scan does not mean the sample is complete.
- The application does not establish a person's identity, authenticity, affiliation, or motive.

See [setup-platform.md](./setup-platform.md) for provider credentials, AI configuration, official API links, and platform-specific access notes.
