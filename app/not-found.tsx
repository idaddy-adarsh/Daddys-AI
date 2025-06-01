import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeftIcon } from '@radix-ui/react-icons'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-black text-white">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image 
              src="/logos/android-chrome-192x192.png" 
              alt="Daddy's AI Logo" 
              width={120} 
              height={120}
              className="object-contain"
              priority
            />
          </Link>
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-bold font-montserrat text-orange-500">404</h1>
          <h2 className="text-3xl font-semibold font-montserrat">Page Not Found</h2>
          <p className="text-gray-400 mt-4">
            Oops! The financial insights you're looking for seem to have vanished like 
            yesterday's stock predictions.
          </p>
        </div>
        
        <div className="mt-8 border-t border-gray-800 pt-8">
          <p className="text-gray-400 mb-6">
            Let's get you back to analyzing the markets that actually exist.
          </p>
          
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 
                      text-white font-medium rounded-md transition-colors duration-200"
          >
            <ArrowLeftIcon className="mr-2 h-5 w-5" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
