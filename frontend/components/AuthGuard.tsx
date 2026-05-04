'use client'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Activity } from 'lucide-react'

const PUBLIC_PATHS = ['/auth/signin', '/auth/error']

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  useEffect(() => {
    if (status === 'unauthenticated' && !isPublic) {
      router.replace('/auth/signin')
    }
  }, [status, isPublic, router])

  // Always allow public paths
  if (isPublic) return <>{children}</>

  // Show loading spinner while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070e]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
            <Activity size={18} className="text-white" />
          </div>
          <p className="text-white/30 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  // Block access — redirect is happening via useEffect
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07070e]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Activity size={18} className="text-white" />
          </div>
          <p className="text-white/30 text-sm">Redirecting to sign in…</p>
        </div>
      </div>
    )
  }

  // Authenticated — render app
  return <>{children}</>
}
