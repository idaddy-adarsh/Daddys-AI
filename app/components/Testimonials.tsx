'use client'

import { useRef, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Card, CardContent, CardHeader } from './ui/card'

const testimonials = [
  {
    name: "Ankit Gangwar",
    role: "Swing Trader",
    company: "Nice Workings",
    content: "It is working very well in stocks in swing trades ………although in option sir in morning upto half an hour I feel that some wrong predictions …..but after half an hour ……it’s predictions are really working ……that’s my experience",
    avatar: "/avatars/rahul.jpg",
    rating: 5,
  },
  {
    name: "Priya Patel",
    role: "Retail Investor",
    company: "",
    content: "As someone new to stock markets, Daddy's AI made complex concepts accessible. My portfolio is up 32% in 6 months!",
    avatar: "/avatars/priya.jpg",
    rating: 5,
  },
  {
    name: "Vikram Mehta",
    role: "Fund Manager",
    company: "NSE Investments",
    content: "The Indian market-specific insights give us an edge over competitors using generic international tools.",
    avatar: "/avatars/vikram.jpg",
    rating: 5,
  },
]

// Star rating component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <svg 
          key={i} 
          className={`w-4 h-4 ${i < rating ? 'text-orange-500' : 'text-gray-500'}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export function Testimonials() {
  const container = useRef(null)
  
  useEffect(() => {
    // Animation will be added later when GSAP is properly configured
  }, [])

  return (
    <section id="testimonials" ref={container} className="py-16 sm:py-20 md:py-24 bg-[#050714] relative">
      {/* Grid background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
      <div className="absolute top-40 right-1/4 w-2 h-2 rounded-full bg-orange-500 blur-sm animate-pulse" />
      <div className="absolute bottom-60 left-1/3 w-3 h-3 rounded-full bg-orange-400 blur-sm animate-pulse" style={{ animationDelay: '1.5s' }} />
      
      <div className="container relative z-10 px-4 sm:px-6">
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-block px-3 sm:px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-medium tracking-wider mb-3 sm:mb-4">
            CLIENT TESTIMONIALS
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-white font-montserrat">
            Trusted by <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">Indian Investors</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-3xl mx-auto">
            Professionals and retail investors alike rely on Daddy's AI for their Indian market analysis.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="testimonial-card bg-[#0a0d1a] border-orange-500/20 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 relative overflow-hidden">
              {/* Quote mark decoration */}
              <div className="absolute top-4 right-4 text-6xl text-orange-500/10 font-serif">"</div>
              
              <CardContent className="p-5 sm:p-6 md:p-8 relative z-10">
                <StarRating rating={testimonial.rating} />
                
                <p className="text-gray-300 my-4 sm:my-6 text-base sm:text-lg leading-relaxed">"{testimonial.content}"</p>
                
                <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-orange-500/10 flex items-center gap-3 sm:gap-4">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-orange-500/20">
                    <AvatarImage src={testimonial.avatar} />
                    <AvatarFallback className="bg-orange-500/10 text-orange-500">
                      {testimonial.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-white">{testimonial.name}</h4>
                    <p className="text-sm text-orange-400">
                      {testimonial.role}
                      {testimonial.company && `, `}
                      <span className="text-gray-400">{testimonial.company}</span>
                    </p>
                  </div>
                </div>
                
                {/* Decorative element */}
                <div className="absolute bottom-4 right-4 flex space-x-1">
                  <div className="w-1 h-1 rounded-full bg-orange-500/40"></div>
                  <div className="w-1 h-1 rounded-full bg-orange-500/60"></div>
                  <div className="w-1 h-1 rounded-full bg-orange-500/80"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Additional trust indicators */}
        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-orange-500/10 flex flex-wrap justify-center gap-5 sm:gap-8 text-gray-400 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Bank-Level Security</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>10,000+ Active Users</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span>4.9/5 Average Rating</span>
          </div>
        </div>
      </div>
      
      {/* Decorative element */}
      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
    </section>
  )
}
