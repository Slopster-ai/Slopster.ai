import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import SupportWidget from '../components/SupportWidget'

export const metadata: Metadata = {
  title: 'Slopster.ai - AI-Powered Video Editor',
  description: 'Turn raw ideas into viral social videos with AI',
  icons: [
    { rel: 'icon', url: '/slopOtransparent.webp', type: 'image/webp' },
  ],
}

// Inter chosen for modern geometric simplicity
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="bg-background text-foreground">
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Skip link for a11y */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 rounded-xl bg-foreground px-4 py-2 text-background"
        >
          Skip to content
        </a>
        <NavBar />
        <main id="main-content">{children}</main>
        <SupportWidget />
        <Footer />
      </body>
    </html>
  )
}

