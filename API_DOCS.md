# API_DOCS.md — API Reference

---

## Overview

| Field | Value |
|-------|-------|
| **Base URL (Local)** | `http://localhost:3000/api` |
| **Base URL (Production)** | TBD |
| **Auth Method** | Fixed ID/password login, HMAC-signed `fc_session` cookie (see below) |
| **Response Format** | JSON |

---

## Standard Response Format

**Success**
```json
{ "success": true }
```

**Error**
```json
{ "success": false, "error": "Human readable message" }
```

---

## Endpoints

---

### Auth

#### `POST /api/auth/login`
**Auth:** No (this IS the login)
**Description:** Checks credentials against `DASHBOARD_LOGIN_ID` / `DASHBOARD_LOGIN_PASSWORD` env vars. On success, sets an httpOnly `fc_session` cookie (HMAC-signed, 7-day expiry, signed with `AUTH_SECRET`).

**Request Body:**
```json
{ "id": "string", "password": "string" }
```

**Response (success):** `{ "ok": true }` — Status 200, `Set-Cookie: fc_session=...`
**Response (error):** `{ "error": "Invalid ID or password" }` — Status 401
`{ "error": "Login is not configured on the server" }` — Status 500 (missing env vars)

#### `POST /api/auth/logout`
**Auth:** Requires existing session
**Description:** Clears the `fc_session` cookie.
**Response:** `{ "ok": true }`

**Note:** All routes and pages except `/login`, `/api/auth/*`, and `/api/webhooks/*` are gated by `src/proxy.ts`, which redirects unauthenticated requests to `/login?next=<original path>`.

---

### Webhooks

#### `POST /api/webhooks/n8n-callback`
**Auth:** No (called by n8n server)
**Description:** Receives callback events from n8n after content generation or social posting.

**Request Body:**
```json
{
  "job_id": "uuid",
  "content_type": "video | image_post | blog",
  "event": "draft_ready | generation_complete | post_complete",
  "data": {
    // draft_ready:
    "draft_data": { "title": "...", "body": "..." },

    // generation_complete:
    "file_url": "https://...",
    "thumbnail_url": "https://...",
    "output_data": {},

    // post_complete:
    "platform": "instagram | facebook | twitter | x",
    "platform_post_id": "...",
    "post_url": "https://..."
  }
}
```

**Behavior by event:**
| Event | Action |
|-------|--------|
| `draft_ready` | Upserts row in `content_drafts`, sets job status → `draft_ready` |
| `generation_complete` | Upserts row in `generated_content`, sets job status → `ready` when all types done |
| `post_complete` | Upserts row in `social_platform_logs`, updates `social_posts.status` → `posted` |

**Response (success):**
```json
{ "success": true }
```

**Response (error):**
```json
{ "error": "Job not found" }
```
Status: 400 / 404 / 500

---

## n8n Outbound Webhooks (called by this app, not routes)

All requests go through `POST /api/n8n/trigger` (`{ type, payload }`), which
forwards to the single `N8N_WEBHOOK_URL` combined workflow with `type` merged
into the body — the workflow's own Switch node routes internally. `type` is
one of `video | video_approve | blog | image_questions | image_post | social`.

### New Content Submission (`type: "video" | "blog" | "image_post"`)
**Method:** POST
**Payload:**
```json
{
  "type": "video | blog | image_post",
  "job_id": "uuid",
  "topic": "string",
  "keywords": "string",
  "category": "string",
  "target_audience": "string",
  "language": "EN | FR | BOTH",
  "brand": "Fresh-CAN",
  "content_type": "video | image_post | blog"
}
```

### Video Approved → Render (`type: "video_approve"`)
**Method:** POST
**Description:** Handles single-language (EN or FR) and BOTH-language jobs in one branch — send `language` plus either plain `script_parts`/`full_script`, or `en_script_parts`/`en_full_script` + `fr_script_parts`/`fr_full_script` when `language` is `BOTH`.
**Payload:**
```json
{
  "type": "video_approve",
  "job_id": "uuid",
  "language": "EN | FR | BOTH",
  "script_parts": [],
  "full_script": "string",
  "en_script_parts": [], "en_full_script": "string",
  "fr_script_parts": [], "fr_full_script": "string",
  "script_config": {},
  "topic": "string",
  "category": "string",
  "script_type": "string",
  "video_duration": "string"
}
```

### Draft Approved → Re-generate (`type: "video" | "image_post" | "blog"`)
**URL:** Same combined webhook as above (fired by `POST /api/jobs/[jobId]/regenerate`)
**Method:** POST
**Payload:**
```json
{
  "type": "video | image_post | blog",
  "job_id": "uuid",
  "content_type": "video | image_post | blog",
  "extra_instructions": "string | null",
  "regenerate": true,
  "brand": "Fresh-CAN"
}
```

### Social Post Approved (`type: "social"`)
**Method:** POST
**Payload:**
```json
{
  "type": "social",
  "job_id": "uuid",
  "social_post_id": "uuid",
  "content_type": "video | image_post | blog",
  "caption": "string",
  "hashtags": ["tag1", "tag2"],
  "platforms": ["instagram", "facebook"],
  "brand": "Fresh-CAN"
}
```

---

## Changelog

| Date | Change | Endpoint |
|------|--------|----------|
| 2026-06-15 | Created | POST /api/webhooks/n8n-callback |
| 2026-07-17 | Created | POST /api/auth/login |
| 2026-07-17 | Created | POST /api/auth/logout |
| 2026-09-06 | Consolidated 8 n8n webhook URLs into 1 combined workflow (`N8N_WEBHOOK_URL`, routed by `type`) | POST /api/n8n/trigger |
