'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  linkText: string;
  linkHref: string;
}

// Animation variants for staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100, damping: 10 }
  }
};

export default function AuthLayout({ children, title, subtitle, linkText, linkHref }: AuthLayoutProps) {
  const [mounted, setMounted] = useState(false);
  
  // Ensure animations only run after component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Generate random positions for decorative elements
  const generateRandomPositions = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 30 + Math.random() * 100,
      delay: i * 0.2,
      duration: 3 + i * 0.5,
      color: i % 3 === 0 ? '#f97316' : i % 3 === 1 ? '#fb923c' : '#1e1e1e',
      opacity: 0.2 + Math.random() * 0.3
    }));
  };
  
  const floatingElements = generateRandomPositions(15);
  
  return (
    <div className="flex min-h-screen bg-[#121212] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        {/* Floating circles with improved animations */}
        {floatingElements.map((element) => (
          <motion.div
            key={element.id}
            className="absolute rounded-full backdrop-blur-sm"
            style={{
              top: `${element.y}%`,
              left: `${element.x}%`,
              width: `${element.size}px`,
              height: `${element.size}px`,
              background: element.color,
              opacity: element.opacity,
              zIndex: 1
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, element.id % 2 === 0 ? 15 : -15, 0],
              scale: [1, 1.1, 1],
              opacity: [element.opacity, element.opacity + 0.1, element.opacity]
            }}
            transition={{
              duration: element.duration,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatType: 'reverse',
              delay: element.delay
            }}
          />
        ))}
        
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#121212] via-[#1e1e1e] to-[#121212] opacity-80"></div>
        
        {/* Animated grid lines */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiMzMzMzMzMzMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
      </div>
      
      {/* Main content */}
      <div className="w-full flex items-center justify-center p-4 sm:p-6 z-10">
        {/* Auth container with glass effect */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-6xl flex flex-col md:flex-row rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-sm border border-gray-800/50"
        >
          {/* Left side - Brand panel (hidden on mobile) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#121212] via-[#1a1a1a] to-[#121212] p-8 md:p-12 flex-col justify-center relative overflow-hidden"
          >
            {/* Brand badge */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="absolute top-8 left-8 px-4 py-2 bg-gradient-to-r from-[#f97316]/20 to-[#fb923c]/20 rounded-xl border border-[#f97316]/30 z-10 shadow-lg"
            >
              <span className="text-white font-bold text-sm tracking-wider">DADDY'S</span>
              <br />
              <span className="text-white/70 text-xs">Artificial Intelligence</span>
            </motion.div>
            
            {/* Main content */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              className="mt-24 mb-12 relative z-10"
            >
              <motion.h2 variants={itemVariants} className="text-white text-2xl font-bold mb-2">Just For Those Who Have</motion.h2>
              <motion.h1 variants={itemVariants} className="text-white text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Patience and Perspective</motion.h1>
              <motion.div variants={itemVariants} className="h-1 w-20 bg-gradient-to-r from-[#f97316] to-[#fb923c] rounded-full mb-6"></motion.div>
              <motion.p variants={itemVariants} className="text-white/70 mb-2">Join the tribe of investors who have patience and perspective.</motion.p>
              <motion.p variants={itemVariants} className="text-white/70">We invite you to join the tribe.</motion.p>
            </motion.div>
            
            {/* Link to alternate auth page */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-auto relative z-10"
            >
              <p className="text-white/70 mb-2">{subtitle}</p>
              <Link 
                href={linkHref} 
                className="text-white font-bold text-xl hover:text-[#f97316] transition-colors duration-300 group flex items-center"
              >
                {linkText}
                <motion.span 
                  initial={{ x: 0 }}
                  whileHover={{ x: 5 }}
                  className="ml-2 text-[#f97316] group-hover:text-white"
                >
                  →
                </motion.span>
              </Link>
            </motion.div>
            
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#121212] via-[#121212]/90 to-[#f97316]/20"></div>
            
            {/* Decorative elements */}
            <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-gradient-to-tr from-[#f97316]/10 to-transparent -mr-48 -mb-48 blur-xl"></div>
            <div className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full bg-gradient-to-br from-[#f97316]/5 to-[#0CD9C8]/5 blur-xl"></div>
            
            {/* Animated dots pattern */}
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          </motion.div>
          
          {/* Right side - Form panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="w-full md:w-1/2 bg-gradient-to-br from-[#1e1e1e] to-[#252525] p-6 sm:p-8 md:p-12 flex items-center justify-center relative"
          >
            {/* Mobile branding */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="md:hidden absolute top-4 left-0 right-0 flex justify-center"
            >
              <div className="px-4 py-2 bg-gradient-to-r from-[#f97316]/20 to-[#fb923c]/20 rounded-xl border border-[#f97316]/30 inline-flex items-center shadow-lg">
                <span className="text-white font-bold text-sm tracking-wider mr-1">DADDY'S</span>
                <span className="text-white/70 text-xs">AI</span>
              </div>
            </motion.div>
            
            {/* Form container */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate={mounted ? "visible" : "hidden"}
              className="w-full max-w-md mt-12 md:mt-0"
            >
              <motion.h1 
                variants={itemVariants} 
                className="text-3xl sm:text-4xl font-bold text-white mb-2 text-center md:text-left"
              >
                {title}
              </motion.h1>
              
              <motion.div 
                variants={itemVariants}
                className="h-1 w-12 bg-gradient-to-r from-[#f97316] to-[#fb923c] rounded-full mb-8 md:mx-0 mx-auto"
              ></motion.div>
              
              <motion.div variants={itemVariants}>
                {children}
              </motion.div>
              
              {/* Form background decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#f97316]/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#f97316]/5 to-transparent rounded-full blur-3xl -ml-32 -mb-32"></div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
