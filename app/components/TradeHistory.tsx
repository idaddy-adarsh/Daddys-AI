'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, ChevronUp, Download, Filter, Loader2, X } from 'lucide-react';
import axios from 'axios';

interface LedgerEntry {
  userId: string;
  tradeDate: string;
  tradeId: string;
  trade: any;
  createdAt: string;
}

interface GroupedLedger {
  [date: string]: LedgerEntry[];
}

export default function TradeHistory({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [ledger, setLedger] = useState<GroupedLedger>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  
  // Fetch ledger data
  const fetchLedger = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query params
      let queryParams = `userId=${user.id}`;
      if (startDate) queryParams += `&startDate=${startDate}`;
      if (endDate) queryParams += `&endDate=${endDate}`;
      
      const response = await axios.get(`/api/ledger?${queryParams}`);
      
      if (response.data && response.data.ledger) {
        setLedger(response.data.ledger);
        
        // Initialize expanded state for all dates
        const newExpandedDates: Record<string, boolean> = {};
        Object.keys(response.data.ledger).forEach(date => {
          newExpandedDates[date] = true; // Start with all dates expanded
        });
        setExpandedDates(newExpandedDates);
      }
    } catch (err) {
      
      setError('Failed to load trade history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch data when component mounts or when filter changes
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchLedger();
    }
  }, [isOpen, user?.id, startDate, endDate]);
  
  // Toggle date expansion
  const toggleDateExpansion = (date: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };
  
  // Export ledger as CSV
  const exportLedgerAsCSV = () => {
    // Flatten the ledger data
    const flattenedData: any[] = [];
    
    Object.entries(ledger).forEach(([date, entries]) => {
      entries.forEach(entry => {
        flattenedData.push({
          Date: date,
          Time: new Date(entry.trade.timestamp).toLocaleTimeString(),
          Type: entry.trade.type,
          Asset: entry.trade.asset,
          Amount: entry.trade.amount,
          Price: entry.trade.price,
          Total: entry.trade.amount * entry.trade.price,
          Status: entry.trade.status,
          CompletedAt: entry.trade.completedAt ? new Date(entry.trade.completedAt).toLocaleString() : ''
        });
      });
    });
    
    // Create CSV content
    const headers = ['Date', 'Time', 'Type', 'Asset', 'Amount', 'Price', 'Total', 'Status', 'CompletedAt'];
    const csvContent = [
      headers.join(','),
      ...flattenedData.map(row => 
        headers.map(header => JSON.stringify(row[header] || '')).join(',')
      )
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `trade_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (!isOpen) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl border border-gray-700 p-6 w-full max-w-6xl my-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Trade History</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Filters */}
        <div className="mb-6 bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={fetchLedger}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </button>
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  fetchLedger();
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Reset
              </button>
              <button
                onClick={exportLedgerAsCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
        
        {/* Ledger Content */}
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <span className="ml-3 text-gray-300">Loading trade history...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">
              <p>{error}</p>
              <button 
                onClick={fetchLedger}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Try Again
              </button>
            </div>
          ) : Object.keys(ledger).length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No trade history found for the selected period.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(ledger)
                .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                .map(([date, entries]) => (
                  <div key={date} className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
                    {/* Date Header */}
                    <button
                      onClick={() => toggleDateExpansion(date)}
                      className="w-full flex items-center justify-between p-4 text-left bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-blue-400" />
                        <span className="text-white font-medium">
                          {new Date(date).toLocaleDateString(undefined, { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2">{entries.length} trades</span>
                        {expandedDates[date] ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </button>
                    
                    {/* Trade Entries */}
                    <AnimatePresence>
                      {expandedDates[date] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="text-gray-400 border-b border-gray-700">
                                  <tr>
                                    <th className="text-left py-2 px-3">Time</th>
                                    <th className="text-left py-2 px-3">Type</th>
                                    <th className="text-left py-2 px-3">Asset</th>
                                    <th className="text-right py-2 px-3">Amount</th>
                                    <th className="text-right py-2 px-3">Price</th>
                                    <th className="text-right py-2 px-3">Total</th>
                                    <th className="text-center py-2 px-3">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {entries.map((entry) => {
                                    const trade = entry.trade;
                                    return (
                                      <tr key={entry.tradeId} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                                        <td className="py-2 px-3 text-gray-300">
                                          {new Date(trade.timestamp).toLocaleTimeString()}
                                          {trade.completedAt && trade.status === 'completed' && (
                                            <div className="text-xs text-gray-500">
                                              Completed: {new Date(trade.completedAt).toLocaleTimeString()}
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-2 px-3">
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                          }`}>
                                            {trade.type.toUpperCase()}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-white">
                                          {trade.asset}
                                          {trade.isOption && (
                                            <span className="ml-2 text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">
                                              {trade.optionType} {trade.strikePrice}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-right text-gray-300">
                                          {trade.isOption ? 
                                            `${trade.amount} (${trade.amount / (trade.lotSize || 75)} lots)` : 
                                            trade.amount
                                          }
                                        </td>
                                        <td className="py-2 px-3 text-right text-gray-300">
                                          ₹{trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-3 text-right text-white font-medium">
                                          ₹{(trade.amount * trade.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          <span className={`px-2 py-1 rounded text-xs ${
                                            trade.status === 'executed' ? 'bg-green-500/20 text-green-400' : 
                                            trade.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                                            trade.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                                            trade.status === 'partially_completed' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-red-500/20 text-red-400'
                                          }`}>
                                            {trade.status === 'partially_completed' ? 'PARTIAL' : trade.status.toUpperCase()}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
} 