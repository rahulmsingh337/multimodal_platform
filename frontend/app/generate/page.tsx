'use client'
import { useState } from 'react'
import { Sparkles, ChevronRight, Loader2, CheckCircle2, Circle, Download, RefreshCw, Info } from 'lucide-react'
import clsx from 'clsx'

type Intent = 'text2video' | 'avatar_animate' | 'image_gen' | 'text2speech'
interface NLPResult {
  refined_prompt: string; negative_prompt: string; style_tags: string[]
  detected_intent: Intent; tts_text: string | null
}

const stages = [
  { key:'nlp',   label:'NLP Engine',      model:'Claude Sonnet',   emoji:'🧠', ms:1800 },
  { key:'image', label:'Image Engine',    model:'SDXL + LoRA',     emoji:'🖼️', ms:5000 },
  { key:'tts',   label:'ElevenLabs TTS', model:'eleven_turbo_v2', emoji:'🎙️', ms:3000 },
  { key:'anim',  label:'Animation Eng.', model:'SadTalker',       emoji:'🤖', ms:6000 },
  { key:'video', label:'Video Engine',   model:'SVD-XT',          emoji:'🎬', ms:8000 },
  { key:'cdn',   label:'S3 + CDN',       model:'CloudFront',      emoji:'☁️', ms:600  },
]

// Realistic demos matched to each generation type
const DEMO_OUT: Record<string, {
  url: string; type: 'video'|'audio'|'image'; ext: string; mime: string
  label: string; description: string
}> = {
  avatar_animate: {
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    type: 'video', ext: 'mp4', mime: 'video/mp4',
    label: 'Animated Avatar (SadTalker)',
    description: 'Real output: SadTalker drives a portrait image with synthesized speech audio to produce a lip-synced talking avatar. Connect REPLICATE_API_TOKEN + ELEVENLABS_API_KEY to generate real avatars.',
  },
  text2video: {
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    type: 'video', ext: 'mp4', mime: 'video/mp4',
    label: 'Generated Video (SVD)',
    description: 'Real output: SDXL generates a keyframe from your prompt, then SVD-XT animates it into a 4-second video. Connect REPLICATE_API_TOKEN to generate real videos.',
  },
  text2speech: {
    url: 'https://www.w3schools.com/html/horse.mp3',
    type: 'audio', ext: 'mp3', mime: 'audio/mpeg',
    label: 'Synthesized Speech (ElevenLabs)',
    description: 'Real output: ElevenLabs eleven_turbo_v2 synthesizes your text into natural speech. Connect ELEVENLABS_API_KEY to generate real audio.',
  },
  image_gen: {
    url: 'https://picsum.photos/seed/multimodal/800/500',
    type: 'image', ext: 'jpg', mime: 'image/jpeg',
    label: 'Generated Image (SDXL)',
    description: 'Real output: SDXL with your LoRA weights generates a high-quality portrait. Connect REPLICATE_API_TOKEN to generate real images.',
  },
}

const TYPE_INFO: Record<string, { icon: string; realPipeline: string; needs: string[] }> = {
  avatar_animate: { icon:'💬', realPipeline:'Image → ElevenLabs TTS → SadTalker → mp4', needs:['REPLICATE_API_TOKEN','ELEVENLABS_API_KEY'] },
  text2video:     { icon:'🎬', realPipeline:'NLP → SDXL keyframe → SVD-XT → mp4',       needs:['REPLICATE_API_TOKEN','OPENAI_API_KEY']    },
  text2speech:    { icon:'🔊', realPipeline:'Text → ElevenLabs TTS → mp3',               needs:['ELEVENLABS_API_KEY']                     },
  image_gen:      { icon:'🖼️', realPipeline:'NLP → SDXL + LoRA → png',                  needs:['REPLICATE_API_TOKEN','OPENAI_API_KEY']    },
}

export default function GeneratePage() {
  const [prompt,setPrompt]       = useState('')
  const [genType,setGenType]     = useState<Intent>('avatar_animate')
  const [parsing,setParsing]     = useState(false)
  const [nlp,setNlp]             = useState<NLPResult|null>(null)
  const [stageIdx,setStageIdx]   = useState(-1)
  const [times,setTimes]         = useState<Record<string,string>>({})
  const [running,setRunning]     = useState(false)
  const [done,setDone]           = useState(false)
  const [out,setOut]             = useState<typeof DEMO_OUT[string]|null>(null)
  const [dlLoading,setDlLoading] = useState(false)

  async function handleParse() {
    if (!prompt.trim()) return
    setParsing(true); setNlp(null); setDone(false); setOut(null); setStageIdx(-1); setTimes({})
    try {
      const res = await fetch('/api/v1/generate/prompt-refine', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ raw_prompt: prompt, context: { type: genType } }),
      })
      if (res.ok) { const d = await res.json(); setNlp(d) }
      else throw new Error()
    } catch {
      await new Promise(r => setTimeout(r, 1400))
      setNlp({
        refined_prompt: `Cinematic ${prompt}, 8K ultra-realistic, professional studio lighting, shallow depth of field, editorial style`,
        negative_prompt: 'blurry, watermark, extra limbs, deformed, low quality, jpeg artifacts, overexposed',
        style_tags: ['cinematic','photorealistic','editorial','studio-lit'],
        detected_intent: genType,
        tts_text: (genType==='avatar_animate'||genType==='text2speech') ? prompt : null,
      })
    }
    setParsing(false)
  }

  async function handleRun() {
    if (!nlp) return
    setRunning(true); setDone(false); setOut(null)
    for (let i = 0; i < stages.length; i++) {
      setStageIdx(i)
      await new Promise(r => setTimeout(r, stages[i].ms + Math.random()*300))
      setTimes(p => ({ ...p, [stages[i].key]: ((stages[i].ms)/1000).toFixed(1)+'s' }))
    }
    setStageIdx(stages.length); setRunning(false); setDone(true)
    setOut(DEMO_OUT[genType] || DEMO_OUT.avatar_animate)
  }

  async function handleDownload() {
    if (!out) return
    setDlLoading(true)
    try {
      const res = await fetch(out.url, { mode:'cors' })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(new Blob([blob], { type: out.mime }))
      const a = document.createElement('a')
      a.href = blobUrl; a.download = `multimodal-${genType}-${Date.now()}.${out.ext}`
      document.body.appendChild(a); a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch {
      const a = document.createElement('a')
      a.href = out.url; a.download = `multimodal-${genType}-${Date.now()}.${out.ext}`
      a.target = '_blank'; document.body.appendChild(a); a.click(); document.body.removeChild(a)
    }
    setDlLoading(false)
  }

  function reset() { setDone(false); setOut(null); setStageIdx(-1); setTimes({}); setNlp(null); setPrompt('') }

  const typeInfo = TYPE_INFO[genType]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Generate</h1>
        <p className="text-sm text-white/40 mt-1">NLP → Image → Animation → Video · full pipeline</p>
      </div>

      {/* Demo mode banner */}
      <div className="mb-6 flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
        <Info size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-medium text-amber-400">Demo Mode — API keys not connected</div>
          <div className="text-xs text-amber-400/60 mt-0.5">
            Pipeline runs with simulated timing. Real {typeInfo.icon} <span className="font-mono">{genType}</span> output requires: {typeInfo.needs.map(k => <code key={k} className="bg-amber-500/10 px-1 rounded text-amber-300 mx-0.5">{k}</code>)} added to Vercel env vars.
          </div>
          <div className="text-xs text-amber-400/40 mt-1 font-mono">Real pipeline: {typeInfo.realPipeline}</div>
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
                <select value={genType} onChange={e => { setGenType(e.target.value as Intent); reset() }} className="input-field">
                  <option value="avatar_animate">💬 Avatar Animation (SadTalker + ElevenLabs)</option>
                  <option value="text2video">🎬 Text → Video (SDXL + SVD-XT)</option>
                  <option value="text2speech">🔊 Text → Speech (ElevenLabs TTS)</option>
                  <option value="image_gen">🖼️ Image Generation (SDXL + LoRA)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">
                  {genType==='text2speech'||genType==='avatar_animate' ? 'Text to speak' : 'Visual prompt'}
                </label>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                  placeholder={
                    genType==='text2speech' ? 'Enter text to synthesize into speech…' :
                    genType==='avatar_animate' ? 'Enter what the avatar should say…' :
                    'Describe the scene you want to generate…'
                  }
                  rows={5} className="input-field resize-none" />
              </div>
              <button onClick={handleParse} disabled={parsing||!prompt.trim()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl py-2.5 transition-colors">
                {parsing ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
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
                  <div className="text-[11px] text-white/30 mb-1">Speech text (ElevenLabs)</div>
                  <p className="text-xs text-indigo-300/80 italic bg-indigo-500/5 rounded-lg px-3 py-2">"{nlp.tts_text}"</p>
                </div>
              )}
              <button onClick={handleRun} disabled={running}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500/80 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl py-2.5 transition-colors">
                {running ? <Loader2 size={14} className="animate-spin"/> : <ChevronRight size={14}/>}
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
                      {isDone ? <CheckCircle2 size={16} className="text-emerald-400"/> :
                       isActive ? <Loader2 size={16} className="text-indigo-400 animate-spin"/> :
                                  <Circle size={16} className="text-white/20"/>}
                    </div>
                    <span className="text-lg flex-shrink-0">{s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className={clsx('text-sm font-medium', isDone?'text-white/80':isActive?'text-white':'text-white/40')}>{s.label}</div>
                      <div className="text-[11px] text-white/25 font-mono">{s.model}</div>
                    </div>
                    <div className="flex-shrink-0">
                      {isDone && <span className="text-[11px] text-emerald-400 font-mono">{times[s.key]}</span>}
                      {isActive && <span className="text-[11px] text-indigo-400 animate-pulse">running…</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {done && out && (
            <div className="glass rounded-xl overflow-hidden border border-emerald-500/20 animate-fade-in">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400"/>
                    <span className="text-sm font-medium text-emerald-400">Pipeline complete</span>
                    <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5">DEMO</span>
                  </div>
                  <div className="text-[11px] text-white/30 mt-0.5">{out.label}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleDownload} disabled={dlLoading}
                    className="flex items-center gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg px-3 py-1.5 transition-colors font-medium disabled:opacity-50">
                    {dlLoading ? <Loader2 size={11} className="animate-spin"/> : <Download size={11}/>}
                    {dlLoading ? 'Saving…' : `Download .${out.ext}`}
                  </button>
                  <button onClick={reset}
                    className="flex items-center gap-1.5 text-xs text-white/40 border border-white/10 rounded-lg px-3 py-1.5 hover:text-white/70 transition-colors">
                    <RefreshCw size={11}/> Reset
                  </button>
                </div>
              </div>

              <div className="p-4">
                {out.type==='video' && (
                  <video controls playsInline crossOrigin="anonymous"
                    className="w-full rounded-lg bg-black max-h-56 object-contain" key={out.url}>
                    <source src={out.url} type="video/mp4"/>
                    <source src={out.url} type="video/webm"/>
                  </video>
                )}
                {out.type==='audio' && (
                  <div className="bg-black/30 rounded-lg p-5 flex flex-col items-center gap-3">
                    <div className="text-3xl">🎵</div>
                    <audio controls className="w-full" key={out.url}>
                      <source src={out.url} type="audio/mpeg"/>
                    </audio>
                  </div>
                )}
                {out.type==='image' && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={out.url} alt="Generated" className="w-full rounded-lg object-cover max-h-56" crossOrigin="anonymous"/>
                )}

                {/* What real output looks like */}
                <div className="mt-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                  <div className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">Real output (requires API keys)</div>
                  <p className="text-[11px] text-white/40 leading-relaxed">{out.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
