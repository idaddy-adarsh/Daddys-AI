'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '../components/Logo';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Bell, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { ComingSoonModal } from '../components/ComingSoonModal';

// Dashboard navigation items
const navItems = [
  { name: 'Overview', path: '/dashboard', icon: '📊', description: 'Your financial dashboard' },
  { name: 'Portfolio', path: '/dashboard/portfolio', icon: '💼', description: 'View your investments' },
  { name: 'Market Analysis', path: '/dashboard/analysis', icon: '📈', description: 'Market trends and analysis' },
  { name: 'AI Predictions', path: null, icon: '🧠', description: 'AI-powered forecasts', comingSoon: true },
  { name: 'Settings', path: null, icon: '⚙️', description: 'Customize your experience', comingSoon: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState(3);
  const [mounted, setMounted] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState('');

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

  if (!mounted) return null;

  return (
    <>
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
                {notifications > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-xs font-bold text-white border border-black/40 shadow-md shadow-orange-900/20"
                  >
                    {notifications}
                  </motion.div>
                )}
                <button className="bg-black/40 hover:bg-black/60 text-orange-500 hover:text-orange-400 transition-all duration-200 p-2 rounded-lg border border-orange-500/30 hover:border-orange-500/50 shadow-md shadow-orange-900/5">
                  <Bell className="h-5 w-5" />
                </button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-black/40 rounded-full shadow-md shadow-orange-900/5 border border-orange-500/20 overflow-hidden"
              >
                <UserButton afterSignOutUrl="/" />
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
    </>
  );
}
