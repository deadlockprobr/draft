import { NextRequest, NextResponse } from 'next/server'

const INTERNAL = `http://localhost:${process.env.PORT || '3000'}`

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
  // Forward original host/proto (used by the internal server to build the cover URL).
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const res = await fetch(`${INTERNAL}/api/internal/draft/by-code/${code}`, {
    headers: {
      ...(host ? { 'x-forwarded-host': host } : {}),
      'x-forwarded-proto': req.headers.get('x-forwarded-proto') ?? 'http',
    },
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
