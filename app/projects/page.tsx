'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  settings: Record<string, unknown>
  created_at: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/projects')
      const data = await res.json()
      setProjects(data.data || [])
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async () => {
    if (!newName.trim()) return
    
    try {
      await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      })
      setNewName('')
      setShowCreate(false)
      fetchProjects()
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-sovalune-400">Projects</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-sovalune-600 hover:bg-sovalune-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            New Project
          </button>
        </div>
        
        {showCreate && (
          <div className="mb-6 bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Project name"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-sovalune-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={createProject}
                className="bg-sovalune-600 hover:bg-sovalune-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📁</div>
            <div className="text-lg">No projects yet</div>
            <div className="text-sm mt-2">Create your first project to get started</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-sovalune-500 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{project.name}</h3>
                <div className="text-sm text-gray-500">
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
