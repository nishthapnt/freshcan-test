# PROGRESS.md — Session Log

---

## 📊 CURRENT STATUS

| Field | Value |
|-------|-------|
| **Project** | Fresh-CAN Content Automation Dashboard |
| **Last Updated** | 2026-06-15 |
| **Phase** | ✅ Core Build |
| **Progress** | ████████░░ 80% |
| **Blockers** | Supabase anon key not yet added to .env.local |

---

## 🏁 MILESTONES

- [x] Phase 1 — Project Setup (Next.js, Supabase, ShadCN, Tailwind)
- [x] Phase 2 — Core pages built (dashboard, new, jobs, social, library)
- [x] Phase 3 — n8n webhook integration wired
- [x] Phase 4 — UI upgrade (skeletons, KPI trends, TopBar, empty/error states)
- [ ] Phase 5 — Supabase tables confirmed + anon key connected
- [ ] Phase 6 — End-to-end test with real n8n flows
- [ ] Phase 7 — Deploy to production

---

## 📅 SESSION LOG

---

### Session 1 — 2026-06-15
**Developer:** Pri
**Tool:** ✅ Claude Code CLI

**✅ Completed**
- Scaffolded Next.js 16 App Router project
- Installed Supabase JS, ShadCN UI, Tailwind v4, Lucide icons
- Created TypeScript types: `content.ts`, `database.ts`
- Created Supabase client: `src/lib/supabase.ts`
- Created all service functions: `src/services/contentService.ts`
- Built n8n callback API route: `POST /api/webhooks/n8n-callback`
- Built Sidebar + DashboardLayout
- Built reusable components: StatusBadge, KPICard, ContentCard, DraftEditor, SocialApprovalCard, PlatformSelector
- Built all 5 pages: /dashboard, /dashboard/new, /dashboard/jobs/[job_id], /dashboard/jobs/[job_id]/social, /dashboard/library
- Clean production build: `npm run build` passes with 0 errors

**🔄 In Progress**
- Connecting real Supabase project (jbrktjnscnzmhwupojiu) — waiting for anon key

**🐛 Bugs Found**
- None

**💡 Decisions Made**
- Used `createClient<any>` instead of full Database generic — supabase-js v2 generic format incompatible; service layer handles types explicitly
- Supabase project switched from vufyllorsfmqocmdyeax → jbrktjnscnzmhwupojiu

**📁 Files Changed**
- All files created fresh (new project)

**⭐ Pick Up Next Session**
- Add Supabase anon key to .env.local
- Verify Supabase tables exist (run SQL if needed)
- Test form submission → n8n → callback flow end-to-end

---

### Session 2 — 2026-06-15
**Developer:** Pri
**Tool:** ✅ Claude Code CLI

**✅ Completed**
- Filled in all project docs (CLAUDE.md, PROGRESS.md, TASKS.md, API_DOCS.md, DECISIONS.md)
- UI upgrade: replaced all spinners with loading skeletons
- UI upgrade: KPICard now shows trend % with green/red/gray indicators
- UI upgrade: Added TopBar component with breadcrumbs, page title, and action slot
- UI upgrade: Improved empty states with illustrations and CTAs
- UI upgrade: Improved error states with retry buttons
- UI upgrade: Sidebar polish — active state, hover effects
- Applied dashboard-ui skill checklist across all pages

**⭐ Pick Up Next Session**
- Add Supabase anon key → test live DB connection
- Verify/create Supabase tables with correct schema

---

### Session 3 — 2026-06-18/19
**Developer:** Pri
**Tool:** ✅ Claude Code CLI

**✅ Completed**
- **Library page** — 3 tabbed sections (Videos, Images, Blog Posts) with full filtering, realtime, Post modal
- **Library Post modal** — platform toggles (Instagram/Facebook/X), caption + hashtags pre-fill, fires `/api/social/post`
- **Video card** — thumbnail click opens full-screen Dialog player (sm:max-w-4xl) instead of inline play
- **Dashboard** — replaced "Recent Content Jobs" grid with 3 mini sections (Videos, Images, Blog Posts) each with quick-view modals
- **Image/Blog types** — added `ImageLibraryItem` and `BlogLibraryItem` types, `getImageLibrary()` / `getBlogLibrary()` service functions
- **`POST /api/social/post`** — saves to `social_posts` + fires `N8N_SOCIAL_WEBHOOK` fire-and-forget
- **Job detail page — full redesign** (`/dashboard/jobs/[job_id]/page.tsx`):
  - Loads ALL drafts (video, image_post, blog) from `content_drafts` at once
  - Tabs for each selected content type with live status indicators (spinner / amber dot / green check)
  - **VideoTabContent** — editable script parts (unchanged)
  - **ImageTabContent** — shows caption, image_prompt, hashtags from draft_data (flexible rendering)
  - **BlogTabContent** — shows title, sections, intro, conclusion, tags from draft_data (flexible rendering)
  - **RegenerateDialog** — extra instructions textarea → calls `POST /api/jobs/[jobId]/regenerate` → retriggers n8n with extra_instructions
  - **Sticky action bar** — per active tab: [Regenerate] + [Approve & Generate Video / Approve Image / Approve Blog Post]
  - Realtime watches both INSERT and UPDATE on content_drafts (not just video)
  - Per-type approval state tracked in `approvedTypes: Set<ContentType>`
  - Approved bar shown after approval (green banner) for image/blog
  - Video approve → existing flow (save script + fire video_approve webhook + job → generating)
  - Image/Blog approve → fire image_approve/blog_approve webhook + mark draft is_approved=true in DB
- **`POST /api/jobs/[jobId]/regenerate`** — new route: resets draft status to pending + retriggers n8n with extra_instructions
- **`POST /api/n8n/trigger`** — extended with `image_approve` and `blog_approve` types (env: `N8N_IMAGE_APPROVE_WEBHOOK`, `N8N_BLOG_APPROVE_WEBHOOK`)

**📁 Files Changed**
- `src/app/dashboard/jobs/[job_id]/page.tsx` (full rewrite)
- `src/app/api/jobs/[jobId]/regenerate/route.ts` (new)
- `src/app/api/n8n/trigger/route.ts` (extended)
- `src/app/api/social/post/route.ts` (new)
- `src/app/dashboard/library/page.tsx` (full rewrite — 3 sections)
- `src/app/dashboard/page.tsx` (rewrite — 3 mini content sections)
- `src/services/contentService.ts` (added getImageLibrary, getBlogLibrary)
- `src/types/content.ts` (added ImageLibraryItem, BlogLibraryItem)

**⭐ Pick Up Next Session**
- Add `N8N_IMAGE_APPROVE_WEBHOOK` and `N8N_BLOG_APPROVE_WEBHOOK` to `.env.local`
- Configure n8n webhooks for image_approve and blog_approve flows
- End-to-end test: create job → wait for drafts → regenerate with instructions → approve each type

---

### Session 4 — 2026-07-17
**Developer:** Pri
**Tool:** ✅ Claude Code CLI

**✅ Completed**
- **Dashboard login** — fixed ID/password gate for the whole app (was previously "no auth, internal tool")
- `src/lib/auth.ts` — HMAC-SHA256 signed session tokens (Web Crypto, edge/node compatible), no external deps
- `POST /api/auth/login` — checks `DASHBOARD_LOGIN_ID` / `DASHBOARD_LOGIN_PASSWORD`, sets httpOnly `fc_session` cookie (7-day expiry)
- `POST /api/auth/logout` — clears the session cookie
- `src/proxy.ts` (Next.js 16's replacement for `middleware.ts`) — gates every route except `/api/auth/*` and the inbound `/api/webhooks/*` (n8n needs unauthenticated access), redirects unauthenticated visitors to `/login?next=...`, redirects already-authenticated visitors away from `/login`
- `/login` page — simple ID/password form using existing ShadCN Button/Input
- Logout button added to `Sidebar` footer
- Added env vars: `DASHBOARD_LOGIN_ID`, `DASHBOARD_LOGIN_PASSWORD`, `AUTH_SECRET` (to `.env.local` + `.env.example`)
- Verified end-to-end with curl: unauth redirect, wrong creds → 401, correct creds → cookie set, cookie grants dashboard access, authenticated visit to `/login` bounces to `/dashboard`, logout clears session, n8n callback route still reachable without auth
- `npm run build` passes clean (no middleware deprecation warning after switching to `proxy.ts`)

**📁 Files Changed**
- `src/lib/auth.ts` (new)
- `src/app/api/auth/login/route.ts` (new)
- `src/app/api/auth/logout/route.ts` (new)
- `src/proxy.ts` (new)
- `src/app/login/page.tsx` (new)
- `src/components/layout/Sidebar.tsx` (added logout button)
- `.env.local`, `.env.example` (added auth env vars)

**💡 Decisions Made**
- Fixed credentials come from env vars, not a database table — matches "internal tool, single fixed ID/password" ask rather than building out a users table
- Session cookie is a self-signed HMAC token (expiry + signature), not a random opaque ID — no session store needed, verification works in both Edge and Node runtimes

**⭐ Pick Up Next Session**
- Update `CLAUDE.md` / `API_DOCS.md` "Auth Method" if a real user-based auth system replaces this later
- Consider rate-limiting `/api/auth/login` if this is ever exposed beyond trusted internal users

---

### Session 5 — 2026-09-06
**Developer:** Pri
**Tool:** ✅ Claude Code CLI

**✅ Completed**
- Merged all 6 n8n workflows (`Antigravity — Video Draft Generator`, `Antigravity — Video Generator (After Approval)`, `Video Generator — Both`, `fresh-can Blog-post`, `Fresh-CAN_Image_Post_v7_direct_to_kie`, `FC — Social Post`) into one combined workflow: `/home/nishtha/Downloads/n8n-fc/Fresh-CAN — Combined Content Pipeline.json`
  - Single shared webhook entry (`freshcan-content`) with a `Verify Secret` gate + `Switch` node routing internally on the `type` field, replacing 8 separate webhook URLs
  - Collapsed `video_approve` + `video_approve_both` into one language-aware branch (`IF — Run Secondary Language?` gate), based on the more complete "Both" workflow (keeps its character-reference-image step); removes the near-duplicate render pipeline
  - Standardized all branches on reporting results back via `POST /api/webhooks/n8n-callback` instead of writing directly to Supabase with a hardcoded JWT (video draft/approve, image_post now report via callback; social already did)
  - Fixed latent bugs found during research: blog now honors the `language` field in its AI prompt (was always English); image_post's kie.ai polling loop now has a 10-retry cap + placeholder fallback (was unbounded); secret verification now happens once at the shared entry gate (blog/image previously never checked it)
  - Script that performed the merge (BFS-based active-subgraph extraction, collision-safe node renaming, connection rewiring) is not checked in — one-off, lives in the session's scratchpad
- Rewired the app to call the single combined webhook instead of 8 separate ones:
  - `src/app/api/n8n/trigger/route.ts` — collapsed `WEBHOOK_URLS` map to one `N8N_WEBHOOK_URL`; dropped dead `image_approve`/`blog_approve` types; removed the bespoke synchronous blog-response-parsing block (blog is now fire-and-forget like the others, reporting via callback)
  - `src/app/dashboard/jobs/[job_id]/page.tsx` — `handleVideoApprove`'s BOTH-language branch now sends `type: 'video_approve'` (was `'video_approve_both'`)
  - `src/services/contentService.ts` — `upsertDraftFromCallback` now accepts/uses `language`, upserting on `job_id,content_type,language` (was `job_id,content_type` with no language column set — could let BOTH-language video drafts silently overwrite each other)
  - `src/app/api/jobs/[jobId]/regenerate/route.ts`, `src/app/api/social/post/route.ts` — point at `N8N_WEBHOOK_URL`, now send a `type` field for the workflow's Switch to route on
  - Deleted `src/services/webhookService.ts` (dead code — unused function, referenced a `NEXT_PUBLIC_N8N_VIDEO_APPROVE_WEBHOOK` var that didn't exist)
  - `src/types/content.ts` — added the missing `language` field to `ContentDraft`/`GeneratedContent` (code already read/filtered on it everywhere; the types just hadn't caught up)
  - `.env.local` — replaced 8 `N8N_*_WEBHOOK` vars with one `N8N_WEBHOOK_URL`
- `npx tsc --noEmit` passes clean

**🐛 Bugs Found**
- `content_drafts` was being upserted with two different, inconsistent conflict targets across the codebase — fixed as part of this work (see above)
- Blog workflow never read `language`, always generated English — fixed in the merged workflow
- Image-post's kie.ai polling loop had no retry cap or failure handling — fixed in the merged workflow

**💡 Decisions Made**
- Standardized on callback-based reporting (n8n → `/api/webhooks/n8n-callback`) for every content type, rather than n8n writing directly to Supabase — removes hardcoded JWTs from the workflow file and centralizes DB writes in `contentService.ts`
- Collapsed the two video-approval workflows into one language-aware branch rather than keeping them separate — real duplicate logic, not just a URL-consolidation exercise

**⭐ Pick Up Next Session**
- Import `Fresh-CAN — Combined Content Pipeline.json` into n8n, review the wiring visually (the hand-authored `Switch` node in particular — no source workflow used one, so there was no example to crib from), and activate it
- Update `N8N_WEBHOOK_URL` in `.env.local` / Vercel once the combined workflow's webhook path is confirmed live
- Test sequence once imported: EN video job, FR video job, BOTH video job, blog in each language, image_post (confirm retry-cap doesn't fire early), social post
- Confirm `content_drafts` / `generated_content` actually have a `language` column with the constraint the new code assumes (code has used it in several places already, but worth a direct check)
