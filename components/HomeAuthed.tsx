"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Container } from './ui/Container'
import { Button } from './ui/Button'

export default function HomeAuthed({ displayName }: { displayName: string }) {
  const [greeting, setGreeting] = useState('Hello')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  const name = useMemo(() => displayName || 'there', [displayName])

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="flex flex-col items-center gap-8 pt-24 pb-20 text-center">
        <Container className="flex flex-col items-center gap-6">
          <h1 className="text-4xl md:text-6xl font-medium tracking-wide2 max-w-4xl">
            {greeting}, {name}!
          </h1>
          <p className="max-w-2xl text-lg text-muted">
            Jump back into your work or start something new.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard">
              <Button className="w-full sm:w-auto" size="lg">Go to dashboard</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full sm:w-auto" size="lg">Create a project</Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  )
}











