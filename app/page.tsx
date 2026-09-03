import Chat from '@/components/chat/Chat'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <div className="w-full max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-sovalune-400">Sovalune</h1>
          <p className="text-gray-400 mt-2">AI Agent with Long-term Memory</p>
        </header>
        <Chat />
      </div>
    </main>
  )
}
