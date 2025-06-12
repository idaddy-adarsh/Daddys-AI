'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { LogOut, Settings, CreditCard, X } from 'lucide-react';
import Image from 'next/image';

interface UserButtonProps {
  afterSignOutUrl?: string;
}

export function UserButton({ afterSignOutUrl = '/' }: UserButtonProps) {
  const { user, logout } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Handle clicks outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking on the trigger button
      if (buttonRef.current?.contains(target)) {
        return;
      }
      
      // Close if clicking outside the modal
      if (modalRef.current && !modalRef.current.contains(target)) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isModalOpen]);

  if (!user) return null;

  const handleToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleLogoutClick = async () => {
    try {
      setIsModalOpen(false);
      await logout();
      router.push(afterSignOutUrl);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleMenuClick = () => {
    setIsModalOpen(false);
  };

  const profilePhoto = user.socialLogins?.google?.picture || user.socialLogins?.microsoft?.picture;
  const initials = user.username ? user.username.substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="relative">
      {/* User Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="relative w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        aria-expanded={isModalOpen}
        aria-haspopup="dialog"
        aria-label="User menu"
      >
        {profilePhoto && !imageError ? (
          <div className="absolute inset-0 rounded-full overflow-hidden ring-2 ring-white/10">
            <Image 
              src={profilePhoto} 
              alt={user.username || 'User'} 
              width={40}
              height={40}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              priority
              unoptimized={profilePhoto.includes('graph.microsoft.com')}
            />
          </div>
        ) : (
          <span className="text-base font-semibold">{initials}</span>
        )}
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal positioned relative to button */}
          <div className="absolute top-16 right-4">
            <div 
              ref={modalRef}
              className="w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-3 right-3 p-1 text-gray-400 z-10"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>

              {/* User Info Section */}
              <div className="flex items-center space-x-4 p-6 border-b border-gray-700">
                <div className="flex-shrink-0">
                  {profilePhoto && !imageError ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-600">
                      <Image
                        src={profilePhoto}
                        alt={user.username || 'User'}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                      <span className="text-xl font-semibold text-white">{initials}</span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-100 truncate">
                    {user.username || 'User'}
                  </h3>
                  {user.email && (
                    <p className="text-sm text-gray-400 truncate">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <button 
                  onClick={handleMenuClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Settings size={16} className="text-gray-400" />
                  <span>Settings</span>
                </button>
                
                <button 
                  onClick={handleMenuClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-200 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <CreditCard size={16} className="text-gray-400" />
                  <span>Billing</span>
                </button>
                
                <div className="h-px bg-gray-700 my-2" />
                
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <LogOut size={16} className="text-red-400" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}