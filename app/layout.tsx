import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sovalune',
  description: 'AI Agent Platform with Long-term Memory',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
