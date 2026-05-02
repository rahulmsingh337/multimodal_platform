'use client'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Activity } from 'lucide-react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const googleConfigured = !!(
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_GOOGLE_CONFIGURED === 'true'
  )

  useEffect(() => {
    // Only redirect if Google auth is configured AND user is not authenticated
    if (status === 'unauthenticated' && !pathname.startsWith('/auth') && googleConfigured) {
      router.push('/auth/signin')
    }
  }, [status, pathname, router, googleConfigured])

  if (pathname.startsWith('/auth')) return <>{children}</>

  if (status === 'loading' && googleConfigured) {
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

  // If Google not configured, render children directly (no auth required)
  return <>{children}</>
}
