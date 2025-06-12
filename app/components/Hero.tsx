'use client'

import { useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Stars } from '@react-three/drei'
import * as THREE from 'three'
import Link from 'next/link'
import { useAuth } from '@/app/contexts/AuthContext'

// Fallback 3D component since we don't have the actual model file
function StockModel() {
  // Create a futuristic 3D visualization
  return (
    <group position={[0, 0, 0]} scale={1.5}>
      {/* Base platform */}
      <mesh position={[0, -1, 0]} receiveShadow>
        <cylinderGeometry args={[2.5, 2.5, 0.1, 32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        
        {/* Circular grid lines */}
        {[...Array(5)].map((_, i) => (
          <mesh key={`grid-${i}`} position={[0, -0.95 + i * 0.01, 0]}>
            <torusGeometry args={[1.8 - i * 0.3, 0.01, 16, 50]} />
            <meshStandardMaterial color="#334155" transparent opacity={0.5} />
          </mesh>
        ))}
      </mesh>
      
      {/* Glowing center */}
      <mesh position={[0, -0.9, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={2} metalness={1} roughness={0.3} />
      </mesh>
      
      {/* Data visualization - vertical lines */}
      {[...Array(16)].map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const radius = 1.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const height = Math.random() * 1.5 + 0.5;
        
        return (
          <group key={`data-${i}`} position={[x, -0.95, z]} rotation={[0, angle, 0]}>
            <mesh position={[0, height/2, 0]}>
              <boxGeometry args={[0.05, height, 0.05]} />
              <meshStandardMaterial 
                color={i % 3 === 0 ? "#f97316" : (i % 3 === 1 ? "#fb923c" : "#fdba74")} 
                emissive={i % 3 === 0 ? "#f97316" : (i % 3 === 1 ? "#fb923c" : "#fdba74")} 
                emissiveIntensity={0.5} 
                transparent 
                opacity={0.8} 
              />
            </mesh>
            
            {/* Top indicator */}
            <mesh position={[0, height + 0.1, 0]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial 
                color={"#f97316"} 
                emissive={"#f97316"} 
                emissiveIntensity={1} 
              />
            </mesh>
          </group>
        );
      })}
      
      {/* Connecting lines */}
      <group>
        {[...Array(8)].map((_, i) => {
          const startAngle = (i / 8) * Math.PI * 2;
          const endAngle = ((i + 1) / 8) * Math.PI * 2;
          const radius = 1.2;
          const startX = Math.cos(startAngle) * radius;
          const startZ = Math.sin(startAngle) * radius;
          const endX = Math.cos(endAngle) * radius;
          const endZ = Math.sin(endAngle) * radius;
          const height = -0.5;
          
          // Calculate the midpoint and direction vector for the cylinder
          const midX = (startX + endX) / 2;
          const midZ = (startZ + endZ) / 2;
          const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endZ - startZ, 2));
          const angle = Math.atan2(endZ - startZ, endX - startX);
          
          return (
            <mesh key={`line-${i}`} position={[midX, height, midZ]} rotation={[0, angle, 0]}>
              <cylinderGeometry args={[0.02, 0.02, length, 8]} rotation={[0, Math.PI/2, 0]} />
              <meshStandardMaterial 
                color="#f97316" 
                emissive="#f97316" 
                emissiveIntensity={0.8} 
                transparent 
                opacity={0.6} 
              />
            </mesh>
          );
        })}
      </group>
      
      {/* Floating Indian market indicators */}
      <group position={[0, 0.5, 0]}>
        {/* Using simple boxes instead of text geometry for compatibility */}
        <group position={[-0.8, Math.sin(Date.now() * 0.001) * 0.1, 0.5]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.4, 0.1, 0.02]} />
            <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0.5, 0, 0]}>
            <boxGeometry args={[0.2, 0.1, 0.02]} />
            <meshStandardMaterial color="#fb923c" emissive="#fb923c" emissiveIntensity={0.5} />
          </mesh>
        </group>
        
        <group position={[0.8, Math.sin(Date.now() * 0.001 + 1) * 0.1, -0.5]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.4, 0.1, 0.02]} />
            <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0.5, 0, 0]}>
            <boxGeometry args={[0.2, 0.1, 0.02]} />
            <meshStandardMaterial color="#fdba74" emissive="#fdba74" emissiveIntensity={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

export function Hero() {
  const container = useRef(null)
  const { isAuthenticated } = useAuth()
  
  useEffect(() => {
    // Animation will be added later when GSAP is properly configured
  }, [])

  return (
    <section 
      ref={container}
      className="relative min-h-screen pt-24 pb-16 sm:py-24 md:py-32 flex items-center justify-center overflow-hidden bg-[#050714]"
    >
      {/* Grid background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-[#050714]/80 to-[#050714] z-10" />
      
      {/* Glowing dots */}
      <div className="absolute top-20 left-1/4 w-2 h-2 rounded-full bg-orange-500 blur-sm animate-pulse" />
      <div className="absolute bottom-40 right-1/3 w-3 h-3 rounded-full bg-orange-400 blur-sm animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-orange-600 blur-sm animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="container relative z-20 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 px-4 sm:px-6">
        <div className="hero-content w-full md:max-w-2xl space-y-6 md:space-y-8">
          <div className="inline-block px-3 sm:px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-medium tracking-wider mb-2">
            INDIAN MARKET INTELLIGENCE
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white font-montserrat">
            AI-Powered <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent">Financial Intelligence</span> for Indian Markets
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed">
            Daddy's AI provides cutting-edge analytics, predictive insights, and personalized recommendations for the Indian stock market. 
            Make smarter investment decisions with our AI-driven platform.
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4 pt-4">
            {!isAuthenticated ? (
              <Link href="/sign-up">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/20 border-none text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto">
                  Start Free Trial
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/20 border-none text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto">
                  Go to Dashboard
                </Button>
              </Link>
            )}
            <Button size="lg" variant="outline" className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto">
              Learn More
            </Button>
          </div>
          
          {/* Feature indicators */}
          <div className="flex flex-wrap gap-3 sm:gap-6 pt-4 sm:pt-6 mt-2">
            <div className="flex items-center gap-2 bg-orange-500/5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-orange-500/10 hover:border-orange-500/20 transition-colors">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-sm text-gray-300">Real-time Analytics</span>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-orange-500/10 hover:border-orange-500/20 transition-colors">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-sm text-gray-300">NSE & BSE Coverage</span>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-orange-500/10 hover:border-orange-500/20 transition-colors">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-sm text-gray-300">Advanced AI Models</span>
            </div>
          </div>
        </div>
        
        <div className="hero-model w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] md:w-1/2 relative rounded-xl sm:rounded-2xl overflow-hidden border border-orange-500/30 shadow-xl shadow-orange-500/10 bg-gradient-to-br from-[#0a0d1a] to-[#050714] mt-8 md:mt-0">
          {/* Decorative elements */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-[#0a0d1a]/80 backdrop-blur-sm px-3 py-1.5 rounded-md border border-orange-500/20">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs text-orange-400 font-mono tracking-wider">LIVE DATA</span>
          </div>
          
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <ambientLight intensity={0.3} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} color="#f97316" />
            <pointLight position={[-10, -10, -10]} color="#f97316" intensity={0.8} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <fog attach="fog" args={['#050714', 8, 25]} />
            <StockModel />
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 3} />
          </Canvas>
          
          {/* UI overlay elements */}
          <div className="absolute bottom-4 right-4 z-10 px-4 py-2 rounded-md bg-[#0a0d1a]/80 backdrop-blur-sm border border-orange-500/30 text-orange-400 text-xs font-mono tracking-wider flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            NIFTY 50: <span className="text-orange-300">+1.2%</span>
          </div>
          <div className="absolute bottom-4 left-4 z-10 px-4 py-2 rounded-md bg-[#0a0d1a]/80 backdrop-blur-sm border border-orange-500/30 text-orange-400 text-xs font-mono tracking-wider flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            SENSEX: <span className="text-orange-300">+0.8%</span>
          </div>
          
          {/* Additional data points */}
          <div className="absolute top-4 right-4 z-10 px-4 py-2 rounded-md bg-[#0a0d1a]/80 backdrop-blur-sm border border-orange-500/30 text-orange-400 text-xs font-mono tracking-wider">
            MARKET CAP: ₹289.4T
          </div>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#050714]/90 via-transparent to-[#050714]/40" />
        </div>
      </div>
    </section>
  )
}
