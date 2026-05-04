'use client'
import { useState, useRef, useEffect } from 'react'
import { Sparkles, ChevronRight, Loader2, CheckCircle2, Circle, Download, RefreshCw, Info, Volume2 } from 'lucide-react'
import clsx from 'clsx'

type Intent = 'text2video' | 'avatar_animate' | 'image_gen' | 'text2speech'
interface NLPResult {
  refined_prompt: string; negative_prompt: string
  style_tags: string[]; detected_intent: Intent; tts_text: string | null
}

const stages = [
  { key:'nlp',   label:'NLP Engine',       model:'Client-side · free',          emoji:'🧠', ms:900  },
  { key:'image', label:'Image Engine',     model:'HF FLUX.1-schnell · free',    emoji:'🖼️', ms:4500 },
  { key:'tts',   label:'Speech Synthesis', model:'Browser Web Speech · free',   emoji:'🎙️', ms:1200 },
  { key:'anim',  label:'Animation Eng.',   model:'SadTalker · needs key',       emoji:'🤖', ms:1800 },
  { key:'video', label:'Video Engine',     model:'SVD-XT · needs key',          emoji:'🎬', ms:1800 },
  { key:'cdn',   label:'S3 + CDN',         model:'Vercel · free',               emoji:'☁️', ms:400  },
]

const TYPE_CONFIG: Record<string, {
  placeholder: string; promptLabel: string
  demo_video: string; demo_image: string
  freeNote: string; icon: string
}> = {
  avatar_animate: {
    placeholder: 'Enter what the avatar should say…',
    promptLabel: 'Speech text',
    demo_video: 'https://www.w3schools.com/html/mov_bbb.mp4',
    demo_image: '',
    freeNote: 'Browser Web Speech API synthesizes voice. Real lip-sync needs REPLICATE_API_TOKEN.',
    icon: '💬',
  },
  text2video: {
    placeholder: 'Describe the scene you want to generate…',
    promptLabel: 'Visual prompt',
    demo_video: 'https://www.w3schools.com/html/mov_bbb.mp4',
    demo_image: '',
    freeNote: 'Real video generation (SDXL → SVD-XT) needs REPLICATE_API_TOKEN.',
    icon: '🎬',
  },
  text2speech: {
    placeholder: 'Enter the text to speak aloud…',
    promptLabel: 'Text to synthesize',
    demo_video: '',
    demo_image: '',
    freeNote: 'Uses browser built-in Web Speech API — totally free, no API key.',
    icon: '🔊',
  },
  image_gen: {
    placeholder: 'Describe the image you want to generate…',
    promptLabel: 'Image prompt',
    demo_video: '',
    demo_image: '',
    freeNote: 'Uses HF FLUX.1-schnell (free). Add HF_TOKEN to Vercel env for real images.',
    icon: '🖼️',
  },
}

export default function GeneratePage() {
  const [prompt, setPrompt]         = useState('')
  const [genType, setGenType]       = useState<Intent>('text2speech')
  const [parsing, setParsing]       = useState(false)
  const [nlp, setNlp]               = useState<NLPResult | null>(null)
  const [stageIdx, setStageIdx]     = useState(-1)
  const [times, setTimes]           = useState<Record<string, string>>({})
  const [running, setRunning]       = useState(false)
  const [done, setDone]             = useState(false)
  const [imageUrl, setImageUrl]     = useState<string | null>(null)
  const [videoUrl, setVideoUrl]     = useState<string | null>(null)
  const [speaking, setSpeaking]     = useState(false)
  const [dlLoading, setDlLoading]   = useState(false)
  const [voices, setVoices]         = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState('')
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis.getVoices()
      if (v.length) { setVoices(v); setSelectedVoice(v[0]?.name || '') }
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => { window.speechSynthesis.cancel() }
  }, [])

  function speakText(text: string) {
    if (!text || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    const v = voices.find(v => v.name === selectedVoice)
    if (v) utt.voice = v
    utt.rate = 0.95; utt.pitch = 1.0
    utt.onstart  = () => setSpeaking(true)
    utt.onend    = () => setSpeaking(false)
    utt.onerror  = () => setSpeaking(false)
    utterRef.current = utt
    window.speechSynthesis.speak(utt)
  }

  function stopSpeech() {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  async function handleParse() {
    if (!prompt.trim()) return
    setParsing(true); setNlp(null); setDone(false)
    setImageUrl(null); setVideoUrl(null); setStageIdx(-1); setTimes({})
    try {
      const res = await fetch('/api/v1/generate/prompt-refine', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_prompt: prompt, context: { type: genType } }),
      })
      if (res.ok) setNlp(await res.json())
      else throw new Error()
    } catch {
      await new Promise(r => setTimeout(r, 1000))
      setNlp({
        refined_prompt: `Cinematic ${prompt}, ultra-realistic, 8K, professional studio lighting, shallow depth of field`,
        negative_prompt: 'blurry, watermark, extra limbs, deformed, low quality, jpeg artifacts',
        style_tags: ['cinematic', 'photorealistic', 'editorial', 'studio-lit'],
        detected_intent: genType,
        tts_text: (genType === 'avatar_animate' || genType === 'text2speech') ? prompt : null,
      })
    }
    setParsing(false)
  }

  async function handleRun() {
    if (!nlp) return
    setRunning(true); setDone(false)
    setImageUrl(null); setVideoUrl(null)

    for (let i = 0; i < stages.length; i++) {
      setStageIdx(i)
      const dur = stages[i].ms + Math.random() * 200
      await new Promise(r => setTimeout(r, dur))
      setTimes(p => ({ ...p, [stages[i].key]: (dur / 1000).toFixed(1) + 's' }))

      // Real actions during pipeline
      if (stages[i].key === 'tts' && nlp.tts_text) {
        speakText(nlp.tts_text)
      }
      if (stages[i].key === 'image') {
        try {
          const r = await fetch('/api/v1/generate/image', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: nlp.refined_prompt }),
          })
          if (r.ok) { const d = await r.json(); setImageUrl(d.output?.image_url || null) }
        } catch {}
      }
    }

    // Set demo video for video types
    const cfg = TYPE_CONFIG[genType]
    if (cfg.demo_video) setVideoUrl(cfg.demo_video)

    setStageIdx(stages.length); setRunning(false); setDone(true)
  }

  async function handleDownload(url: string, ext: string, mime: string) {
    setDlLoading(true)
    try {
      const res = await fetch(url, { mode: 'cors' })
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(new Blob([blob], { type: mime }))
      const a = document.createElement('a')
      a.href = blobUrl; a.download = `multimodal-${genType}-${Date.now()}.${ext}`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch {
      window.open(url, '_blank')
    }
    setDlLoading(false)
  }

  function reset() {
    stopSpeech()
    setDone(false); setImageUrl(null); setVideoUrl(null)
    setStageIdx(-1); setTimes({}); setNlp(null); setPrompt('')
  }

  const cfg = TYPE_CONFIG[genType]
  const hasOutput = done && (imageUrl || videoUrl || genType === 'text2speech')

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Generate</h1>
        <p className="text-sm text-white/40 mt-1">NLP · Image · Speech · Animation · Video — all free</p>
      </div>

      {/* Info banner */}
      <div className="mb-6 flex items-start gap-3 bg-indigo-500/5 border border-indigo-500/15 rounded-xl px-4 py-3">
        <Info size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-300/70 leading-relaxed">
          <span className="text-indigo-300 font-medium">Free tier active.</span> NLP is client-side.
          Speech uses your browser. Images use HF FLUX.1-schnell (add <code className="bg-indigo-500/10 px-1 rounded">HF_TOKEN</code> for real generation).
          Real video + avatar animation requires <code className="bg-indigo-500/10 px-1 rounded">REPLICATE_API_TOKEN</code>.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left */}
        <div className="space-y-5">
          <div className="glass rounded-xl p-6">
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">Config</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Generation type</label>
                <select value={genType}
                  onChange={e => { setGenType(e.target.value as Intent); reset() }}
                  className="input-field">
                  <option value="text2speech">🔊 Text → Speech (Browser — fully free)</option>
                  <option value="image_gen">🖼️ Image Generation (HF FLUX — free)</option>
                  <option value="avatar_animate">💬 Avatar Animation (needs Replicate key)</option>
                  <option value="text2video">🎬 Text → Video (needs Replicate key)</option>
                </select>
              </div>

              {/* Voice selector for TTS */}
              {(genType === 'text2speech' || genType === 'avatar_animate') && voices.length > 0 && (
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Browser voice</label>
                  <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className="input-field">
                    {voices.map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs text-white/50 mb-1.5">{cfg.promptLabel}</label>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                  placeholder={cfg.placeholder} rows={5} className="input-field resize-none" />
              </div>

              <button onClick={handleParse} disabled={parsing || !prompt.trim()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl py-2.5 transition-colors">
                {parsing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {parsing ? 'Parsing…' : '1. Parse with NLP Engine'}
              </button>
            </div>
          </div>

          {nlp && (
            <div className="glass rounded-xl p-6 animate-fade-in space-y-3">
              <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest">NLP Output</h2>
              <div>
                <div className="text-[11px] text-white/30 mb-1">Refined prompt</div>
                <p className="text-xs text-white/60 leading-relaxed">{nlp.refined_prompt}</p>
              </div>
              <div>
                <div className="text-[11px] text-white/30 mb-1">Negative prompt</div>
                <p className="text-xs text-red-400/60">{nlp.negative_prompt}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {nlp.style_tags.map(t => (
                  <span key={t} className="text-[11px] bg-white/5 text-white/50 rounded-md px-2 py-0.5">{t}</span>
                ))}
              </div>
              {nlp.tts_text && (
                <div>
                  <div className="text-[11px] text-white/30 mb-1">Speech text</div>
                  <div className="flex items-start gap-2">
                    <p className="text-xs text-indigo-300/80 italic bg-indigo-500/5 rounded-lg px-3 py-2 flex-1">"{nlp.tts_text}"</p>
                    <button onClick={() => speaking ? stopSpeech() : speakText(nlp.tts_text!)}
                      className={clsx('flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-colors',
                        speaking ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'border-white/10 text-white/40 hover:text-white/70')}>
                      <Volume2 size={13} />
                    </button>
                  </div>
                </div>
              )}
              <button onClick={handleRun} disabled={running}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500/80 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl py-2.5 transition-colors">
                {running ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                {running ? 'Pipeline running…' : '2. Run Full Pipeline'}
              </button>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="space-y-5">
          <div className="glass rounded-xl p-6">
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-5">Pipeline Stages</h2>
            <div className="space-y-1">
              {stages.map((s, i) => {
                const isDone   = stageIdx > i
                const isActive = stageIdx === i && running
                return (
                  <div key={s.key} className={clsx(
                    'flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300',
                    isActive ? 'bg-indigo-500/10 border border-indigo-500/20' :
                    isDone   ? 'bg-emerald-500/5 border border-emerald-500/10' :
                               'border border-transparent opacity-40')}>
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {isDone   ? <CheckCircle2 size={16} className="text-emerald-400" /> :
                       isActive ? <Loader2 size={16} className="text-indigo-400 animate-spin" /> :
                                  <Circle size={16} className="text-white/20" />}
                    </div>
                    <span className="text-lg flex-shrink-0">{s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className={clsx('text-sm font-medium',
                        isDone ? 'text-white/80' : isActive ? 'text-white' : 'text-white/40')}>
                        {s.label}
                      </div>
                      <div className="text-[11px] text-white/25 font-mono">{s.model}</div>
                    </div>
                    <div className="flex-shrink-0">
                      {isDone   && <span className="text-[11px] text-emerald-400 font-mono">{times[s.key]}</span>}
                      {isActive && <span className="text-[11px] text-indigo-400 animate-pulse">running…</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Output panel */}
          {hasOutput && (
            <div className="glass rounded-xl overflow-hidden border border-emerald-500/20 animate-fade-in">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">Pipeline complete</span>
                </div>
                <div className="flex gap-2">
                  {(videoUrl || imageUrl) && (
                    <button onClick={() => handleDownload(videoUrl||imageUrl!, videoUrl?'mp4':'jpg', videoUrl?'video/mp4':'image/jpeg')}
                      disabled={dlLoading}
                      className="flex items-center gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg px-3 py-1.5 transition-colors font-medium disabled:opacity-50">
                      {dlLoading ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                      Download
                    </button>
                  )}
                  <button onClick={reset}
                    className="flex items-center gap-1.5 text-xs text-white/40 border border-white/10 rounded-lg px-3 py-1.5 hover:text-white/70 transition-colors">
                    <RefreshCw size={11} /> Reset
                  </button>
                </div>
              </div>
              <div className="p-4">
                {videoUrl && (
                  <video controls playsInline crossOrigin="anonymous"
                    className="w-full rounded-lg bg-black max-h-56 object-contain" key={videoUrl}>
                    <source src={videoUrl} type="video/mp4" />
                  </video>
                )}
                {imageUrl && !videoUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={imageUrl} alt="Generated" className="w-full rounded-lg object-cover max-h-56" />
                )}
                {genType === 'text2speech' && !videoUrl && (
                  <div className="bg-black/20 rounded-lg p-5 flex flex-col items-center gap-3">
                    <div className="text-3xl">🎙️</div>
                    <p className="text-sm text-white/60 text-center italic">"{nlp?.tts_text || prompt}"</p>
                    <button onClick={() => speaking ? stopSpeech() : speakText(nlp?.tts_text || prompt)}
                      className={clsx('flex items-center gap-2 text-sm font-medium rounded-xl px-5 py-2.5 transition-colors border',
                        speaking
                          ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                          : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20')}>
                      <Volume2 size={14} />
                      {speaking ? 'Stop speaking' : 'Play speech'}
                    </button>
                    <p className="text-[11px] text-white/25">Browser Web Speech API · free · no API key</p>
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-0.5">Free tier</span>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full px-2.5 py-0.5">{cfg.icon} {genType.replace('_',' ')}</span>
                  <span className="text-[11px] text-white/30 ml-1">{cfg.freeNote}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
