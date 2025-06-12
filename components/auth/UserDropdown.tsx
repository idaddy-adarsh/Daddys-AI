'use client';

import { LogOut, UserCog } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";
import { useState } from 'react';
import { ProfileDialog } from './ProfileDialog';

interface UserDropdownProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  username: string | undefined;
  email: string | undefined;
  imageUrl?: string;
  onLogout: () => void;
  children: React.ReactNode;
}

export function UserDropdown({ isOpen, onClose, username, email, imageUrl, onLogout, children }: UserDropdownProps) {
  const initials = username ? username.substring(0, 2).toUpperCase() : 'U';
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const handleProfileClick = () => {
    onClose(false); // Close the dropdown
    setIsProfileOpen(true); // Open the profile dialog
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={onClose}>
        <DropdownMenuTrigger asChild>
          {children}
        </DropdownMenuTrigger>      
        <DropdownMenuContent 
          className="w-72 bg-neutral-950 border-neutral-800 text-neutral-50 animate-in zoom-in-95 duration-100"
          align="end"
          sideOffset={5}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-neutral-800">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-orange-500/80 hover:border-orange-500 transition-colors">
                <AvatarImage src={imageUrl} alt={username || 'User'} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-xl font-medium text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-neutral-100 truncate">{username || 'User'}</p>
                <p className="text-sm text-neutral-400 truncate">{email}</p>
              </div>
            </div>
          </div>
          <div className="p-2">
            <DropdownMenuItem 
              onClick={handleProfileClick}
              className="text-neutral-300 hover:text-orange-500 data-[highlighted]:text-orange-500 data-[highlighted]:bg-neutral-900/80 cursor-pointer flex items-center gap-2 py-2 px-3 transition-colors"
            >
              <UserCog className="w-4 h-4" />
              <span>Manage Account</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-neutral-800 my-2" />
            <DropdownMenuItem 
              onClick={onLogout}
              className="text-neutral-300 hover:text-orange-500 data-[highlighted]:text-orange-500 data-[highlighted]:bg-neutral-900/80 cursor-pointer flex items-center gap-2 py-2 px-3 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </>
  );
}
