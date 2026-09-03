'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Chat', icon: '💬' },
  { href: '/memory', label: 'Memory', icon: '🧠' },
  { href: '/learning-cycles', label: 'Learning', icon: '📚' },
  { href: '/projects', label: 'Projects', icon: '📁' },
  { href: '/sessions', label: 'Sessions', icon: '📝' },
]

export default function Navigation() {
  const pathname = usePathname()
  
  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-gray-900/50 border-r border-gray-800 p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-sovalune-400">Sovalune</h1>
        <p className="text-xs text-gray-500 mt-1">AI Agent Platform</p>
      </div>
      
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-sovalune-600/20 text-sovalune-400'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-500">Status</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-300">Connected</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
