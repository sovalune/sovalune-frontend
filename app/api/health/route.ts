import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8090'
    const res = await fetch(`${apiUrl}/health/live`, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    })
    
    if (res.ok) {
      return NextResponse.json({ status: 'ok', api: 'connected' })
    } else {
      return NextResponse.json({ status: 'degraded', api: 'error' }, { status: 503 })
    }
  } catch {
    return NextResponse.json({ status: 'degraded', api: 'unreachable' }, { status: 503 })
  }
}
