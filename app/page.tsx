'use client'

import Chat from '@/components/chat/Chat'

export default function HomePage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-sovalune-400">Chat</h1>
        <Chat />
      </div>
    </div>
  )
}
