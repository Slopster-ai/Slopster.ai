import Link from 'next/link'
import Image from 'next/image'
import Logo from '../slopsterlogo.webp'
import { Button } from '../components/ui/Button'
import { Container } from '../components/ui/Container'
import { Bot, Scissors, Gauge } from 'lucide-react'
import { getUser } from '../lib/supabase/auth'
import HomeAuthed from '../components/HomeAuthed'
import HeroGlassCard from '../components/HeroGlassCard'

export default async function HomePage() {
  const user = await getUser()
  if (user) {
    const name = (user.user_metadata as any)?.display_name || (user.email || '').split('@')[0] || 'there'
    return <HomeAuthed displayName={name} />
  }
  const siteClosed = process.env.NEXT_PUBLIC_SITE_CLOSED === 'true' || process.env.SITE_CLOSED === 'true'
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero: bold, minimal, anchored by logo */}
      <section className="flex flex-col items-center gap-8 pt-24 pb-20 text-center">
        <Container className="flex flex-col items-center gap-8">
          <HeroGlassCard>
            <Image src={Logo} alt="Slopster" className="opacity-90" priority />
            <h1 className="text-5xl md:text-7xl font-medium tracking-wide2 max-w-4xl">
              Make content people actually watch.
            </h1>
            <p className="max-w-2xl text-lg text-muted">
              Turn rough takes into crisp, captioned, algorithm-friendly shorts. Less polishing,
              more publishing.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {siteClosed ? (
                <>
                  <Link href="/waitlist">
                    <Button className="w-full sm:w-auto" size="lg">Join the waitlist</Button>
                  </Link>
                  <Link href="/waitlist">
                    <Button variant="ghost" className="w-full sm:w-auto" size="lg">Learn more</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signup">
                    <Button className="w-full sm:w-auto" size="lg">Start free</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="ghost" className="w-full sm:w-auto" size="lg">Log in</Button>
                  </Link>
                </>
              )}
            </div>
            {!siteClosed && <p className="text-xs text-muted">No credit card required.</p>}
          </HeroGlassCard>
        </Container>
      </section>

      {/* Features grid: consistent modules, subtle depth */}
      <section className="pb-28">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="surface hairline rounded-xl p-6">
              <Bot className="mb-4 h-6 w-6 text-foreground" aria-hidden />
            <h3 className="text-xl font-medium mb-2">AI script & hook</h3>
            <p className="text-sm text-muted">
              Generate tight scripts with hooks, beats and CTAs.
            </p>
          </div>
          <div className="surface hairline rounded-xl p-6">
              <Scissors className="mb-4 h-6 w-6 text-foreground" aria-hidden />
            <h3 className="text-xl font-medium mb-2">Auto edit & captions</h3>
            <p className="text-sm text-muted">
              Jump-cuts, silence removal, kinetic captions and timing you’d swear a human did.
            </p>
          </div>
          <div className="surface hairline rounded-xl p-6">
              <Gauge className="mb-4 h-6 w-6 text-foreground" aria-hidden />
            <h3 className="text-xl font-medium mb-2">Optimizer that cares</h3>
            <p className="text-sm text-muted">
              Thumbnails, hashtags and post timing. Helpful scores, no shaming.
            </p>
          </div>
          </div>
        </Container>
      </section>

      {/* CTA band */}
      <section className="pb-28">
        <Container>
          <div className="hairline rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-medium">Ship your next short in minutes</h2>
            </div>
            {siteClosed ? (
              <Link href="/waitlist">
                <Button size="lg">Join the waitlist</Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button size="lg">Get started</Button>
              </Link>
            )}
          </div>
        </Container>
      </section>
    </div>
  )
}

