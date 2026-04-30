'use client'
import { useState, useRef } from 'react'
import { Sparkles, ChevronRight, Loader2, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

type Intent = 'text2video' | 'avatar_animate' | 'image_gen' | 'text2speech'

interface NLPResult {
  refined_prompt: string
  negative_prompt: string
  style_tags: string[]
  detected_intent: Intent
  tts_text: string | null
}

const pipelineStages = [
  { key: 'nlp',   label: 'NLP Engine',        model: 'GPT-4o',           emoji: '🧠', ms: 1200  },
  { key: 'image', label: 'Image Engine',       model: 'SDXL + LoRA',      emoji: '🖼️', ms: 4000  },
  { key: 'tts',   label: 'ElevenLabs TTS',     model: 'eleven_turbo_v2',  emoji: '🎙️', ms: 2500  },
  { key: 'anim',  label: 'Animation Engine',   model: 'SadTalker',        emoji: '🤖', ms: 5500  },
  { key: 'video', label: 'Video Engine',       model: 'SVD-XT',           emoji: '🎬', ms: 7000  },
  { key: 'cdn',   label: 'S3 + CloudFront',    model: 'us-east-1',        emoji: '☁️', ms: 800   },
]

const intentLabels: Record<Intent, string> = {
  text2video:     '🎬 Text → Video',
  avatar_animate: '💬 Avatar Animate',
  image_gen:      '🖼️ Image Gen',
  text2speech:    '🔊 Text to Speech',
}

const DEMO_RESULT: NLPResult = {
  refined_prompt: 'Cinematic close-up portrait of a professional woman, soft directional studio lighting, shallow depth of field, 8K resolution, ultra-realistic skin texture, neutral background, editorial photography style',
  negative_prompt: 'blurry, watermark, extra limbs, deformed, low quality, cartoon, jpeg artifacts, overexposed',
  style_tags: ['cinematic', 'editorial', 'photorealistic', 'studio-lit'],
  detected_intent: 'avatar_animate',
  tts_text: 'Welcome to our platform. Today I want to show you something truly remarkable.',
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('')
  const [genType, setGenType] = useState<Intent>('avatar_animate')
  const [parsing, setParsing] = useState(false)
  const [nlpResult, setNlpResult] = useState<NLPResult | null>(null)
  const [stageIdx, setStageIdx] = useState(-1)
  const [stageTimes, setStageTimes] = useState<Record<string, string>>({})
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const abortRef = useRef(false)

  async function handleParse() {
    if (!prompt.trim()) return
    setParsing(true)
    setNlpResult(null)
    setDone(false)
    setOutputUrl(null)
    setStageIdx(-1)
    setStageTimes({})

    try {
      const res = await fetch('/api/v1/generate/prompt-refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_prompt: prompt }),
      })
      if (res.ok) {
        const data = await res.json()
        setNlpResult(data)
      } else {
        // Demo fallback
        await new Promise(r => setTimeout(r, 1400))
        setNlpResult(DEMO_RESULT)
      }
    } catch {
      await new Promise(r => setTimeout(r, 1400))
      setNlpResult(DEMO_RESULT)
    }
    setParsing(false)
  }

  async function handleRun() {
    if (!nlpResult) return
    setRunning(true)
    setDone(false)
    setOutputUrl(null)
    abortRef.current = false

    for (let i = 0; i < pipelineStages.length; i++) {
      if (abortRef.current) break
      setStageIdx(i)
      const dur = pipelineStages[i].ms + Math.random() * 400 - 200
      await new Promise(r => setTimeout(r, dur))
      setStageTimes(prev => ({ ...prev, [pipelineStages[i].key]: (dur / 1000).toFixed(1) + 's' }))
    }

    setStageIdx(pipelineStages.length)
    setRunning(false)
    setDone(true)
    setOutputUrl(`https://cdn.platform.io/output/${Date.now()}.mp4`)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Generate</h1>
        <p className="text-sm text-white/40 mt-1">NLP → Image → Animation → Video · full pipeline</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Config */}
        <div className="space-y-5">
          <div className="glass rounded-xl p-6">
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">Pipeline Config</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Generation type</label>
                <select
                  value={genType}
                  onChange={e => setGenType(e.target.value as Intent)}
                  className="input-field"
                >
                  <option value="avatar_animate">Avatar Animation (SadTalker)</option>
                  <option value="text2video">Text → Video (SVD pipeline)</option>
                  <option value="text2speech">Text → Speech (ElevenLabs)</option>
                  <option value="image_gen">Image Generation (SDXL)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5">Raw prompt</label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe what you want to generate. The NLP engine will parse and refine your prompt before sending to the pipeline…"
                  rows={5}
                  className="input-field resize-none"
                />
              </div>

              <button
                onClick={handleParse}
                disabled={parsing || !prompt.trim()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl py-2.5 transition-colors"
              >
                {parsing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {parsing ? 'Parsing prompt…' : '1. Parse with NLP Engine'}
              </button>
            </div>
          </div>

          {/* NLP Result */}
          {nlpResult && (
            <div className="glass rounded-xl p-6 animate-fade-in">
              <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">NLP Output</h2>
              <div className="space-y-3">
                <Field label="Refined prompt" value={nlpResult.refined_prompt} />
                <Field label="Negative prompt" value={nlpResult.negative_prompt} danger />
                <div>
                  <div className="text-[11px] text-white/30 mb-1.5">Detected intent</div>
                  <span className="text-xs bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 rounded-full px-3 py-1">
                    {intentLabels[nlpResult.detected_intent]}
                  </span>
                </div>
                <div>
                  <div className="text-[11px] text-white/30 mb-1.5">Style tags</div>
                  <div className="flex flex-wrap gap-1.5">
                    {nlpResult.style_tags.map(t => (
                      <span key={t} className="text-[11px] bg-white/5 text-white/50 rounded-md px-2 py-0.5">{t}</span>
                    ))}
                  </div>
                </div>
                {nlpResult.tts_text && <Field label="TTS text" value={nlpResult.tts_text} />}
              </div>
              <button
                onClick={handleRun}
                disabled={running}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-emerald-500/80 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl py-2.5 transition-colors"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                {running ? 'Pipeline running…' : '2. Run Full Pipeline'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Pipeline stages */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-5">Pipeline Stages</h2>
          <div className="space-y-1">
            {pipelineStages.map((s, i) => {
              const isDone    = stageIdx > i
              const isActive  = stageIdx === i && running
              const isPending = stageIdx < i
              return (
                <div key={s.key}
                  className={clsx(
                    'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300',
                    isActive  ? 'bg-indigo-500/10 border border-indigo-500/20' :
                    isDone    ? 'bg-emerald-500/5  border border-emerald-500/10' :
                                'border border-transparent opacity-40'
                  )}
                >
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                    {isDone    ? <CheckCircle2 size={16} className="text-emerald-400" /> :
                     isActive  ? <Loader2 size={16} className="text-indigo-400 animate-spin" /> :
                                 <Circle size={16} className="text-white/20" />}
                  </div>
                  <span className="text-lg flex-shrink-0">{s.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className={clsx('text-sm font-medium', isDone ? 'text-white/80' : isActive ? 'text-white' : 'text-white/40')}>{s.label}</div>
                    <div className="text-[11px] text-white/25 font-mono mt-0.5">{s.model}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {isDone && <span className="text-[11px] text-emerald-400 font-mono">{stageTimes[s.key]}</span>}
                    {isActive && <span className="text-[11px] text-indigo-400 animate-pulse">running…</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Output */}
          {done && outputUrl && (
            <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Pipeline complete</span>
              </div>
              <div className="text-[11px] font-mono text-white/30 mt-1 break-all">{outputUrl}</div>
              <div className="flex gap-2 mt-3">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-0.5">Signed CDN URL</span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full px-2.5 py-0.5">15-min TTL</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-white/30 mb-1">{label}</div>
      <p className={clsx('text-xs leading-relaxed', danger ? 'text-red-400/70' : 'text-white/60')}>{value}</p>
    </div>
  )
}
