'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '../components/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, createContext, useContext } from 'react';
import { Bell, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { ComingSoonModal } from '../components/ComingSoonModal';
import { UserButton } from '@/components/auth/UserButton';
import { useAuth } from '@/app/contexts/AuthContext';

// Dashboard navigation items
const navItems = [
  { name: 'Overview', path: '/dashboard', icon: '📊', description: 'Your financial dashboard' },
  { name: 'Portfolio', path: '/dashboard/portfolio', icon: '💼', description: 'View your investments' },
  { name: 'Market Analysis', path: '/dashboard/analysis', icon: '📈', description: 'Analysis with LTP Calculator' },
  { name: 'AI Predictions', path: null, icon: '🧠', description: 'AI-powered forecasts', comingSoon: true },
  { name: 'Settings', path: null, icon: '⚙️', description: 'Customize your experience', comingSoon: true },
];

// Create notification context
export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: number;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationList, setNotificationList] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState('');

  // Calculate unread notifications count
  const unreadCount = notificationList.filter(n => !n.read).length;

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavClick = (item: typeof navItems[0], e: React.MouseEvent) => {
    if (item.comingSoon) {
      e.preventDefault();
      setSelectedFeature(item.name);
      setShowComingSoon(true);
    }
  };

  // Notification functions
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false,
    };
    
    setNotificationList(prev => [newNotification, ...prev]);
    
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.message,
        });
      } catch (error) {
        
      }
    }
  };

  const markAsRead = (id: string) => {
    setNotificationList(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const clearNotifications = () => {
    setNotificationList([]);
  };

  const toggleNotificationsPanel = () => {
    setShowNotifications(!showNotifications);
  };

  // Notification context value
  const notificationContextValue = {
    notifications: notificationList,
    addNotification,
    markAsRead,
    clearNotifications,
    unreadCount
  };

  if (!mounted) return null;

  return (
    <NotificationContext.Provider value={notificationContextValue}>
      <div className="flex min-h-screen bg-gradient-to-br from-black via-gray-950 to-orange-950/20 overflow-hidden">
        {/* Toggle button for mobile */}
        <motion.button
          onClick={toggleSidebar}
          whileTap={{ scale: 0.9 }}
          className="fixed top-4 left-4 z-50 md:hidden bg-black/80 text-orange-500 p-2 rounded-full shadow-lg shadow-orange-500/10 border border-orange-500/30 hover:bg-black/90 hover:border-orange-500/50 transition-all duration-200"
          aria-label="Toggle sidebar"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={sidebarOpen ? 'close' : 'open'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Sidebar overlay for mobile */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
              onClick={toggleSidebar}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          className="fixed left-0 top-0 bottom-0 w-72 bg-black/70 backdrop-blur-xl border-r border-orange-500/20 overflow-y-auto z-40 shadow-xl shadow-orange-900/10"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: sidebarOpen ? 0 : -320, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="p-5 pt-6">
            <motion.div whileHover={{ scale: 1.03 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
              <Logo size="md" />
            </motion.div>
          </div>

          <div className="px-3 py-2 mt-3">
            <div className="flex items-center px-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-600/30 to-transparent"></div>
              <p className="text-xs font-medium text-orange-300/80 uppercase tracking-wider px-3">Dashboard</p>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-600/30 to-transparent"></div>
            </div>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    href={item.path || '#'}
                    onClick={(e) => handleNavClick(item, e)}
                  >
                    <motion.div
                      whileHover={{ x: 3 }}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl group transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-orange-600/20 to-orange-500/10 text-orange-300 shadow-lg shadow-orange-900/5'
                          : 'text-gray-300 hover:bg-orange-500/5 hover:text-orange-300'
                      }`}
                    >
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg mr-3 ${isActive ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-800/60 text-gray-400 group-hover:text-orange-400 group-hover:bg-orange-500/10'} transition-colors`}>
                        <span className="text-lg">{item.icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <span>{item.name}</span>
                        <span className="text-xs text-gray-500 font-normal mt-0.5">{item.description}</span>
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-indicator"
                          className="ml-auto w-1 h-8 rounded-full bg-gradient-to-b from-orange-400 to-orange-600"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Resources section */}
          <div className="px-3 py-2 mt-8">
            <div className="flex items-center px-3 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-600/30 to-transparent"></div>
              <p className="text-xs font-medium text-orange-300/80 uppercase tracking-wider px-3">Resources</p>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-600/30 to-transparent"></div>
            </div>
            <nav className="space-y-1.5">
              <Link href="#" onClick={(e) => { e.preventDefault(); setSelectedFeature('Help & Guides'); setShowComingSoon(true); }}>
                <motion.div
                  whileHover={{ x: 3 }}
                  className="flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-300 hover:bg-orange-500/5 hover:text-orange-300 group transition-all duration-200"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg mr-3 bg-gray-800/60 text-gray-400 group-hover:text-orange-400 group-hover:bg-orange-500/10 transition-colors">
                    <span className="text-lg">📚</span>
                  </div>
                  <div className="flex flex-col">
                    <span>Help & Guides</span>
                    <span className="text-xs text-gray-500 font-normal mt-0.5">Documentation & tutorials</span>
                  </div>
                </motion.div>
              </Link>
              <Link href="#" onClick={(e) => { e.preventDefault(); setSelectedFeature('Support'); setShowComingSoon(true); }}>
                <motion.div
                  whileHover={{ x: 3 }}
                  className="flex items-center px-4 py-3 text-sm font-medium rounded-xl text-gray-300 hover:bg-orange-500/5 hover:text-orange-300 group transition-all duration-200"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg mr-3 bg-gray-800/60 text-gray-400 group-hover:text-orange-400 group-hover:bg-orange-500/10 transition-colors">
                    <span className="text-lg">🛟</span>
                  </div>
                  <div className="flex flex-col">
                    <span>Support</span>
                    <span className="text-xs text-gray-500 font-normal mt-0.5">Get help with your account</span>
                  </div>
                </motion.div>
              </Link>
            </nav>
          </div>
        </motion.aside>

        {/* Main content */}
        <div className={`flex-1 ${sidebarOpen ? 'md:ml-72' : 'ml-0'} transition-all duration-300 overflow-x-hidden`}>
          {/* Header */}
          <header className="sticky top-0 z-10 bg-black/60 backdrop-blur-xl border-b border-orange-500/20 px-5 py-3.5 flex justify-between items-center shadow-md shadow-black/20">
            <motion.button
              onClick={toggleSidebar}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:flex items-center justify-center bg-gradient-to-r from-black/80 to-gray-900/80 text-orange-500 hover:text-orange-400 transition-all duration-200 px-3 py-2 rounded-lg border border-orange-500/30 hover:border-orange-500/50 shadow-md shadow-orange-900/5"
              aria-label="Toggle sidebar"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={sidebarOpen ? 'collapse' : 'expand'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center"
                >
                  {sidebarOpen ? (
                    <>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Hide Menu</span>
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Show Menu</span>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.button>
            <div className="flex items-center space-x-5">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-xs font-bold text-white border border-black/40 shadow-md shadow-orange-900/20"
                  >
                    {unreadCount}
                  </motion.div>
                )}
                <button 
                  onClick={toggleNotificationsPanel}
                  className="bg-black/40 hover:bg-black/60 text-orange-500 hover:text-orange-400 transition-all duration-200 p-2 rounded-lg border border-orange-500/30 hover:border-orange-500/50 shadow-md shadow-orange-900/5"
                >
                  <Bell className="h-5 w-5" />
                </button>

                {/* Notifications Panel */}
                <AnimatePresence>
                  {showNotifications && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setShowNotifications(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-80 bg-gray-900 border border-orange-500/20 rounded-lg shadow-lg shadow-black/30 z-50 overflow-hidden"
                      >
                        <div className="p-3 border-b border-gray-800 flex justify-between items-center">
                          <h3 className="font-medium text-white">Notifications</h3>
                          {notificationList.length > 0 && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); clearNotifications(); }}
                              className="text-xs text-gray-400 hover:text-white"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notificationList.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                              No notifications yet
                            </div>
                          ) : (
                            notificationList.map(notification => (
                              <div 
                                key={notification.id} 
                                className={`p-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer ${notification.read ? 'opacity-70' : ''}`}
                                onClick={() => markAsRead(notification.id)}
                              >
                                <div className="flex items-start">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 mr-2 flex-shrink-0 ${
                                    notification.type === 'success' ? 'bg-green-500' :
                                    notification.type === 'warning' ? 'bg-yellow-500' :
                                    notification.type === 'error' ? 'bg-red-500' :
                                    'bg-blue-500'
                                  }`} />
                                  <div className="flex-1">
                                    <div className="font-medium text-white text-sm">{notification.title}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">{notification.message}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(notification.timestamp).toLocaleTimeString()}
                                    </div>
                                  </div>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-black/40 rounded-full shadow-md shadow-orange-900/5 border border-orange-500/20 overflow-hidden"
              >
                <UserButton />
              </motion.div>
            </div>
          </header>

          {/* Page content */}
          <main className="px-2 py-5 md:px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Coming Soon Modal */}
        <ComingSoonModal
          isOpen={showComingSoon}
          onClose={() => setShowComingSoon(false)}
          feature={selectedFeature}
        />
      </div>
    </NotificationContext.Provider>
  );
}
