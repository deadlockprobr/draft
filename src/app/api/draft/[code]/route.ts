import { NextRequest, NextResponse } from 'next/server'

const INTERNAL = `http://localhost:${process.env.PORT || '3000'}`

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
  const res = await fetch(`${INTERNAL}/api/internal/draft/by-code/${code}`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
