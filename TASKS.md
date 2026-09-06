# TASKS.md — Feature Backlog

---

## 🎯 CURRENT SPRINT

- [ ] Add Supabase anon key to `.env.local` and verify DB connection
- [ ] Verify all 5 Supabase tables exist with correct columns
- [ ] End-to-end test: submit form → n8n webhook fires → callback received → draft appears
- [ ] Test social posting flow with real platform credentials
- [ ] Deploy to Vercel (or chosen host)
- [ ] Import `Fresh-CAN — Combined Content Pipeline.json` into n8n, review wiring (especially the new `Switch` node), and activate it
- [ ] Confirm `N8N_WEBHOOK_URL` in `.env.local`/Vercel matches the combined workflow's actual activated webhook path
- [ ] Confirm `content_drafts`/`generated_content` have a `language` column with a `job_id,content_type,language` unique constraint (code now assumes this everywhere)
- [ ] End-to-end test the combined workflow: EN video, FR video, BOTH video, blog (each language), image_post, social post

---

## 📋 BACKLOG

### 🏗️ Setup
- [x] Initialize Next.js 16 App Router project
- [x] Configure TypeScript, ESLint, Tailwind v4
- [x] Install ShadCN UI + required components
- [x] Set up Supabase client with realtime config
- [x] Create `.env.local` with all required keys
- [ ] Add Supabase anon key (BLOCKED: waiting from user)
- [ ] Create Supabase tables (run SQL migration)

### 🎨 Frontend — Pages
- [x] /dashboard — KPI cards + recent jobs grid
- [x] /dashboard/new — Input form with all fields
- [x] /dashboard/jobs/[job_id] — Draft editor with tabs + realtime
- [x] /dashboard/jobs/[job_id]/social — Social caption + platform approval
- [x] /dashboard/library — Videos / Images / Blogs grid
- [ ] /dashboard/jobs/[job_id] — Show generated content preview when ready
- [ ] Toast notifications for save/approve/post actions

### 🎨 Frontend — Components
- [x] StatusBadge (all statuses + colors)
- [x] KPICard (with trend %)
- [x] ContentCard (job summary)
- [x] DraftEditor (per content type: blog, image, video)
- [x] SocialApprovalCard (caption + hashtags + platforms)
- [x] PlatformSelector
- [x] TopBar (breadcrumbs + page title)
- [x] Loading skeletons for all pages
- [ ] Toast notification component
- [ ] Confirm dialog before approve/post actions

### ⚙️ Backend / API
- [x] POST /api/webhooks/n8n-callback (draft_ready, generation_complete, post_complete)
- [ ] GET /api/jobs — list jobs with pagination (optional, currently uses Supabase direct)
- [ ] POST /api/jobs/[id]/retry — retry failed jobs

### 🗄️ Database
- [x] TypeScript types match Supabase schema
- [x] All CRUD service functions written
- [ ] Confirm tables created in Supabase project jbrktjnscnzmhwupojiu
- [ ] Add DB indexes for performance (job_id, status, created_at)
- [ ] Seed dev data for testing

### 🔗 Integrations
- [x] n8n webhooks fire on form submit
- [x] n8n callback API receives events and updates DB
- [x] Supabase Realtime subscribed on job detail page
- [x] Consolidated 6 n8n workflows into one combined workflow, all content types report via `/api/webhooks/n8n-callback` (Session 5, 2026-09-06)
- [ ] Import combined workflow into n8n, verify webhook URL is live and responding
- [ ] Test social platform posting via n8n

### 🧪 Testing
- [ ] Manual QA pass on full flow
- [ ] Test all error states (n8n unreachable, DB error)
- [ ] Test realtime updates in job detail page
- [ ] Cross-browser check (Chrome, Safari, Firefox)
- [ ] Mobile responsive check

### 🚀 Deployment
- [ ] Set up Vercel project
- [ ] Add all env vars to Vercel
- [ ] Deploy to staging
- [ ] QA on staging
- [ ] Deploy to production

---

## ✅ COMPLETED
- [x] Project scaffolded (Session 1, 2026-06-15)
- [x] All 5 pages built (Session 1, 2026-06-15)
- [x] n8n callback API route (Session 1, 2026-06-15)
- [x] All reusable components (Session 1, 2026-06-15)
- [x] Project docs filled in (Session 2, 2026-06-15)
- [x] UI upgrade with skeletons, TopBar, improved empty/error states (Session 2, 2026-06-15)

---

## 🔴 BLOCKED

| Task | Blocked By | Who Resolves |
|------|-----------|--------------|
| DB connection | Need Supabase anon key | Pri |
| Social posting test | Need platform API credentials in n8n | Pri |

---

## 💡 IDEAS / FUTURE FEATURES

- Analytics page: posts per week chart, engagement rates
- AI caption regeneration button (single-click re-run)
- Bulk approve all drafts for a job
- Email notification when generation is complete
- Dark mode
- Role-based access (editor vs. approver vs. admin)
