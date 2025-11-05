'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Label, Input } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/welcome`,
      },
    })

    if (error) {
      const msg = error.message?.toLowerCase() || ''
      if (msg.includes('signups not allowed') || msg.includes('signup_disabled')) {
        setError("We're currently under construction, please check back later! :)")
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      router.push('/welcome')
      router.refresh()
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/welcome`,
      },
    })

    if (error) {
      const msg = error.message?.toLowerCase() || ''
      if (msg.includes('signups not allowed') || msg.includes('signup_disabled')) {
        setError("We're currently under construction, please check back later! :)")
      } else {
        setError(error.message)
      }
      setLoading(false)
    }
  }

  return (
    <Container>
      <div className="py-16 max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleEmailSignup}>
              {error && (
                <div className="rounded-xl hairline p-3"><p className="text-sm">{error}</p></div>
              )}

              <div>
                <Label htmlFor="email-address" className="mb-1">Email address</Label>
                <Input id="email-address" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" />
              </div>
              <div>
                <Label htmlFor="password" className="mb-1">Password</Label>
                <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>

              <Button type="submit" disabled={loading} className="w-full">{loading ? 'Creating account…' : 'Sign up'}</Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted">Already have an account? <Link href="/login" className="hover:text-foreground">Sign in</Link></p>
          </CardContent>
        </Card>
      </div>
    </Container>
  )
}

