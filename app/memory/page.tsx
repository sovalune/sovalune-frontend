'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface MemoryEntry {
  id: string
  project_id: string
  tier: string
  content: string
  confidence_score: number
  decay_score: number
  archived: boolean
  created_at: string
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ tier: '', projectId: '' })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMemories()
  }, [filter])

  const fetchMemories = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.projectId) params.set('project_id', filter.projectId)
      if (filter.tier) params.set('tier', filter.tier)
      
      const res = await fetch(`/api/v1/memory?${params}`)
      const data = await res.json()
      setMemories(data.data || [])
    } catch (error) {
      console.error('Failed to fetch memories:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchMemories = async () => {
    if (!searchQuery.trim() || !filter.projectId) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        project_id: filter.projectId,
        query: searchQuery,
      })
      
      const res = await fetch(`/api/v1/memory/search?${params}`)
      const data = await res.json()
      setMemories(data.data || [])
    } catch (error) {
      console.error('Failed to search memories:', error)
    } finally {
      setLoading(false)
    }
  }

  const tierColors: Record<string, string> = {
    raw: 'bg-yellow-900/30 text-yellow-400',
    consolidated: 'bg-blue-900/30 text-blue-400',
    verified: 'bg-green-900/30 text-green-400',
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-sovalune-400">Memory</h1>
        
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={filter.projectId}
            onChange={e => setFilter(prev => ({ ...prev, projectId: e.target.value }))}
            placeholder="Project ID"
            className="bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sovalune-500"
          />
          <select
            value={filter.tier}
            onChange={e => setFilter(prev => ({ ...prev, tier: e.target.value }))}
            className="bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sovalune-500"
          >
            <option value="">All Tiers</option>
            <option value="raw">Raw</option>
            <option value="consolidated">Consolidated</option>
            <option value="verified">Verified</option>
          </select>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search query"
              className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sovalune-500"
            />
            <button
              onClick={searchMemories}
              disabled={!filter.projectId || !searchQuery.trim()}
              className="bg-sovalune-600 hover:bg-sovalune-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : memories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🧠</div>
            <div className="text-lg">No memories found</div>
            <div className="text-sm mt-2">Start a chat to create memories</div>
          </div>
        ) : (
          <div className="space-y-4">
            {memories.map(memory => (
              <Link
                key={memory.id}
                href={`/memory/${memory.id}`}
                className="block bg-gray-900/50 border border-gray-800 rounded-lg p-4 hover:border-sovalune-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs ${tierColors[memory.tier]}`}>
                        {memory.tier}
                      </span>
                      {memory.archived && (
                        <span className="px-2 py-1 rounded text-xs bg-red-900/30 text-red-400">
                          Archived
                        </span>
                      )}
                    </div>
                    <div className="text-gray-300 line-clamp-2">{memory.content}</div>
                  </div>
                  <div className="ml-4 text-right text-sm text-gray-500">
                    <div>Confidence: {(memory.confidence_score * 100).toFixed(0)}%</div>
                    <div>Decay: {(memory.decay_score * 100).toFixed(0)}%</div>
                    <div className="mt-1">{new Date(memory.created_at).toLocaleDateString()}</div>
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
