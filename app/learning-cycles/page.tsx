'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface LearningCycle {
  id: string
  project_id: string
  status: string
  origin_task_id: string
  retry_count: number
  confidence_score: number | null
  created_at: string
}

const statusSteps = ['detected', 'researching', 'verifying', 'practicing', 'testing', 'applying', 'completed']

export default function LearningCyclesPage() {
  const [cycles, setCycles] = useState<LearningCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ projectId: '' })

  useEffect(() => {
    fetchCycles()
  }, [filter])

  const fetchCycles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.projectId) params.set('project_id', filter.projectId)
      
      const res = await fetch(`/api/v1/learning-cycles?${params}`)
      const data = await res.json()
      setCycles(data.data || [])
    } catch (error) {
      console.error('Failed to fetch learning cycles:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'detected': return 'bg-yellow-500'
      default: return 'bg-sovalune-500'
    }
  }

  const getStepIndex = (status: string) => {
    return statusSteps.indexOf(status)
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-sovalune-400">Learning Cycles</h1>
        
        <div className="mb-6">
          <input
            type="text"
            value={filter.projectId}
            onChange={e => setFilter(prev => ({ ...prev, projectId: e.target.value }))}
            placeholder="Filter by Project ID"
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sovalune-500"
          />
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : cycles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📚</div>
            <div className="text-lg">No learning cycles found</div>
            <div className="text-sm mt-2">Start a conversation to trigger learning</div>
          </div>
        ) : (
          <div className="space-y-4">
            {cycles.map(cycle => (
              <Link
                key={cycle.id}
                href={`/learning-cycles/${cycle.id}`}
                className="block bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-sovalune-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(cycle.status)}`}>
                        {cycle.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        Retry: {cycle.retry_count}/3
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {cycle.id.slice(0, 8)}...
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {cycle.confidence_score && (
                      <div>Confidence: {(cycle.confidence_score * 100).toFixed(0)}%</div>
                    )}
                    <div>{new Date(cycle.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {statusSteps.map((step, index) => (
                    <div key={step} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                          index <= getStepIndex(cycle.status)
                            ? 'bg-sovalune-600 text-white'
                            : 'bg-gray-800 text-gray-500'
                        }`}
                      >
                        {index + 1}
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`w-8 h-1 ${
                            index < getStepIndex(cycle.status)
                              ? 'bg-sovalune-600'
                              : 'bg-gray-800'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  {statusSteps.map(step => (
                    <div key={step} className="w-8 text-center capitalize">{step.slice(0, 4)}</div>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
