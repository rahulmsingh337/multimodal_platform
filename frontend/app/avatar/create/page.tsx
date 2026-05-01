'use client'
import { useState, useRef } from 'react'
import { Upload, Loader2, CheckCircle2, Download, Trash2 } from 'lucide-react'
import clsx from 'clsx'

const VOICES = [
  { id:'rachel', name:'Rachel', desc:'Calm, professional' },
  { id:'adam',   name:'Adam',   desc:'Deep, authoritative' },
  { id:'bella',  name:'Bella',  desc:'Warm, friendly'     },
  { id:'josh',   name:'Josh',   desc:'Young, energetic'   },
]

interface AvatarItem {
  id: string; name: string; emoji: string
  status: 'training'|'ready'; lora: boolean; created: string
  progress?: number; imageUrl?: string
}

const DEMO: AvatarItem[] = [
  { id:'av1', name:'Priya',  emoji:'👩', status:'ready',    lora:true,  created:'2h ago', imageUrl:'https://picsum.photos/seed/priya/200/200'  },
  { id:'av2', name:'Marcus', emoji:'👨', status:'ready',    lora:true,  created:'1d ago', imageUrl:'https://picsum.photos/seed/marcus/200/200' },
  { id:'av3', name:'Aiko',   emoji:'🧑', status:'training', lora:false, created:'10m ago', progress:42 },
]

export default function AvatarPage() {
  const [avatarName, setAvatarName] = useState('')
  const [voice, setVoice]           = useState('rachel')
  const [file, setFile]             = useState<File|null>(null)
  const [preview, setPreview]       = useState<string|null>(null)
  const [avatars, setAvatars]       = useState<AvatarItem[]>(DEMO)
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState<number|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setFile(f)
    const r = new FileReader(); r.onload = e => setPreview(e.target?.result as string); r.readAsDataURL(f)
  }

  async function handleCreate() {
    if (!file || !avatarName.trim()) return
    setUploading(true); setProgress(0)
    const previewUrl = preview!
    const emojis = ['👩‍💻','🧑‍🎤','👨‍🔬','👩‍🎨','🧑‍💼']
    const newAv: AvatarItem = {
      id:'av_'+Date.now(), name:avatarName,
      emoji:emojis[Math.floor(Math.random()*emojis.length)],
      status:'training', lora:false, created:'just now', progress:0, imageUrl:previewUrl,
    }
    setAvatars(p=>[...p, newAv])

    // Try real API, fallback to simulation
    try {
      const form = new FormData(); form.append('file', file); form.append('name', avatarName)
      await fetch('/api/v1/avatars/', { method:'POST', body:form })
    } catch {}

    // Simulate LoRA training progress
    let prog = 0
    const iv = setInterval(() => {
      prog += Math.random()*3+1
      if (prog >= 100) {
        prog = 100; clearInterval(iv)
        setAvatars(p=>p.map(a=>a.id===newAv.id?{...a,status:'ready',lora:true,progress:100}:a))
        setUploading(false); setProgress(null); setAvatarName(''); setFile(null); setPreview(null)
      } else {
        setAvatars(p=>p.map(a=>a.id===newAv.id?{...a,progress:Math.round(prog)}:a))
        setProgress(Math.round(prog))
      }
    }, 400)
  }

  async function handleDownload(av: AvatarItem) {
    if (!av.imageUrl) return
    try {
      const res = await fetch(av.imageUrl); const blob = await res.blob()
      const a = document.createElement('a'); a.href=URL.createObjectURL(blob)
      a.download=`avatar-${av.name}-${Date.now()}.jpg`; a.click(); URL.revokeObjectURL(a.href)
    } catch { window.open(av.imageUrl,'_blank') }
  }

  function handleDelete(id: string) {
    setAvatars(p=>p.filter(a=>a.id!==id))
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Avatar Studio</h1>
        <p className="text-sm text-white/40 mt-1">Upload · Train LoRA · Animate with voice</p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Create form */}
        <div className="col-span-2">
          <div className="glass rounded-xl p-6">
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-5">Create Avatar</h2>

            <div onClick={()=>fileRef.current?.click()}
              onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handleFile(f)}}
              onDragOver={e=>e.preventDefault()}
              className={clsx('border-2 border-dashed rounded-xl cursor-pointer transition-all mb-4',
                preview?'border-indigo-500/30 bg-indigo-500/5 p-1':'border-white/10 hover:border-white/20 bg-white/[0.02] p-8 flex flex-col items-center')}>
              {preview
                ? <img src={preview} alt="preview" className="w-full h-44 object-cover rounded-lg"/>
                : (<><Upload size={20} className="text-white/20 mb-3"/>
                    <div className="text-sm text-white/40 font-medium text-center">Drop image or click to upload</div>
                    <div className="text-xs text-white/20 mt-1 text-center">JPG/PNG · 512px min · face required</div></>)}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e=>{if(e.target.files?.[0])handleFile(e.target.files[0])}}/>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Avatar name</label>
                <input type="text" value={avatarName} onChange={e=>setAvatarName(e.target.value)}
                  placeholder="e.g. Dana" className="input-field"/>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-2">Voice</label>
                <div className="grid grid-cols-2 gap-2">
                  {VOICES.map(v=>(
                    <button key={v.id} onClick={()=>setVoice(v.id)}
                      className={clsx('text-left rounded-lg border p-2.5 transition-all text-xs',
                        voice===v.id?'border-indigo-500/40 bg-indigo-500/10 text-indigo-300':'border-white/[0.06] text-white/40 hover:border-white/20')}>
                      <div className="font-medium">{v.name}</div>
                      <div className="opacity-60 text-[10px] mt-0.5">{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {progress!==null&&(
                <div>
                  <div className="flex justify-between text-[11px] text-white/40 mb-1.5">
                    <span>LoRA training</span><span>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full shimmer rounded-full transition-all duration-500" style={{width:`${progress}%`}}/>
                  </div>
                </div>
              )}

              <button onClick={handleCreate} disabled={uploading||!file||!avatarName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl py-2.5 transition-colors">
                {uploading?<><Loader2 size={14} className="animate-spin"/>Training LoRA…</>:<><Upload size={14}/>Create Avatar</>}
              </button>
            </div>
          </div>
        </div>

        {/* Avatar grid */}
        <div className="col-span-3">
          <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">Your Avatars ({avatars.length})</h2>
          <div className="grid grid-cols-3 gap-4">
            {avatars.map(av=>(
              <div key={av.id} className="glass rounded-xl overflow-hidden">
                <div className="relative">
                  {av.imageUrl
                    ?<img src={av.imageUrl} alt={av.name} className="w-full h-32 object-cover"/>
                    :<div className="w-full h-32 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center text-4xl">{av.emoji}</div>}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {av.status==='ready'&&(
                      <button onClick={()=>handleDownload(av)}
                        className="w-6 h-6 bg-black/60 hover:bg-black/80 rounded-md flex items-center justify-center transition-colors" title="Download">
                        <Download size={11} className="text-white"/>
                      </button>
                    )}
                    <button onClick={()=>handleDelete(av.id)}
                      className="w-6 h-6 bg-black/60 hover:bg-red-500/80 rounded-md flex items-center justify-center transition-colors" title="Delete">
                      <Trash2 size={11} className="text-white"/>
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium text-white">{av.name}</div>
                    <span className={clsx('text-[10px] font-medium rounded-full px-2 py-0.5',
                      av.status==='ready'?'bg-emerald-500/10 text-emerald-400':'bg-amber-500/10 text-amber-400')}>
                      {av.status}
                    </span>
                  </div>
                  {av.status==='training'&&av.progress!==undefined&&(
                    <div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                        <div className="h-full shimmer rounded-full" style={{width:`${av.progress}%`}}/>
                      </div>
                      <div className="text-[10px] text-white/30 mt-1">LoRA {av.progress}%</div>
                    </div>
                  )}
                  {av.status==='ready'&&(
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-1 text-[10px] text-indigo-400">
                        <CheckCircle2 size={10}/> LoRA ready · {av.created}
                      </div>
                      <button onClick={()=>window.location.href='/generate'}
                        className="w-full text-[11px] font-medium text-indigo-400 border border-indigo-500/20 rounded-lg py-1.5 hover:bg-indigo-500/10 transition-colors">
                        Animate →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
