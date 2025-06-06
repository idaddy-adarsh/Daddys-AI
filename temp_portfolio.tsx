'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, BarChart4, DollarSign, Activity, Plus, Minus, RefreshCw, Search, ChevronDown, X, Check, AlertCircle, Copy, Eye, EyeOff, Clock, Calendar, User, Percent, LineChart, CandlestickChart, Bot } from 'lucide-react';
import OptionChain from '@/app/components/OptionChain';

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
  
  // Add state for trading mode selection
  const [showTradingModeModal, setShowTradingModeModal] = useState(true);
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
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<'conservative' | 'balanced' | 'dynamic'>('balanced');
  const [riskPercentage, setRiskPercentage] = useState(50);
  const [algoParameters, setAlgoParameters] = useState<Record<string, any>>({
    timeFrame: '1h',
    capital: 10,
    stopLoss: 5,
    takeProfit: 10
  });

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
          
        }
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

  // Function to update option prices with random movements
  const updateWithRandomPrices = useCallback(() => {
    setAssets(currentAssets => {
      if (!currentAssets || !Array.isArray(currentAssets)) return currentAssets;
      
      return currentAssets.map(asset => {
        if (!asset || typeof asset !== 'object' || asset.type !== 'options') 
          return asset;
        
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
  }, []);

  // Safe update function that tries to use real data first, then falls back to random
  const safeUpdateOptionPrices = useCallback(() => {
    try {
      if (!assets || !Array.isArray(assets)) return;
      
      // First try to update options with real data from API
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
                    
                    return asset;
                  });
                });
              } else {
                // Fallback to random price updates if API data is invalid
                updateWithRandomPrices();
              }
            })
            .catch(err => {
              
              // Fall back to random price updates
              updateWithRandomPrices();
            });
        } else {
          // No expiry dates available, fall back to random updates
          updateWithRandomPrices();
        }
      }
    } catch (error) {
      
      // Fall back to random price updates
      updateWithRandomPrices();
    }
  }, [assets, updateWithRandomPrices]);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
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
                          onClick={() => setSelectedInstrument(instrument.id)}
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
                    
                    {/* Risk Selection UI - Semi-circle */}
                    <div className="mb-10 mt-5">
                      <div className="relative h-64 w-full flex flex-col items-center justify-end">
                        {/* Semi-circle background */}
                        <div className="absolute w-[90%] h-[180px] bg-gradient-to-t from-gray-800/30 to-gray-800/10 rounded-t-full overflow-hidden border-t border-l border-r border-gray-700/50">
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-green-500/10 to-red-500/10 opacity-70"></div>
                          
                          {/* Center line */}
                          <div className="absolute top-0 left-1/2 w-[1px] h-full bg-gray-600/30 -translate-x-1/2"></div>
                          
                          {/* Risk level text indicators */}
                          <div className="absolute top-[30px] left-[15%] text-xs font-medium text-blue-400">Low Risk</div>
                          <div className="absolute top-[30px] left-1/2 text-xs font-medium text-green-400 -translate-x-1/2">Balanced</div>
                          <div className="absolute top-[30px] right-[15%] text-xs font-medium text-red-400">High Risk</div>
                          
                          <div className="absolute inset-0 flex items-center justify-center pt-10">
                            <div className="text-center text-gray-400 text-sm font-medium tracking-wider opacity-70">RISK PROFILE</div>
                          </div>
                        </div>
                        
                        {/* Risk level indicators */}
                        <div className="absolute w-[90%] h-[180px] pointer-events-none">
                          {/* Conservative section */}
                          <div className="absolute top-0 left-0 w-1/3 h-full overflow-hidden">
                            <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/30 to-blue-400/10 rounded-tl-full transition-opacity ${selectedRiskLevel === 'conservative' ? 'opacity-100' : 'opacity-0'}`}></div>
                          </div>
                          
                          {/* Balanced section */}
                          <div className="absolute top-0 left-1/3 w-1/3 h-full overflow-hidden">
                            <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-r from-green-400/10 to-green-500/30 transition-opacity ${selectedRiskLevel === 'balanced' ? 'opacity-100' : 'opacity-0'}`}></div>
                          </div>
                          
                          {/* Dynamic section */}
                          <div className="absolute top-0 right-0 w-1/3 h-full overflow-hidden">
                            <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-l from-red-500/30 to-red-400/10 rounded-tr-full transition-opacity ${selectedRiskLevel === 'dynamic' ? 'opacity-100' : 'opacity-0'}`}></div>
                          </div>

                          {/* Tick marks */}
                          <div className="absolute bottom-0 w-full flex justify-between px-[10%]">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="w-[1px] h-3 bg-gray-500/50"></div>
                            ))}
                          </div>

                          {/* Glow effect at selected point */}
                          <div className={`absolute top-[5px] transition-all duration-300 w-8 h-8 rounded-full blur-md ${
                            selectedRiskLevel === 'conservative' ? 'left-[16%] bg-blue-500/70' : 
                            selectedRiskLevel === 'balanced' ? 'left-[50%] bg-green-500/70 -translate-x-1/2' : 
                            'right-[16%] bg-red-500/70'
                          }`}></div>
                        </div>
                        
                        {/* Draggable slider */}
                        <div className="absolute bottom-0 w-[90%] flex justify-between px-4">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={riskPercentage}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              setRiskPercentage(value);
                              
                              // Update risk level based on percentage
                              if (value < 33) {
                                setSelectedRiskLevel('conservative');
                                // Update algo parameters based on risk percentage
                                setAlgoParameters(prev => ({
                                  ...prev,
                                  capital: Math.max(5, Math.round(value * 15 / 33)),
                                  stopLoss: Math.max(1, Math.round(value * 3 / 33)),
                                  takeProfit: Math.max(3, Math.round(value * 7 / 33) + 3)
                                }));
                              } else if (value < 67) {
                                setSelectedRiskLevel('balanced');
                                // Map 33-67 range to appropriate parameter values
                                const normalizedValue = (value - 33) / 34; // 0 to 1 in balanced range
                                setAlgoParameters(prev => ({
                                  ...prev,
                                  capital: Math.round(15 + normalizedValue * 15), // 15-30%
                                  stopLoss: Math.round(3 + normalizedValue * 4), // 3-7%
                                  takeProfit: Math.round(10 + normalizedValue * 5) // 10-15%
                                }));
                              } else {
                                setSelectedRiskLevel('dynamic');
                                // Map 67-100 range to appropriate parameter values
                                const normalizedValue = (value - 67) / 33; // 0 to 1 in dynamic range
                                setAlgoParameters(prev => ({
                                  ...prev,
                                  capital: Math.round(30 + normalizedValue * 70), // 30-100%
                                  stopLoss: Math.round(7 + normalizedValue * 8), // 7-15%
                                  takeProfit: Math.round(15 + normalizedValue * 15) // 15-30%
                                }));
                              }
                            }}
                            className="w-full h-2 appearance-none bg-transparent cursor-pointer"
                            style={{
                              WebkitAppearance: 'none',
                              background: 'linear-gradient(to right, #3b82f6 0%, #3b82f6 33%, #10b981 33%, #10b981 67%, #ef4444 67%, #ef4444 100%)'
                            }}
                          />
                        </div>

                        {/* Risk percentage indicator */}
                        <div className="absolute bottom-[25px] left-1/2 transform -translate-x-1/2 bg-gray-800/90 border border-gray-700/50 rounded-full px-3 py-1 text-xs font-medium">
                          <span className={`${
                            selectedRiskLevel === 'conservative' ? 'text-blue-400' : 
                            selectedRiskLevel === 'balanced' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            Risk: {riskPercentage}%
                          </span>
                        </div>
                        
                        {/* Risk level buttons */}
                        <div className="absolute bottom-[-30px] w-[90%] flex justify-between px-4">
                          <motion.button 
                            onClick={() => setSelectedRiskLevel('conservative')}
                            className={`flex flex-col items-center transition-all duration-300`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div className={`w-4 h-4 rounded-full mb-2 transition-colors duration-300 ${selectedRiskLevel === 'conservative' ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-gray-600'}`}></div>
                            <span className={`text-sm font-medium transition-colors duration-300 ${selectedRiskLevel === 'conservative' ? 'text-blue-400' : 'text-gray-400'}`}>Conservative</span>
                          </motion.button>
                          
                          <motion.button 
                            onClick={() => setSelectedRiskLevel('balanced')}
                            className={`flex flex-col items-center transition-all duration-300`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div className={`w-4 h-4 rounded-full mb-2 transition-colors duration-300 ${selectedRiskLevel === 'balanced' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-600'}`}></div>
                            <span className={`text-sm font-medium transition-colors duration-300 ${selectedRiskLevel === 'balanced' ? 'text-green-400' : 'text-gray-400'}`}>Balanced</span>
                          </motion.button>
                          
                          <motion.button 
                            onClick={() => setSelectedRiskLevel('dynamic')}
                            className={`flex flex-col items-center transition-all duration-300`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div className={`w-4 h-4 rounded-full mb-2 transition-colors duration-300 ${selectedRiskLevel === 'dynamic' ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-gray-600'}`}></div>
                            <span className={`text-sm font-medium transition-colors duration-300 ${selectedRiskLevel === 'dynamic' ? 'text-red-400' : 'text-gray-400'}`}>Dynamic</span>
                          </motion.button>
                        </div>
                        
                        {/* Selected risk level display */}
                        <div className="absolute bottom-[85px] bg-gray-800/80 border border-gray-700 rounded-lg px-6 py-2 text-center backdrop-blur-sm shadow-lg">
                          <span className={`text-lg font-medium ${
                            selectedRiskLevel === 'conservative' ? 'text-blue-400' : 
                            selectedRiskLevel === 'balanced' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {selectedRiskLevel === 'conservative' ? 'Conservative' : 
                             selectedRiskLevel === 'balanced' ? 'Balanced' : 'Dynamic'}
                          </span>
                        </div>
                        
                        {/* Indicator line */}
                        <div className={`absolute bottom-[85px] h-[85px] w-[1px] ${
                          selectedRiskLevel === 'conservative' ? 'bg-gradient-to-t from-blue-500 to-transparent' :
                          selectedRiskLevel === 'balanced' ? 'bg-gradient-to-t from-green-500 to-transparent' :
                          'bg-gradient-to-t from-red-500 to-transparent'
                        }`}></div>

                        {/* Animated pulse at current position */}
                        <motion.div 
                          className="absolute bottom-[10px] w-5 h-5 rounded-full"
                          style={{
                            left: `calc(${riskPercentage}% - 10px)`,
                            backgroundColor: selectedRiskLevel === 'conservative' ? '#3b82f6' : 
                                           selectedRiskLevel === 'balanced' ? '#10b981' : 
                                           '#ef4444'
                          }}
                          animate={{ 
                            boxShadow: [
                              `0 0 0 0 ${selectedRiskLevel === 'conservative' ? 'rgba(59, 130, 246, 0.7)' : 
                                selectedRiskLevel === 'balanced' ? 'rgba(16, 185, 129, 0.7)' : 
                                'rgba(239, 68, 68, 0.7)'}`,
                              `0 0 0 10px ${selectedRiskLevel === 'conservative' ? 'rgba(59, 130, 246, 0)' : 
                                selectedRiskLevel === 'balanced' ? 'rgba(16, 185, 129, 0)' : 
                                'rgba(239, 68, 68, 0)'}`
                            ]
                          }}
                          transition={{ 
                            repeat: Infinity, 
                            duration: 1.5
                          }}
                        />
                      </div>
                      
                      <div className="text-center mt-8">
                        <p className={`text-sm ${
                          selectedRiskLevel === 'conservative' ? 'text-blue-300' : 
                          selectedRiskLevel === 'balanced' ? 'text-green-300' : 'text-red-300'
                        }`}>
                          {selectedRiskLevel === 'conservative' ? 'Full control, zero guesswork. Lower returns with minimal risk.' : 
                           selectedRiskLevel === 'balanced' ? 'Balanced approach with moderate risk and returns.' : 
                           'Higher potential returns with increased risk tolerance.'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-b from-gray-800/30 to-gray-800/10 rounded-xl p-6 mb-6 border border-gray-700/50 backdrop-blur-sm">
                      <h3 className="text-lg font-semibold text-white mb-4">Algorithm Parameters</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Time Frame</label>
                          <div className="relative">
                            <select 
                              className="w-full bg-gray-800/70 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                              value={algoParameters.timeFrame || '1h'}
                              onChange={(e) => setAlgoParameters({...algoParameters, timeFrame: e.target.value})}
                            >
                              <option value="5m">5 Minutes</option>
                              <option value="15m">15 Minutes</option>
                              <option value="1h">1 Hour</option>
                              <option value="1d">1 Day</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Capital Allocation</label>
                          <div className="flex items-center space-x-4">
                            <input 
                              type="range" 
                              className={`w-full h-2 appearance-none rounded-full ${
                                selectedRiskLevel === 'conservative' ? 'bg-gradient-to-r from-gray-700 to-blue-500' :
                                selectedRiskLevel === 'balanced' ? 'bg-gradient-to-r from-gray-700 to-green-500' :
                                'bg-gradient-to-r from-gray-700 to-red-500'
                              }`}
                              min="5"
                              max="100"
                              step="1"
                              value={algoParameters.capital || 10}
                              onChange={(e) => setAlgoParameters({...algoParameters, capital: parseInt(e.target.value)})}
                            />
                            <span className="text-white text-sm font-medium w-12 text-center">{algoParameters.capital || 10}%</span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss</label>
                          <div className="flex items-center space-x-4">
                            <input 
                              type="range" 
                              className={`w-full h-2 appearance-none rounded-full ${
                                selectedRiskLevel === 'conservative' ? 'bg-gradient-to-r from-gray-700 to-blue-500' :
                                selectedRiskLevel === 'balanced' ? 'bg-gradient-to-r from-gray-700 to-green-500' :
                                'bg-gradient-to-r from-gray-700 to-red-500'
                              }`}
                              min="1"
                              max="15"
                              step="1"
                              value={algoParameters.stopLoss || 5}
                              onChange={(e) => setAlgoParameters({...algoParameters, stopLoss: parseInt(e.target.value)})}
                            />
                            <span className="text-white text-sm font-medium w-12 text-center">{algoParameters.stopLoss || 5}%</span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit</label>
                          <div className="flex items-center space-x-4">
                            <input 
                              type="range" 
                              className={`w-full h-2 appearance-none rounded-full ${
                                selectedRiskLevel === 'conservative' ? 'bg-gradient-to-r from-gray-700 to-blue-500' :
                                selectedRiskLevel === 'balanced' ? 'bg-gradient-to-r from-gray-700 to-green-500' :
                                'bg-gradient-to-r from-gray-700 to-red-500'
                              }`}
                              min="3"
                              max="30"
                              step="1"
                              value={algoParameters.takeProfit || 10}
                              onChange={(e) => setAlgoParameters({...algoParameters, takeProfit: parseInt(e.target.value)})}
                            />
                            <span className="text-white text-sm font-medium w-12 text-center">{algoParameters.takeProfit || 10}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-8 flex justify-end space-x-4">
                        <motion.button 
                          onClick={() => {
                            setShowAlgoTradingModal(false);
                            setTradeMessage(`${selectedInstrument === 'nifty' ? 'NIFTY' : selectedInstrument === 'banknifty' ? 'BANK NIFTY' : 'Stock'} algorithm with ${selectedRiskLevel} risk profile activated!`);
                            setShowTradeSuccess(true);
                            setTimeout(() => {
                              setShowTradeSuccess(false);
                              setSelectedInstrument(null);
                            }, 5000);
                          }}
                          className={`px-6 py-3 text-white rounded-lg font-medium transition-all flex items-center shadow-lg ${
                            selectedRiskLevel === 'conservative' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' :
                            selectedRiskLevel === 'balanced' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/20' :
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
              <p className="text-gray-400">Welcome back, {user?.firstName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAlgoTradingModal(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                <Bot className="h-5 w-5" />
                <span>Algo Trading</span>
              </button>
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