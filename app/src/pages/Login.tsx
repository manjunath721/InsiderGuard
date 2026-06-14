import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Lock } from 'lucide-react'

export function LoginPage() {
  const { login, loading, error } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await login(username.trim(), password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4">
      <div className="max-w-md w-full rounded-3xl border border-[rgba(245,245,240,0.06)] bg-[#0A0A0A] p-8 shadow-[0_0_40px_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#0A84FF] flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#F5F5F0]">InsiderGuard Sign In</h1>
            <p className="text-sm text-[#8A8A93]">Enterprise threat detection platform access</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A8A93]">Username or Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[rgba(245,245,240,0.08)] bg-[#111111] px-4 py-3 text-sm text-[#F5F5F0] focus:outline-none focus:border-[#0A84FF]"
              placeholder="john.smith@company.com"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8A8A93]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-[rgba(245,245,240,0.08)] bg-[#111111] px-4 py-3 text-sm text-[#F5F5F0] focus:outline-none focus:border-[#0A84FF]"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-sm text-[#FF3B30]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#0A84FF] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0066D6] disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-[11px] text-[#5A5A63]">Need access? Contact your SOC administrator for onboarding.</p>
      </div>
    </div>
  )
}
