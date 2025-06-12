'use client'

import Link from 'next/link'
import { Button } from './ui/button'
import { Logo } from './Logo'
import { useAuth } from '@/app/contexts/AuthContext'

export function Footer() {
  const { isAuthenticated } = useAuth()
  
  return (
    <footer className="border-t border-orange-500/20 py-16 bg-[#050714] relative">
      {/* Grid background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
      <div className="absolute top-10 left-1/4 w-2 h-2 rounded-full bg-orange-500 blur-sm animate-pulse" />
      <div className="absolute bottom-20 right-1/3 w-1 h-1 rounded-full bg-orange-400 blur-sm animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-40 h-40 rounded-full bg-orange-500/10 filter blur-[80px]" />
      
      <div className="container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo size="lg" className="mb-2" />
            <p className="text-gray-400 leading-relaxed">
              AI-powered financial intelligence for the Indian stock market. Empowering investors with data-driven insights.
            </p>
            
            {/* Social links */}
            <div className="flex gap-4 mt-6">
              {[
                { name: "twitter", icon: "X" },
                { name: "linkedin", icon: "in" },
                { name: "facebook", icon: "f" },
                { name: "instagram", icon: "Ig" }
              ].map((social) => (
                <a 
                  key={social.name} 
                  href={`https://${social.name}.com`} 
                  className="w-9 h-9 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all duration-300"
                  aria-label={social.name}
                >
                  <span className="text-xs font-medium">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-white text-lg">Product</h4>
            <ul className="space-y-3 text-gray-400">
              <li><Link href="#features" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                <span className="w-1 h-1 bg-orange-500/50 rounded-full"></span>Features
              </Link></li>
              <li><Link href="#visualization" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                <span className="w-1 h-1 bg-orange-500/50 rounded-full"></span>Market Insights
              </Link></li>
              <li><Link href="#pricing" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                <span className="w-1 h-1 bg-orange-500/50 rounded-full"></span>Pricing
              </Link></li>
              <li><Link href="#testimonials" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                <span className="w-1 h-1 bg-orange-500/50 rounded-full"></span>Testimonials
              </Link></li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-white text-lg">Company</h4>
            <ul className="space-y-3 text-gray-400">
              <li><Link href="/about" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                <span className="w-1 h-1 bg-orange-500/50 rounded-full"></span>About Us
              </Link></li>
              <li><Link href="/careers" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                <span className="w-1 h-1 bg-orange-500/50 rounded-full"></span>Careers
              </Link></li>
              <li><Link href="/blog" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                <span className="w-1 h-1 bg-orange-500/50 rounded-full"></span>Blog
              </Link></li>
              <li><Link href="/contact" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                <span className="w-1 h-1 bg-orange-500/50 rounded-full"></span>Contact
              </Link></li>
              {!isAuthenticated ? (
                <>
                <li><Link href="/sign-in" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-orange-500/50 rounded-full"></span>Sign In
                </Link></li>
                <li><Link href="/sign-up" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-orange-500/50 rounded-full"></span>Sign Up
                </Link></li>
                </>
              ) : (
                <li><Link href="/dashboard" className="hover:text-orange-500 transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-orange-500/50 rounded-full"></span>Dashboard
                </Link></li>
              )}
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-white text-lg">Stay Updated</h4>
            <p className="text-gray-400 leading-relaxed">
              Subscribe to our newsletter for the latest market insights and AI-powered trading tips.
            </p>
            <div className="flex flex-col gap-3">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="px-4 py-3 border border-orange-500/30 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-orange-500 bg-[#0a0d1a]/70 text-gray-300 placeholder-gray-500"
              />
              <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700 border-none py-6 rounded-lg font-medium text-base transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
                Subscribe Now
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
        
        <div className="border-t border-orange-500/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center">
            <div className="mr-3">
              <Logo size="sm" showText={false} />
            </div>
            <p className="text-gray-500 text-sm flex items-center">
              © {new Date().getFullYear()} Daddy's AI. All rights reserved.
            </p>
          </div>
          <div className="flex gap-6 mt-6 md:mt-0">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-orange-500 transition-colors flex items-center gap-1">
              <span className="w-1 h-1 bg-orange-500/70 rounded-full"></span>
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-orange-500 transition-colors flex items-center gap-1">
              <span className="w-1 h-1 bg-orange-500/70 rounded-full"></span>
              Terms of Service
            </Link>
            <Link href="/faq" className="text-sm text-gray-500 hover:text-orange-500 transition-colors flex items-center gap-1">
              <span className="w-1 h-1 bg-orange-500/70 rounded-full"></span>
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
