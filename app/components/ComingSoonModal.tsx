'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Image from 'next/image';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

export function ComingSoonModal({ isOpen, onClose, feature }: ComingSoonModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl border border-orange-500/20 shadow-2xl p-6 mx-4">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              {/* Content */}
              <div className="text-center pt-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 rounded-full p-1 shadow-lg shadow-orange-500/20 flex items-center justify-center mb-6">
                  <div className="relative w-12 h-12">
                    <Image
                      src="/logos/android-chrome-512x512.png"
                      alt="Daddy&apos;s AI"
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">Coming Soon!</h3>
                <p className="text-gray-300 mb-6">
                  {feature} is currently under development. We&apos;re working hard to bring you this exciting feature soon!
                </p>
                
                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2.5 rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 transition-colors shadow-lg shadow-orange-500/20"
                >
                  Got it!
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 