import { NextRequest, NextResponse } from 'next/server'

const INTERNAL = `http://localhost:${process.env.PORT || '3000'}`

// Forward the original host/proto so the internal server can build absolute
// URLs (cover) when BASE_URL is not set.
function forwardedHeaders(req: NextRequest): Record<string, string> {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') ?? 'http'
  return {
    ...(host ? { 'x-forwarded-host': host } : {}),
    'x-forwarded-proto': proto,
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(`${INTERNAL}/api/internal/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...forwardedHeaders(req) },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
