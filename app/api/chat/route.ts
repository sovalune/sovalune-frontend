import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { message } = await request.json()

  // TODO: Connect to Sovalune Core WebSocket/HTTP
  // For now, return placeholder response
  const response = `Echo: ${message}`

  return NextResponse.json({ response })
}
