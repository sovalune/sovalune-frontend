import { NextRequest, NextResponse } from 'next/server'

const CORE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  const res = await fetch(`${CORE_URL}/api/v1/projects`)
  const data = await res.json()
  
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const res = await fetch(`${CORE_URL}/api/v1/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  
  const data = await res.json()
  return NextResponse.json(data)
}
