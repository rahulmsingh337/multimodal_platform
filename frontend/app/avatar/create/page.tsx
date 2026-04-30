'use client'
import { useState, useRef } from 'react'
import { Upload, Loader2, CheckCircle2, User, Mic, Trash2 } from 'lucide-react'
import clsx from 'clsx'

const voices = [
  { id: 'rachel', name: 'Rachel', desc: 'Calm, professional',  lang: 'en-US' },
  { id: 'adam',   name: 'Adam',   desc: 'Deep, authoritative', lang: 'en-US' },
  { id: 'bella',  name: 'Bella',  desc: 'Warm, friendly',      lang: 'en-US' },
  { id: 'josh',   name: 'Josh',   desc: 'Young, energetic',    lang: 'en-US' },
]

const demoAvatars = [
  { id: 'av1', name: 'Priya',  emoji: '👩', status: 'ready',    lora: true,  created: '2h ago'  },
  { id: 'av2', name: 'Marcus', emoji: '👨', status: 'training', lora: false, created: '30m ago', progress: 67 },
  { id: 'av3', name: 'Aiko',   emoji: '🧑', status: 'ready',    lora: true,  created: '1d ago'  },
]

export default function AvatarPage() {
  const [avatarName, setAvatarName] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('rachel')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [avatars, setAvatars] = useState(demoAvatars)
  const [newAvProgress, setNewAvProgress] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setFile(f)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  async function handleCreate() {
    if (!file || !avatarName.trim()) return
    setUploading(true)
    setNewAvProgress(0)
    const emojis = ['👩‍💻', '🧑‍🎤', '👨‍🔬', '👩‍🎨', '🧑‍💼']
    const newAv = {
      id: 'av_' + Date.now(),
      name: avatarName,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      status: 'training',
      lora: false,
      created: 'just now',
      progress: 0,
    }
    setAvatars(prev => [...prev, newAv])

    // Simulate LoRA training progress
    let prog = 0
    const iv = setInterval(() => {
      prog += Math.random() * 4 + 1
      if (prog >= 100) {
        prog = 100
        clearInterval(iv)
        setAvatars(prev => prev.map(a => a.id === newAv.id ? { ...a, status: 'ready', lora: true, progress: 100 } : a))
        setUploading(false)
        setNewAvProgress(null)
        setAvatarName('')
        setFile(null)
        setPreview(null)
      } else {
        setAvatars(prev => prev.map(a => a.id === newAv.id ? { ...a, progress: Math.round(prog) } : a))
        setNewAvProgress(Math.round(prog))
      }
    }, 500)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Avatar Studio</h1>
        <p className="text-sm text-white/40 mt-1">Upload · train LoRA · animate with voice</p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Create form */}
        <div className="col-span-2 space-y-5">
          <div className="glass rounded-xl p-6">
            <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-5">Create Avatar</h2>

            {/* Upload zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) handleFile(f) }}
              onDragOver={e => e.preventDefault()}
              className={clsx(
                'border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all mb-4',
                preview ? 'border-indigo-500/30 bg-indigo-500/5 p-2' : 'border-white/10 hover:border-white/20 bg-white/[0.02] p-8'
              )}
            >
              {preview ? (
                <img src={preview} alt="preview" className="w-full h-40 object-cover rounded-lg" />
              ) : (
                <>
                  <Upload size={20} className="text-white/20 mb-3" />
                  <div className="text-sm text-white/40 font-medium">Drop image or click to upload</div>
                  <div className="text-xs text-white/20 mt-1">JPG / PNG · min 512px · face required</div>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { if(e.target.files?.[0]) handleFile(e.target.files[0]) }} />

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Avatar name</label>
                <input type="text" value={avatarName} onChange={e => setAvatarName(e.target.value)} placeholder="e.g. Dana" className="input-field" />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5">Voice (ElevenLabs)</label>
                <div className="grid grid-cols-2 gap-2">
                  {voices.map(v => (
                    <button key={v.id} onClick={() => setSelectedVoice(v.id)}
                      className={clsx(
                        'text-left rounded-lg border p-2.5 transition-all text-xs',
                        selectedVoice === v.id
                          ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
                          : 'border-white/[0.06] text-white/40 hover:border-white/20'
                      )}
                    >
                      <div className="font-medium">{v.name}</div>
                      <div className="opacity-60 text-[10px] mt-0.5">{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {newAvProgress !== null && (
                <div>
                  <div className="flex justify-between text-[11px] text-white/40 mb-1.5">
                    <span>LoRA training</span><span>{newAvProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full shimmer rounded-full transition-all duration-500" style={{ width: `${newAvProgress}%` }} />
                  </div>
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={uploading || !file || !avatarName.trim()}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl py-2.5 transition-colors"
              >
                {uploading ? <><Loader2 size={14} className="animate-spin" /> Training LoRA…</> : <><Upload size={14} /> Create Avatar</>}
              </button>
            </div>
          </div>
        </div>

        {/* Avatar grid */}
        <div className="col-span-3">
          <h2 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-4">Your Avatars</h2>
          <div className="grid grid-cols-3 gap-4">
            {avatars.map(av => (
              <div key={av.id} className="glass rounded-xl p-4 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-600/30 flex items-center justify-center text-2xl mb-3">
                  {av.emoji}
                </div>
                <div className="text-sm font-medium text-white">{av.name}</div>
                <div className="mt-2">
                  <span className={clsx(
                    'text-[10px] font-medium rounded-full px-2 py-0.5',
                    av.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  )}>{av.status}</span>
                </div>
                {av.status === 'training' && (av as any).progress !== undefined && (
                  <div className="w-full mt-3">
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full shimmer rounded-full" style={{ width: `${(av as any).progress}%` }} />
                    </div>
                    <div className="text-[10px] text-white/30 mt-1">LoRA {(av as any).progress}%</div>
                  </div>
                )}
                {av.status === 'ready' && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-indigo-400">
                    <CheckCircle2 size={10} /> LoRA ready
                  </div>
                )}
                <div className="text-[10px] text-white/20 mt-2">{av.created}</div>
                {av.status === 'ready' && (
                  <button className="mt-3 w-full text-[11px] font-medium text-indigo-400 border border-indigo-500/20 rounded-lg py-1.5 hover:bg-indigo-500/10 transition-colors">
                    Animate →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
