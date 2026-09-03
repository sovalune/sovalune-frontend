'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface MemoryEntry {
  id: string
  project_id: string
  tier: string
  content: string
  metadata: Record<string, unknown>
  confidence_score: number
  decay_score: number
  archived: boolean
  source_entry_ids: string[] | null
  created_at: string
  updated_at: string
}

export default function MemoryDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [memory, setMemory] = useState<MemoryEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState('')

  useEffect(() => {
    fetchMemory()
  }, [id])

  const fetchMemory = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/memory/${id}`)
      const data = await res.json()
      setMemory(data)
      setContent(data.content || '')
    } catch (error) {
      console.error('Failed to fetch memory:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveMemory = async () => {
    try {
      await fetch(`/api/v1/memory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      setEditing(false)
      fetchMemory()
    } catch (error) {
      console.error('Failed to save memory:', error)
    }
  }

  const archiveMemory = async () => {
    try {
      await fetch(`/api/v1/memory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      })
      fetchMemory()
    } catch (error) {
      console.error('Failed to archive memory:', error)
    }
  }

  const tierColors: Record<string, string> = {
    raw: 'bg-yellow-900/30 text-yellow-400',
    consolidated: 'bg-blue-900/30 text-blue-400',
    verified: 'bg-green-900/30 text-green-400',
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!memory) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Memory not found</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/memory" className="text-sovalune-400 hover:underline">
            ← Back to Memory
          </Link>
        </div>
        
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-sovalune-400">Memory Entry</h1>
          <span className={`px-3 py-1 rounded-full text-sm ${tierColors[memory.tier] || ''}`}>
            {memory.tier}
          </span>
          {memory.archived && (
            <span className="px-3 py-1 rounded-full text-sm bg-red-900/30 text-red-400">
              Archived
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Content</h2>
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <button
                        onClick={saveMemory}
                        className="bg-sovalune-600 hover:bg-sovalune-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditing(false); setContent(memory.content); }}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditing(true)}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Edit
                      </button>
                      {!memory.archived && (
                        <button
                          onClick={archiveMemory}
                          className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1 rounded text-sm transition-colors"
                        >
                          Archive
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {editing ? (
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full h-64 bg-gray-800 text-white rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-sovalune-500"
                />
              ) : (
                <div className="whitespace-pre-wrap text-gray-300">{memory.content}</div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Confidence</span>
                  <span className="text-white">{(memory.confidence_score * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Decay</span>
                  <span className="text-white">{(memory.decay_score * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">ID</span>
                  <span className="text-white font-mono text-xs">{memory.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Project</span>
                  <span className="text-white font-mono text-xs">{memory.project_id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-white">{new Date(memory.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Updated</span>
                  <span className="text-white">{new Date(memory.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            {memory.source_entry_ids && memory.source_entry_ids.length > 0 && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Source Entries</h3>
                <div className="space-y-1">
                  {memory.source_entry_ids.map(sourceId => (
                    <Link
                      key={sourceId}
                      href={`/memory/${sourceId}`}
                      className="block text-sm text-sovalune-400 hover:underline font-mono"
                    >
                      {sourceId.slice(0, 8)}...
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Metadata</h3>
              <pre className="text-xs text-gray-400 overflow-x-auto">
                {JSON.stringify(memory.metadata, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
