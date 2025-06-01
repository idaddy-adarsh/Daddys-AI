'use client'

import { useRef, useEffect } from 'react'
import { Button } from './ui/button'

export function CTA() {
  const container = useRef(null)
  
  useEffect(() => {
    // Animation will be added later when GSAP is properly configured
  }, [])

  return (
    <section ref={container} className="py-24 bg-[#050714] relative">
      {/* Grid background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
      <div className="absolute top-1/4 right-1/4 w-3 h-3 rounded-full bg-orange-500/50 blur-sm animate-pulse" />
      <div className="absolute bottom-1/3 left-1/5 w-2 h-2 rounded-full bg-orange-400/50 blur-sm animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="container relative z-10 px-6">
        <div className="cta-content bg-[#0a0d1a] rounded-2xl p-8 md:p-12 shadow-xl shadow-orange-500/10 border border-orange-500/20 text-center relative overflow-hidden">
          {/* Background glow effect */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="inline-block px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-medium tracking-wider mb-4">
              LIMITED TIME OFFER
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-white font-montserrat">
              Ready to Transform Your <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">Investment Strategy</span>?
            </h2>
            
            <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-8">
              Join thousands of investors using Daddy's AI to gain an edge in the Indian stock market. 
              Start your 14-day free trial today - no credit card required.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium px-8 py-6 h-auto text-lg">
                Get Started for Free
              </Button>
              <Button size="lg" variant="outline" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 px-8 py-6 h-auto text-lg">
                Book a Demo
              </Button>
            </div>
            
            <div className="mt-8 text-gray-400 text-sm flex items-center justify-center gap-2">
              <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Secure payment processing with end-to-end encryption</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
