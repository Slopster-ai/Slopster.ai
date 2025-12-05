import Link from 'next/link'
import { Container } from './ui/Container'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-[#1f1f22]">
      <Container className="flex flex-col md:flex-row items-center justify-between py-10 gap-6">
        <p className="text-sm text-muted">© {new Date().getFullYear()} Slopster. Sit back, we'll take it from here.</p>
        <nav className="flex items-center gap-6 text-sm text-muted">
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/dashboard" className="hover:text-foreground">Tools</Link>
        </nav>
      </Container>
    </footer>
  )
}


