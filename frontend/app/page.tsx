'use client'
import { useEffect, useState } from 'react'
import { Zap, Users, CheckCircle, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

const engines = [
  { name: 'NLP Engine',       model: 'GPT-4o',             status: 'online', latency: '0.8s',  color: 'emerald' },
  { name: 'Image Engine',     model: 'SDXL + LoRA',        status: 'online', latency: '18s',   color: 'violet'  },
  { name: 'Animation Engine', model: 'SadTalker · WAV2Lip',status: 'online', latency: '45s',   color: 'amber'   },
  { name: 'Video Engine',     model: 'SVD · Replicate',    status: 'idle',   latency: '90s',   color: 'sky'     },
]

const recentActivity = [
  { id: 'job_a1b2', type: 'avatar_animate', label: 'Avatar animation', status: 'done',       ago: '2m ago'  },
  { id: 'job_c3d4', type: 'text2video',     label: 'Text → Video',     status: 'processing', ago: '5m ago'  },
  { id: 'job_e5f6', type: 'text2speech',    label: 'TTS synthesis',    status: 'done',       ago: '12m ago' },
  { id: 'job_g7h8', type: 'lora_train',     label: 'LoRA training',    status: 'failed',     ago: '1h ago'  },
]

const statusColors: Record<string, string> = {
  done:       'text-emerald-400 bg-emerald-400/10',
  processing: 'text-indigo-400 bg-indigo-400/10',
  failed:     'text-red-400 bg-red-400/10',
  queued:     'text-amber-400 bg-amber-400/10',
}

const engineColors: Record<string, string> = {
  emerald: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400',
  violet:  'bg-violet-400/10 border-violet-400/20 text-violet-400',
  amber:   'bg-amber-400/10 border-amber-400/20 text-amber-400',
  sky:     'bg-sky-400/10 border-sky-400/20 text-sky-400',
}

export default function Dashboard() {
  const [tick, setTick] = useState(0)
  useEffect(() => { const iv = setInterval(() => setTick(t => t + 1), 2000); return () => clearInterval(iv) }, [])

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-white/40 mt-1">Multimodal AI generation platform — overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Jobs',   value: '284',  sub: 'all time',      icon: ListIcon,       delta: '+12 today' },
          { label: 'Completed',    value: '261',  sub: '92% success',   icon: CheckCircle,    delta: null        },
          { label: 'Processing',   value: '3',    sub: 'in queue',      icon: Clock,          delta: null        },
          { label: 'Avatars',      value: '9',    sub: '7 LoRA-ready',  icon: Users,          delta: '+2 this week'},
        ].map(({ label, value, sub, icon: Icon, delta }) => (
          <div key={label} className="glass rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs text-white/30 uppercase tracking-widest">{label}</span>
              <Icon size={14} className="text-white/20 mt-0.5" />
            </div>
            <div className="text-3xl font-semibold text-white tracking-tight">{value}</div>
            <div className="text-xs text-white/30 mt-1">{sub}</div>
            {delta && <div className="text-[11px] text-indigo-400 mt-2">{delta}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Engine Status */}
        <div className="col-span-3 glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-medium text-white/70">Engine Status</h2>
            <span className="text-xs text-white/30">FastAPI · Replicate · ElevenLabs</span>
          </div>
          <div className="space-y-3">
            {engines.map((e) => (
              <div key={e.name} className={clsx('flex items-center gap-4 rounded-lg border px-4 py-3', engineColors[e.color])}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{e.name}</div>
                  <div className="text-xs opacity-60 font-mono mt-0.5">{e.model}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs capitalize">{e.status}</span>
                  <div className="text-xs opacity-50 mt-0.5">avg {e.latency}</div>
                </div>
                <div className="relative flex h-2 w-2 flex-shrink-0">
                  {e.status === 'online' && (
                    <span className="ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span className={clsx('relative inline-flex rounded-full h-2 w-2', e.status === 'online' ? 'bg-emerald-500' : 'bg-white/20')} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-2 glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-medium text-white/70">Recent Jobs</h2>
            <Link href="/jobs" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentActivity.map((j) => (
              <div key={j.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white/80 truncate">{j.label}</div>
                  <div className="text-[11px] text-white/25 font-mono mt-0.5">{j.id}</div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full', statusColors[j.status])}>
                    {j.status}
                  </span>
                  <span className="text-[10px] text-white/25">{j.ago}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { href: '/avatar/create', label: 'Create Avatar',    desc: 'Upload image · train LoRA',      icon: '👤', grad: 'from-violet-500/20 to-purple-600/10' },
          { href: '/generate',      label: 'Generate Video',   desc: 'Text → animated avatar → CDN',  icon: '🎬', grad: 'from-indigo-500/20 to-blue-600/10'   },
          { href: '/generate',      label: 'Voice Synthesis',  desc: 'ElevenLabs TTS · clone voice',  icon: '🎙️', grad: 'from-pink-500/20 to-rose-600/10'    },
        ].map(({ href, label, desc, icon, grad }) => (
          <Link key={label} href={href}
            className={clsx('glass rounded-xl p-5 bg-gradient-to-br hover:scale-[1.02] transition-transform duration-150', grad)}>
            <div className="text-2xl mb-3">{icon}</div>
            <div className="text-sm font-medium text-white">{label}</div>
            <div className="text-xs text-white/40 mt-1">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ListIcon({ size, className }: { size: number; className?: string }) {
  return <TrendingUp size={size} className={className} />
}
