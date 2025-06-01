import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  // Size mapping
  const sizeMap = {
    sm: { logo: 24, text: 'text-lg' },
    md: { logo: 32, text: 'text-xl' },
    lg: { logo: 40, text: 'text-2xl' },
  }
  
  return (
    <Link href="/" className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <Image 
          src="/logos/android-chrome-192x192.png" 
          alt="Daddy's AI Logo" 
          width={sizeMap[size].logo} 
          height={sizeMap[size].logo}
          className="object-contain"
        />
      </div>
      
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent ${sizeMap[size].text}`}>
          Daddy's AI
        </span>
      )}
    </Link>
  )
}
