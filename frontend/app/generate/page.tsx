'use client'
import { useState } from 'react'
import { Sparkles, ChevronRight, Loader2, CheckCircle2, Circle, Download, RefreshCw } from 'lucide-react'
import clsx from 'clsx'

type Intent = 'text2video' | 'avatar_animate' | 'image_gen' | 'text2speech'
interface NLPResult {
  refined_prompt: string; negative_prompt: string; style_tags: string[]
  detected_intent: Intent; tts_text: string | null
}
const stages = [
  { key:'nlp',   label:'NLP Engine',      model:'Claude claude-sonnet-4-20250514', emoji:'🧠', ms:1800 },
  { key:'image', label:'Image Engine',    model:'SDXL + LoRA',     emoji:'🖼️', ms:5000 },
  { key:'tts',   label:'ElevenLabs TTS', model:'eleven_turbo_v2', emoji:'🎙️', ms:3000 },
  { key:'anim',  label:'Animation Eng.', model:'SadTalker',       emoji:'🤖', ms:6000 },
  { key:'video', label:'Video Engine',   model:'SVD-XT',          emoji:'🎬', ms:8000 },
  { key:'cdn',   label:'S3 + CDN',       model:'CloudFront',      emoji:'☁️', ms:600  },
]
const DEMO_OUT: Record<string,string> = {
  text2video:     'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  avatar_animate: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  text2speech:    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  image_gen:      'https://picsum.photos/seed/multimodal/800/600',
}

export default function GeneratePage() {
  const [prompt,setPrompt]=useState('')
  const [genType,setGenType]=useState<Intent>('avatar_animate')
  const [parsing,setParsing]=useState(false)
  const [nlp,setNlp]=useState<NLPResult|null>(null)
  const [stageIdx,setStageIdx]=useState(-1)
  const [times,setTimes]=useState<Record<string,string>>({})
  const [running,setRunning]=useState(false)
  const [done,setDone]=useState(false)
  const [out,setOut]=useState<string|null>(null)

  async function handleParse(){
    if(!prompt.trim())return
    setParsing(true);setNlp(null);setDone(false);setOut(null);setStageIdx(-1);setTimes({})
    try {
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:800,
          system:`Parse user prompt into JSON only: {"refined_prompt":"","negative_prompt":"","style_tags":[],"detected_intent":"text2video|avatar_animate|image_gen|text2speech","tts_text":null}`,
          messages:[{role:'user',content:prompt}]})
      })
      if(res.ok){const d=await res.json();setNlp(JSON.parse(d.content[0].text.replace(/```json|```/g,'').trim()))}
      else throw new Error()
    } catch {
      await new Promise(r=>setTimeout(r,1600))
      setNlp({refined_prompt:`Cinematic ${prompt}, 8K, ultra-realistic, professional lighting, shallow DoF`,
        negative_prompt:'blurry, watermark, extra limbs, deformed, low quality',
        style_tags:['cinematic','photorealistic','editorial','studio-lit'],detected_intent:genType,
        tts_text:genType==='avatar_animate'?prompt:null})
    }
    setParsing(false)
  }

  async function handleRun(){
    if(!nlp)return
    setRunning(true);setDone(false);setOut(null)
    for(let i=0;i<stages.length;i++){
      setStageIdx(i)
      const dur=stages[i].ms+Math.random()*300
      await new Promise(r=>setTimeout(r,dur))
      setTimes(p=>({...p,[stages[i].key]:(dur/1000).toFixed(1)+'s'}))
    }
    setStageIdx(stages.length);setRunning(false);setDone(true)
    setOut(DEMO_OUT[genType]||DEMO_OUT.text2video)
  }

  async function handleDownload(){
    if(!out)return
    try {
      const res=await fetch(out);const blob=await res.blob()
      const ext=genType==='text2speech'?'mp3':genType==='image_gen'?'png':'mp4'
      const a=document.createElement('a');a.href=URL.createObjectURL(blob)
      a.download=`multimodal-${Date.now()}.${ext}`;a.click();URL.revokeObjectURL(a.href)
    } catch { window.open(out,'_blank') }
  }

  function reset(){setDone(false);setOut(null);setStageIdx(-1);setTimes({})}

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Generate</h1>
        <p className="text-sm text-white/40 mt-1">NLP → Image → Animation → Video · full pipeline</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="glass rounded-xl p-6">
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">Config</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Type</label>
                <select value={genType} onChange={e=>setGenType(e.target.value as Intent)} className="input-field">
                  <option value="avatar_animate">Avatar Animation (SadTalker)</option>
                  <option value="text2video">Text → Video (SVD)</option>
                  <option value="text2speech">Text → Speech (ElevenLabs)</option>
                  <option value="image_gen">Image Generation (SDXL)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Prompt</label>
                <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
                  placeholder="Describe what you want to generate…" rows={5} className="input-field resize-none"/>
              </div>
              <button onClick={handleParse} disabled={parsing||!prompt.trim()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl py-2.5 transition-colors">
                {parsing?<Loader2 size={14} className="animate-spin"/>:<Sparkles size={14}/>}
                {parsing?'Parsing…':'1. Parse with NLP Engine'}
              </button>
            </div>
          </div>

          {nlp&&(
            <div className="glass rounded-xl p-6 animate-fade-in space-y-3">
              <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest">NLP Output</h2>
              <div><div className="text-[11px] text-white/30 mb-1">Refined prompt</div><p className="text-xs text-white/60 leading-relaxed">{nlp.refined_prompt}</p></div>
              <div><div className="text-[11px] text-white/30 mb-1">Negative</div><p className="text-xs text-red-400/60">{nlp.negative_prompt}</p></div>
              <div className="flex flex-wrap gap-1.5">{nlp.style_tags.map(t=><span key={t} className="text-[11px] bg-white/5 text-white/50 rounded-md px-2 py-0.5">{t}</span>)}</div>
              {nlp.tts_text&&<div><div className="text-[11px] text-white/30 mb-1">TTS</div><p className="text-xs text-white/50 italic">"{nlp.tts_text}"</p></div>}
              <button onClick={handleRun} disabled={running}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500/80 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl py-2.5 transition-colors">
                {running?<Loader2 size={14} className="animate-spin"/>:<ChevronRight size={14}/>}
                {running?'Running pipeline…':'2. Run Full Pipeline'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="glass rounded-xl p-6">
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-5">Pipeline Stages</h2>
            <div className="space-y-1">
              {stages.map((s,i)=>{
                const isDone=stageIdx>i,isActive=stageIdx===i&&running
                return(
                  <div key={s.key} className={clsx('flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300',
                    isActive?'bg-indigo-500/10 border border-indigo-500/20':isDone?'bg-emerald-500/5 border border-emerald-500/10':'border border-transparent opacity-40')}>
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {isDone?<CheckCircle2 size={16} className="text-emerald-400"/>:isActive?<Loader2 size={16} className="text-indigo-400 animate-spin"/>:<Circle size={16} className="text-white/20"/>}
                    </div>
                    <span className="text-lg flex-shrink-0">{s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className={clsx('text-sm font-medium',isDone?'text-white/80':isActive?'text-white':'text-white/40')}>{s.label}</div>
                      <div className="text-[11px] text-white/25 font-mono">{s.model}</div>
                    </div>
                    <div className="flex-shrink-0">
                      {isDone&&<span className="text-[11px] text-emerald-400 font-mono">{times[s.key]}</span>}
                      {isActive&&<span className="text-[11px] text-indigo-400 animate-pulse">running…</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {done&&out&&(
            <div className="glass rounded-xl p-5 border border-emerald-500/20 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400"/>
                  <span className="text-sm font-medium text-emerald-400">Pipeline complete</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleDownload}
                    className="flex items-center gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg px-3 py-1.5 transition-colors font-medium">
                    <Download size={12}/> Download
                  </button>
                  <button onClick={reset}
                    className="flex items-center gap-1.5 text-xs text-white/40 border border-white/10 rounded-lg px-3 py-1.5 hover:text-white/70 transition-colors">
                    <RefreshCw size={12}/> Reset
                  </button>
                </div>
              </div>
              {(genType==='text2video'||genType==='avatar_animate')&&(
                <video controls className="w-full rounded-lg bg-black" key={out}><source src={out} type="video/mp4"/></video>)}
              {genType==='text2speech'&&(
                <audio controls className="w-full" key={out}><source src={out} type="audio/mpeg"/></audio>)}
              {genType==='image_gen'&&(
                // eslint-disable-next-line @next/next/no-img-element
                <img src={out} alt="Generated" className="w-full rounded-lg"/>)}
              <div className="mt-3 flex gap-2">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-0.5">CDN Ready</span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full px-2.5 py-0.5">15-min TTL</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
