'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, BarChart4, DollarSign, Activity, Plus, Minus, RefreshCw, Search, ChevronDown, X, Check, AlertCircle, Copy, Eye, EyeOff, Clock, Calendar, User, Percent, LineChart, CandlestickChart, Bot } from 'lucide-react';
import OptionChain from '@/app/components/OptionChain';
import { ComingSoonModal } from '@/app/components/ComingSoonModal';
import axios from 'axios';
import { Trade } from '@/app/models/Trade';
// Import the TradeHistory component
import TradeHistory from '@/app/components/TradeHistory';
import { isMarketOpen } from '@/app/utils/marketTime';

// Add trade type selection modal state
interface TradingMode {
  type: 'real' | 'virtual';
  selected: boolean;
}

interface Asset {
  id: string;
  name: string;
  symbol: string;
  exchange: string;
  type: 'equity' | 'futures' | 'options' | 'currency' | 'commodity' | 'index';
  amount: number;
  value: number;
  change24h: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  lotSize?: number;
}

interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

interface WatchlistItem extends Asset {
  alerts?: {
    price: number;
    condition: 'above' | 'below';
  }[];
}

export default function PortfolioPage() {
  const { user } = useAuth();
  
  // Add state for trading mode selection
  const [showTradingModeModal, setShowTradingModeModal] = useState(true);
  const [showTradeHistory, setShowTradeHistory] = useState(false);
  const [tradingMode, setTradingMode] = useState<'real' | 'virtual'>('virtual');
  const [showRealTradeNotice, setShowRealTradeNotice] = useState(false);
  
  // Initialize states without local storage
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);

  const [assets, setAssets] = useState<Asset[]>([]);

  const [marginDetails, setMarginDetails] = useState({
    availableMargin: 1000000, // Increased from 100000 to 1000000
    usedMargin: 0,
    marginRequired: 0,
    leverage: '5x'
  });

  // Remove localStorage effect
  useEffect(() => {
    
    
    
  }, [recentTrades, assets, marginDetails]);

  // Market data state
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [selectedInstrumentType, setSelectedInstrumentType] = useState<'all' | 'stocks' | 'indices'>('all');
  const [isUpdating, setIsUpdating] = useState(false);

  // Trade success notification state
  const [showTradeSuccess, setShowTradeSuccess] = useState(false);
  const [tradeMessage, setTradeMessage] = useState('');

  const [totalPnL, setTotalPnL] = useState(0);
  const [dayPnL, setDayPnL] = useState(0);

  // Add state for option trading
  const [showOptionChain, setShowOptionChain] = useState(false);
  const [selectedOption, setSelectedOption] = useState<{ strike: number; type: 'CE' | 'PE' } | null>(null);
  
  // Add state for algo trading
  const [showAlgoTradingModal, setShowAlgoTradingModal] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
  // Add state for risk level
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<'moderate' | 'risky' | 'highlyRisky'>('risky');
  const [riskPercentage, setRiskPercentage] = useState(50);
  const [algoParameters, setAlgoParameters] = useState<Record<string, any>>({
    timeFrame: '1h',
    capital: 10,
    stopLoss: 5,
    takeProfit: 10,
    lotSize: 1,
    minTarget: 50,
    maxStopLoss: 100,
    isActive: false
  });
  const [ltpData, setLtpData] = useState<any>(null);
  const [algoStatus, setAlgoStatus] = useState<'idle' | 'running' | 'error'>('idle');
  const algoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');

  // Add state for loading trades from database
  const [isLoadingTrades, setIsLoadingTrades] = useState(false);
  
  // Fetch user's trades from MongoDB when component mounts
  useEffect(() => {
    const fetchUserTrades = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoadingTrades(true);
        const response = await axios.get(`/api/trades?userId=${user.id}`);
        if (response.data && Array.isArray(response.data.trades)) {
          setRecentTrades(response.data.trades);
        }
      } catch (error) {
        
      } finally {
        setIsLoadingTrades(false);
      }
    };
    
    fetchUserTrades();
  }, [user?.id]);
  
  // Save trade to MongoDB
  const saveTrade = async (trade: Trade) => {
    if (!user?.id) return;
    
    try {
      // Add userId to the trade
      const tradeWithUserId = {
        ...trade,
        userId: user.id
      };
      
      // Save to MongoDB
      await axios.post('/api/trades', tradeWithUserId);
    } catch (error) {
      
    }
  };
  
  // Update trade in MongoDB
  const updateTrade = async (tradeId: string, updates: Partial<Trade>) => {
    if (!user?.id) return;
    
    try {
      await axios.put(`/api/trades/${tradeId}`, {
        ...updates,
        userId: user.id
      });
    } catch (error) {
      
    }
  };

  // Define market symbols and their Yahoo Finance symbols
  const marketSymbols = {
    stocks: [
      { name: 'Reliance Industries', symbol: 'RELIANCE.NS', type: 'equity' },
      { name: 'HDFC Bank', symbol: 'HDFCBANK.NS', type: 'equity' },
      { name: 'Infosys', symbol: 'INFY.NS', type: 'equity' },
      { name: 'TCS', symbol: 'TCS.NS', type: 'equity' },
      { name: 'ITC', symbol: 'ITC.NS', type: 'equity' }
    ],
    indices: [
      { 
        name: 'NIFTY 50', 
        symbol: '^NSEI',
        type: 'index',
        lotSize: 75
      }
    ]
  };

  // Function to fetch stock data from Yahoo Finance through our proxy API
  const fetchStockData = async (symbol: string) => {
    try {
      const response = await fetch(`/api/yahoo-finance?symbol=${encodeURIComponent(symbol)}`);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.error || data.chart.error) {
        throw new Error(data.error || data.chart.error.description);
      }

      const result = data.chart.result[0];
      const meta = result.meta;

      return {
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.chartPreviousClose,
        changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
        dayHigh: meta.regularMarketDayHigh,
        dayLow: meta.regularMarketDayLow,
        volume: meta.regularMarketVolume,
        longName: meta.longName || meta.shortName,
        shortName: meta.shortName
      };
    } catch (error) {
      
      return null;
    }
  };

  // Function to update market data
  const updateMarketData = async () => {
    setIsUpdating(true);
    try {
      // Update assets with both stocks and tradable indices
      const stocksData = await Promise.all(
        marketSymbols.stocks.map(async (stock, index) => {
          try {
            const data = await fetchStockData(stock.symbol);
            if (data) {
              return {
                id: `stock-${index + 1}`,
                name: data.longName || stock.name,
                symbol: stock.symbol.replace('.NS', ''),
                exchange: 'NSE',
                type: stock.type,
                amount: 0,
                value: data.price,
                change24h: data.changePercent,
                dayHigh: data.dayHigh,
                dayLow: data.dayLow,
                volume: data.volume
              };
            }
          } catch (error) {
            
          }
          return null;
        })
      );

      const tradableIndices = await Promise.all(
        marketSymbols.indices
          .filter(index => index.type === 'index')
          .map(async (index, idx) => {
            try {
              const data = await fetchStockData(index.symbol);
              if (data) {
                return {
                  id: `index-${idx + 1}`,
                  name: index.name,
                  symbol: index.symbol,
                  exchange: 'NSE',
                  type: 'index',
                  amount: 0,
                  value: data.price,
                  change24h: data.changePercent,
                  dayHigh: data.dayHigh,
                  dayLow: data.dayLow,
                  volume: data.volume,
                  lotSize: index.lotSize
                };
              }
            } catch (error) {
              
            }
            return null;
          })
      );

      const validStocksData = (stocksData || []).filter(Boolean) as Asset[];
      const validIndicesData = (tradableIndices || []).filter(Boolean) as Asset[];
      
      // Safely update assets by preserving existing options/trades
      setAssets(prevAssets => {
        // Keep existing option assets
        const existingOptions = Array.isArray(prevAssets) ? 
          prevAssets.filter(a => a && a.type === 'options') : 
          [];
        
        return [...validStocksData, ...validIndicesData, ...existingOptions];
      });
    } catch (error) {
      
    } finally {
      setIsUpdating(false);
    }
  };

  // Fetch market data on component mount and every second
  useEffect(() => {
    // Initial fetch
    updateMarketData();

    // Set up interval for real-time updates
    const interval = setInterval(async () => {
      try {
        await updateMarketData();
      } catch (error) {
        
      }
    }, 1000); // Update every second

    // Cleanup function to clear interval when component unmounts
    return () => clearInterval(interval);
  }, []); // Empty dependency array since updateMarketData is stable

  // Initialize watchlist with some stocks
  useEffect(() => {
    try {
      if (Array.isArray(assets) && assets.length > 0) {
        const watchlistItems = assets.slice(0, 2).map(asset => {
          if (!asset) return null;
          
          const assetValue = typeof asset.value === 'number' && !isNaN(asset.value) ? asset.value : 0;
          
          return {
            ...asset,
            alerts: [{ price: assetValue * 1.05, condition: 'above' }]
          };
        }).filter(Boolean) as WatchlistItem[];
        
        if (watchlistItems.length > 0) {
          setWatchlist(watchlistItems);
        }
      }
    } catch (error) {
      
    }
  }, [assets]);

  // Calculate total P&L from active trades
  useEffect(() => {
    try {
      let totalProfit = 0;
      let dayProfit = 0;
      const today = new Date().toDateString();

      if (!Array.isArray(recentTrades) || !Array.isArray(assets)) {
        setTotalPnL(0);
        setDayPnL(0);
        return;
      }

      // First, organize trades by asset and match buy/sell pairs
      const tradesByAsset: Record<string, Trade[]> = {};
      
      // Group trades by asset
      recentTrades.forEach(trade => {
        if (!trade || !trade.asset) return;
        
        if (!tradesByAsset[trade.asset]) {
          tradesByAsset[trade.asset] = [];
        }
        tradesByAsset[trade.asset].push(trade);
      });
      
      // Calculate P&L for each asset
      Object.keys(tradesByAsset).forEach(assetSymbol => {
        const assetTrades = tradesByAsset[assetSymbol];
        const asset = assets.find(a => a && a.symbol === assetSymbol);
        if (!asset) return;

        // For active trades (not matched with a closing trade)
        const activeTrades = assetTrades.filter((t: Trade) => 
          t.status !== 'completed' && !t.completedWith && (t.remainingAmount || t.amount) > 0
        );
        
        // For completed trades (matched buy/sell pairs)
        const completedTrades = assetTrades.filter((t: Trade) => 
          t.completedWith && t.status === 'completed'
        );
        
        // Calculate unrealized P&L for active trades
        activeTrades.forEach((trade: Trade) => {
        // Safely access properties with fallbacks
        const activeAmount = trade.remainingAmount || trade.amount || 0;
        const assetValue = typeof asset.value === 'number' && !isNaN(asset.value) ? asset.value : 0;
        const tradePrice = typeof trade.price === 'number' && !isNaN(trade.price) ? trade.price : 0;
        const lotSize = trade.lotSize || 1;
        
          // For options, calculate using premium difference
          if (trade.isOption) {
            // For active options, calculate unrealized P&L based on current premium vs entry premium
            const premiumDiffActive = trade.type === 'buy' ? 
              (assetValue - tradePrice) : 
              (tradePrice - assetValue);
            
            // Calculate number of lots
            const numLotsActive = activeAmount / lotSize;
            
            // P&L = premium difference × lot size × number of lots
            const tradePnL = premiumDiffActive * lotSize * numLotsActive;
            
            totalProfit += tradePnL;
            
            // Add to day's P&L if trade was made today
            if (trade.timestamp && new Date(trade.timestamp).toDateString() === today) {
              dayProfit += tradePnL;
            }
          } else {
            // For stocks, calculate normally
            const currentValue = activeAmount * assetValue;
            const costBasis = activeAmount * tradePrice;
        const tradePnL = trade.type === 'buy' ? currentValue - costBasis : costBasis - currentValue;
        
        totalProfit += tradePnL;
        
            // Add to day's P&L if trade was made today
          if (trade.timestamp && new Date(trade.timestamp).toDateString() === today) {
            dayProfit += tradePnL;
          }
          }
        });
        
        // Calculate realized P&L for completed trades
        completedTrades.forEach((trade: Trade) => {
          // Find the matching trade that closed this position
          const matchingTrade = assetTrades.find((t: Trade) => t.id === trade.completedWith);
          if (!matchingTrade) return;
          
          // For options, calculate using premium difference between buy and sell
          if (trade.isOption) {
            const buyTrade = trade.type === 'buy' ? trade : matchingTrade;
            const sellTrade = trade.type === 'sell' ? trade : matchingTrade;
            
            // Get premiums
            const buyPremium = buyTrade.price || 0;
            const sellPremium = sellTrade.price || 0;
            
            // Calculate premium difference
            const premiumDiffCompleted = sellPremium - buyPremium;
            
            // Get lot size and number of contracts
            const lotSize = trade.lotSize || 1;
            const contracts = Math.min(
              trade.originalAmount || trade.amount || 0,
              matchingTrade.originalAmount || matchingTrade.amount || 0
            );
            
            // Calculate number of lots
            const numLotsCompleted = contracts / lotSize;
            
            // P&L = premium difference × lot size × number of lots
            const tradePnL = premiumDiffCompleted * lotSize * numLotsCompleted;
            
            totalProfit += tradePnL;
            
            // Add to day's P&L if trade was completed today
            if (trade.completedAt && new Date(trade.completedAt).toDateString() === today) {
              dayProfit += tradePnL;
            }
          } else {
            // For stocks, calculate normally
            const buyTrade = trade.type === 'buy' ? trade : matchingTrade;
            const sellTrade = trade.type === 'sell' ? trade : matchingTrade;
            
            const buyPrice = buyTrade.price || 0;
            const sellPrice = sellTrade.price || 0;
            const amount = Math.min(
              trade.originalAmount || trade.amount || 0,
              matchingTrade.originalAmount || matchingTrade.amount || 0
            );
            
            const tradePnL = (sellPrice - buyPrice) * amount;
            
            totalProfit += tradePnL;
            
            // Add to day's P&L if trade was completed today
            if (trade.completedAt && new Date(trade.completedAt).toDateString() === today) {
              dayProfit += tradePnL;
            }
          }
        });
      });

      setTotalPnL(totalProfit);
      setDayPnL(dayProfit);
    } catch (error) {
      
      // Set defaults on error
      setTotalPnL(0);
      setDayPnL(0);
    }
  }, [recentTrades, assets]);

  // Trade Modal State
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeAmount, setTradeAmount] = useState('');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop' | 'stoplimit'>('market');
  const [productType, setProductType] = useState<'intraday' | 'cnc' | 'co'>('intraday');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');

  const totalValue = assets.reduce((sum, asset) => sum + (asset.amount * asset.value), 0);
  const totalChange24h = assets.reduce((sum, asset) => sum + (asset.amount * asset.value * (asset.change24h / 100)), 0);

  const handleOptionSelect = (strike: number, type: 'CE' | 'PE', premium: number) => {
    const optionName = `NIFTY ${strike} ${type}`;
    const optionSymbol = `NIFTY${strike}${type}`;
    
    setSelectedOption({ strike, type });
    const newAsset: Asset = {
      id: `NIFTY-${type}-${strike}`,
      name: optionName,
      symbol: optionSymbol,
      exchange: 'NSE',
      type: 'options',
      amount: 0,
      value: premium,
      change24h: 0,
      lotSize: 75  // Always set to 75 for NIFTY options
    };
    
    // Immediately add the asset to the assets list
    setAssets(prevAssets => {
      // Check if asset already exists
      const existingAssetIndex = prevAssets.findIndex(a => a.symbol === optionSymbol);
      if (existingAssetIndex >= 0) {
        // Update existing asset with new premium value
        const updatedAssets = [...prevAssets];
        updatedAssets[existingAssetIndex] = {
          ...updatedAssets[existingAssetIndex],
          value: premium
        };
        return updatedAssets;
      }
      // Add new asset
      return [...prevAssets, newAsset];
    });
    
    setSelectedAsset(newAsset);
    setTradeType('buy');
    setTradeAmount('75'); // Default to exactly 1 lot (75 contracts)
    setOrderType('market');
    setProductType('intraday');
    setShowTradeModal(true);
    setShowOptionChain(false);
  };

  // Add this new implementation instead:
  const updateOptionPricesRef = useRef<NodeJS.Timeout | null>(null);

  // Safe update function that only uses real data from API
  const safeUpdateOptionPrices = useCallback(() => {
    try {
      if (!assets || !Array.isArray(assets)) return;
      
      // Only try to update options with real data from API
      const optionAssets = assets.filter(asset => 
        asset && typeof asset === 'object' && asset.type === 'options'
      );
      
      // If we have option assets, try to fetch real data for them
      if (optionAssets.length > 0) {
        // Get the first expiry date we have
        const today = new Date();
        const nextThursday = new Date(today);
        nextThursday.setDate(today.getDate() + ((4 + 7 - today.getDay()) % 7));
        const currentExpiry = nextThursday.toISOString().split('T')[0];
        
        if (currentExpiry) {
          // Fetch option chain data for the current expiry
          fetch(`/api/option-chain?instrument_key=NSE_INDEX|Nifty 50&expiry_date=${currentExpiry}`)
            .then(res => res.json())
            .then(data => {
              if (data.status === 'success' && data.data && data.data.length > 0) {
                // Sort by strike price
                const sortedData = [...data.data].sort((a, b) => a.strike_price - b.strike_price);
                
                // Update assets with real option data
                setAssets(currentAssets => {
                  if (!currentAssets || !Array.isArray(currentAssets)) return currentAssets;
                  
                  return currentAssets.map(asset => {
                    if (!asset || typeof asset !== 'object' || asset.type !== 'options') 
                      return asset;
                    
                    // Extract strike price and option type from symbol
                    const strikeMatch = asset.symbol.match(/\d+/);
                    const isCallOption = asset.symbol.includes('CE');
                    const isPutOption = asset.symbol.includes('PE');
                    
                    if (!strikeMatch || (!isCallOption && !isPutOption)) 
                      return asset;
                    
                    const strike = parseInt(strikeMatch[0]);
                    const optionType = isCallOption ? 'CE' : 'PE';
                    
                    // Find matching option in the fetched data
                    const matchingOption = sortedData.find(item => 
                      item.strike_price === strike
                    );
                    
                    if (matchingOption) {
                      const optionData = optionType === 'CE' 
                        ? matchingOption.call_options 
                        : matchingOption.put_options;
                      
                      const newPrice = optionData.market_data.ltp;
                      const oldPrice = asset.value;
                      const priceChange = oldPrice > 0 
                        ? ((newPrice - oldPrice) / oldPrice) * 100 
                        : 0;
                      
                      return {
                        ...asset,
                        value: newPrice,
                        change24h: asset.change24h + priceChange
                      };
                    }
                    
                    // If no matching option found, keep the existing data
                    return asset;
                  });
                });
              } else {
                
                // Don't update with fake data, just keep existing data
              }
            })
            .catch(err => {
              
              // Don't update with fake data, just keep existing data
            });
        }
      }
    } catch (error) {
      
      // Don't update with fake data, just keep existing data
    }
  }, [assets]);

  // Setup and cleanup the interval
  useEffect(() => {
    try {
      // Clear any existing interval
      if (updateOptionPricesRef.current) {
        clearInterval(updateOptionPricesRef.current);
        updateOptionPricesRef.current = null;
      }
      
      // Always set up the interval, regardless of whether we have options or not
      // This ensures that when options are added, they'll immediately start updating
      updateOptionPricesRef.current = setInterval(() => {
        safeUpdateOptionPrices();
      }, 1000); // Update every second instead of every 5 seconds
      
      // Cleanup function
      return () => {
        if (updateOptionPricesRef.current) {
          clearInterval(updateOptionPricesRef.current);
          updateOptionPricesRef.current = null;
        }
      };
    } catch (error) {
      
    }
  }, [safeUpdateOptionPrices]);

  // Add a function to exit a position
  const exitPosition = (trade: Trade) => {
    // If no trade or asset, do nothing
    if (!trade) return;
    const asset = assets.find(a => a && a.symbol === trade.asset);
    if (!asset) return;
    
    // Set up the exit trade with opposite type
    setSelectedAsset(asset);
    setTradeType(trade.type === 'buy' ? 'sell' : 'buy');
    setTradeAmount((trade.remainingAmount || trade.amount).toString());
    setOrderType('market');
    setProductType('intraday');
    setShowTradeModal(true);
  };

  // Add a function to close a position immediately
  const closePosition = (trade: Trade) => {
    // If no trade or asset, do nothing
    if (!trade) return;
    const asset = assets.find(a => a && a.symbol === trade.asset);
    if (!asset || !asset.symbol) return; // Add check for asset.symbol
    
    // Ensure user ID is available
    if (!user?.id) {
      
      setTradeMessage('Error: User authentication required');
      setShowTradeSuccess(true);
      return;
    }
    
    // Create an exit trade with opposite type
    const exitType = trade.type === 'buy' ? 'sell' : 'buy';
    const exitAmount = trade.remainingAmount || trade.amount;
    const currentPrice = asset.value;
    
    // Create the exit trade with the correct type
    const exitTrade: Trade = {
      id: String(Date.now()),
      type: exitType,
      asset: asset.symbol, // Use asset.symbol directly since we've checked it's not undefined
      amount: exitAmount,
      price: currentPrice,
      timestamp: new Date().toISOString(),
      orderType: 'market',
      status: 'executed',
      originalAmount: exitAmount,
      lotSize: trade.lotSize,
      isOption: trade.isOption,
      strikePrice: trade.strikePrice,
      optionType: trade.optionType,
      premium: trade.isOption ? currentPrice : undefined,
      completedWith: trade.id,
      userId: user.id // Use user.id directly
    };
    
    // Update the original trade status
    const updatedTrades = recentTrades.map(t => {
      if (t.id === trade.id) {
        // Create a new trade object with the updated status
        const updatedTrade = {
          ...t,
          status: 'completed' as const,
          completedWith: exitTrade.id,
          completedAt: new Date().toISOString() // Add completion timestamp
        };
        
        // Update the trade in MongoDB
        updateTrade(t.id, updatedTrade);
        
        return updatedTrade;
      }
      return t;
    }) as Trade[]; // Cast to Trade[] to ensure type safety
    
    // Add the exit trade
    const newTrades = [exitTrade, ...updatedTrades];
    
    // Save the exit trade to MongoDB
    saveTrade(exitTrade);
    
    // Calculate P&L for this closed position
    let pnl = 0;
    let pnlText = '';
    
    if (trade.isOption) {
      // For options: P&L = premium difference × lot size × number of lots
      const buyTrade = trade.type === 'buy' ? trade : exitTrade;
      const sellTrade = trade.type === 'sell' ? trade : exitTrade;
      
      const buyPremium = buyTrade.price;
      const sellPremium = sellTrade.price;
      const premiumDiffClosed = sellPremium - buyPremium;
      
      const lotSizeCalc = trade.lotSize || 75; // Default to 75 if lotSize is not defined
      const numLotsClosed = exitAmount / lotSizeCalc;
      
      pnl = premiumDiffClosed * lotSizeCalc * numLotsClosed;
      
      pnlText = ` with P&L: ${pnl >= 0 ? '+' : ''}₹${pnl.toFixed(2)} (${premiumDiffClosed >= 0 ? '+' : ''}₹${premiumDiffClosed.toFixed(2)} × ${lotSizeCalc} × ${numLotsClosed})`;
    } else {
      // For stocks: P&L = (sell price - buy price) × quantity
      const buyPrice = trade.type === 'buy' ? trade.price : currentPrice;
      const sellPrice = trade.type === 'sell' ? trade.price : currentPrice;
      
      pnl = (sellPrice - buyPrice) * exitAmount;
      pnlText = ` with P&L: ${pnl >= 0 ? '+' : ''}₹${pnl.toFixed(2)}`;
    }
    
    // Calculate values for margin update
    const isOption = trade.isOption;
    const lotSize = trade.lotSize || 75; // Default to 75 if lotSize is not defined
    // For options, we just need the amount * price, without multiplying by lotSize again
    const tradeValue = exitAmount * currentPrice;
    
    // Update margin
    const updatedMargin = {
      ...marginDetails,
      availableMargin: exitType === 'buy' ? 
        marginDetails.availableMargin - tradeValue : 
        marginDetails.availableMargin + tradeValue,
      usedMargin: exitType === 'buy' ?
        marginDetails.usedMargin + tradeValue :
        marginDetails.usedMargin - tradeValue
    };
    
    // Update state
    setMarginDetails(updatedMargin);
    setRecentTrades(newTrades);
    
    // Show success message
    const quantityText = isOption ? 
      `${exitAmount} contracts (${exitAmount/lotSize} lots)` : 
      `${exitAmount} shares`;
      
    const totalCostText = isOption ? 
      ` for ₹${(exitAmount * currentPrice).toLocaleString()}` :
      ` for ₹${(exitAmount * currentPrice).toLocaleString()}`;
      
    setTradeMessage(`Position closed: ${exitType === 'buy' ? 'Bought' : 'Sold'} ${quantityText} of ${asset.name} at ₹${currentPrice}${totalCostText}${pnlText}`);
    setShowTradeSuccess(true);
    setTimeout(() => setShowTradeSuccess(false), 5000);

    // Close modal and reset form
    setShowTradeModal(false);
    setTradeAmount('');
    setLimitPrice('');
    setStopPrice('');
    setTargetPrice('');
    setStopLoss('');
    setOrderType('market');
  };

  // Function to handle Nifty option trading - only allow for indices, not stocks like Reliance
  const handleNiftyTrade = (asset: Asset, tradeType: 'buy' | 'sell') => {
    // Only allow option trading for indices, not for stocks like Reliance
    if (asset.type === 'index') {
    setShowOptionChain(true);
    } else {
      // For stocks, just use regular trading
      setSelectedAsset(asset);
      setTradeType(tradeType);
      if (asset.lotSize) {
        setTradeAmount(asset.lotSize.toString());
      }
      setShowTradeModal(true);
    }
  };

  // Add useEffect for debugging
  useEffect(() => {
    
    
  }, [recentTrades, assets]);

  // Add this debugging effect
  useEffect(() => {
    // Debug log for active trades
    const activeTrades = recentTrades.filter(trade => 
      trade.status === 'executed' || trade.status === 'partially_completed'
    );
    
    
    // Check if assets exist for trades
    const missingAssets = activeTrades.filter(trade => 
      !assets.find(a => a.symbol === trade.asset)
    );
    if (missingAssets.length > 0) {
      
    }
  }, [recentTrades, assets]);

  // Update the handleTrade function to check for matching trades
  const handleTrade = () => {
    if (!selectedAsset || !tradeAmount) return;
    
    // Ensure user ID is available
    if (!user?.id) {
      
      setTradeMessage('Error: User authentication required');
      setShowTradeSuccess(true);
      return;
    }

    const newTradeAmount = parseFloat(tradeAmount);
    
    // Validate trade amount is positive
    if (newTradeAmount <= 0) {
      setTradeMessage('Trade quantity must be positive');
      setShowTradeSuccess(true);
      return;
    }

    // For options and indices, validate lot size
    const isOption = selectedAsset.type === 'options' || 
      (typeof selectedAsset.symbol === 'string' && (selectedAsset.symbol.includes('CE') || selectedAsset.symbol.includes('PE')));
    
    if (isOption) {
      const lotSize = selectedAsset.lotSize || 75;
      if (newTradeAmount % lotSize !== 0) {
        setTradeMessage(`For options: Quantity must be in multiples of ${lotSize} (1 lot = ${lotSize} contracts)`);
        setShowTradeSuccess(true);
        return;
      }
    } 
    else if (selectedAsset.type === 'index' && selectedAsset.lotSize) {
      if (newTradeAmount % selectedAsset.lotSize !== 0) {
        setTradeMessage(`Quantity must be in multiples of ${selectedAsset.lotSize} lots`);
        setShowTradeSuccess(true);
        return;
      }
    }

    const tradePrice = orderType === 'market' ? selectedAsset.value :
      orderType === 'limit' ? parseFloat(limitPrice) :
      orderType === 'stop' ? parseFloat(stopPrice) :
      parseFloat(limitPrice);

    // Calculate total trade value including premium for options
    const lotSize = selectedAsset.lotSize || 75; // Default to 75 if lotSize is not defined
    // For options, we just multiply the number of contracts by the premium
    // No need to multiply by lotSize again since the number of contracts already accounts for it
    const tradeValue = newTradeAmount * tradePrice;

    // Find active opposite trades for the same asset
    let remainingAmount = newTradeAmount;
    let matchedTrades: { tradeId: string; matchedAmount: number }[] = [];
    
    // Only look for matches if this is a market order
    if (orderType === 'market') {
      // Get all active opposite trades for this asset
      const oppositeTrades = recentTrades.filter(t => 
        t.asset === selectedAsset.symbol && 
        t.type !== tradeType &&
        t.status !== 'completed' &&
        !t.completedWith &&
        (t.remainingAmount || t.amount) > 0
      );

      // Try to match trades
      for (const trade of oppositeTrades) {
        if (remainingAmount <= 0) break;
        
        const availableAmount = trade.remainingAmount || trade.amount;
        
        if (availableAmount <= remainingAmount) {
          // Can fully complete this trade
          matchedTrades.push({
            tradeId: trade.id,
            matchedAmount: availableAmount
          });
          remainingAmount -= availableAmount;
        } else {
          // Can partially complete this trade
          matchedTrades.push({
            tradeId: trade.id,
            matchedAmount: remainingAmount
          });
          remainingAmount = 0;
          break;
        }
      }
    }

    // Create the new trade
    const newTrade: Trade = {
      id: String(Date.now()),
      type: tradeType,
      asset: selectedAsset.symbol,
      amount: newTradeAmount,
      remainingAmount: remainingAmount > 0 ? remainingAmount : undefined,
      price: tradePrice,
      timestamp: new Date().toISOString(),
      orderType: orderType,
      status: matchedTrades.length > 0 && remainingAmount === 0 ? 'completed' as const :
             matchedTrades.length > 0 ? 'partially_completed' as const :
             'executed' as const,
      completedWith: matchedTrades.length > 0 && remainingAmount === 0 ? matchedTrades[0].tradeId : undefined,
      originalAmount: newTradeAmount,
      lotSize: selectedAsset.lotSize,
      isOption: isOption,
      strikePrice: isOption ? parseInt(selectedAsset.symbol.match(/\d+/)?.[0] || '0') : undefined,
      optionType: selectedAsset.symbol.includes('CE') ? 'CE' : selectedAsset.symbol.includes('PE') ? 'PE' : undefined,
      premium: isOption ? tradePrice : undefined,
      userId: user.id // Use user.id directly
    };

    // Update matched trades
    const updatedTrades = recentTrades.map(trade => {
      const match = matchedTrades.find(m => m.tradeId === trade.id);
      if (match) {
        const currentRemaining = trade.remainingAmount || trade.amount;
        const newRemaining = currentRemaining - match.matchedAmount;
        
        const updatedTrade = {
          ...trade,
          status: newRemaining <= 0 ? 'completed' as const : 'partially_completed' as const,
          remainingAmount: newRemaining > 0 ? newRemaining : undefined,
          completedWith: newTrade.id,
          completedAt: newRemaining <= 0 ? new Date().toISOString() : undefined // Add completion timestamp
        } as Trade;
        
        // Update the trade in MongoDB
        updateTrade(trade.id, updatedTrade);
        
        return updatedTrade;
      }
      return trade;
    });

    // Add the new trade
    const finalTrades = [newTrade, ...updatedTrades] as Trade[];

    // Save the new trade to MongoDB
    saveTrade(newTrade);

    // Update margin based on remaining amount
    const marginAdjustment = remainingAmount * tradePrice;
    const updatedMargin = {
      ...marginDetails,
      availableMargin: tradeType === 'buy' ? 
        marginDetails.availableMargin - marginAdjustment : 
        marginDetails.availableMargin + marginAdjustment,
      usedMargin: tradeType === 'buy' ?
        marginDetails.usedMargin + marginAdjustment :
        marginDetails.usedMargin - marginAdjustment
    };

    // Update states
    setMarginDetails(updatedMargin);
    setRecentTrades(finalTrades);

    // Show success message
    const quantityText = isOption ? 
      `${newTradeAmount} contracts (${newTradeAmount/lotSize} lots)` : 
      `${newTradeAmount} shares`;

    const matchedText = matchedTrades.length > 0 ? 
      ` (matched ${matchedTrades.reduce((sum, m) => sum + m.matchedAmount, 0)} ${isOption ? 'contracts' : 'shares'})` : 
      '';

    const remainingText = remainingAmount > 0 ?
      ` (${remainingAmount} ${isOption ? 'contracts' : 'shares'} remaining)` :
      '';

    const totalCostText = isOption ? 
      ` for ₹${(newTradeAmount * tradePrice).toLocaleString()}` :
      ` for ₹${(newTradeAmount * tradePrice).toLocaleString()}`;

    setTradeMessage(
      `${orderType === 'market' ? '' : 'Order placed: '}${tradeType === 'buy' ? 'Bought' : 'Sold'} ${quantityText} of ${selectedAsset.name}${matchedText}${remainingText}${totalCostText}`
    );
    setShowTradeSuccess(true);
    setTimeout(() => setShowTradeSuccess(false), 5000);

    // Close modal and reset form
    setShowTradeModal(false);
    setTradeAmount('');
    setLimitPrice('');
    setStopPrice('');
    setTargetPrice('');
    setStopLoss('');
    setOrderType('market');
  };

  // Function to fetch LTP calculator data
  const fetchLtpData = useCallback(async (symbol: string) => {
    try {
      const response = await fetch(`/api/ltp-calculator?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      setLtpData(data);
      return data;
    } catch (error) {
      
      setAlgoStatus('error');
      return null;
    }
  }, []);

  // Function to determine if we should take a trade based on risk level and LTP data
  const shouldTakeTrade = useCallback((data: any, riskLevel: 'moderate' | 'risky' | 'highlyRisky'): { 
    shouldTrade: boolean; 
    optionType?: 'CE' | 'PE'; 
    reason?: string 
  } => {
    if (!data) return { shouldTrade: false };
    
    const asset = assets.find(a => 
      a && a.symbol && (a.symbol === '^NSEI' || a.symbol === selectedInstrument?.toUpperCase())
    );
    
    if (!asset || !asset.value) return { shouldTrade: false };
    
    const currentPrice = asset.value;
    
    const moderateSupport = data.moderateSupport;
    const moderateResistance = data.moderateResistance;
    const riskySupport = data.riskySupport;
    const riskyResistance = data.riskyResistance;
    
    // For moderate risk level, only take trades when price hits moderate levels
    if (riskLevel === 'moderate') {
      // Take call option when price hits moderate support
      if (moderateSupport && Math.abs(currentPrice - moderateSupport) < 5) {
        return { 
          shouldTrade: true, 
          optionType: 'CE', 
          reason: `Price (${currentPrice}) hit moderate support (${moderateSupport})` 
        };
      }
      
      // Take put option when price hits moderate resistance
      if (moderateResistance && Math.abs(currentPrice - moderateResistance) < 5) {
        return { 
          shouldTrade: true, 
          optionType: 'PE', 
          reason: `Price (${currentPrice}) hit moderate resistance (${moderateResistance})` 
        };
      }
    }
    
    // For risky level, take trades when price hits either moderate or risky levels
    if (riskLevel === 'risky') {
      // Check moderate levels first
      if (moderateSupport && Math.abs(currentPrice - moderateSupport) < 5) {
        return { 
          shouldTrade: true, 
          optionType: 'CE', 
          reason: `Price (${currentPrice}) hit moderate support (${moderateSupport})` 
        };
      }
      
      if (moderateResistance && Math.abs(currentPrice - moderateResistance) < 5) {
        return { 
          shouldTrade: true, 
          optionType: 'PE', 
          reason: `Price (${currentPrice}) hit moderate resistance (${moderateResistance})` 
        };
      }
      
      // Then check risky levels
      if (riskySupport && Math.abs(currentPrice - riskySupport) < 5) {
        return { 
          shouldTrade: true, 
          optionType: 'CE', 
          reason: `Price (${currentPrice}) hit risky support (${riskySupport})` 
        };
      }
      
      if (riskyResistance && Math.abs(currentPrice - riskyResistance) < 5) {
        return { 
          shouldTrade: true, 
          optionType: 'PE', 
          reason: `Price (${currentPrice}) hit risky resistance (${riskyResistance})` 
        };
      }
    }
    
    // For highly risky level, take trades at any level
    if (riskLevel === 'highlyRisky') {
      // Check all levels
      if (moderateSupport && Math.abs(currentPrice - moderateSupport) < 5) {
        return { 
          shouldTrade: true, 
          optionType: 'CE', 
          reason: `Price (${currentPrice}) hit moderate support (${moderateSupport})` 
        };
      }
      
      if (moderateResistance && Math.abs(currentPrice - moderateResistance) < 5) {
        return { 
          shouldTrade: true, 
          optionType: 'PE', 
          reason: `Price (${currentPrice}) hit moderate resistance (${moderateResistance})` 
        };
      }
      
      if (riskySupport && Math.abs(currentPrice - riskySupport) < 5) {
        return { 
          shouldTrade: true, 
          optionType: 'CE', 
          reason: `Price (${currentPrice}) hit risky support (${riskySupport})` 
        };
      }
      
      if (riskyResistance && Math.abs(currentPrice - riskyResistance) < 5) {
        return { 
          shouldTrade: true, 
          optionType: 'PE', 
          reason: `Price (${currentPrice}) hit risky resistance (${riskyResistance})` 
        };
      }
    }
    
    return { shouldTrade: false };
  }, [assets, selectedInstrument]);

  // Function to find the appropriate in-the-money strike price
  const findInTheMoneyStrike = useCallback((optionType: 'CE' | 'PE', currentPrice: number) => {
    // For call options, find a strike price below the current price
    if (optionType === 'CE') {
      // Round down to the nearest 50
      return Math.floor(currentPrice / 50) * 50;
    } 
    // For put options, find a strike price above the current price
    else {
      // Round up to the nearest 50
      return Math.ceil(currentPrice / 50) * 50;
    }
  }, []);

  // Function to execute an algorithmic trade
  const executeAlgoTrade = useCallback(async (optionType: 'CE' | 'PE', reason: string) => {
    try {
      // Ensure user ID is available
      if (!user?.id) {
        
        return false;
      }
      
      // Find the current price of the selected instrument
      const asset = assets.find(a => 
        a && a.symbol && (a.symbol === '^NSEI' || a.symbol === selectedInstrument?.toUpperCase())
      );
      
      if (!asset || !asset.symbol) { // Add check for asset.symbol
        
        return false;
      }
      
      const currentPrice = asset.value;
      
      // Find an appropriate in-the-money strike price
      const strikePrice = findInTheMoneyStrike(optionType, currentPrice);
      
      // Calculate target and stop loss based on user parameters
      const target = currentPrice + (optionType === 'CE' ? algoParameters.minTarget : -algoParameters.minTarget);
      const stopLoss = currentPrice + (optionType === 'CE' ? -algoParameters.maxStopLoss : algoParameters.maxStopLoss);
      
      // Create option symbol
      const instrumentSymbol = selectedInstrument?.toUpperCase() || 'NIFTY';
      const optionSymbol = `${instrumentSymbol}${strikePrice}${optionType}`;
      
      // Get option premium (simulated for now)
      const premium = optionType === 'CE' 
        ? (currentPrice - strikePrice) + 50 + Math.random() * 20
        : (strikePrice - currentPrice) + 50 + Math.random() * 20;
      
      // Create a new option asset if it doesn't exist
      const optionAsset: Asset = {
        id: `${instrumentSymbol}-${optionType}-${strikePrice}`,
        name: `${instrumentSymbol} ${strikePrice} ${optionType}`,
        symbol: optionSymbol,
        exchange: 'NSE',
        type: 'options',
        amount: 0,
        value: Math.max(10, premium),
        change24h: 0,
        lotSize: instrumentSymbol === 'NIFTY' ? 75 : 30 // NIFTY = 75, BANKNIFTY = 30
      };
      
      // Add the option to assets if it doesn't exist
      setAssets(prevAssets => {
        const existingAsset = prevAssets.find(a => a.symbol === optionSymbol);
        if (existingAsset) return prevAssets;
        return [...prevAssets, optionAsset];
      });
      
      // Create a trade for the option
      const lotSize = instrumentSymbol === 'NIFTY' ? 75 : 30;
      const tradeAmount = algoParameters.lotSize * lotSize;
      
      const trade: Trade = {
        id: String(Date.now()),
        type: 'buy',
        asset: optionSymbol,
        amount: tradeAmount,
        price: Math.max(10, premium),
        timestamp: new Date().toISOString(),
        orderType: 'market',
        status: 'executed',
        lotSize: lotSize,
        isOption: true,
        strikePrice: strikePrice,
        optionType: optionType,
        premium: Math.max(10, premium),
        userId: user.id // Use user.id directly
      };
      
      // Add the trade
      setRecentTrades(prevTrades => [trade, ...prevTrades]);
      
      // Save the algo trade to MongoDB
      saveTrade(trade);
      
      // Show success message
      setTradeMessage(`Algo Trade: Bought ${tradeAmount} contracts (${algoParameters.lotSize} lots) of ${optionSymbol} at ₹${Math.max(10, premium).toFixed(2)} | Reason: ${reason} | Target: ${target.toFixed(2)}, SL: ${stopLoss.toFixed(2)}`);
      setShowTradeSuccess(true);
      setTimeout(() => setShowTradeSuccess(false), 5000);
      
      return true;
    } catch (error) {
      
      return false;
    }
  }, [assets, algoParameters, selectedInstrument, findInTheMoneyStrike, user?.id, saveTrade]);

  // Function to run the algorithm trading logic
  const runAlgoTrading = useCallback(async () => {
    if (!selectedInstrument || !algoParameters.isActive) return;
    
    // Only allow algorithm trading for NIFTY and not Highly Risky
    if (selectedInstrument !== 'nifty' || selectedRiskLevel === 'highlyRisky') {
      
      setAlgoParameters({
        ...algoParameters,
        isActive: false
      });
      setAlgoStatus('idle');
      return;
    }
    
    try {
      // Map the selected instrument to the correct symbol for LTP calculator
      const ltpSymbol = 'NIFTY';
      
      // Fetch LTP data
      const data = await fetchLtpData(ltpSymbol);
      if (!data) return;
      
      // Check if we should take a trade
      const { shouldTrade, optionType, reason } = shouldTakeTrade(data, selectedRiskLevel);
      
      if (shouldTrade && optionType && reason) {
        // Execute the trade
        await executeAlgoTrade(optionType as 'CE' | 'PE', reason);
      }
    } catch (error) {
      
      setAlgoStatus('error');
    }
  }, [selectedInstrument, algoParameters.isActive, selectedRiskLevel, fetchLtpData, shouldTakeTrade, executeAlgoTrade]);

  // Set up and clean up the algorithm trading interval
  useEffect(() => {
    if (algoParameters.isActive && selectedInstrument) {
      // Clear any existing interval
      if (algoIntervalRef.current) {
        clearInterval(algoIntervalRef.current);
        algoIntervalRef.current = null;
      }
      
      // Run once immediately
      runAlgoTrading();
      
      // Then set up interval to run every 30 seconds
      algoIntervalRef.current = setInterval(runAlgoTrading, 30000);
      setAlgoStatus('running');
      
      
    } else {
      // Clear the interval if algo is not active
      if (algoIntervalRef.current) {
        clearInterval(algoIntervalRef.current);
        algoIntervalRef.current = null;
        setAlgoStatus('idle');
        
      }
    }
    
    // Cleanup function
    return () => {
      if (algoIntervalRef.current) {
        clearInterval(algoIntervalRef.current);
        algoIntervalRef.current = null;
      }
    };
  }, [algoParameters.isActive, selectedInstrument, selectedRiskLevel, runAlgoTrading]);

  const [marketOpen, setMarketOpen] = useState(true);
  const [showMarketClosedModal, setShowMarketClosedModal] = useState(false);

  // Check market open status every minute
  useEffect(() => {
    const checkMarket = () => {
      const open = isMarketOpen();
      setMarketOpen(open);
      setShowMarketClosedModal(!open);
    };
    checkMarket();
    const interval = setInterval(checkMarket, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      <main className="container mx-auto px-4 py-8">
        {/* Trading Mode Selection Modal */}
        <AnimatePresence>
          {showTradingModeModal && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl border border-gray-700 p-8 w-full max-w-2xl"
              >
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Choose Trading Mode</h2>
                <p className="text-gray-300 text-center mb-8">Select how you want to trade in this session</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={() => {
                      setTradingMode('real');
                      setShowRealTradeNotice(true);
                      setShowTradingModeModal(false);
                    }}
                    className="bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl p-6 flex flex-col items-center justify-center transition-all transform hover:scale-105 shadow-lg hover:shadow-blue-500/20"
                  >
                    <div className="bg-blue-500/20 p-4 rounded-full mb-4">
                      <DollarSign className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Real Trading</h3>
                    <p className="text-blue-200 text-sm text-center">Trade with real market data and execute actual orders</p>
                  </button>
                  
                  <button 
                    onClick={() => {
                      setTradingMode('virtual');
                      setShowTradingModeModal(false);
                    }}
                    className="bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white rounded-xl p-6 flex flex-col items-center justify-center transition-all transform hover:scale-105 shadow-lg hover:shadow-purple-500/20"
                  >
                    <div className="bg-purple-500/20 p-4 rounded-full mb-4">
                      <LineChart className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Virtual Trading</h3>
                    <p className="text-purple-200 text-sm text-center">Practice with virtual funds in a risk-free environment</p>
                  </button>
                </div>
                
                <div className="mt-8 text-center text-gray-400 text-sm">
                  You can change this setting later from your profile settings
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Real Trading Coming Soon Notice */}
        <AnimatePresence>
          {showRealTradeNotice && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl border border-gray-700 p-8 w-full max-w-md"
              >
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-blue-500/20 p-4 rounded-full">
                    <AlertCircle className="h-10 w-10 text-blue-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4 text-center">Coming Soon!</h2>
                <p className="text-gray-300 text-center mb-6">
                  Real trading functionality is currently under development. You'll be automatically switched to virtual trading mode.
                </p>
                <button 
                  onClick={() => {
                    setShowRealTradeNotice(false);
                    setTradingMode('virtual');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-medium transition-colors"
                >
                  Continue to Virtual Trading
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trade History Modal */}
        <TradeHistory 
          isOpen={showTradeHistory} 
          onClose={() => setShowTradeHistory(false)} 
        />

        {/* Algorithmic Trading Modal */}
        <AnimatePresence>
          {showAlgoTradingModal && (
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
                className="bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-black/90 rounded-2xl shadow-2xl border border-gray-700/50 p-6 w-full max-w-4xl my-4"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">Algorithmic Trading</h2>
                  <button
                    onClick={() => setShowAlgoTradingModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                {!selectedInstrument ? (
                  <>
                    <div className="relative mb-10 mt-2 flex justify-center">
                      <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full"></div>
                      <h3 className="relative text-xl font-medium text-white text-center mb-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50">Select Instrument to Trade</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      {[
                        {
                          id: 'nifty',
                          name: 'NIFTY 50',
                          description: 'Multi-strategy algorithmic trading on NIFTY 50 Index',
                          icon: <LineChart className="h-12 w-12 mb-3 text-blue-400" />,
                          color: 'from-blue-500/20 to-blue-600/5'
                        },
                        {
                          id: 'banknifty',
                          name: 'BANK NIFTY',
                          description: 'Multi-strategy algorithmic trading on Bank NIFTY Index',
                          icon: <BarChart4 className="h-12 w-12 mb-3 text-green-400" />,
                          color: 'from-green-500/20 to-green-600/5'
                        },
                        {
                          id: 'stocks',
                          name: 'Stocks',
                          description: 'Apply multi-strategy algorithms to selected stocks',
                          icon: <CandlestickChart className="h-12 w-12 mb-3 text-purple-400" />,
                          color: 'from-purple-500/20 to-purple-600/5'
                        }
                      ].map(instrument => (
                        <motion.button
                          key={instrument.id}
                          onClick={() => {
                            if (instrument.id === 'nifty') {
                              setSelectedInstrument(instrument.id);
                              // Fetch LTP data when instrument is selected
                              const ltpSymbol = 'NIFTY';
                              fetchLtpData(ltpSymbol);
                            } else {
                              // Show coming soon modal for other instruments
                              setComingSoonFeature(`${instrument.name} Algorithm Trading`);
                              setShowComingSoonModal(true);
                            }
                          }}
                          className={`bg-gradient-to-b ${instrument.color} hover:bg-gray-700/40 rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center border border-gray-700/50`}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {instrument.icon}
                          <h3 className="text-xl font-semibold text-white mb-2">{instrument.name}</h3>
                          <p className="text-gray-300 text-sm">{instrument.description}</p>
                        </motion.button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <button 
                          onClick={() => setSelectedInstrument(null)}
                          className="text-blue-400 hover:text-blue-300 flex items-center mr-4 transition-colors"
                        >
                          <ArrowUpRight className="h-4 w-4 mr-1 rotate-180" /> Back
                        </button>
                        <h3 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                          {selectedInstrument === 'nifty' ? 'NIFTY 50' : 
                           selectedInstrument === 'banknifty' ? 'BANK NIFTY' : 'Stocks'} Algorithm
                        </h3>
                      </div>
                      <div className="flex items-center text-sm">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          selectedInstrument === 'nifty' ? 'bg-blue-500' : 
                          selectedInstrument === 'banknifty' ? 'bg-green-500' : 'bg-purple-500'
                        }`}></div>
                        <span className="text-gray-300">Auto-selected multi-strategy</span>
                      </div>
                    </div>
                    
                    {/* Risk Selection UI - Simple Semicircle with 3 sections */}
                    <div className="mb-10 mt-5">
                      <div className="relative w-full aspect-[2/1] flex flex-col items-center justify-end">
                        {/* Perfect semicircle background */}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-800/30 to-gray-800/10 rounded-t-full overflow-hidden border-t border-l border-r border-gray-700/50">
                          {/* Three-part gradient overlay */}
                          <div className="absolute inset-0 flex">
                            <div className="w-1/3 h-full bg-gradient-to-t from-green-500/20 to-green-500/5 rounded-tl-full"></div>
                            <div className="w-1/3 h-full bg-gradient-to-t from-yellow-500/20 to-yellow-500/5"></div>
                            <div className="w-1/3 h-full bg-gradient-to-t from-red-500/20 to-red-500/5 rounded-tr-full"></div>
                          </div>
                          
                          {/* Risk level text indicators */}
                          <div className="absolute top-[15%] left-[16%] text-sm font-medium text-green-400">Moderate</div>
                          <div className="absolute top-[15%] left-1/2 text-sm font-medium text-yellow-400 -translate-x-1/2">Risky</div>
                          <div className="absolute top-[15%] right-[16%] text-sm font-medium text-red-400">Highly Risky</div>
                          
                          <div className="absolute inset-0 flex items-center justify-center pt-10">
                            <div className="text-center text-gray-300 text-lg font-medium tracking-wider">RISK PROFILE</div>
                          </div>
                        </div>
                        
                        {/* Selected section highlight */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className={`absolute top-0 left-0 w-1/3 h-full bg-green-500/30 rounded-tl-full transition-opacity ${selectedRiskLevel === 'moderate' ? 'opacity-100' : 'opacity-0'}`}></div>
                          <div className={`absolute top-0 left-1/3 w-1/3 h-full bg-yellow-500/30 transition-opacity ${selectedRiskLevel === 'risky' ? 'opacity-100' : 'opacity-0'}`}></div>
                          <div className={`absolute top-0 right-0 w-1/3 h-full bg-red-500/30 rounded-tr-full transition-opacity ${selectedRiskLevel === 'highlyRisky' ? 'opacity-100' : 'opacity-0'}`}></div>
                        </div>
                        
                        {/* Selected risk level display */}
                        <div className="absolute bottom-[30%] bg-gray-800/80 border border-gray-700 rounded-lg px-6 py-2 text-center backdrop-blur-sm shadow-lg">
                          <span className={`text-lg font-medium ${
                            selectedRiskLevel === 'moderate' ? 'text-green-400' : 
                            selectedRiskLevel === 'risky' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {selectedRiskLevel === 'moderate' ? 'Moderate' : 
                             selectedRiskLevel === 'risky' ? 'Risky' : 'Highly Risky'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Risk level buttons */}
                      <div className="flex justify-between px-4 mt-4">
                        <motion.button 
                          onClick={() => {
                            setSelectedRiskLevel('moderate');
                            setRiskPercentage(20);
                            setAlgoParameters({
                              ...algoParameters,
                              capital: 10,
                              stopLoss: 3,
                              takeProfit: 7
                            });
                          }}
                          className="flex flex-col items-center transition-all duration-300"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className={`w-5 h-5 rounded-full mb-2 transition-colors duration-300 ${selectedRiskLevel === 'moderate' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-600'}`}></div>
                          <span className={`text-sm font-medium transition-colors duration-300 ${selectedRiskLevel === 'moderate' ? 'text-green-400' : 'text-gray-400'}`}>Moderate</span>
                        </motion.button>
                        
                        <motion.button 
                          onClick={() => {
                            setSelectedRiskLevel('risky');
                            setRiskPercentage(50);
                            setAlgoParameters({
                              ...algoParameters,
                              capital: 25,
                              stopLoss: 5,
                              takeProfit: 10
                            });
                          }}
                          className="flex flex-col items-center transition-all duration-300"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className={`w-5 h-5 rounded-full mb-2 transition-colors duration-300 ${selectedRiskLevel === 'risky' ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' : 'bg-gray-600'}`}></div>
                          <span className={`text-sm font-medium transition-colors duration-300 ${selectedRiskLevel === 'risky' ? 'text-yellow-400' : 'text-gray-400'}`}>Risky</span>
                        </motion.button>
                        
                        <motion.button 
                          onClick={() => {
                            setSelectedRiskLevel('highlyRisky');
                            setRiskPercentage(80);
                            setAlgoParameters({
                              ...algoParameters,
                              capital: 50,
                              stopLoss: 8,
                              takeProfit: 20
                            });
                            
                            // Show coming soon modal for highly risky
                            setComingSoonFeature('Highly Risky Algorithm Trading');
                            setShowComingSoonModal(true);
                          }}
                          className="flex flex-col items-center transition-all duration-300"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className={`w-5 h-5 rounded-full mb-2 transition-colors duration-300 ${selectedRiskLevel === 'highlyRisky' ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-gray-600'}`}></div>
                          <span className={`text-sm font-medium transition-colors duration-300 ${selectedRiskLevel === 'highlyRisky' ? 'text-red-400' : 'text-gray-400'}`}>Highly Risky</span>
                        </motion.button>
                      </div>
                      
                      {/* Strategy Selection */}
                      
                      {/* Trading Parameters */}
                      <div className="mt-6 bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                        <h3 className="text-white text-sm font-medium mb-4">Trading Parameters</h3>
                        
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          {/* Lot Size */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Lot Size</label>
                            <div className="flex items-center">
                              <button 
                                onClick={() => setAlgoParameters({...algoParameters, lotSize: Math.max(1, (algoParameters.lotSize || 1) - 1)})}
                                className="bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded-l-lg flex items-center justify-center"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <input 
                                type="number" 
                                value={algoParameters.lotSize || 1} 
                                onChange={(e) => setAlgoParameters({...algoParameters, lotSize: Math.max(1, parseInt(e.target.value) || 1)})}
                                className="bg-gray-700 border-y border-gray-600 text-center text-white w-12 h-8 focus:outline-none"
                              />
                              <button 
                                onClick={() => setAlgoParameters({...algoParameters, lotSize: (algoParameters.lotSize || 1) + 1})}
                                className="bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded-r-lg flex items-center justify-center"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Minimum Target */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Min Target (points)</label>
                            <div className="flex items-center">
                              <button 
                                onClick={() => setAlgoParameters({...algoParameters, minTarget: Math.max(10, (algoParameters.minTarget || 50) - 10)})}
                                className="bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded-l-lg flex items-center justify-center"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <input 
                                type="number" 
                                value={algoParameters.minTarget || 50} 
                                onChange={(e) => setAlgoParameters({...algoParameters, minTarget: Math.max(10, parseInt(e.target.value) || 50)})}
                                className="bg-gray-700 border-y border-gray-600 text-center text-white w-12 h-8 focus:outline-none"
                              />
                              <button 
                                onClick={() => setAlgoParameters({...algoParameters, minTarget: (algoParameters.minTarget || 50) + 10})}
                                className="bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded-r-lg flex items-center justify-center"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Max Stop Loss */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Max Stop Loss (points)</label>
                            <div className="flex items-center">
                              <button 
                                onClick={() => setAlgoParameters({...algoParameters, maxStopLoss: Math.max(10, (algoParameters.maxStopLoss || 100) - 10)})}
                                className="bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded-l-lg flex items-center justify-center"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <input 
                                type="number" 
                                value={algoParameters.maxStopLoss || 100} 
                                onChange={(e) => setAlgoParameters({...algoParameters, maxStopLoss: Math.max(10, parseInt(e.target.value) || 100)})}
                                className="bg-gray-700 border-y border-gray-600 text-center text-white w-12 h-8 focus:outline-none"
                              />
                              <button 
                                onClick={() => setAlgoParameters({...algoParameters, maxStopLoss: (algoParameters.maxStopLoss || 100) + 10})}
                                className="bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded-r-lg flex items-center justify-center"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Risk-based parameter indicators */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                            <div className="text-xs text-gray-400">Total Lots</div>
                            <div className="text-white font-medium">{algoParameters.lotSize || 1} × {selectedInstrument === 'nifty' ? 75 : selectedInstrument === 'banknifty' ? 25 : 1}</div>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                            <div className="text-xs text-gray-400">Target Price</div>
                            <div className="text-green-400 font-medium">+{algoParameters.minTarget || 50} points</div>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                            <div className="text-xs text-gray-400">Stop Loss</div>
                            <div className="text-red-400 font-medium">-{algoParameters.maxStopLoss || 100} points</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* LTP Calculator Data */}
                      <div className="mt-4 bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-white text-sm font-medium">LTP Calculator Data</h3>
                          <button 
                            onClick={async () => {
                              const ltpSymbol = selectedInstrument === 'nifty' ? 'NIFTY' : 
                                selectedInstrument === 'banknifty' ? 'BANKNIFTY' : 
                                selectedInstrument?.toUpperCase();
                              if (ltpSymbol) {
                                await fetchLtpData(ltpSymbol);
                              }
                            }}
                            className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-2 py-1 rounded flex items-center"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Refresh
                          </button>
                        </div>
                        
                        {ltpData ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="bg-gray-700/50 rounded-lg p-2">
                                <div className="text-xs text-gray-400">Moderate Support</div>
                                <div className="text-green-400 font-medium">{ltpData.moderateSupport || 'N/A'}</div>
                              </div>
                              <div className="bg-gray-700/50 rounded-lg p-2">
                                <div className="text-xs text-gray-400">Moderate Resistance</div>
                                <div className="text-red-400 font-medium">{ltpData.moderateResistance || 'N/A'}</div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="bg-gray-700/50 rounded-lg p-2">
                                <div className="text-xs text-gray-400">Risky Support</div>
                                <div className="text-green-400 font-medium">{ltpData.riskySupport || 'N/A'}</div>
                              </div>
                              <div className="bg-gray-700/50 rounded-lg p-2">
                                <div className="text-xs text-gray-400">Risky Resistance</div>
                                <div className="text-red-400 font-medium">{ltpData.riskyResistance || 'N/A'}</div>
                              </div>
                            </div>
                            <div className="col-span-2 bg-gray-700/50 rounded-lg p-2">
                              <div className="text-xs text-gray-400">Market Direction</div>
                              <div className={`font-medium ${
                                ltpData.direction === 'BULLISH' ? 'text-green-400' :
                                ltpData.direction === 'BEARISH' ? 'text-red-400' :
                                'text-yellow-400'
                              }`}>
                                {ltpData.direction || 'UNKNOWN'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-400 text-sm">
                            <p>No data available. Click Refresh to load data.</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-8 flex justify-center space-x-4">
                        <motion.button 
                          onClick={() => {
                            // Only allow algorithm trading for NIFTY and not Highly Risky
                            if (selectedInstrument !== 'nifty') {
                              setComingSoonFeature(`${selectedInstrument === 'banknifty' ? 'BANK NIFTY' : 'Stock'} Algorithm Trading`);
                              setShowComingSoonModal(true);
                              return;
                            }
                            
                            if (selectedRiskLevel === 'highlyRisky') {
                              setComingSoonFeature('Highly Risky Algorithm Trading');
                              setShowComingSoonModal(true);
                              return;
                            }
                            
                            // Set algorithm to active
                            setAlgoParameters({
                              ...algoParameters,
                              isActive: true
                            });
                            setShowAlgoTradingModal(false);
                            setTradeMessage(`${selectedInstrument === 'nifty' ? 'NIFTY' : selectedInstrument === 'banknifty' ? 'BANK NIFTY' : 'Stock'} algorithm with ${selectedRiskLevel} risk profile activated! (${algoParameters.lotSize || 1} lots, Target: +${algoParameters.minTarget || 50} points, SL: -${algoParameters.maxStopLoss || 100} points)`);
                            setShowTradeSuccess(true);
                            setTimeout(() => {
                              setShowTradeSuccess(false);
                            }, 5000);
                          }}
                          className={`px-6 py-3 text-white rounded-lg font-medium transition-all flex items-center shadow-lg ${
                            selectedRiskLevel === 'moderate' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' :
                            selectedRiskLevel === 'risky' ? 'bg-yellow-600 hover:bg-yellow-700 shadow-yellow-500/20' :
                            'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Activity className="h-5 w-5 mr-2" />
                          Start Algorithm
                        </motion.button>
                        
                        <motion.button 
                          onClick={() => {
                            setShowAlgoTradingModal(false);
                            setSelectedInstrument(null);
                          }}
                          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Portfolio Overview */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl border border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Portfolio Overview</h1>
              <p className="text-gray-400">Welcome back, {user?.username}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAlgoTradingModal(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  <Bot className="h-5 w-5" />
                  <span>Algo Trading</span>
                  {algoStatus === 'running' && (
                    <div className="flex items-center ml-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs ml-1">Active</span>
                    </div>
                  )}
                  {algoStatus === 'error' && (
                    <div className="flex items-center ml-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-xs ml-1">Error</span>
                    </div>
                  )}
                </button>
                
                {algoStatus === 'running' && (
                  <button
                    onClick={() => {
                      setAlgoParameters({
                        ...algoParameters,
                        isActive: false
                      });
                      setTradeMessage(`Algorithm trading stopped`);
                      setShowTradeSuccess(true);
                      setTimeout(() => setShowTradeSuccess(false), 3000);
                    }}
                    className="flex items-center space-x-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-all"
                  >
                    <X className="h-4 w-4" />
                    <span className="text-sm">Stop</span>
                  </button>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">₹{marginDetails.availableMargin.toLocaleString()}</p>
                <div className="flex items-center justify-end space-x-2 text-sm">
                  <span className={`${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalPnL >= 0 ? '+' : '-'}₹{Math.abs(totalPnL).toLocaleString()}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className={`${dayPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    Today: {dayPnL >= 0 ? '+' : '-'}₹{Math.abs(dayPnL).toLocaleString()}
                  </span>
                </div>
                <div className="text-gray-400 text-sm mt-1">
                  Used Margin: ₹{marginDetails.usedMargin.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Fund Details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="text-gray-400 text-sm mb-1">Available Funds</div>
              <div className="text-white text-lg font-semibold">₹{marginDetails.availableMargin.toLocaleString()}</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="text-gray-400 text-sm mb-1">Used Margin</div>
              <div className="text-white text-lg font-semibold">₹{marginDetails.usedMargin.toLocaleString()}</div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="text-gray-400 text-sm mb-1">Total P&L</div>
              <div className={`text-lg font-semibold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalPnL >= 0 ? '+' : '-'}₹{Math.abs(totalPnL).toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <div className="text-gray-400 text-sm mb-1">Day's P&L</div>
              <div className={`text-lg font-semibold ${dayPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {dayPnL >= 0 ? '+' : '-'}₹{Math.abs(dayPnL).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Active Positions and Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Positions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Active Positions</h2>
                <div className="flex items-center space-x-2">
                  <button onClick={() => updateMarketData()} className="text-blue-400 hover:text-blue-300">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {!recentTrades || recentTrades.length === 0 ? (
                  <div className="text-center py-4 text-gray-400">
                    No active positions. Start trading to see your positions here.
                  </div>
                ) : (
                  recentTrades
                    .filter(trade => {
                      // Don't show completed trades
                      if (trade.status === 'completed') return false;
                      
                      // Don't show trades that are part of a completed match
                      if (trade.completedWith) {
                        const matchedTrade = recentTrades.find(t => t.id === trade.completedWith);
                        if (matchedTrade) return false;
                      }

                      // Only show trades with remaining amount
                      const hasRemainingAmount = (trade.remainingAmount || trade.amount) > 0;
                      return hasRemainingAmount;
                    })
                    .map(trade => {
                      if (!trade) return null;
                      
                      // Find the asset for this trade
                      const asset = assets?.find(a => a && a.symbol === trade.asset);
                      
                      // Skip if asset not found
                      if (!asset) {
                        
                        return null;
                      }
                      
                      const activeAmount = trade.remainingAmount || trade.amount;
                      const lotSize = trade.lotSize || 1;
                      
                      // Calculate P&L differently for options vs stocks
                      let pnl = 0;
                      let pnlPercent = 0;
                      
                      if (trade.isOption) {
                        // For options: P&L = premium difference × lot size × number of lots
                        const entryPremium = trade.price;
                        const currentPremium = asset.value;
                        const premiumDiff = trade.type === 'buy' ? 
                          (currentPremium - entryPremium) : 
                          (entryPremium - currentPremium);
                        const numLots = activeAmount / lotSize;
                        
                        pnl = premiumDiff * lotSize * numLots;
                        pnlPercent = entryPremium > 0 ? (premiumDiff / entryPremium) * 100 : 0;
                      } else {
                        // For stocks: normal calculation
                        const totalValue = activeAmount * trade.price;
                        const currentValue = activeAmount * asset.value;
                        pnl = trade.type === 'buy' ? currentValue - totalValue : totalValue - currentValue;
                        pnlPercent = totalValue > 0 ? (pnl / totalValue) * 100 : 0;
                      }

                      return (
                        <div key={trade.id} className="bg-gray-800/50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="flex items-center">
                                <h3 className="text-white font-semibold">{asset.name}</h3>
                                {trade.isOption && (
                                  <span className="ml-2 text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">
                                    {trade.optionType} {trade.strikePrice}
                                  </span>
                                )}
                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                  trade.status === 'executed' ? 'bg-green-500/20 text-green-400' :
                                  trade.status === 'partially_completed' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {trade.status.toUpperCase()}
                                </span>
                              </div>
                              <div className="text-sm text-gray-400 mt-1">
                                {trade.isOption ? (
                                  <>
                                    {activeAmount} contracts ({activeAmount/lotSize} lots)
                                    <span className="mx-1">•</span>
                                    Premium: ₹{trade.premium?.toFixed(2)}
                                  </>
                                ) : (
                                  <>{activeAmount} shares</>
                                )}
                                {trade.status === 'partially_completed' && (
                                  <span className="text-blue-400 ml-2">
                                    (Original: {trade.originalAmount})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className={`text-right ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              <div className="flex items-center justify-end">
                                {pnl >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                                <span>₹{Math.abs(pnl).toFixed(2)}</span>
                              </div>
                              <div className="text-sm">
                                {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-400">Entry:</span>
                                <span className="text-white ml-2">₹{trade.price.toFixed(2)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-gray-400">Current:</span>
                                <span className="text-white ml-2">₹{asset.value.toFixed(2)}</span>
                              </div>
                            </div>
                            {trade.isOption && (
                              <div className="text-xs text-gray-400 mt-2">
                                <span>P&L = (Premium diff) × Lot size × Lots = </span>
                                <span className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  ({trade.type === 'buy' ? 
                                    `${asset.value.toFixed(2)} - ${trade.price.toFixed(2)}` : 
                                    `${trade.price.toFixed(2)} - ${asset.value.toFixed(2)}`
                                  } × {lotSize} × {(activeAmount/lotSize).toFixed(2)})
                                </span>
                              </div>
                            )}
                            <div className="flex justify-end space-x-2 mt-3">
                              <button
                                onClick={() => exitPosition(trade)}
                                className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs font-medium transition-colors"
                              >
                                Modify
                              </button>
                              <button
                                onClick={() => closePosition(trade)}
                                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors"
                              >
                                Exit Position
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-white">
                    <Calendar className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {recentTrades.length === 0 ? (
                  <div className="text-center py-4 text-gray-400">
                    No transactions yet. Start trading to see your history here.
                  </div>
                ) : (
                  recentTrades
                    .filter(trade => {
                      // Don't show completed trades
                      if (trade.status === 'completed') return false;
                      
                      // Don't show trades that are part of a completed match
                      if (trade.completedWith) return false;

                      // Don't show trades that are matched by other trades
                      const isMatchedByOtherTrade = recentTrades.some(t => 
                        t.completedWith === trade.id || 
                        (t.asset === trade.asset && 
                         t.type !== trade.type && 
                         t.timestamp > trade.timestamp)
                      );
                      if (isMatchedByOtherTrade) return false;

                      return true;
                    })
                    .slice(0, 10)
                    .map(trade => {
                      const asset = assets.find(a => a.symbol === trade.asset);
                      if (!asset) return null;

                      const activeAmount = trade.remainingAmount || trade.amount;
                      const lotSize = trade.lotSize || 1;
                      const totalValue = trade.isOption ? 
                        activeAmount * trade.price * lotSize :
                        activeAmount * trade.price;

                      return (
                        <div key={trade.id} className="bg-gray-800/50 rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {trade.type === 'buy' ? 
                                <Plus className={`h-4 w-4 text-green-400 mr-2`} /> : 
                                <Minus className={`h-4 w-4 text-red-400 mr-2`} />}
                              <div>
                                <div className="flex items-center">
                                  <span className="text-white font-medium">
                                    {trade.type === 'buy' ? 'Bought' : 'Sold'}
                                  </span>
                                  {trade.isOption && (
                                    <span className="ml-2 text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">
                                      {trade.optionType}
                                    </span>
                                  )}
                                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                    trade.status === 'executed' ? 'bg-green-500/20 text-green-400' :
                                    trade.status === 'partially_completed' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {trade.status.toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-400">
                                  {trade.isOption ? (
                                    `${activeAmount} contracts at ₹${trade.price}`
                                  ) : (
                                    `${activeAmount} shares at ₹${trade.price}`
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white">₹{totalValue.toLocaleString()}</div>
                              <div className="text-xs text-gray-400">
                                {new Date(trade.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Watchlist */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl border border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Watchlist</h2>
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setSelectedInstrumentType('all')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedInstrumentType === 'all' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedInstrumentType('stocks')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedInstrumentType === 'stocks' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Stocks
                </button>
                <button
                  onClick={() => setSelectedInstrumentType('indices')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    selectedInstrumentType === 'indices' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Indices
                </button>
              </div>
              <button 
                onClick={() => updateMarketData()} 
                className={`text-blue-400 hover:text-blue-300 flex items-center ${isUpdating ? 'animate-spin' : ''}`}
              >
                <RefreshCw className="h-5 w-5 mr-1" />
                {isUpdating ? 'Updating...' : 'Refresh'}
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {assets
              .filter(item => 
                selectedInstrumentType === 'all' ? true :
                selectedInstrumentType === 'stocks' ? item.type === 'equity' :
                item.type === 'index'
              )
              .map(item => (
                <div key={item.id} className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">{item.name}</h3>
                      <div className="flex items-center text-sm text-gray-400">
                        <span>{item.symbol}</span>
                        <span className="mx-1">•</span>
                        <span>{item.exchange}</span>
                        <span className="mx-1">•</span>
                        <span className="capitalize">{item.type}</span>
                        {item.lotSize && (
                          <>
                            <span className="mx-1">•</span>
                            <span>Lot: {item.lotSize}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">₹{item.value.toFixed(2)}</p>
                      <div className={`flex items-center justify-end text-sm ${item.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {item.change24h >= 0 ? 
                          <TrendingUp className="h-4 w-4 mr-1" /> : 
                          <TrendingDown className="h-4 w-4 mr-1" />
                        }
                        {Math.abs(item.change24h).toFixed(2)}%
                      </div>
                      <div className="flex items-center justify-end space-x-2 mt-2">
                        {item.type === 'index' ? (
                          <>
                            <button
                              onClick={() => handleNiftyTrade(item, 'buy')}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                            >
                              Buy Options
                            </button>
                            <button
                              onClick={() => handleNiftyTrade(item, 'sell')}
                              className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                            >
                              Sell Options
                            </button>
                          </>
                        ) : (
                          <>
                        <button
                          onClick={() => {
                            setSelectedAsset(item);
                            setTradeType('buy');
                            if (item.lotSize) {
                              setTradeAmount(item.lotSize.toString());
                            }
                            setShowTradeModal(true);
                          }}
                          className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                        >
                          Buy
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAsset(item);
                            setTradeType('sell');
                            if (item.lotSize) {
                              setTradeAmount(item.lotSize.toString());
                            }
                            setShowTradeModal(true);
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                        >
                          Sell
                        </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {item.dayHigh && item.dayLow && (
                    <div className="mt-2 text-sm text-gray-400 flex items-center justify-between">
                      <div>
                        <span>Volume: {item.volume?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span>H: ₹{item.dayHigh.toFixed(2)}</span>
                        <span className="mx-2">•</span>
                        <span>L: ₹{item.dayLow.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Transaction History</h2>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowTradeHistory(true)}
                className="text-blue-400 hover:text-blue-300 flex items-center bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Calendar className="h-4 w-4 mr-1" /> View Full History
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {isLoadingTrades ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-400">Loading transaction history...</span>
              </div>
            ) : recentTrades.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No transaction history found. Start trading to build your ledger.
              </div>
            ) : (
              recentTrades.map(trade => {
              const asset = assets.find(a => a.symbol === trade.asset);
              if (!asset) return null;

              const activeAmount = trade.remainingAmount || trade.amount;
              const currentValue = activeAmount * asset.value;
              const costBasis = activeAmount * trade.price;
              const pnl = trade.type === 'buy' ? currentValue - costBasis : costBasis - currentValue;
              const pnlPercent = (pnl / costBasis) * 100;

              const lotSize = trade.lotSize || 1;
              const totalValue = trade.isOption ? 
                trade.amount * trade.price * lotSize :
                trade.amount * trade.price;

              const isCompleted = trade.status === 'completed';
              const isPartiallyCompleted = trade.status === 'partially_completed';
              const matchingTrade = trade.completedWith ? recentTrades.find(t => t.id === trade.completedWith) : null;
              
              return (
                <div key={trade.id} className={`bg-gray-800/50 rounded-xl p-4 ${isCompleted ? 'opacity-75' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {trade.type === 'buy' ? 
                        <Plus className={`h-5 w-5 ${
                          trade.status === 'executed' ? 'text-green-400' : 
                          trade.status === 'completed' ? 'text-gray-400' :
                          trade.status === 'partially_completed' ? 'text-green-400/70' :
                          'text-gray-400'
                        } mr-2`} /> : 
                        <Minus className={`h-5 w-5 ${
                          trade.status === 'executed' ? 'text-red-400' : 
                          trade.status === 'completed' ? 'text-gray-400' :
                          trade.status === 'partially_completed' ? 'text-red-400/70' :
                          'text-gray-400'
                        } mr-2`} />}
                      <div>
                        <div className="flex items-center">
                          <p className="text-white font-medium">
                            {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.isOption ? (
                              <>
                                {trade.amount} contracts ({trade.amount/lotSize} lots) of {asset.name}
                                <span className="ml-2 text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">
                                  {trade.optionType} {trade.strikePrice}
                                </span>
                              </>
                            ) : (
                              `${trade.amount} ${trade.asset}`
                            )}
                          </p>
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                            trade.status === 'executed' ? 'bg-green-500/20 text-green-400' : 
                            trade.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                            trade.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                            trade.status === 'partially_completed' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {trade.status === 'partially_completed' ? 'PARTIAL' : trade.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-400 mt-1">
                          {trade.isOption ? (
                            <>
                              <span>Premium: ₹{trade.price.toLocaleString()} per lot</span>
                              <span className="mx-1">•</span>
                              <span>Total: ₹{totalValue.toLocaleString()}</span>
                            </>
                          ) : (
                            <>
                          <span>₹{trade.price.toLocaleString()} per share</span>
                              <span className="mx-1">•</span>
                              <span>Total: ₹{totalValue.toLocaleString()}</span>
                            </>
                          )}
                          <span className="mx-1">•</span>
                          <span>{trade.orderType.toUpperCase()}</span>
                          <span className="mx-1">•</span>
                          <span>{new Date(trade.timestamp).toLocaleString()}</span>
                        </div>
                        {(isCompleted || isPartiallyCompleted) && matchingTrade && (
                          <div className="text-xs text-gray-500 mt-1">
                            {isCompleted ? 'Position closed' : 'Partially closed'} with {matchingTrade.type === 'buy' ? 'buy' : 'sell'} at ₹{matchingTrade.price.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">₹{totalValue.toLocaleString()}</p>
                      {isPartiallyCompleted && trade.remainingAmount && (
                        <p className="text-sm text-gray-400">
                          Active: ₹{(trade.remainingAmount * trade.price * (trade.isOption ? lotSize : 1)).toLocaleString()}
                        </p>
                      )}
                      <div className="flex items-center justify-end text-sm text-gray-400 mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{new Date(trade.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
              })
            )}
          </div>
        </div>

        {/* Trade Modal */}
        <AnimatePresence>
          {showTradeModal && selectedAsset && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 overflow-y-auto"
            >
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl border border-gray-700 p-4 w-full max-w-md my-2">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedAsset.name}</h2>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <span>{selectedAsset.symbol}</span>
                      <span className="mx-1">•</span>
                      <span>{selectedAsset.exchange}</span>
                      <span className="mx-1">•</span>
                      <span className="capitalize">{selectedAsset.type}</span>
                      {selectedAsset.type === 'index' && selectedAsset.lotSize && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="text-blue-400">Lot: {selectedAsset.lotSize}</span>
                        </>
                      )}
                      {(selectedAsset.type === 'options' || 
                        (selectedAsset.type === 'index' && (selectedAsset.symbol.includes('CE') || selectedAsset.symbol.includes('PE')))) && (
                        (() => {
                          // Extract strike price safely
                          const strikeMatch = selectedAsset.symbol.match(/\d+/);
                          const strikePrice = strikeMatch ? strikeMatch[0] : '';
                          
                          return (
                            <>
                              <span className="mx-1">•</span>
                              <span className="text-purple-400">
                                {selectedAsset.symbol.includes('CE') ? 'Call' : 'Put'} 
                                {strikePrice && ` @ ${strikePrice}`}
                              </span>
                              <span className="mx-1">•</span>
                              <span className="text-blue-400">Lot: {selectedAsset.lotSize || 75}</span>
                            </>
                          );
                        })()
                      )}
                    </div>
                  </div>
                  <button onClick={() => setShowTradeModal(false)} className="text-gray-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Add option details box if it's an option */}
                {(selectedAsset.type === 'options' || 
                  (selectedAsset.type === 'index' && (selectedAsset.symbol.includes('CE') || selectedAsset.symbol.includes('PE')))) && (
                  <div className="bg-gray-800/70 rounded-lg p-3 mb-3 border border-gray-700/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-white">Option Details</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${selectedAsset.symbol.includes('CE') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {selectedAsset.symbol.includes('CE') ? 'CALL' : 'PUT'}
                      </span>
                    </div>
                    {(() => {
                      // Extract strike price safely
                      const strikeMatch = selectedAsset.symbol.match(/\d+/);
                      const strikePrice = strikeMatch ? strikeMatch[0] : 'N/A';
                      
                      return (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Strike Price:</span>
                            <span className="text-white ml-1">₹{strikePrice}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Premium:</span>
                            <span className="text-white ml-1">₹{selectedAsset.value.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Lot Size:</span>
                            <span className="text-white ml-1">{selectedAsset.lotSize || 75} contracts</span>
                          </div>
                          <div>
                            <span className="text-gray-400">1 Lot Cost:</span>
                            <span className="text-white ml-1">₹{((selectedAsset.lotSize || 75) * selectedAsset.value).toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
                  <div className="space-y-3">
                  {/* Order Type Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Order Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setTradeType('buy')}
                        className={`py-1.5 px-3 rounded-lg font-medium text-sm ${tradeType === 'buy' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                      >
                        Buy
                      </button>
                      <button 
                        onClick={() => setTradeType('sell')}
                        className={`py-1.5 px-3 rounded-lg font-medium text-sm ${tradeType === 'sell' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                      >
                        Sell
                      </button>
                    </div>
                  </div>

                  {/* Product Type */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Product</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['intraday', 'cnc', 'co'].map(type => (
                        <button
                          key={type}
                          onClick={() => setProductType(type as 'intraday' | 'cnc' | 'co')}
                          className={`py-1.5 px-3 rounded-lg font-medium text-sm ${productType === type ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'} uppercase`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Order Type */}
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Order Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['market', 'limit', 'stop', 'stoplimit'].map(type => (
                        <button
                          key={type}
                          onClick={() => setOrderType(type as 'market' | 'limit' | 'stop' | 'stoplimit')}
                          className={`py-1.5 px-3 rounded-lg font-medium text-sm ${orderType === type ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'} capitalize`}
                        >
                          {type === 'stoplimit' ? 'Stop Limit' : type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity and Price */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={tradeAmount}
                        onChange={(e) => setTradeAmount(e.target.value)}
                        placeholder="Enter quantity"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Market Price</label>
                      <input
                        type="number"
                        value={selectedAsset.value}
                        readOnly
                        className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white"
                      />
                    </div>
                  </div>

                  {/* Price Settings */}
                  {orderType !== 'market' && (
                    <div className="grid grid-cols-2 gap-3">
                      {(orderType === 'limit' || orderType === 'stoplimit') && (
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Limit Price</label>
                          <input
                            type="number"
                            value={limitPrice}
                            onChange={(e) => setLimitPrice(e.target.value)}
                            placeholder="Enter limit price"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                      {(orderType === 'stop' || orderType === 'stoplimit') && (
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">Trigger Price</label>
                          <input
                            type="number"
                            value={stopPrice}
                            onChange={(e) => setStopPrice(e.target.value)}
                            placeholder="Enter trigger price"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Target and Stop Loss */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Target Price</label>
                      <input
                        type="number"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        placeholder="Enter target price"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Stop Loss</label>
                      <input
                        type="number"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        placeholder="Enter stop loss"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Order Value</span>
                      <span className="text-white">₹{(parseFloat(tradeAmount || '0') * selectedAsset.value).toLocaleString()}</span>
                    </div>
                    
                    {/* Show calculation breakdown for options */}
                      {(selectedAsset.type === 'options' || 
                        (selectedAsset.type === 'index' && (selectedAsset.symbol.includes('CE') || selectedAsset.symbol.includes('PE')))) && (
                      <div className="text-xs text-gray-400 border-t border-gray-600 pt-1 mt-1">
                        <div className="flex justify-between">
                          <span>Calculation:</span>
                          <span>{parseFloat(tradeAmount || '0')} contracts × ₹{selectedAsset.value}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>Lots:</span>
                          <span>{Math.floor(parseFloat(tradeAmount || '0') / (selectedAsset.lotSize || 75))} lots ({parseFloat(tradeAmount || '0')} contracts)</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Margin Required</span>
                      <span className="text-white">₹{marginDetails.marginRequired.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Available Margin</span>
                      <span className="text-white">₹{marginDetails.availableMargin.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Used Margin</span>
                      <span className="text-white">₹{marginDetails.usedMargin.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Leverage</span>
                      <span className="text-white">{marginDetails.leverage}</span>
                    </div>
                  </div>

                  {/* Trading Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-3">
                    <button
                      onClick={handleTrade}
                      className={`py-2 px-4 rounded-lg font-medium text-sm ${tradeType === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white transition-colors flex items-center justify-center`}
                    >
                      {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedAsset.symbol}
                    </button>
                    <button
                      className="py-2 px-4 rounded-lg font-medium text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center justify-center"
                    >
                      Add to Watchlist
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Option Chain Modal */}
        <AnimatePresence>
          {showOptionChain && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl border border-gray-700 p-4 w-full max-w-6xl my-2"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold text-white">NIFTY Options Trading</h2>
                  <button
                    onClick={() => setShowOptionChain(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="max-h-[calc(100vh-120px)] overflow-y-auto">
                <OptionChain 
                  spotPrice={assets.find(a => a.symbol === '^NSEI')?.value || 0}
                  onStrikeSelect={handleOptionSelect}
                />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Notification */}
        <AnimatePresence>
          {showTradeSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-5 right-5 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-xl flex items-center z-50"
            >
              <Check className="h-5 w-5 mr-2" />
              <span className="font-medium">{tradeMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Coming Soon Modal */}
        <ComingSoonModal 
          isOpen={showComingSoonModal}
          onClose={() => setShowComingSoonModal(false)}
          feature={comingSoonFeature}
        />

        {/* Market Closed Modal */}
        <AnimatePresence>
          {showMarketClosedModal && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl border border-gray-700 p-8 w-full max-w-md"
              >
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-yellow-500/20 p-4 rounded-full">
                    <AlertCircle className="h-10 w-10 text-yellow-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4 text-center">Market is Closed</h2>
                <p className="text-gray-300 text-center mb-6">
                  Trading is only allowed during market hours (Mon-Fri, 9:15 AM to 3:30 PM IST).
                </p>
                <button 
                  onClick={() => setShowMarketClosedModal(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-medium transition-colors"
                >
                  OK
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}