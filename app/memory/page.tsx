'use client'

import { useState, useEffect } from 'react'

interface MemoryEntry {
  id: string
  project_id: string
  tier: string
  content: string
  metadata: Record<string, unknown>
  confidence_score: number
  decay_score: number
  archived: boolean
  created_at: string
  updated_at: string
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ tier: '', q: '' })

  useEffect(() => {
    fetchMemories()
  }, [filter])

  const fetchMemories = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.tier) params.set('tier', filter.tier)
      if (filter.q) params.set('q', filter.q)
      
      const res = await fetch(`/api/v1/memory?${params}`)
      const data = await res.json()
      setMemories(data.data || [])
    } catch (error) {
      console.error('Failed to fetch memories:', error)
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
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-sovalune-400">Memory Dashboard</h1>
        
        <div className="flex gap-4 mb-6">
          <select
            value={filter.tier}
            onChange={e => setFilter({ ...filter, tier: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
          >
            <option value="">All Tiers</option>
            <option value="raw">Raw</option>
            <option value="consolidated">Consolidated</option>
            <option value="verified">Verified</option>
          </select>
          
          <input
            type="text"
            value={filter.q}
            onChange={e => setFilter({ ...filter, q: e.target.value })}
            placeholder="Search memories..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
          />
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : memories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No memories found</div>
        ) : (
          <div className="space-y-4">
            {memories.map(memory => (
              <div
                key={memory.id}
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 rounded text-xs ${tierColors[memory.tier] || ''}`}>
                    {memory.tier}
                  </span>
                  <span className="text-gray-500 text-sm">
                    Confidence: {(memory.confidence_score * 100).toFixed(0)}%
                  </span>
                  <span className="text-gray-500 text-sm">
                    Decay: {(memory.decay_score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-gray-300">{memory.content}</p>
                <div className="mt-2 text-xs text-gray-600">
                  {new Date(memory.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
