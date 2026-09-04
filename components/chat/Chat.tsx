'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'

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

function getWsUrl(): string {
  if (typeof window === 'undefined') return ''
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.hostname
  const port = process.env.NEXT_PUBLIC_WS_PORT || '8091'
  return `${protocol}//${host}:${port}`
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [projectId, setProjectId] = useState<string>('')
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const initSession = useCallback(async () => {
    try {
      const projectRes = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Chat Session' }),
      })
      
      if (!projectRes.ok) {
        throw new Error('Failed to create project')
      }
      
      const projectData = await projectRes.json()
      const pId = projectData.id
      setProjectId(pId)

      const sessionRes = await fetch('/api/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: pId }),
      })
      
      if (!sessionRes.ok) {
        throw new Error('Failed to create session')
      }
      
      const sessionData = await sessionRes.json()
      setSessionId(sessionData.id)
      setIsInitializing(false)
      setError(null)
    } catch (err) {
      console.error('Failed to init session:', err)
      setError('Failed to connect to backend. Make sure the server is running.')
      setIsInitializing(false)
    }
  }, [])

  useEffect(() => {
    initSession()
  }, [initSession])

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    if (!sessionId || !projectId) return
    
    const wsUrl = getWsUrl()
    const ws = new WebSocket(`${wsUrl}/ws/chat`)

    ws.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      setError(null)
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
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    wsRef.current = ws
  }, [sessionId, projectId])

  useEffect(() => {
    if (sessionId && projectId) {
      connectWebSocket()
    }
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      wsRef.current?.close()
    }
  }, [connectWebSocket, sessionId, projectId])

  const sendMessage = async () => {
    if (!input.trim() || !wsRef.current || isGenerating || !sessionId || !projectId) return

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

  const startNewSession = async () => {
    wsRef.current?.close()
    setMessages([])
    setIsInitializing(true)
    await initSession()
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-900/50 rounded-lg border border-gray-800">
        <div className="text-gray-500">Initializing session...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-gray-900/50 rounded-lg border border-gray-800">
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={startNewSession}
          className="bg-sovalune-600 hover:bg-sovalune-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] bg-gray-900/50 rounded-lg border border-gray-800">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Session: {sessionId.slice(0, 8)}...
          </div>
          <button
            onClick={startNewSession}
            className="text-xs text-sovalune-400 hover:text-sovalune-300 transition-colors"
          >
            New Session
          </button>
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
              ) : msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '')
                        const isInline = !match
                        return isInline ? (
                          <code className={className} {...props}>{children}</code>
                        ) : (
                          <div className="relative">
                            <div className="absolute top-2 right-2 text-xs text-gray-500">
                              {match[1]}
                            </div>
                            <pre className={className}>
                              <code className={className} {...props}>{children}</code>
                            </pre>
                          </div>
                        )
                      }
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                  {isGenerating && msg === messages[messages.length - 1] && (
                    <span className="inline-block w-2 h-4 ml-1 bg-sovalune-500 animate-pulse" />
                  )}
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
