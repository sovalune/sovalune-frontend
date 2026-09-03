'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface WebSocketMessage {
  type: string
  session_id?: string
  delta?: string
  message_id?: string
  code?: string
  message?: string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const sessionIdRef = useRef<string>(crypto.randomUUID())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const connectWebSocket = useCallback(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws/chat'
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      const data: WebSocketMessage = JSON.parse(event.data)
      
      switch (data.type) {
        case 'token':
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1]
            if (lastMsg && lastMsg.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: lastMsg.content + (data.delta || '') }
              ]
            }
            return prev
          })
          break
          
        case 'message_complete':
          setIsGenerating(false)
          break
          
        case 'error':
          console.error('Server error:', data.message)
          setIsGenerating(false)
          break
      }
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    wsRef.current = ws
    
    return () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    const cleanup = connectWebSocket()
    return cleanup
  }, [connectWebSocket])

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || isGenerating) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
    }

    setMessages(prev => [...prev, userMessage])
    
    // Add empty assistant message
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
    }
    setMessages(prev => [...prev, assistantMessage])
    setIsGenerating(true)

    // Send via WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'user_message',
      session_id: sessionIdRef.current,
      content: input,
    }))

    setInput('')
  }

  return (
    <div className="flex flex-col h-[600px] bg-gray-900/50 rounded-lg border border-gray-800">
      <div className="p-2 border-b border-gray-800 text-xs text-gray-500">
        {isConnected ? 'Connected' : 'Disconnected'} | Session: {sessionIdRef.current.slice(0, 8)}...
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-sovalune-600 text-white'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              {msg.content || (isGenerating && msg.role === 'assistant' ? '...' : '')}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sovalune-500"
            disabled={!isConnected || isGenerating}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || isGenerating || !input.trim()}
            className="bg-sovalune-600 hover:bg-sovalune-700 disabled:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
