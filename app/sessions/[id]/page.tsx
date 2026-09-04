'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Message {
  id: string
  session_id: string
  role: string
  content: string
  tool_call: Record<string, unknown> | null
  request_id: string
  created_at: string
}

export default function SessionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/v1/sessions/${id}/messages`)
        const data = await res.json()
        setMessages(data.data || [])
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchMessages()
  }, [id])

  const roleColors: Record<string, string> = {
    user: 'bg-sovalune-600',
    assistant: 'bg-gray-700',
    system: 'bg-yellow-900/30 text-yellow-400',
    tool: 'bg-blue-900/30 text-blue-400',
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-sovalune-400">
          Session: {id.slice(0, 8)}...
        </h1>
        
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">💬</div>
            <div className="text-lg">No messages yet</div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`rounded-lg p-4 ${roleColors[msg.role] || 'bg-gray-800'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-white capitalize">{msg.role}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </span>
                </div>
                
                {msg.tool_call ? (
                  <div className="text-sm">
                    <div className="font-medium text-sovalune-400 mb-1">Tool Call</div>
                    <pre className="text-xs text-gray-400 overflow-x-auto bg-gray-900/50 rounded p-2">
                      {JSON.stringify(msg.tool_call, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-gray-200">{msg.content}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
