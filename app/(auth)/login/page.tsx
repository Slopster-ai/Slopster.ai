'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Label, Input } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const authClient = remember ? supabase : createClient({ storage: 'session' })

    const { error } = await authClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <Container>
      <div className="py-16 max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to Slopster</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleEmailLogin}>
              {error && (
                <div className="rounded-xl hairline p-3"><p className="text-sm">{error}</p></div>
              )}

              <div>
                <Label htmlFor="email-address" className="mb-1">Email address</Label>
                <Input id="email-address" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" />
              </div>
              <div>
                <Label htmlFor="password" className="mb-1">Password</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border hairline"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <Button type="submit" disabled={loading} className="w-full">{loading ? 'Signing in…' : 'Sign in'}</Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted">No account? <Link href="/signup" className="hover:text-foreground">Create one</Link></p>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}

