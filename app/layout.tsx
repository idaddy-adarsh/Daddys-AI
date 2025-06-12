import type { Metadata, Viewport } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import { Favicon } from './components/Favicon'
import './globals.css'
import { Analytics } from '@vercel/analytics/react';
import PageTransition from './components/PageTransition';
import { AuthProvider } from './contexts/AuthContext';

// Use Inter for body text - modern, clean and highly readable
const inter = Inter({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Use Montserrat for headings - elegant and impactful
const montserrat = Montserrat({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
})

// Separate viewport export
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: "Daddy's AI - Financial Intelligence",
  description: 'AI-powered insights and analytics for Indian stock market investors',
  keywords: 'AI, stock market, financial intelligence, trading, investment, India, NSE, BSE',
  authors: [{ name: "Daddy's AI Team" }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <html lang="en" suppressHydrationWarning className={`${inter.variable} ${montserrat.variable}`} style={{ scrollBehavior: 'smooth' }} data-theme="dark">
        <head>
          <Favicon />
          <meta name="theme-color" content="#000000" />
        </head>
        <body className={`${inter.className} bg-black text-white antialiased overflow-x-hidden`}>
          {/* Wrap the entire app with PageTransition for smooth transitions */}
          <PageTransition>
            <main className="min-h-screen flex flex-col">
              {children}
            </main>
          </PageTransition>
          <Analytics />
        </body>
      </html>
    </AuthProvider>
  )
}