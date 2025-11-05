'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Container } from '@/components/ui/Container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Label, Input } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'

export default function WelcomePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return
      if (!user) {
        router.replace('/login')
        return
      }
      const existing = (user.user_metadata as any)?.display_name as string | undefined
      if (existing && existing.trim()) {
        router.replace('/dashboard')
        return
      }
      const email = user.email || ''
      const guess = email.includes('@') ? email.split('@')[0] : ''
      setName(guess)
      setLoading(false)
    })
    return () => { mounted = false }
  }, [router, supabase])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) return
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: name.trim() },
      })
      if (error) throw error
      router.replace('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to save name')
    }
  }

  if (loading) return null

  return (
    <Container>
      <div className="py-16 max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Welcome! 🎉</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={save}>
              {error && <div className="rounded-xl hairline p-3 text-sm">{error}</div>}

              <p className="text-muted">Great to have you here. What should we call you?</p>
              <div>
                <Label htmlFor="display-name" className="mb-1">Your name</Label>
                <Input
                  id="display-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Alex"
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" className="w-full">Continue</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}


