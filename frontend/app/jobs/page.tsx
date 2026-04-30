'use client'
import { useState, useEffect } from 'react'
import { RefreshCw, X, CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react'
import clsx from 'clsx'

type JobStatus = 'queued' | 'processing' | 'done' | 'failed' | 'cancelled'

interface Job {
  id: string
  type: string
  status: JobStatus
  prompt?: string
  created: number
  elapsed?: number
  error?: string
  progress?: number
}

const JOB_TYPES: Record<string, string> = {
  text2video:     '🎬 Text → Video',
  avatar_animate: '💬 Avatar Animate',
  text2speech:    '🔊 TTS',
  lora_train:     '🧠 LoRA Train',
  image_gen:      '🖼️ Image Gen',
}

const STATUS_STYLE: Record<JobStatus, string> = {
  done:       'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  processing: 'text-indigo-400  bg-indigo-400/10  border-indigo-400/20',
  queued:     'text-amber-400   bg-amber-400/10   border-amber-400/20',
  failed:     'text-red-400     bg-red-400/10     border-red-400/20',
  cancelled:  'text-white/30   bg-white/5        border-white/10',
}

const STATUS_ICON: Record<JobStatus, React.ReactNode> = {
  done:       <CheckCircle2 size={13} />,
  processing: <Loader2 size={13} className="animate-spin" />,
  queued:     <Clock size={13} />,
  failed:     <AlertCircle size={13} />,
  cancelled:  <X size={13} />,
}

const FILTER_OPTIONS = ['all', 'processing', 'done', 'failed']

const SEED_JOBS: Job[] = [
  { id: 'job_a1b2c3', type: 'avatar_animate', status: 'done',       prompt: 'Welcome to our platform. Today I will show you AI generation.',  created: Date.now() - 120000,  elapsed: 42  },
  { id: 'job_d4e5f6', type: 'text2video',     status: 'processing', prompt: 'A futuristic city at night, neon lights reflecting on wet streets',   created: Date.now() - 300000                },
  { id: 'job_g7h8i9', type: 'text2speech',    status: 'done',       prompt: 'Hello world, this is an ElevenLabs synthesis test.',               created: Date.now() - 720000,  elapsed: 8   },
  { id: 'job_j0k1l2', type: 'lora_train',     status: 'done',       prompt: 'LoRA training: Priya avatar v2',                                  created: Date.now() - 3600000, elapsed: 284 },
  { id: 'job_m3n4o5', type: 'image_gen',      status: 'failed',     prompt: 'Cinematic portrait, SDXL + LoRA conditioning',                    created: Date.now() - 7200000, error: 'Replicate cold start timeout (60s exceeded)' },
  { id: 'job_p6q7r8', type: 'avatar_animate', status: 'queued',     prompt: 'Product demo walkthrough, professional tone',                     created: Date.now() - 30000                  },
]

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  return `${Math.floor(s/3600)}h ago`
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(SEED_JOBS)
  const [filter, setFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  // Simulate processing job advancing
  useEffect(() => {
    const iv = setInterval(() => {
      setJobs(prev => prev.map(j => {
        if (j.status !== 'processing') return j
        const prog = (j.progress || 0) + Math.random() * 5
        if (prog >= 100) return { ...j, status: 'done', elapsed: Math.round((Date.now() - j.created) / 1000), progress: 100 }
        return { ...j, progress: Math.round(prog) }
      }))
    }, 800)
    return () => clearInterval(iv)
  }, [])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/v1/jobs/')
      if (res.ok) {
        const data = await res.json()
        // merge with demo
      }
    } catch {}
    await new Promise(r => setTimeout(r, 600))
    setRefreshing(false)
  }

  function handleCancel(id: string) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'cancelled' } : j))
  }

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)
  const selectedJob = selected ? jobs.find(j => j.id === selected) : null

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Jobs</h1>
          <p className="text-sm text-white/40 mt-1">{jobs.length} total · {jobs.filter(j=>j.status==='processing').length} processing</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleRefresh} className={clsx('flex items-center gap-2 text-xs text-white/40 hover:text-white/70 border border-white/10 rounded-lg px-3 py-2 transition-colors', refreshing && 'opacity-50')}>
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setJobs(prev => prev.filter(j => j.status !== 'done'))}
            className="text-xs text-white/40 hover:text-white/70 border border-white/10 rounded-lg px-3 py-2 transition-colors">
            Clear done
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {FILTER_OPTIONS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={clsx(
              'text-xs font-medium px-4 py-1.5 rounded-lg border transition-all capitalize',
              filter === f
                ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                : 'text-white/40 border-white/[0.06] hover:text-white/60 hover:border-white/20'
            )}>
            {f === 'all' ? `All (${jobs.length})` : `${f} (${jobs.filter(j=>j.status===f).length})`}
          </button>
        ))}
      </div>

      <div className={clsx('grid gap-5', selectedJob ? 'grid-cols-3' : 'grid-cols-1')}>
        {/* Job list */}
        <div className={clsx(selectedJob ? 'col-span-2' : 'col-span-1', 'space-y-2')}>
          {filtered.length === 0 && (
            <div className="glass rounded-xl p-12 text-center text-white/30 text-sm">No jobs found.</div>
          )}
          {filtered.map(j => (
            <div key={j.id}
              onClick={() => setSelected(j.id === selected ? null : j.id)}
              className={clsx(
                'glass rounded-xl px-5 py-4 cursor-pointer transition-all hover:border-white/20',
                selected === j.id && 'border-indigo-500/30 bg-indigo-500/5'
              )}>
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{JOB_TYPES[j.type] || j.type}</span>
                    <span className={clsx('text-[10px] font-medium rounded-full px-2 py-0.5 border flex items-center gap-1', STATUS_STYLE[j.status])}>
                      {STATUS_ICON[j.status]} {j.status}
                    </span>
                  </div>
                  {j.prompt && <p className="text-xs text-white/40 truncate">{j.prompt}</p>}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] text-white/20 font-mono">{j.id}</span>
                    <span className="text-[11px] text-white/25">·</span>
                    <span className="text-[11px] text-white/25">{timeAgo(j.created)}</span>
                    {j.elapsed && <><span className="text-[11px] text-white/25">·</span><span className="text-[11px] text-emerald-400">{j.elapsed}s</span></>}
                  </div>
                </div>
                {j.status === 'processing' && (
                  <div className="w-24 flex-shrink-0">
                    <div className="flex justify-between text-[10px] text-white/30 mb-1">
                      <span>progress</span><span>{j.progress || 0}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full shimmer rounded-full transition-all" style={{ width: `${j.progress || 0}%` }} />
                    </div>
                  </div>
                )}
                {j.status === 'queued' && (
                  <button onClick={e => { e.stopPropagation(); handleCancel(j.id) }}
                    className="text-[11px] text-red-400/60 hover:text-red-400 border border-red-400/20 rounded-lg px-3 py-1.5 transition-colors flex-shrink-0">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Job detail */}
        {selectedJob && (
          <div className="col-span-1 glass rounded-xl p-6 h-fit sticky top-8 animate-slide-up">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-sm font-medium text-white">{JOB_TYPES[selectedJob.type]}</div>
                <div className="text-[11px] text-white/25 font-mono mt-1">{selectedJob.id}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white/60">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-4">
              <Row k="Status">
                <span className={clsx('text-[11px] font-medium rounded-full px-2 py-0.5 border', STATUS_STYLE[selectedJob.status])}>
                  {selectedJob.status}
                </span>
              </Row>
              <Row k="Created">{new Date(selectedJob.created).toLocaleTimeString()}</Row>
              {selectedJob.elapsed && <Row k="Duration">{selectedJob.elapsed}s</Row>}
              {selectedJob.prompt && (
                <div>
                  <div className="text-[11px] text-white/30 mb-1.5">Prompt</div>
                  <p className="text-xs text-white/50 leading-relaxed">{selectedJob.prompt}</p>
                </div>
              )}
              {selectedJob.error && (
                <div className="rounded-lg bg-red-400/5 border border-red-400/20 p-3">
                  <div className="text-[11px] text-red-400 font-medium mb-1">Error</div>
                  <p className="text-[11px] text-red-400/70">{selectedJob.error}</p>
                </div>
              )}
              {selectedJob.status === 'done' && (
                <div className="rounded-lg bg-emerald-400/5 border border-emerald-400/20 p-3">
                  <div className="text-[11px] text-emerald-400 font-medium mb-1">Output</div>
                  <p className="text-[11px] text-emerald-400/60 font-mono break-all">
                    cdn.platform.io/{selectedJob.id}/output.mp4
                  </p>
                  <button className="mt-2 text-[11px] text-emerald-400 hover:text-emerald-300">Get signed URL →</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
      <span className="text-[11px] text-white/30">{k}</span>
      <span className="text-[11px] text-white/60">{children}</span>
    </div>
  )
}
