'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'
import { LayoutDashboard, Users, Zap, ListChecks, Activity, LogOut, LogIn } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/',              label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/avatar/create', label: 'Avatar Studio', icon: Users },
  { href: '/generate',      label: 'Generate',     icon: Zap },
  { href: '/jobs',          label: 'Jobs',         icon: ListChecks },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside style={{ width: 'var(--sidebar-width)' }}
      className="flex-shrink-0 h-screen flex flex-col border-r border-white/[0.06] bg-[#07070e]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Activity size={14} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white tracking-tight">MultiModal</div>
            <div className="text-[10px] text-white/30 leading-none mt-0.5">AI Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                active ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
              )}>
              <Icon size={15} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-1.5 w-1.5">
            <span className="ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] text-white/30">All engines online</span>
        </div>

        {session?.user ? (
          /* Signed in — show profile + sign out */
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-white/[0.02]">
            {session.user.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={session.user.image} alt="avatar"
                className="rounded-full flex-shrink-0 w-7 h-7 object-cover border border-white/10" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs text-indigo-300 flex-shrink-0 font-medium">
                {session.user.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/70 font-medium truncate">{session.user.name}</div>
              <div className="text-[10px] text-white/25 truncate">{session.user.email}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
              title="Sign out">
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          /* Not signed in — show Google sign-in button */
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-gray-50 text-gray-800 text-xs font-medium rounded-xl py-2.5 px-3 transition-colors">
            <svg width="14" height="14" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
            </svg>
            Sign in with Google
          </button>
        )}
      </div>
    </aside>
  )
}
