import { NextRequest, NextResponse } from 'next/server'

const CORE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const queryString = searchParams.toString()
  
  const res = await fetch(`${CORE_URL}/api/v1/memory?${queryString}`)
  const data = await res.json()
  
  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  
  const res = await fetch(`${CORE_URL}/api/v1/memory/${params.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  
  const data = await res.json()
  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const res = await fetch(`${CORE_URL}/api/v1/memory/${params.id}`, {
    method: 'DELETE',
  })
  
  const data = await res.json()
  return NextResponse.json(data)
}
