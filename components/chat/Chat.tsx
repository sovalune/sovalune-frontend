'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  toolCall?: {
    tool: string
    arguments: Record<string, unknown>
  }
}

interface WebSocketMessage {
  type: string
  session_id?: string
  delta?: string
  message_id?: string
  tool?: string
  arguments?: Record<string, unknown>
  result_summary?: string
  code?: string
  message?: string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [projectId, setProjectId] = useState<string>('')
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const newSessionId = crypto.randomUUID()
    const newProjectId = crypto.randomUUID()
    setSessionId(newSessionId)
    setProjectId(newProjectId)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8091'
    const ws = new WebSocket(`${wsUrl}/ws/chat`)

    ws.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      ws.send(JSON.stringify({ 
        type: 'join_session', 
        session_id: sessionId,
        project_id: projectId 
      }))
    }

    ws.onmessage = (event) => {
      const data: WebSocketMessage = JSON.parse(event.data)
      
      switch (data.type) {
        case 'token':
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1]
            if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.toolCall) {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: lastMsg.content + (data.delta || '') }
              ]
            }
            return prev
          })
          break
          
        case 'tool_call_started':
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '',
            toolCall: {
              tool: data.tool || '',
              arguments: data.arguments || {}
            }
          }])
          break
          
        case 'tool_call_finished':
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1]
            if (lastMsg && lastMsg.toolCall) {
              return [
                ...prev.slice(0, -1),
                { ...lastMsg, content: `Tool ${data.tool} completed: ${data.result_summary}` }
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
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'system',
            content: `Error: ${data.message}`
          }])
          break
      }
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)
      setTimeout(connectWebSocket, 3000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    wsRef.current = ws
  }, [sessionId, projectId])

  useEffect(() => {
    connectWebSocket()
    return () => {
      wsRef.current?.close()
    }
  }, [connectWebSocket])

  const sendMessage = async () => {
    if (!input.trim() || !wsRef.current || isGenerating) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
    }

    setMessages(prev => [...prev, userMessage])
    
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
    }
    setMessages(prev => [...prev, assistantMessage])
    setIsGenerating(true)

    wsRef.current.send(JSON.stringify({
      type: 'user_message',
      session_id: sessionId,
      project_id: projectId,
      content: input,
    }))

    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-gray-900/50 rounded-lg border border-gray-800">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Session: {sessionId.slice(0, 8)}...
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-gray-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <div className="text-4xl mb-4">💬</div>
            <div className="text-lg">Start a conversation</div>
            <div className="text-sm mt-2">Ask me anything about your codebase</div>
          </div>
        )}
        
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-sovalune-600 text-white'
                  : msg.role === 'system'
                  ? 'bg-red-900/30 text-red-400 border border-red-800'
                  : 'bg-gray-800 text-gray-200'
              }`}
            >
              {msg.toolCall ? (
                <div className="text-sm">
                  <div className="font-medium text-sovalune-400 mb-1">
                    Using tool: {msg.toolCall.tool}
                  </div>
                  <pre className="text-xs text-gray-400 overflow-x-auto">
                    {JSON.stringify(msg.toolCall.arguments, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sovalune-500 resize-none"
            disabled={!isConnected || isGenerating}
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || isGenerating || !input.trim()}
            className="bg-sovalune-600 hover:bg-sovalune-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Generating...
              </span>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
