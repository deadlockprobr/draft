import { NextRequest, NextResponse } from 'next/server'

const INTERNAL = `http://localhost:${process.env.PORT || '3000'}`

export async function POST(req: NextRequest) {
  const body = await req.json()
  const res = await fetch(`${INTERNAL}/api/internal/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
