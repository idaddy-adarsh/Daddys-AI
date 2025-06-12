'use client'

import { useRef, useEffect } from 'react'

// Removed Three.js imports as we're using a video instead of 3D visualization

export function StockVisualization() {
  const container = useRef(null)
  
  useEffect(() => {
    // Animation will be added later when GSAP is properly configured
  }, [])

  return (
    <section id="visualization" ref={container} className="py-16 sm:py-20 md:py-24 bg-[#050714] relative">
      {/* Grid background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
      <div className="absolute top-40 right-1/5 w-2 h-2 rounded-full bg-orange-500 blur-sm animate-pulse" />
      <div className="absolute bottom-60 left-1/4 w-3 h-3 rounded-full bg-orange-400 blur-sm animate-pulse" style={{ animationDelay: '1.5s' }} />
      
      <div className="container relative z-10 px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-block px-3 sm:px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-medium tracking-wider mb-3 sm:mb-4">
            MARKET INTELLIGENCE
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-white font-montserrat">
            Interactive <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">Market Visualizations</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-3xl mx-auto">
            Explore complex market data through our intuitive 3D visualizations. 
            Understand trends, patterns, and correlations that traditional 2D charts can't reveal.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12 lg:gap-16">
          <div className="visualization-content w-full lg:w-1/2 space-y-6 sm:space-y-8">
            <div className="bg-[#0a0d1a] border border-orange-500/20 rounded-xl p-4 sm:p-6 shadow-lg shadow-orange-500/5">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white">Advanced Market Analysis</h3>
              <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
                Our AI-powered platform processes vast amounts of market data to identify patterns and trends that human analysts might miss.
              </p>
              <ul className="space-y-3 sm:space-y-5">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 bg-orange-500/10 p-1.5 rounded-full">
                    <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-300">3D trend analysis for better pattern recognition</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 bg-orange-500/10 p-1.5 rounded-full">
                    <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-300">Real-time data streaming for up-to-the-minute insights</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1 bg-orange-500/10 p-1.5 rounded-full">
                    <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-300">Customizable views for different analysis approaches</p>
                </li>
              </ul>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4 bg-orange-500/5 border border-orange-500/10 rounded-lg p-3 sm:p-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-medium">Real-time Updates</h4>
                <p className="text-gray-400 text-sm">Data refreshes every 5 seconds during market hours</p>
              </div>
            </div>
          </div>
          
          <div className="stock-video w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] lg:w-1/2 relative rounded-xl sm:rounded-2xl overflow-hidden border border-orange-500/30 shadow-xl shadow-orange-500/10 bg-gradient-to-br from-[#0a0d1a] to-[#050714] mt-8 lg:mt-0">
            {/* Decorative elements */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#0a0d1a]/80 backdrop-blur-sm px-3 py-1.5 rounded-md border border-orange-500/20">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs text-orange-400 font-mono tracking-wider">LIVE MARKET</span>
            </div>
            
            {/* Video player */}
            <video 
              className="w-full h-full object-cover"
              autoPlay 
              loop 
              muted 
              playsInline
            >
              <source src="/204306-923909642.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {/* UI overlay elements */}
            <div className="absolute bottom-4 right-4 z-10 px-4 py-2 rounded-md bg-[#0a0d1a]/80 backdrop-blur-sm border border-orange-500/30 text-orange-400 text-xs font-mono tracking-wider">
              VOLUME: 1.2B SHARES
            </div>
            
            <div className="absolute top-4 right-4 z-10 px-4 py-2 rounded-md bg-[#0a0d1a]/80 backdrop-blur-sm border border-orange-500/30 text-orange-400 text-xs font-mono tracking-wider">
              NIFTY 50: <span className="text-orange-300">+1.2%</span>
            </div>
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#050714]/90 via-transparent to-[#050714]/40" />
          </div>
        </div>
      </div>
      
      {/* Decorative element */}
      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
    </section>
  )
}
