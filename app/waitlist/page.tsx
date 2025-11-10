'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Label, Input } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'

export default function WaitlistPage() {
	const [email, setEmail] = useState('')
	const [name, setName] = useState('')
	const [useCase, setUseCase] = useState('')
	const [loading, setLoading] = useState(false)
	const [submitted, setSubmitted] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError(null)
		try {
			const params = new URLSearchParams(window.location.search)
			const url = `/api/waitlist?${params.toString()}`
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, name, use_case: useCase }),
			})
			const data = await res.json()
			if (!res.ok && !data?.ok) {
				throw new Error(data?.error || 'Failed to join waitlist.')
			}
			setSubmitted(true)
		} catch (err: any) {
			setError(err.message || 'Something went wrong.')
		} finally {
			setLoading(false)
		}
	}

	if (submitted) {
		return (
			<div className="min-h-[calc(100vh-4rem)] flex items-center">
				<Container className="max-w-xl w-full">
					<Card className="p-8">
						<CardHeader>
							<CardTitle>You're on the list ✅</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted">
								Thanks for your interest in Slopster. We’re inviting early users in waves.
								We’ll email you when your invite is ready.
							</p>
							<div className="flex gap-3">
								<Link href="/">
									<Button variant="ghost">Back to home</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				</Container>
			</div>
		)
	}

	return (
		<div className="min-h-[calc(100vh-4rem)] flex items-center">
			<Container className="max-w-xl w-full">
				<Card className="p-8">
					<CardHeader>
						<CardTitle>Join the waitlist</CardTitle>
					</CardHeader>
					<CardContent>
						<form className="space-y-4" onSubmit={handleSubmit}>
							<div>
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									required
									placeholder="you@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
							</div>
							<div>
								<Label htmlFor="name">Name (optional)</Label>
								<Input
									id="name"
									type="text"
									placeholder="Your name"
									value={name}
									onChange={(e) => setName(e.target.value)}
								/>
							</div>
							<div>
								<Label htmlFor="useCase">What will you use it for? (optional)</Label>
								<Input
									id="useCase"
									type="text"
									placeholder="e.g. clips for my podcast"
									value={useCase}
									onChange={(e) => setUseCase(e.target.value)}
								/>
							</div>
							{error && <p className="text-sm text-red-500">{error}</p>}
							<Button type="submit" className="w-full" disabled={loading}>
								{loading ? 'Joining…' : 'Join waitlist'}
							</Button>
							<p className="text-xs text-muted text-center">
								We’ll only email you about your invite.
							</p>
						</form>
					</CardContent>
				</Card>
			</Container>
		</div>
	)
}


