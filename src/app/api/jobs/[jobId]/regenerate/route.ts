import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const REGEN_CONTENT_TYPES = new Set(['video', 'image_post', 'blog'])

interface VideoDraftData {
  script_type?: string
  script_config?: { total_duration?: number }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { content_type, extra_instructions, language: requestedLanguage } = body as {
    content_type: string
    extra_instructions?: string
    language?: string
  }

  if (!content_type) {
    return NextResponse.json({ error: 'content_type required' }, { status: 400 })
  }

  const { data: job, error: jobErr } = await supabase
    .from('content_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (jobErr || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // The language actually being regenerated: whatever the caller says it's
  // looking at, falling back to the job's overall language for callers that
  // don't send one. For a BOTH job this must be a single language (EN/FR) —
  // never blindly reuse job.language ('BOTH') here, or every regenerate would
  // reset and re-trigger both languages instead of just the one being edited.
  const language = requestedLanguage || (job.language === 'BOTH' ? 'EN' : job.language)

  // Load current draft to recover video settings — scoped to this language,
  // since a BOTH job has a separate row per language and an unscoped query
  // here would error (more than one row) instead of picking the right one.
  const { data: currentDraft } = await supabase
    .from('content_drafts')
    .select('draft_data')
    .eq('job_id', jobId)
    .eq('content_type', content_type)
    .eq('language', language)
    .maybeSingle()

  // Reset draft to pending so UI shows "waiting" state — only the language
  // being regenerated, not every language's row for this content type.
  await supabase
    .from('content_drafts')
    .update({ status: 'pending', is_approved: false, updated_at: new Date().toISOString() })
    .eq('job_id', jobId)
    .eq('content_type', content_type)
    .eq('language', language)

  // For image_post: reset generated_content so the old row isn't picked up by the poll
  if (content_type === 'image_post') {
    await supabase
      .from('generated_content')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('job_id', jobId)
      .eq('content_type', 'image_post')
      .eq('language', language)
  }

  // Reset job status to pending
  await supabase
    .from('content_jobs')
    .update({ status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', jobId)

  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (webhookUrl && REGEN_CONTENT_TYPES.has(content_type)) {
    const videoData = (currentDraft?.draft_data as VideoDraftData | undefined)
    const payload: Record<string, unknown> = {
      type:               content_type,
      job_id:             jobId,
      topic:              job.topic,
      keywords:           job.keywords ?? '',
      category:           job.category,
      target_audience:    job.target_audience,
      language,
      brand:              'Fresh-CAN',
      content_type,
      extra_instructions: extra_instructions || null,
      regenerate:         true,
    }

    if (content_type === 'video') {
      payload.script_type    = videoData?.script_type ?? 'SOLUTION'
      payload.video_duration = String(videoData?.script_config?.total_duration ?? '36')
    }

    const secret = process.env.N8N_WEBHOOK_SECRET ?? ''
    fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'x-n8n-secret': secret },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(8000),
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
