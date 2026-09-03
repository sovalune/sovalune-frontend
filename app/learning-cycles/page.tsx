'use client'

import { useState, useEffect } from 'react'

interface LearningCycle {
  id: string
  project_id: string
  status: string
  origin_task_id: string
  failure_reason: string | null
  retry_count: number
  confidence_score: number | null
  created_at: string
  updated_at: string
}

const statusSteps = ['detected', 'researching', 'verifying', 'practicing', 'testing', 'applying', 'completed']

export default function LearningCyclesPage() {
  const [cycles, setCycles] = useState<LearningCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '' })

  useEffect(() => {
    fetchCycles()
  }, [filter])

  const fetchCycles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.status) params.set('status', filter.status)
      
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
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-sovalune-400">Learning Cycles</h1>
        
        <div className="flex gap-4 mb-6">
          <select
            value={filter.status}
            onChange={e => setFilter({ ...filter, status: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
          >
            <option value="">All Statuses</option>
            {statusSteps.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
            <option value="failed">failed</option>
          </select>
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : cycles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No learning cycles found</div>
        ) : (
          <div className="space-y-4">
            {cycles.map(cycle => (
              <div
                key={cycle.id}
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(cycle.status)}`}>
                      {cycle.status}
                    </span>
                    <span className="text-gray-500 text-sm">
                      Retry: {cycle.retry_count}/3
                    </span>
                  </div>
                  {cycle.confidence_score && (
                    <span className="text-gray-500 text-sm">
                      Confidence: {(cycle.confidence_score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1 mb-4">
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
                
                {cycle.failure_reason && (
                  <div className="text-red-400 text-sm mb-2">
                    Failure: {cycle.failure_reason}
                  </div>
                )}
                
                <div className="text-xs text-gray-600">
                  Created: {new Date(cycle.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
