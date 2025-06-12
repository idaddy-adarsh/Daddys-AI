'use client';

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { useAuth } from "@/app/contexts/AuthContext";
import { Button } from "@/app/components/ui/button";
import { PlusCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileDialog({ isOpen, onClose }: ProfileDialogProps) {
  const { user, completeProfile } = useAuth();
  const initials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'U';
  const profilePhoto = user?.socialLogins?.google?.picture || user?.socialLogins?.microsoft?.picture;
  
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Update profile information
  const handleUpdateProfile = async () => {
    // Reset messages
    setError(null);
    setSuccess(null);
    
    if (!newUsername.trim()) {
      setError("Username cannot be empty");
      return;
    }

    if (isEditingPassword) {
      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters long");
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    try {
      setIsUpdating(true);
      await completeProfile(newUsername, isEditingPassword ? newPassword : '');
      
      setSuccess("Profile updated successfully");
      
      setIsEditingUsername(false);
      setIsEditingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Google OAuth connection
  const connectGoogle = () => {
    window.location.href = '/api/auth/social/google';
  };

  // Handle Microsoft OAuth connection
  const connectMicrosoft = () => {
    window.location.href = '/api/auth/social/microsoft';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "w-[90vw] max-w-[500px] bg-neutral-950 text-neutral-50 border border-neutral-800 p-0",
        "data-[state=open]:duration-300",
      )}>
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-semibold text-neutral-50">Profile details</DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 mb-4 text-sm border rounded-md bg-red-500/10 border-red-500/20 text-red-400">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 mb-4 text-sm border rounded-md bg-green-500/10 border-green-500/20 text-green-400">
              {success}
            </div>
          )}
          
          <div className="flex items-start gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-orange-500/80">
                <AvatarImage src={profilePhoto} alt={user?.username || 'User'} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-2xl font-medium text-white">
                  {initials}
                </AvatarFallback>   
              </Avatar>
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="flex flex-col gap-1">
                  {!user?.socialLogins?.google && (
                    <button 
                      onClick={connectGoogle}
                      className="text-xs text-white hover:text-orange-500 transition-colors"
                    >
                      Connect Google
                    </button>
                  )}
                  {!user?.socialLogins?.microsoft && (
                    <button 
                      onClick={connectMicrosoft}
                      className="text-xs text-white hover:text-orange-500 transition-colors"
                    >
                      Connect Microsoft
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-neutral-50">{user?.username || 'User'}</h3>
                  <p className="text-sm text-neutral-400">{user?.email}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-orange-500 border-orange-500/20 hover:bg-orange-500/10 hover:text-orange-400"
                  onClick={() => {
                    setIsEditingUsername(true);
                  }}
                  disabled={isEditingUsername || isEditingPassword}
                >
                  Update profile
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {isEditingUsername ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-neutral-400">Username</div>
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="Enter new username"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-neutral-400">Username</h4>
                <div className="flex justify-between items-center">
                  <p className="text-neutral-100">{user?.username || 'Not set'}</p>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-orange-500 hover:text-orange-400 hover:bg-transparent px-0"
                    onClick={() => setIsEditingUsername(true)}
                  >
                    Update username
                  </Button>
                </div>
              </div>
            )}

            {!isEditingPassword && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-neutral-400">Password</h4>
                <div className="flex justify-between items-center">
                  <p className="text-neutral-100">••••••••</p>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-orange-500 hover:text-orange-400 hover:bg-transparent px-0"
                    onClick={() => setIsEditingPassword(true)}
                  >
                    Update password
                  </Button>
                </div>
              </div>
            )}

            {isEditingPassword && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-neutral-400">New Password</div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-100 focus:outline-none focus:ring-1 focus:ring-orange-500 pr-10"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-neutral-400">Confirm Password</div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-md text-neutral-100 focus:outline-none focus:ring-1 focus:ring-orange-500 pr-10"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-300"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-neutral-400 hover:text-neutral-300 hover:bg-transparent px-0"
                    onClick={() => {
                      setIsEditingPassword(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    disabled={isUpdating}
                  >
                    Cancel password update
                  </Button>
                </div>
              </div>
            )}

            {(isEditingUsername || isEditingPassword) && (
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-neutral-400 border-neutral-700 hover:bg-neutral-800"
                  onClick={() => {
                    setIsEditingUsername(false);
                    setIsEditingPassword(false);
                    setNewUsername(user?.username || '');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={handleUpdateProfile}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Save changes'}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-neutral-400">Email addresses</h4>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-neutral-100">{user?.email}</p>
                  <span className="inline-block px-2 py-0.5 bg-neutral-900 text-neutral-400 text-xs rounded-full mt-1">
                    Primary
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-neutral-400">Connected accounts</h4>
              
              {/* Google account */}
              <div className="flex justify-between items-center py-2 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <svg 
                    className="w-5 h-5" 
                    viewBox="0 0 48 48"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                  </svg>
                  <span className="text-neutral-100">
                    {user?.socialLogins?.google?.email || 'Google'}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className={cn(
                    "px-0 hover:bg-transparent",
                    user?.socialLogins?.google 
                      ? "text-neutral-400 hover:text-neutral-300" 
                      : "text-orange-500 hover:text-orange-400"
                  )}
                  onClick={connectGoogle}
                >
                  {user?.socialLogins?.google ? 'Reconnect' : 'Connect'}
                </Button>
              </div>
              
              {/* Microsoft account */}
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-2">
                  <svg 
                    className="w-5 h-5" 
                    viewBox="0 0 23 23"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path fill="#f25022" d="M1 1h10v10H1z"/>
                    <path fill="#00a4ef" d="M1 12h10v10H1z"/>
                    <path fill="#7fba00" d="M12 1h10v10H12z"/>
                    <path fill="#ffb900" d="M12 12h10v10H12z"/>
                  </svg>
                  <span className="text-neutral-100">
                    {user?.socialLogins?.microsoft?.email || 'Microsoft'}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className={cn(
                    "px-0 hover:bg-transparent",
                    user?.socialLogins?.microsoft 
                      ? "text-neutral-400 hover:text-neutral-300" 
                      : "text-orange-500 hover:text-orange-400"
                  )}
                  onClick={connectMicrosoft}
                >
                  {user?.socialLogins?.microsoft ? 'Reconnect' : 'Connect'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
