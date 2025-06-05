import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import { Favicon } from './components/Favicon'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { dark, neobrutalism } from '@clerk/themes';
import { Analytics } from '@vercel/analytics/react';
import PageTransition from './components/PageTransition';

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

export const metadata: Metadata = {
  title: "Daddy's AI - Financial Intelligence",
  description: 'AI-powered insights and analytics for Indian stock market investors',
  keywords: 'AI, stock market, financial intelligence, trading, investment, India, NSE, BSE',
  authors: [{ name: "Daddy's AI Team" }],
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider 
      appearance={{
        baseTheme: [dark, neobrutalism],
        variables: {
          colorPrimary: '#f97316',
          colorText: '#ffffff',
          colorTextSecondary: '#e5e7eb',
          colorBackground: '#000000',
          colorDanger: '#ef4444',
          fontFamily: 'Inter, system-ui, sans-serif',
          borderRadius: '0.5rem',
        }
      }}
    >
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
    </ClerkProvider>
  )
}