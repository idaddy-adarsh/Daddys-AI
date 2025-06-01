'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, BarChart4, DollarSign, Activity, Plus, Minus, RefreshCw, Search, ChevronDown, X, Check, AlertCircle, Copy, Eye, EyeOff, Clock, Calendar, User, Percent, LineChart, CandlestickChart } from 'lucide-react';

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
  
  // Market data state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [selectedInstrumentType, setSelectedInstrumentType] = useState<'all' | 'stocks' | 'indices'>('all');

  // Trade success notification state
  const [showTradeSuccess, setShowTradeSuccess] = useState(false);
  const [tradeMessage, setTradeMessage] = useState('');

  // Add fund management state
  const [marginDetails, setMarginDetails] = useState({
    availableMargin: 100000,
    usedMargin: 0,
    marginRequired: 0,
    leverage: '5x'
  });

  const [totalPnL, setTotalPnL] = useState(0);
  const [dayPnL, setDayPnL] = useState(0);

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
    // Update assets with both stocks and tradable indices
    const stocksData = await Promise.all(
      marketSymbols.stocks.map(async (stock, index) => {
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
        return null;
      })
    );

    const tradableIndices = await Promise.all(
      marketSymbols.indices
        .filter(index => index.type === 'index')
        .map(async (index, idx) => {
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
          return null;
        })
    );

    setAssets([...stocksData.filter(Boolean), ...tradableIndices.filter(Boolean)] as Asset[]);
  };

  // Fetch market data on component mount and every minute
  useEffect(() => {
    updateMarketData();
    const interval = setInterval(updateMarketData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Initialize watchlist with some stocks
  useEffect(() => {
    if (assets.length > 0) {
      setWatchlist([
        { ...assets[0], alerts: [{ price: assets[0].value * 1.05, condition: 'above' }] },
        { ...assets[1], alerts: [{ price: assets[1].value * 0.95, condition: 'below' }] }
      ]);
    }
  }, [assets]);

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

  // Calculate total P&L from active trades
  useEffect(() => {
    let totalProfit = 0;
    let dayProfit = 0;
    const today = new Date().toDateString();

    recentTrades.forEach(trade => {
      const asset = assets.find(a => a.symbol === trade.asset);
      if (!asset) return;

      const activeAmount = trade.remainingAmount || trade.amount;
      const currentValue = activeAmount * asset.value;
      const costBasis = activeAmount * trade.price;
      const tradePnL = trade.type === 'buy' ? currentValue - costBasis : costBasis - currentValue;
      
      totalProfit += tradePnL;
      
      // Calculate day's P&L
      if (new Date(trade.timestamp).toDateString() === today) {
        dayProfit += tradePnL;
      }
    });

    setTotalPnL(totalProfit);
    setDayPnL(dayProfit);
  }, [recentTrades, assets]);

  const totalValue = assets.reduce((sum, asset) => sum + (asset.amount * asset.value), 0);
  const totalChange24h = assets.reduce((sum, asset) => sum + (asset.amount * asset.value * (asset.change24h / 100)), 0);

  const handleTrade = () => {
    if (!selectedAsset || !tradeAmount) return;

    const newTradeAmount = parseFloat(tradeAmount);
    
    // Validate trade amount is positive
    if (newTradeAmount <= 0) {
      setTradeMessage('Trade quantity must be positive');
      setShowTradeSuccess(true);
      return;
    }

    // For indices, validate lot size
    if (selectedAsset.type === 'index' && selectedAsset.lotSize) {
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

    const tradeValue = newTradeAmount * tradePrice;
    
    // Check if enough funds available for buy
    if (tradeType === 'buy' && tradeValue > marginDetails.availableMargin) {
      setTradeMessage('Insufficient funds for this trade');
      setShowTradeSuccess(true);
      return;
    }

    // For sell orders, check if enough shares are available
    if (tradeType === 'sell') {
      const existingPosition = recentTrades
        .filter(t => 
          t.asset === selectedAsset.symbol && 
          t.type === 'buy' &&
          (t.status === 'executed' || t.status === 'partially_completed')
        )
        .reduce((total, trade) => total + (trade.remainingAmount || trade.amount), 0);

      const pendingSells = recentTrades
        .filter(t => 
          t.asset === selectedAsset.symbol && 
          t.type === 'sell' &&
          (t.status === 'executed' || t.status === 'partially_completed')
        )
        .reduce((total, trade) => total + (trade.remainingAmount || trade.amount), 0);

      const availableShares = existingPosition - pendingSells;

      if (newTradeAmount > availableShares) {
        setTradeMessage(`Insufficient shares. Available: ${availableShares}`);
        setShowTradeSuccess(true);
        return;
      }
    }

    // Check for matching trades to complete
    let matchingTrades: { trade: Trade, amountToClose: number }[] = [];
    let remainingAmount = newTradeAmount;
    
    if (orderType === 'market') {
      const existingTrades = recentTrades
        .filter(t => 
          t.asset === selectedAsset.symbol && 
          (t.status === 'executed' || t.status === 'partially_completed') && 
          t.type !== tradeType
        )
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      for (const trade of existingTrades) {
        if (remainingAmount <= 0) break;
        
        const activeAmount = trade.remainingAmount || trade.amount;
        if (activeAmount > 0) {
          const amountToClose = Math.min(remainingAmount, activeAmount);
          matchingTrades.push({ trade, amountToClose });
          remainingAmount -= amountToClose;
        }
      }
    }

    const newTrade: Trade = {
      id: String(recentTrades.length + 1),
      type: tradeType,
      asset: selectedAsset.symbol,
      amount: newTradeAmount,
      price: tradePrice,
      timestamp: new Date().toISOString(),
      orderType: orderType,
      status: orderType === 'market' ? ('executed' as const) : ('pending' as const),
      originalAmount: newTradeAmount
    };

    // Update matching trades status
    if (matchingTrades.length > 0 && orderType === 'market') {
      setRecentTrades(prev => prev.map(trade => {
        const matchingEntry = matchingTrades.find(m => m.trade.id === trade.id);
        if (matchingEntry) {
          const currentActive = trade.remainingAmount || trade.amount;
          const newRemaining = currentActive - matchingEntry.amountToClose;
          
          return {
            ...trade,
            status: newRemaining > 0 ? 'partially_completed' : 'completed',
            completedWith: newTrade.id,
            remainingAmount: newRemaining > 0 ? newRemaining : 0,
            originalAmount: trade.originalAmount || trade.amount
          };
        }
        return trade;
      }));

      // If the entire amount is matched, mark the new trade as completed
      if (remainingAmount <= 0) {
        newTrade.status = 'completed';
        newTrade.completedWith = matchingTrades.map(m => m.trade.id).join(',');
      } else if (remainingAmount < newTradeAmount) {
        // If partially matched
        newTrade.status = 'partially_completed';
        newTrade.remainingAmount = remainingAmount;
        newTrade.completedWith = matchingTrades.map(m => m.trade.id).join(',');
      }
    }

    // Update fund balance and margin details for market orders
    if (orderType === 'market') {
      setMarginDetails(prev => ({
        ...prev,
        availableMargin: tradeType === 'buy' ? 
          prev.availableMargin - tradeValue : 
          prev.availableMargin + tradeValue,
        usedMargin: tradeType === 'buy' ?
          prev.usedMargin + tradeValue :
          prev.usedMargin - tradeValue
      }));
    }

    setRecentTrades(prev => [newTrade, ...prev]);
    setShowTradeModal(false);
    setTradeMessage(
      `${orderType === 'market' ? '' : 'Order placed: '}${tradeType === 'buy' ? 'Buy' : 'Sell'} ${tradeAmount} ${selectedAsset.symbol} at ₹${tradePrice} (${orderType})`
    );
    setShowTradeSuccess(true);

    // Reset trade form
    setTradeAmount('');
    setLimitPrice('');
    setStopPrice('');
    setTargetPrice('');
    setStopLoss('');
    setOrderType('market');
  };

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

          {/* Active Positions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTrades
              .filter(trade => trade.status === 'executed' || trade.status === 'partially_completed')
              .map(trade => {
                const asset = assets.find(a => a.symbol === trade.asset);
                if (!asset) return null;
                
                const activeAmount = trade.remainingAmount || trade.amount;
                const currentValue = activeAmount * asset.value;
                const costBasis = activeAmount * trade.price;
                const pnl = trade.type === 'buy' ? currentValue - costBasis : costBasis - currentValue;
                const pnlPercent = (pnl / costBasis) * 100;

                return (
                  <div key={trade.id} className="bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-white font-semibold">{asset.name}</h3>
                        <div className="flex items-center text-sm text-gray-400">
                          <span>{trade.asset}</span>
                          <span className="mx-1">•</span>
                          <span>{trade.type.toUpperCase()}</span>
                          <span className="mx-1">•</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">
                            {activeAmount} {asset.type === 'index' ? 'lots' : 'shares'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedAsset(asset);
                          setTradeType(trade.type === 'buy' ? 'sell' : 'buy');
                          setTradeAmount(activeAmount.toString());
                          setOrderType('market');
                          setProductType('intraday');
                          setShowTradeModal(true);
                        }}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors flex items-center"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Close Position
                      </button>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Entry Price</span>
                        <span className="text-white">₹{trade.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Current Price</span>
                        <span className="text-white">₹{asset.value.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Position Value</span>
                        <span className="text-white">₹{currentValue.toLocaleString()}</span>
                      </div>
                      <div className={`flex justify-between text-sm ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <span>P&L</span>
                        <div className="flex items-center">
                          {pnl >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                          <span>₹{Math.abs(pnl).toFixed(2)} ({Math.abs(pnlPercent).toFixed(2)}%)</span>
                        </div>
                      </div>
                      {trade.status === 'partially_completed' && trade.originalAmount && (
                        <div className="flex justify-between text-xs text-gray-400 border-t border-gray-700 pt-2 mt-2">
                          <span>Original Position</span>
                          <span>{trade.originalAmount} {asset.type === 'index' ? 'lots' : 'shares'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
                className="text-blue-400 hover:text-blue-300 flex items-center"
              >
                <RefreshCw className="h-5 w-5 mr-1" /> Refresh
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
                      <div className="flex items-center justify-end space-x-2 mt-2">
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

              const totalValue = trade.amount * trade.price;
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
                            {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.amount} {trade.asset}
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
                          {isPartiallyCompleted && trade.remainingAmount && (
                            <span className="ml-2 text-xs text-gray-400">
                              ({trade.remainingAmount} shares remaining)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-400 mt-1">
                          <span>₹{trade.price.toLocaleString()} per share</span>
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
                          Active: ₹{(trade.remainingAmount * trade.price).toLocaleString()}
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