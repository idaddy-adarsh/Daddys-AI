'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, BarChart4, DollarSign, Activity, Plus, Minus, RefreshCw, Search, ChevronDown, X, Check, AlertCircle, Copy, Eye, EyeOff, Clock, Calendar, User, Percent, LineChart, CandlestickChart } from 'lucide-react';
import OptionChain from '@/app/components/OptionChain';

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

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  asset: string;
  amount: number;
  price: number;
  timestamp: string;
  orderType: 'market' | 'limit' | 'stop' | 'stoplimit';
  status: 'executed' | 'pending' | 'cancelled' | 'completed' | 'partially_completed';
  completedWith?: string;
  remainingAmount?: number;
  originalAmount?: number;
  lotSize?: number;
  isOption?: boolean;
  strikePrice?: number;
  optionType?: 'CE' | 'PE';
  premium?: number;
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
  const { user } = useUser();
  
  // Initialize states without local storage
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);

  const [assets, setAssets] = useState<Asset[]>([]);

  const [marginDetails, setMarginDetails] = useState({
    availableMargin: 100000,
    usedMargin: 0,
    marginRequired: 0,
    leverage: '5x'
  });

  // Remove localStorage effect
  useEffect(() => {
    console.log('Trades updated:', recentTrades);
    console.log('Assets updated:', assets);
    console.log('Margin updated:', marginDetails);
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
        lotSize: 50
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
      console.error(`Error fetching data for ${symbol}:`, error);
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
            console.error(`Error processing stock ${stock.symbol}:`, error);
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
              console.error(`Error processing index ${index.symbol}:`, error);
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
      console.error('Error updating market data:', error);
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
        console.error('Error updating market data:', error);
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
      console.error('Error initializing watchlist:', error);
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

      recentTrades.forEach(trade => {
        if (!trade) return;
        
        const asset = assets.find(a => a && a.symbol === trade.asset);
        if (!asset) return;

        // Safely access properties with fallbacks
        const activeAmount = trade.remainingAmount || trade.amount || 0;
        const assetValue = typeof asset.value === 'number' && !isNaN(asset.value) ? asset.value : 0;
        const tradePrice = typeof trade.price === 'number' && !isNaN(trade.price) ? trade.price : 0;
        const lotSize = trade.lotSize || 1;
        
        // Calculate values safely
        const currentValue = activeAmount * assetValue * (trade.isOption ? lotSize : 1);
        const costBasis = activeAmount * tradePrice * (trade.isOption ? lotSize : 1);
        const tradePnL = trade.type === 'buy' ? currentValue - costBasis : costBasis - currentValue;
        
        totalProfit += tradePnL;
        
        // Calculate day's P&L
        try {
          if (trade.timestamp && new Date(trade.timestamp).toDateString() === today) {
            dayProfit += tradePnL;
          }
        } catch (e) {
          console.error('Error calculating day P&L:', e);
        }
      });

      setTotalPnL(totalProfit);
      setDayPnL(dayProfit);
    } catch (error) {
      console.error('Error calculating P&L:', error);
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
      lotSize: 50
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
    setTradeAmount('50'); // Default to 1 lot
    setOrderType('market');
    setProductType('intraday');
    setShowTradeModal(true);
    setShowOptionChain(false);
  };

  // Add this new implementation instead:
  const updateOptionPricesRef = useRef<NodeJS.Timeout | null>(null);

  // Safe update function
  const safeUpdateOptionPrices = useCallback(() => {
    try {
      if (!assets || !Array.isArray(assets)) return;
      
      setAssets(currentAssets => {
        if (!currentAssets || !Array.isArray(currentAssets)) return currentAssets;
        
        return currentAssets.map(asset => {
          if (!asset || typeof asset !== 'object') return asset;
          if (asset.type !== 'options') return asset;
          
          // Safe price calculation
          const currentValue = typeof asset.value === 'number' && !isNaN(asset.value) 
            ? asset.value 
            : 0.05;
          const currentChange = typeof asset.change24h === 'number' && !isNaN(asset.change24h)
            ? asset.change24h
            : 0;
            
          // Generate price movement
          const priceChange = (Math.random() - 0.5) * 2;
          const newValue = Math.max(0.05, currentValue * (1 + priceChange / 100));
          
          return {
            ...asset,
            value: newValue,
            change24h: currentChange + priceChange
          };
        });
      });
    } catch (error) {
      console.error('Error in safeUpdateOptionPrices:', error);
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
      
      // Check if we have any option assets before setting up interval
      const hasOptions = Array.isArray(assets) && 
        assets.some(asset => asset && typeof asset === 'object' && asset.type === 'options');
      
      if (hasOptions) {
        updateOptionPricesRef.current = setInterval(() => {
          safeUpdateOptionPrices();
        }, 5000);
      }
      
      // Cleanup function
      return () => {
        if (updateOptionPricesRef.current) {
          clearInterval(updateOptionPricesRef.current);
          updateOptionPricesRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error setting up option price updates:', error);
    }
  }, [assets, safeUpdateOptionPrices]);

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
    if (!asset) return;
    
    // Create an exit trade with opposite type
    const exitType = trade.type === 'buy' ? 'sell' : 'buy';
    const exitAmount = trade.remainingAmount || trade.amount;
    const currentPrice = asset.value;
    
    // Create the exit trade with the correct type
    const exitTrade: Trade = {
      id: String(Date.now()),
      type: exitType,
      asset: trade.asset,
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
      completedWith: trade.id
    };
    
    // Calculate values for margin update
    const isOption = trade.isOption;
    const lotSize = trade.lotSize || 1;
    const contractMultiplier = isOption ? lotSize : 1;
    const tradeValue = exitAmount * currentPrice * contractMultiplier;
    
    // Update the original trade status
    const updatedTrades = recentTrades.map(t => {
      if (t.id === trade.id) {
        // Create a new trade object with the updated status
        return {
          ...t,
          status: 'completed' as const,
          completedWith: exitTrade.id
        };
      }
      return t;
    }) as Trade[]; // Cast to Trade[] to ensure type safety
    
    // Add the exit trade
    const newTrades = [exitTrade, ...updatedTrades];
    
    // Calculate updated margin
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
      
    setTradeMessage(`Position closed: ${exitType === 'buy' ? 'Bought' : 'Sold'} ${quantityText} of ${asset.name} at ₹${currentPrice}`);
    setShowTradeSuccess(true);
    setTimeout(() => setShowTradeSuccess(false), 5000);
  };

  // Update the handleTrade function to check for matching trades
  const handleTrade = () => {
    if (!selectedAsset || !tradeAmount) return;

    const newTradeAmount = parseFloat(tradeAmount);
    
    // Validate trade amount is positive
    if (newTradeAmount <= 0) {
      setTradeMessage('Trade quantity must be positive');
      setShowTradeSuccess(true);
      return;
    }

    // For options and indices, validate lot size
    if ((selectedAsset.type === 'options' || selectedAsset.type === 'index') && selectedAsset.lotSize) {
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
    const isOption = selectedAsset.type === 'options' || selectedAsset.symbol.includes('CE') || selectedAsset.symbol.includes('PE');
    const lotSize = selectedAsset.lotSize || 1;
    const contractMultiplier = isOption ? lotSize : 1;
    const tradeValue = newTradeAmount * tradePrice * contractMultiplier;

    // Check if enough funds available for buy
    if (tradeType === 'buy' && tradeValue > marginDetails.availableMargin) {
      setTradeMessage('Insufficient funds for this trade');
      setShowTradeSuccess(true);
      return;
    }

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
      premium: isOption ? tradePrice : undefined
    };

    // Update matched trades
    const updatedTrades = recentTrades.map(trade => {
      const match = matchedTrades.find(m => m.tradeId === trade.id);
      if (match) {
        const currentRemaining = trade.remainingAmount || trade.amount;
        const newRemaining = currentRemaining - match.matchedAmount;
        
        return {
          ...trade,
          status: newRemaining <= 0 ? 'completed' as const : 'partially_completed' as const,
          remainingAmount: newRemaining > 0 ? newRemaining : undefined,
          completedWith: newTrade.id
        } as Trade;
      }
      return trade;
    });

    // Add the new trade
    const finalTrades = [newTrade, ...updatedTrades] as Trade[];

    // Update margin based on remaining amount
    const marginAdjustment = remainingAmount * tradePrice * contractMultiplier;
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

    setTradeMessage(
      `${orderType === 'market' ? '' : 'Order placed: '}${tradeType === 'buy' ? 'Bought' : 'Sold'} ${quantityText} of ${selectedAsset.name}${matchedText}${remainingText}`
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

  const handleNiftyTrade = (index: Asset, tradeType: 'buy' | 'sell') => {
    setShowOptionChain(true);
  };

  // Add useEffect for debugging
  useEffect(() => {
    console.log('Current Trades:', recentTrades);
    console.log('Current Assets:', assets);
  }, [recentTrades, assets]);

  // Add this debugging effect
  useEffect(() => {
    // Debug log for active trades
    const activeTrades = recentTrades.filter(trade => 
      trade.status === 'executed' || trade.status === 'partially_completed'
    );
    console.log('Active trades that should be displayed:', activeTrades);
    
    // Check if assets exist for trades
    const missingAssets = activeTrades.filter(trade => 
      !assets.find(a => a.symbol === trade.asset)
    );
    if (missingAssets.length > 0) {
      console.warn('Trades with missing assets:', missingAssets);
    }
  }, [recentTrades, assets]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <main className="container mx-auto px-4 py-8">
        {/* Portfolio Overview */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl border border-gray-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Portfolio Overview</h1>
              <p className="text-gray-400">Welcome back, {user?.firstName}</p>
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
                        console.warn(`Asset not found for trade ${trade.id}: ${trade.asset}`);
                        return null;
                      }
                      
                      const activeAmount = trade.remainingAmount || trade.amount;
                      const lotSize = trade.lotSize || 1;
                      const totalValue = trade.isOption ? 
                        activeAmount * trade.price * lotSize :
                        activeAmount * trade.price;
                      const currentValue = activeAmount * asset.value * (trade.isOption ? lotSize : 1);
                      const pnl = trade.type === 'buy' ? currentValue - totalValue : totalValue - currentValue;
                      const pnlPercent = totalValue > 0 ? (pnl / totalValue) * 100 : 0;

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
                        {item.symbol === '^NSEI' ? (
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
              <button className="text-gray-400 hover:text-white flex items-center">
                <Calendar className="h-5 w-5 mr-1" /> Filter
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {recentTrades.map(trade => {
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
            })}
          </div>
        </div>

        {/* Trade Modal */}
        <AnimatePresence>
          {showTradeModal && selectedAsset && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            >
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl border border-gray-700 p-4 w-full max-w-md my-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedAsset.name}</h2>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <span>{selectedAsset.symbol}</span>
                      <span className="mx-1">•</span>
                      <span>{selectedAsset.exchange}</span>
                      <span className="mx-1">•</span>
                      <span className="capitalize">{selectedAsset.type}</span>
                    </div>
                  </div>
                  <button onClick={() => setShowTradeModal(false)} className="text-gray-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto px-1">
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
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={handleTrade}
                      disabled={marginDetails.marginRequired > (marginDetails.availableMargin - marginDetails.usedMargin)}
                      className={`py-2 px-4 rounded-lg font-medium text-sm ${tradeType === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
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
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            >
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl shadow-2xl border border-gray-700 p-6 w-full max-w-6xl my-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">NIFTY Options Trading</h2>
                  <button
                    onClick={() => setShowOptionChain(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <OptionChain 
                  spotPrice={assets.find(a => a.symbol === '^NSEI')?.value || 0}
                  onStrikeSelect={handleOptionSelect}
                />
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
      </main>
    </div>
  );
}