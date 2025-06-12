'use client'

import Link from 'next/link'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'
import { Logo } from './Logo'
import { useAuth } from '@/app/contexts/AuthContext'

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, isAuthenticated } = useAuth()
  
  useEffect(() => {
    // Animation will be added later when GSAP is properly configured
  }, [])

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMenuOpen) {
        setIsMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault()
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
      setIsMenuOpen(false) // Close mobile menu after clicking a link
    }
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#050714]/90 backdrop-blur-md border-b border-orange-500/20">
      <div className="container flex items-center justify-between h-16 sm:h-20 px-4 sm:px-6">
        <Logo size="lg" />
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="#features" onClick={(e) => scrollToSection(e, 'features')} className="nav-item text-base font-medium text-gray-300 hover:text-orange-500 transition-colors">
            Features
          </Link>
          <Link href="#visualization" onClick={(e) => scrollToSection(e, 'visualization')} className="nav-item text-base font-medium text-gray-300 hover:text-orange-500 transition-colors">
            Market Insights
          </Link>
          <Link href="#testimonials" onClick={(e) => scrollToSection(e, 'testimonials')} className="nav-item text-base font-medium text-gray-300 hover:text-orange-500 transition-colors">
            Testimonials
          </Link>
        </div>
        
        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-5">
          {!isAuthenticated ? (
            <>
            <Link href="/sign-in">
              <Button variant="outline" className="nav-item border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300">
                Login
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="nav-item bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium px-6">
                Get Started
              </Button>
            </Link>
            </>
          ) : (
            <Link href="/dashboard">
              <Button className="nav-item bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium px-6">
                Dashboard
              </Button>
            </Link>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-md focus:outline-none"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-0.5 bg-orange-500 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : 'mb-1.5'}`} />
          <span className={`block w-6 h-0.5 bg-orange-500 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'mb-1.5'}`} />
          <span className={`block w-6 h-0.5 bg-orange-500 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </button>
      </div>
      
      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-40 bg-[#050714]/98 backdrop-blur-lg transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden pt-20`}>
        <div className="flex flex-col h-full px-6 py-8 space-y-8">
          <div className="flex flex-col space-y-6">
            <Link 
              href="#features" 
              onClick={(e) => scrollToSection(e, 'features')} 
              className="nav-item text-xl font-medium text-gray-300 hover:text-orange-500 transition-colors py-2 border-b border-orange-500/10"
            >
              Features
            </Link>
            <Link 
              href="#visualization" 
              onClick={(e) => scrollToSection(e, 'visualization')} 
              className="nav-item text-xl font-medium text-gray-300 hover:text-orange-500 transition-colors py-2 border-b border-orange-500/10"
            >
              Market Insights
            </Link>
            <Link 
              href="#testimonials" 
              onClick={(e) => scrollToSection(e, 'testimonials')} 
              className="nav-item text-xl font-medium text-gray-300 hover:text-orange-500 transition-colors py-2 border-b border-orange-500/10"
            >
              Testimonials
            </Link>
          </div>
          
          <div className="mt-auto flex flex-col space-y-4">
            {!isAuthenticated ? (
              <>
              <Link href="/sign-in" className="w-full">
                <Button variant="outline" className="w-full nav-item border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300">
                  Login
                </Button>
              </Link>
              <Link href="/sign-up" className="w-full">
                <Button className="w-full nav-item bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium">
                  Get Started
                </Button>
              </Link>
              </>
            ) : (
              <Link href="/dashboard" className="w-full">
                <Button className="w-full nav-item bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium">
                  Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
