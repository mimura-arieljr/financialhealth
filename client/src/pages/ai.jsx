import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PageHeader } from '../components/ui/pageHeader'
import { IconButton } from '../components/ui/button'
import { SendIcon, SparkleIcon } from '../components/ui/icons'

// Supabase edge function API URL
const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`

function UserMessage({ text }) {
  return (
    <div className="flex justify-end">
      <div className="bg-ink text-white text-sm rounded-[20px] rounded-tr-md px-4 py-2.5 max-w-[80%] whitespace-pre-wrap">
        {text}
      </div>
    </div>
  )
}

function AiMessage({ text }) {
  return (
    <div className="flex justify-start gap-2">
      <span className="w-7 h-7 rounded-full bg-ink text-cyan grid place-items-center shrink-0 mt-0.5"><SparkleIcon className="w-3.5 h-3.5" /></span>
      <div className="bg-sub text-ink text-sm rounded-[20px] rounded-tl-md px-4 py-2.5 max-w-[80%] whitespace-pre-wrap leading-relaxed">
        {text}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2" aria-label="Assistant is typing">
      <span className="w-7 h-7 rounded-full bg-ink text-cyan grid place-items-center shrink-0"><SparkleIcon className="w-3.5 h-3.5" /></span>
      <div className="bg-sub rounded-[20px] rounded-tl-md px-4 py-3 flex gap-1 items-center">
        <span className="w-1.5 h-1.5 bg-faint rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-faint rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-faint rounded-full animate-bounce" />
      </div>
    </div>
  )
}

const SUGGESTIONS = [
  'What are my total active recurring expenses per month?',
  'How much did I spend last month?',
  'What is my biggest spending category?',
  'Am I spending more than I earn?',
]

export default function AiChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (question) => {
    if (!question.trim() || loading) return

    setMessages(prev => [...prev, { role: 'user', text: question }])
    setInput('')
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ question }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Request failed')

      setMessages(prev => [...prev, { role: 'ai', text: data.answer }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: `Sorry, something went wrong: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div>
      <div className="hidden lg:block">
        <PageHeader title="AI Chat" subtitle="Ask anything about your finances." />
      </div>
      <div className="bg-card rounded-card flex flex-col h-[calc(100dvh-11.5rem)] lg:h-[calc(100dvh-15rem)] min-h-[420px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <span className="w-12 h-12 rounded-full bg-ink text-cyan grid place-items-center"><SparkleIcon className="w-6 h-6" /></span>
              <div>
                <p className="font-bold text-lg tracking-tight">Ask about your finances</p>
                <p className="text-muted text-sm mt-1">I have access to your real account data.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map(s => (
                  <button key={s} type="button" onClick={() => sendMessage(s)}
                    className="text-left text-xs font-medium bg-sub hover:bg-line rounded-row px-4 py-3 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) =>
            msg.role === 'user'
              ? <UserMessage key={i} text={msg.text} />
              : <AiMessage key={i} text={msg.text} />
          )}

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-line shrink-0">
          <div className="flex gap-2 items-center bg-sub rounded-full pl-4 pr-1.5 py-1.5 focus-within:ring-2 focus-within:ring-cyan-ink/25">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about your finances..."
              aria-label="Your question"
              disabled={loading}
              className="flex-1 bg-transparent text-base lg:text-sm outline-none placeholder:text-faint disabled:opacity-50 min-w-0"
            />
            <IconButton type="submit" label="Send" variant="ink" disabled={loading || !input.trim()}>
              <SendIcon className="w-4 h-4" />
            </IconButton>
          </div>
        </form>
      </div>
    </div>
  )
}
