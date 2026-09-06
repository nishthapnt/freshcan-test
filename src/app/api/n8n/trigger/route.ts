import { NextRequest, NextResponse } from 'next/server'

type WebhookType =
  | 'image_post'
  | 'image_questions'
  | 'video'
  | 'blog'
  | 'social'
  | 'video_approve'

// All content types route through one combined n8n workflow, which branches
// internally on `type` — see the merged workflow at
// /home/nishtha/Downloads/n8n-fc/Fresh-CAN — Combined Content Pipeline.json
const COMBINED_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL

export async function POST(req: NextRequest) {
  let body: { type: WebhookType; payload: Record<string, unknown> }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, payload } = body

  if (!type || !payload) {
    return NextResponse.json({ error: 'Missing type or payload' }, { status: 400 })
  }

  if (!COMBINED_WEBHOOK_URL) {
    return NextResponse.json({ error: 'N8N_WEBHOOK_URL is not configured' }, { status: 500 })
  }

  const reqHeaders = {
    'Content-Type': 'application/json',
    'x-n8n-secret': process.env.N8N_WEBHOOK_SECRET ?? '',
  }
  const bodyStr = JSON.stringify({ ...payload, type })

  // Fire-and-forget generation types: results come back via /api/webhooks/n8n-callback.
  const GENERATION_TYPES: WebhookType[] = ['video', 'blog', 'image_post', 'social', 'video_approve']

  try {
    // No timeout for generation types — wait until n8n responds however long it takes.
    // image_questions also gets no artificial timeout override beyond the default,
    // since it's a quick text-only call, but it is NOT in GENERATION_TYPES because
    // (unlike image_post/video/blog) the frontend needs to read its response body
    // right away instead of treating it as fire-and-forget.
    const n8nRes = await fetch(COMBINED_WEBHOOK_URL, {
      method: 'POST',
      headers: reqHeaders,
      body: bodyStr,
      ...(GENERATION_TYPES.includes(type) ? {} : { signal: AbortSignal.timeout(15000) }),
    })

    // image_questions: unlike the other types, this one is NOT fire-and-forget
    // — n8n responds immediately with the actual question list, which the
    // frontend needs right away to render the Q&A step.
    if (type === 'image_questions') {
      if (!n8nRes.ok) {
        const text = await n8nRes.text().catch(() => '')
        return NextResponse.json({ error: `n8n returned ${n8nRes.status}: ${text}` }, { status: 502 })
      }
      const data = await n8nRes.json().catch(() => null)
      if (!data) {
        return NextResponse.json({ error: 'Invalid response from n8n' }, { status: 502 })
      }
      return NextResponse.json(data)
    }

    // All generation webhooks (video, blog, image_post, social, video_approve)
    // report their result asynchronously via /api/webhooks/n8n-callback —
    // ignore n8n's HTTP status here.
    if (GENERATION_TYPES.includes(type)) {
      if (!n8nRes.ok) {
        const text = await n8nRes.text().catch(() => '')
        console.log(`[n8n-trigger] ${type} returned ${n8nRes.status} (workflow may still complete): ${text}`)
      }
      return NextResponse.json({ success: true })
    }

    if (!n8nRes.ok) {
      const text = await n8nRes.text().catch(() => '')
      console.error(`[n8n-trigger] ${type} returned ${n8nRes.status}: ${text}`)
      return NextResponse.json({ error: `n8n returned ${n8nRes.status}` }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[n8n-trigger] ${type}:`, message)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
