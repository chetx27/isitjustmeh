import React from 'react'
import type { Metadata } from 'next'
import { Syne, DM_Sans, JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const syne = Syne({ 
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const jbMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Is It Just Me? 🇮🇳',
  description: "India's real-time, crowdsourced outage detection platform.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable} ${jbMono.variable}`}>
      <body className="flex flex-col min-h-screen">
        <header className="border-b border-border bg-surface sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="font-disp font-extrabold text-2xl tracking-tighter flex items-center gap-2">
              <span className="w-4 h-4 bg-accent rounded-sm inline-block" />
              Is It Just Me?
            </Link>
            <nav className="flex items-center gap-6 text-sm font-semibold">
              <Link href="/outages" className="hover:text-accent transition-colors">Active Outages</Link>
              <Link href="/suggest" className="hover:text-accent transition-colors">Add Service</Link>
            </nav>
          </div>
        </header>
        
        <main className="flex-1">
          {children}
        </main>
        
        <footer className="border-t border-border bg-surface mt-12 py-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted">
            <p>Built for India 🇮🇳. No tracking, zero friction.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
