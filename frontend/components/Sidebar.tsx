'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { LayoutDashboard, Users, Zap, ListChecks, Activity, LogOut } from 'lucide-react'
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

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className={clsx('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                active ? 'bg-indigo-500/10 text-indigo-400 font-medium' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]')}>
              <Icon size={15} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-1.5 w-1.5">
            <span className="ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] text-white/30">All engines online</span>
        </div>
        {session?.user ? (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            {session.user.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={session.user.image} alt="avatar" width={26} height={26} className="rounded-full flex-shrink-0 w-6 h-6 object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs text-indigo-300 flex-shrink-0">
                {session.user.name?.[0] ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/70 font-medium truncate">{session.user.name}</div>
              <div className="text-[10px] text-white/25 truncate">{session.user.email}</div>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="text-white/20 hover:text-white/60 transition-colors flex-shrink-0" title="Sign out">
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <div className="text-[10px] text-white/20 font-mono px-2">v1.0 · May 2026</div>
        )}
      </div>
    </aside>
  )
}
