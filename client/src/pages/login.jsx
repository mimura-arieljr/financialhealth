import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { FieldInput } from '../components/ui/fieldInput'
import { ErrorBanner } from '../components/ui/errorBanner'
import { Button } from '../components/ui/button'

// Decorative sample numbers on the hero panel; the visitor is not signed in yet
function SampleCard({ label, value, className = '' }) {
  return (
    <div aria-hidden="true" className={`bg-card/90 rounded-[18px] px-4 py-3 shadow-[0_10px_30px_rgba(14,116,144,0.18)] ${className}`}>
      <p className="text-xs text-muted font-medium">{label}</p>
      <p className="text-xl font-bold tracking-tight tnum mt-0.5">{value}</p>
    </div>
  )
}

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (isSignUp) {
      const { error } = await signUp(email, password)
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    } else {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-canvas flex items-center justify-center lg:p-6">
      <div className="w-full max-w-[980px] lg:bg-card lg:rounded-[28px] lg:p-3 lg:grid lg:grid-cols-[1.05fr_1fr] lg:shadow-[0_20px_60px_rgba(14,17,22,0.08)]">
        {/* Hero panel */}
        <div className="relative bg-hero overflow-hidden rounded-b-[28px] lg:rounded-[22px] px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-8 lg:p-8 lg:min-h-[560px] flex flex-col">
          <div className="inline-flex items-center gap-2 font-bold text-lg tracking-tight self-start">
            <img src="/fundora_logo.svg" alt="" className="w-7 h-7" />
            Fundora
          </div>
          <h1 className="text-[30px] lg:text-[40px] font-bold tracking-[-0.035em] leading-[1.05] mt-8 lg:mt-14 max-w-sm">
            Personal finance, under control.
          </h1>
          <p className="text-[#155E75] text-sm lg:text-base mt-3 max-w-xs">Expenses, income, cards and bills in one calm place.</p>
          <div className="hidden lg:block relative mt-auto h-40">
            <SampleCard label="Spent this month" value="₱18,420" className="absolute left-0 bottom-14 w-52" />
            <SampleCard label="Net this month" value={<span className="text-good">+₱23,580</span>} className="absolute left-36 bottom-0 w-52" />
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-8 lg:px-12 lg:py-10 flex flex-col justify-center">
          <h2 className="text-2xl font-bold tracking-tight">{isSignUp ? 'Create your account' : 'Welcome back'}</h2>
          <p className="text-sm text-muted mt-1">{isSignUp ? 'Start tracking your money with Fundora.' : 'Sign in to your Fundora account.'}</p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-7">
            <FieldInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
            <FieldInput label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />
            <ErrorBanner message={error} />
            {message && <p role="status" className="text-good text-xs font-medium bg-good-bg rounded-row px-3 py-2">{message}</p>}
            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
              className="font-semibold text-cyan-ink hover:underline">
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
          <p className="text-center text-xs text-faint mt-8">©Chock Mimura. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
