'use client'
import { signIn } from 'next-auth/react'
import { Activity } from 'lucide-react'

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#07070e]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
            <Activity size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white">MultiModal AI</h1>
          <p className="text-white/40 text-sm mt-1">Sign in to access the platform</p>
        </div>

        <div className="glass rounded-2xl p-8">
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium text-sm rounded-xl py-3 px-4 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-white/20 mt-6">
            By signing in you agree to our terms of service
          </p>
        </div>
      </div>
    </div>
  )
}
