import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import AuthProvider from '@/components/AuthProvider'
import AuthGuard from '@/components/AuthGuard'

export const metadata: Metadata = {
  title: 'MultiModal AI Platform',
  description: 'Avatar animation, text-to-video, and voice synthesis powered by AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AuthGuard>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  )
}
