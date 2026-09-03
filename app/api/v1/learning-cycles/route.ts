import { NextRequest, NextResponse } from 'next/server'

const CORE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  
  const res = await fetch(`${CORE_URL}/api/v1/learning-cycles?${queryString}`)
  const data = await res.json()
  
  return NextResponse.json(data)
}
