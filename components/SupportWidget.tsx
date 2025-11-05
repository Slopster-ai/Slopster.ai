"use client"

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Icon from '../slopOtransparent.webp'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export default function SupportWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I’m Slopster Support. How can I help?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const next = [...messages, { role: 'user', content: input.trim() }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      const data = await res.json()
      if (data?.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: "Sorry, I couldn't process that. Try again." },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Network error. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 hidden md:block select-none"
        aria-label={open ? 'Close support' : 'Open support'}
      >
        <div className="mascot-bob transition-transform hover:-rotate-6">
          <Image src={Icon} alt="" className="h-11 w-11 drop-shadow" priority />
        </div>
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 hidden md:flex w-[320px] max-h-[60vh] flex-col rounded-xl border hairline bg-background shadow-xl">
          <div className="flex items-center justify-between p-3 border-b hairline">
            <div className="flex items-center gap-2">
              <Image src={Icon} alt="" className="h-6 w-6" />
              <span className="text-sm font-medium">Slopster Support</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground">✕</button>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={
                    'inline-block rounded-lg px-3 py-2 text-sm ' +
                    (m.role === 'user' ? 'bg-foreground text-background' : 'bg-surface text-foreground')
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-left">
                <div className="inline-block rounded-lg px-3 py-2 text-sm bg-surface text-foreground opacity-80">
                  Typing…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form onSubmit={sendMessage} className="p-3 border-t hairline flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 rounded-lg border hairline bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-foreground px-3 py-2 text-sm text-background hover:bg-accent hover:text-accent-foreground disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}


