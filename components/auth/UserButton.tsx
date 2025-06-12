'use client';

import React, { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserDropdown } from './UserDropdown';
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";

interface UserButtonProps {
  afterSignOutUrl?: string;
}

export function UserButton({ afterSignOutUrl = '/' }: UserButtonProps) {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      router.push(afterSignOutUrl);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsDropdownOpen(open);
  };

  const profilePhoto = user.socialLogins?.google?.picture || user.socialLogins?.microsoft?.picture;
  const initials = user.username ? user.username.substring(0, 2).toUpperCase() : 'U';

  return (
    <UserDropdown
      isOpen={isDropdownOpen}
      onClose={handleOpenChange}
      username={user.username}
      email={user.email}
      imageUrl={profilePhoto}
      onLogout={handleLogout}
    >
      <motion.button
        type="button"
        className="relative focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-neutral-950 rounded-full"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Avatar className="h-12 w-12 border-2 border-orange-400/50 hover:border-orange-500 transition-colors duration-200">
          <AvatarImage src={profilePhoto} alt={user.username || 'User'} />
          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-lg font-medium text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
      </motion.button>
    </UserDropdown>
  );
}