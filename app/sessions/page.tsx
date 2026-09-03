'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Session {
  id: string
  project_id: string
  created_at: string
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [projectId, setProjectId] = useState('')

  useEffect(() => {
    fetchSessions()
  }, [projectId])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (projectId) params.set('project_id', projectId)
      
      const res = await fetch(`/api/v1/sessions?${params}`)
      const data = await res.json()
      setSessions(data.data || [])
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-sovalune-400">Sessions</h1>
        
        <div className="mb-6">
          <input
            type="text"
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            placeholder="Filter by Project ID"
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sovalune-500"
          />
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <div className="text-lg">No sessions found</div>
            <div className="text-sm mt-2">Start a chat to create a session</div>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="block bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:border-sovalune-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{session.id.slice(0, 8)}...</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Project: {session.project_id.slice(0, 8)}...
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(session.created_at).toLocaleString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
