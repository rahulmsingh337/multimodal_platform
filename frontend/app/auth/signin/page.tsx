'use client'
import { signIn } from 'next-auth/react'
import { Activity, Zap, Users, Video } from 'lucide-react'

export default function SignIn() {
  return (
    <div className="min-h-screen flex bg-[#07070e]">
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 border-r border-white/[0.06] bg-gradient-to-br from-indigo-950/40 to-purple-950/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Activity size={18} className="text-white" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">MultiModal AI</span>
        </div>

        <div>
          <h1 className="text-4xl font-semibold text-white leading-tight mb-4">
            Generate avatars,<br/>videos & voices<br/>
            <span className="gradient-text">powered by AI</span>
          </h1>
          <p className="text-white/40 text-sm leading-relaxed max-w-sm">
            Full-stack multimodal generation platform. GPT-4o NLP, SDXL images, SadTalker animation, SVD video, and ElevenLabs voice — all in one pipeline.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: Users,  label: 'Avatar Studio',   desc: 'Upload, train LoRA, animate with voice' },
              { icon: Video,  label: 'Text → Video',    desc: 'Full SVD pipeline with NLP refinement'  },
              { icon: Zap,    label: 'Voice Synthesis', desc: 'ElevenLabs TTS with voice cloning'      },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-indigo-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white/80">{label}</div>
                  <div className="text-xs text-white/30">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/20">© 2026 MultiModal AI Platform</p>
      </div>

      {/* Right — sign in */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <span className="text-white font-semibold">MultiModal AI</span>
          </div>

          <h2 className="text-2xl font-semibold text-white mb-1">Sign in</h2>
          <p className="text-white/40 text-sm mb-8">Authentication required to access the platform</p>

          <div className="glass rounded-2xl p-6 space-y-4">
            <button
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-900 font-medium text-sm rounded-xl py-3 px-4 transition-colors shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
                <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
                <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
              </svg>
              Continue with Google
            </button>

            <div className="border-t border-white/[0.06] pt-4">
              <p className="text-xs text-white/20 text-center leading-relaxed">
                By signing in you agree to our terms of service.<br/>
                Your data is kept private and secure.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <p className="text-xs text-amber-400/80 leading-relaxed">
              <span className="font-medium">Setup required:</span> Add <code className="text-amber-300 bg-amber-500/10 px-1 rounded">GOOGLE_CLIENT_ID</code>, <code className="text-amber-300 bg-amber-500/10 px-1 rounded">GOOGLE_CLIENT_SECRET</code>, and <code className="text-amber-300 bg-amber-500/10 px-1 rounded">NEXTAUTH_SECRET</code> to Vercel environment variables to enable Google sign-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
