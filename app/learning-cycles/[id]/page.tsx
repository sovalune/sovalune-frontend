'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

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

interface Evidence {
  id: string
  cycle_id: string
  source_type: string
  source_url: string | null
  excerpt: string
  trust_tier: number
  created_at: string
}

interface TestResult {
  id: string
  cycle_id: string
  stage: string
  passed: boolean
  detail: Record<string, unknown>
  created_at: string
}

const statusSteps = ['detected', 'researching', 'verifying', 'practicing', 'testing', 'applying', 'completed']

export default function LearningCycleDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [cycle, setCycle] = useState<LearningCycle | null>(null)
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [cycleRes, evidenceRes, testRes] = await Promise.all([
        fetch(`/api/v1/learning-cycles/${id}`),
        fetch(`/api/v1/learning-cycles/${id}/evidence`),
        fetch(`/api/v1/learning-cycles/${id}/test-results`),
      ])
      
      const cycleData = await cycleRes.json()
      const evidenceData = await evidenceRes.json()
      const testData = await testRes.json()
      
      setCycle(cycleData)
      setEvidence(evidenceData.data || [])
      setTestResults(testData.data || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!cycle) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">Learning cycle not found</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/learning-cycles" className="text-sovalune-400 hover:underline">
            ← Back to Learning Cycles
          </Link>
        </div>
        
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-sovalune-400">Learning Cycle</h1>
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(cycle.status)}`}>
            {cycle.status}
          </span>
        </div>
        
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Progress</h2>
          <div className="flex items-center gap-2">
            {statusSteps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${
                    index <= getStepIndex(cycle.status)
                      ? 'bg-sovalune-600 text-white'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                {index < statusSteps.length - 1 && (
                  <div
                    className={`w-12 h-1 ${
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
              <div key={step} className="w-10 text-center capitalize">{step.slice(0, 4)}</div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">ID</div>
                  <div className="text-white font-mono">{cycle.id.slice(0, 8)}...</div>
                </div>
                <div>
                  <div className="text-gray-500">Project</div>
                  <div className="text-white font-mono">{cycle.project_id.slice(0, 8)}...</div>
                </div>
                <div>
                  <div className="text-gray-500">Origin Task</div>
                  <div className="text-white font-mono">{cycle.origin_task_id.slice(0, 8)}...</div>
                </div>
                <div>
                  <div className="text-gray-500">Retry Count</div>
                  <div className="text-white">{cycle.retry_count}/3</div>
                </div>
                <div>
                  <div className="text-gray-500">Confidence</div>
                  <div className="text-white">
                    {cycle.confidence_score ? `${(cycle.confidence_score * 100).toFixed(0)}%` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Created</div>
                  <div className="text-white">{new Date(cycle.created_at).toLocaleString()}</div>
                </div>
              </div>
              
              {cycle.failure_reason && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded">
                  <div className="text-sm text-red-400">
                    <span className="font-medium">Failure Reason:</span> {cycle.failure_reason}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Evidence ({evidence.length})</h2>
              {evidence.length === 0 ? (
                <div className="text-gray-500 text-sm">No evidence collected yet</div>
              ) : (
                <div className="space-y-3">
                  {evidence.map(e => (
                    <div key={e.id} className="bg-gray-800/50 rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300">
                          {e.source_type}
                        </span>
                        <span className="text-xs text-gray-500">
                          Trust Tier: {e.trust_tier}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">{e.excerpt}</div>
                      {e.source_url && (
                        <div className="text-xs text-sovalune-400 mt-1 truncate">
                          {e.source_url}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Test Results ({testResults.length})</h2>
              {testResults.length === 0 ? (
                <div className="text-gray-500 text-sm">No test results yet</div>
              ) : (
                <div className="space-y-3">
                  {testResults.map(r => (
                    <div key={r.id} className="bg-gray-800/50 rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-3 h-3 rounded-full ${r.passed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span className="text-sm text-white capitalize">{r.stage}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(r.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
