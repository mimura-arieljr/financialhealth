import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Supabase edge function API URL
const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`

function UserMessage({ text }) {
  return (
    <div className="flex justify-end">
      <div className="bg-emerald-500 text-neutral-950 text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
        {text}
      </div>
    </div>
  )
}

function AiMessage({ text }) {
  return (
    <div className="flex justify-start">
      <div className="bg-neutral-800 text-neutral-100 text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%] whitespace-pre-wrap">
        {text}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-neutral-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
        <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" />
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
    <div className="flex flex-col h-screen sm:h-[calc(100vh)] max-h-screen">
      {/* Header */}
      <div className="px-6 py-5 shrink-0 hidden md:block">
        <h1 className="text-2xl font-semibold text-white">AI Assistant</h1>
        <p className="text-neutral-500 text-sm mt-1">Ask anything about your finances.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
            <div>
              <p className="text-white font-medium mb-1">Ask about your finances</p>
              <p className="text-neutral-500 text-sm">I have access to your real account data.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs text-neutral-400 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl px-4 py-3 transition-colors"
                >
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
      <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 border-t border-neutral-800 shrink-0">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            disabled={loading}
            className="flex-1 bg-neutral-900 border border-neutral-800 text-white text-sm rounded-xl px-4 py-3 placeholder-neutral-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-neutral-950 rounded-xl px-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
