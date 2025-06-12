import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, ArrowRight, ArrowUpDown } from 'lucide-react';
import type { OptionChainResponse, OptionChainData } from '@/app/types/optionChain';

interface OptionChainProps {
  spotPrice: number;
  onStrikeSelect?: (strike: number, type: 'CE' | 'PE', premium: number) => void;
}

export default function OptionChain({ spotPrice, onStrikeSelect }: OptionChainProps) {
  const [optionData, setOptionData] = useState<OptionChainData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState<string>('');
  const [expiryDates, setExpiryDates] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actualSpotPrice, setActualSpotPrice] = useState<number>(spotPrice);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number>(500);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');

  // Adjust container height based on viewport
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        // Get viewport height and subtract some space for headers/footers
        const viewportHeight = window.innerHeight;
        const offset = 200; // Space for headers, footers, etc.
        const newHeight = Math.max(400, viewportHeight - offset);
        setContainerHeight(newHeight);
      }
    };
    
    // Set initial height
    updateHeight();
    
    // Update height on resize
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Update the last update time display
  useEffect(() => {
    const updateTimeDisplay = () => {
      const now = Date.now();
      const diffSeconds = Math.floor((now - lastUpdateTimeRef.current) / 1000);
      
      if (diffSeconds < 60) {
        setLastUpdateTime(`${diffSeconds}s ago`);
      } else if (diffSeconds < 3600) {
        setLastUpdateTime(`${Math.floor(diffSeconds / 60)}m ago`);
      } else {
        setLastUpdateTime(`${Math.floor(diffSeconds / 3600)}h ago`);
      }
    };
    
    // Update immediately and then every second
    updateTimeDisplay();
    const interval = setInterval(updateTimeDisplay, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real-time NIFTY price
  useEffect(() => {
    const fetchLivePrice = async () => {
      try {
        const response = await fetch('/api/yahoo-finance/latest-price?symbol=%5ENSEI');
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.price) {
          const newPrice = parseFloat(data.price);
          
          // Calculate change percentage if we have a previous price
          if (livePrice !== null) {
            const changePercent = ((newPrice - livePrice) / livePrice) * 100;
            setPriceChangePercent(changePercent);
          }
          
          setLivePrice(newPrice);
          setActualSpotPrice(newPrice);
        }
      } catch (error) {
        
      }
    };
    
    // Fetch immediately
    fetchLivePrice();
    
    // Then fetch every second
    const interval = setInterval(fetchLivePrice, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate NIFTY expiry dates (upcoming Thursdays)
  useEffect(() => {
    // Calculate upcoming expiry dates (next 4 Thursdays)
    const calculateExpiryDates = () => {
      const dates: string[] = [];
      const today = new Date();
      let currentDate = new Date(today);
      
      // Get the current month and year
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Find the last Thursday of the current month (monthly expiry)
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      let lastThursday = new Date(lastDayOfMonth);
      
      // Adjust to get the last Thursday
      while (lastThursday.getDay() !== 4) { // 4 is Thursday
        lastThursday.setDate(lastThursday.getDate() - 1);
      }
      
      // Find the next 4 Thursdays
      for (let i = 0; i < 4; i++) {
        // If we're before Thursday, find this week's Thursday
        if (currentDate.getDay() < 4) {
          currentDate.setDate(currentDate.getDate() + (4 - currentDate.getDay()));
        } 
        // If we're on or after Thursday, find next week's Thursday
        else {
          currentDate.setDate(currentDate.getDate() + (4 + 7 - currentDate.getDay()) % 7);
        }
        
        // Format the date as YYYY-MM-DD
        const formattedDate = currentDate.toISOString().split('T')[0];
        
        // Check if this is the monthly expiry
        const isMonthlyExpiry = 
          currentDate.getDate() === lastThursday.getDate() && 
          currentDate.getMonth() === lastThursday.getMonth();
        
        // Add to our list
        dates.push(formattedDate);
        
        // For the next iteration, move to the day after this Thursday
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return dates;
    };
    
    const dates = calculateExpiryDates();
    setExpiryDates(dates);
    setSelectedExpiry(dates[0]);
  }, []);

  // Fetch option chain data
  useEffect(() => {
    const fetchOptionChain = async () => {
      try {
        const response = await fetch(
          `/api/option-chain?instrument_key=NSE_INDEX|Nifty 50&expiry_date=${selectedExpiry}`
        );
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const data: OptionChainResponse = await response.json();
        
        // Check if we got an error response
        if (data.status === 'error' || data.error) {
          throw new Error(data.error || 'Failed to fetch real-time option chain data');
        }
        
        if (data.status === 'success' && data.data && data.data.length > 0) {
          // Sort by strike price
          const sortedData = [...data.data].sort((a, b) => a.strike_price - b.strike_price);
          setOptionData(sortedData);
          
          // Update spot price if available in the data and we don't have live price
          if (sortedData[0]?.underlying_spot_price && !livePrice) {
            setActualSpotPrice(sortedData[0].underlying_spot_price);
          }
          
          // Update last update time
          lastUpdateTimeRef.current = Date.now();
        } else {
          throw new Error('Invalid data format received from API');
        }
      } catch (error) {
        
        // Set error for user
        if (error instanceof Error) {
          setError(`${error.message}. Only real-time market data is used (no simulated data).`);
        } else {
          setError('Failed to load real-time option chain data. Only actual market data is used (no simulated data).');
        }
      }
    };

    if (selectedExpiry) {
      // Initial fetch with loading indicator
      setIsLoading(true);
      setError(null);
      fetchOptionChain()
        .then(() => setIsLoading(false))
        .catch(err => {
          setError('Failed to load real-time option chain data. Only actual market data is used (no simulated data).');
          setIsLoading(false);
        });
      
      // Refresh every second
      const interval = setInterval(fetchOptionChain, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedExpiry, livePrice]);

  // Function to format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toString();
  };

  // Format expiry date for display
  const formatExpiryDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    
    // Check if this is the last Thursday of the month (monthly expiry)
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    let lastThursday = new Date(lastDay);
    while (lastThursday.getDay() !== 4) {
      lastThursday.setDate(lastThursday.getDate() - 1);
    }
    
    const isMonthlyExpiry = date.getDate() === lastThursday.getDate();
    
    return `${day} ${month}${isMonthlyExpiry ? ' (Monthly)' : ''}`;
  };

  // Find ATM strike (closest to spot price)
  const atmStrike = optionData.length > 0
    ? optionData.reduce((closest, current) => 
        Math.abs(current.strike_price - actualSpotPrice) < Math.abs(closest.strike_price - actualSpotPrice)
          ? current
          : closest
      ).strike_price
    : 0;

  // Find the two strike prices that bracket the current market price
  const lowerStrike = optionData.length > 0
    ? Math.max(...optionData.filter(row => row.strike_price <= actualSpotPrice).map(row => row.strike_price))
    : 0;
  
  const upperStrike = optionData.length > 0
    ? Math.min(...optionData.filter(row => row.strike_price >= actualSpotPrice).map(row => row.strike_price))
    : 0;

  // Calculate how far the spot price is between the two brackets (as a percentage)
  const spotPositionPercentage = (upperStrike !== lowerStrike) 
    ? ((actualSpotPrice - lowerStrike) / (upperStrike - lowerStrike)) * 100
    : 50;
  
  // Determine if a row is one of the bracketing strikes
  const isLowerBracket = (strike: number) => strike === lowerStrike && lowerStrike !== upperStrike;
  const isUpperBracket = (strike: number) => strike === upperStrike && lowerStrike !== upperStrike;
  
  // Determine if we should show the imaginary line (only when we have valid bracketing strikes)
  const showImaginaryLine = lowerStrike !== 0 && upperStrike !== 0 && lowerStrike !== upperStrike;

  // Filter the option data to show only 10 strikes above and 10 below the imaginary line
  const filteredOptionData = useMemo(() => {
    if (!showImaginaryLine || optionData.length === 0) return optionData;

    // Sort by strike price
    const sortedData = [...optionData].sort((a, b) => a.strike_price - b.strike_price);
    
    // Find the index of the middle point (between lower and upper brackets)
    const middlePoint = (lowerStrike + upperStrike) / 2;
    
    // Find the index of the closest strike to the middle point
    const middleIndex = sortedData.findIndex(item => 
      item.strike_price >= middlePoint
    );
    
    // Calculate the start and end indices to show 10 strikes above and 10 below
    const startIndex = Math.max(0, middleIndex - 10);
    const endIndex = Math.min(sortedData.length - 1, middleIndex + 10);
    
    return sortedData.slice(startIndex, endIndex + 1);
  }, [optionData, lowerStrike, upperStrike, showImaginaryLine]);

  return (
    <div ref={containerRef} className="bg-gray-800/50 rounded-xl p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center">
            NIFTY Option Chain
            {livePrice && (
              <span className={`ml-3 text-sm px-2 py-0.5 rounded ${
                priceChangePercent > 0 ? 'bg-green-500/20 text-green-400' : 
                priceChangePercent < 0 ? 'bg-red-500/20 text-red-400' : 
                'bg-blue-500/20 text-blue-400'
              }`}>
                {priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </span>
            )}
            {lastUpdateTime && (
              <span className="ml-2 text-xs text-gray-400">
                Updated: {lastUpdateTime}
              </span>
            )}
          </h3>
          <div className="text-sm flex items-center">
            <span className={`mr-2 font-medium ${
              priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              Spot Price: {livePrice?.toFixed(2) || actualSpotPrice.toFixed(2)}
            </span>
            {showImaginaryLine && (
              <span className="text-xs px-2 py-0.5 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center">
                <span className="text-blue-300 mr-1">Between</span>
                <span className="text-white font-medium">{lowerStrike.toFixed(1)}</span>
                <ArrowUpDown className="h-3 w-3 mx-1 text-blue-300" />
                <span className="text-white font-medium">{upperStrike.toFixed(1)}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedExpiry}
            onChange={(e) => setSelectedExpiry(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {expiryDates.map((date) => (
              <option key={date} value={date}>{formatExpiryDate(date)}</option>
            ))}
          </select>
          <button 
            onClick={() => {
              setIsLoading(true);
              lastUpdateTimeRef.current = Date.now();
              
              // Fetch live price first
              fetch('/api/yahoo-finance/latest-price?symbol=%5ENSEI')
                .then(res => res.json())
                .then(data => {
                  if (data.price) {
                    setLivePrice(parseFloat(data.price));
                    setActualSpotPrice(parseFloat(data.price));
                  }
                  
                  // Then fetch option chain
                  return fetch(`/api/option-chain?instrument_key=NSE_INDEX|Nifty 50&expiry_date=${selectedExpiry}`);
                })
                .then(res => res.json())
                .then(data => {
                  if (data.status === 'success') {
                    const sortedData = [...data.data].sort((a, b) => a.strike_price - b.strike_price);
                    setOptionData(sortedData);
                  }
                  setIsLoading(false);
                })
                .catch(err => {
                  
                  setIsLoading(false);
                  setError('Failed to refresh option chain data. Only real-time market data is used (no simulated data).');
                });
            }}
            className="text-blue-400 hover:text-blue-300 focus:outline-none"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center text-red-300">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {optionData.length === 0 && !error ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-pulse text-gray-400">Loading option chain data...</div>
        </div>
      ) : (
        <div className="overflow-auto" style={{ maxHeight: `${containerHeight}px` }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900 z-10">
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="px-4 py-2 text-center" colSpan={6}>CALLS</th>
                <th className="px-4 py-2 text-center">Strike</th>
                <th className="px-4 py-2 text-center" colSpan={6}>PUTS</th>
              </tr>
              <tr className="text-gray-400 text-xs bg-gray-900">
                <th className="px-2 py-2">IV</th>
                <th className="px-2 py-2">Delta</th>
                <th className="px-2 py-2">Volume</th>
                <th className="px-2 py-2">OI</th>
                <th className="px-2 py-2">Bid/Ask</th>
                <th className="px-2 py-2">LTP</th>
                <th className="px-2 py-2 font-bold">Strike</th>
                <th className="px-2 py-2">LTP</th>
                <th className="px-2 py-2">Bid/Ask</th>
                <th className="px-2 py-2">OI</th>
                <th className="px-2 py-2">Volume</th>
                <th className="px-2 py-2">Delta</th>
                <th className="px-2 py-2">IV</th>
              </tr>
            </thead>
            <tbody>
              {/* Render the imaginary line separately at the top */}
              {showImaginaryLine && (
                <tr key="imaginary-line-header" className="border-none">
                  <td colSpan={13} className="px-0 py-2 text-center">
                    <div className="text-xs font-medium text-blue-400">
                      Imaginary Line: Market Price between {lowerStrike.toFixed(1)} and {upperStrike.toFixed(1)}
                    </div>
                  </td>
                </tr>
              )}
            
              {filteredOptionData.map((row, index, arr) => {
                // Find the index of the lower and upper brackets
                const lowerBracketIndex = arr.findIndex(r => r.strike_price === lowerStrike);
                const upperBracketIndex = arr.findIndex(r => r.strike_price === upperStrike);
                
                // Determine if this row is between the brackets (inclusive)
                const isBetweenBrackets = 
                  showImaginaryLine && 
                  row.strike_price >= lowerStrike && 
                  row.strike_price <= upperStrike;
                
                // Determine if this is the first row in the bracket range
                const isFirstInRange = row.strike_price === lowerStrike;
                
                // Determine if this is the last row in the bracket range
                const isLastInRange = row.strike_price === upperStrike;

                // Determine if this row should show the market price line
                const shouldShowMarketPriceLine = showImaginaryLine && 
                  ((row.strike_price === lowerStrike && arr.findIndex(r => r.strike_price === upperStrike) === index + 1) || // If the market is exactly between two consecutive strikes
                   (index === Math.floor(arr.length / 2) - 1)); // Or in the middle of the range
                
                return (
                  <>
                    {/* Regular row for this strike price */}
                    <tr 
                      key={row.strike_price} 
                      className={`border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors ${
                        row.strike_price === atmStrike ? 'bg-blue-900/20' : 
                        isBetweenBrackets ? 'bg-gray-800/80' : ''
                      } ${
                        isLowerBracket(row.strike_price) ? 'border-t-2 border-t-blue-500/50' : 
                        isUpperBracket(row.strike_price) ? 'border-b-2 border-b-blue-500/50' : ''
                      }`}
                    >
                      {/* Call Side */}
                      <td className="px-2 py-2 text-gray-300 text-center">{row.call_options.option_greeks.iv.toFixed(1)}%</td>
                      <td className="px-2 py-2 text-gray-300 text-center">{row.call_options.option_greeks.delta.toFixed(2)}</td>
                      <td className="px-2 py-2 text-gray-300 text-center">{formatNumber(row.call_options.market_data.volume)}</td>
                      <td className="px-2 py-2 text-gray-300 text-center">{formatNumber(row.call_options.market_data.oi)}</td>
                      <td className="px-2 py-2 text-gray-300 text-center">
                        {row.call_options.market_data.bid_price.toFixed(2)}/{row.call_options.market_data.ask_price.toFixed(2)}
                      </td>
                      <td 
                        className="px-2 py-2 text-white text-center cursor-pointer hover:text-blue-400 group relative"
                        onClick={() => onStrikeSelect?.(row.strike_price, 'CE', row.call_options.market_data.ltp)}
                      >
                        <div className="flex items-center justify-center">
                          {row.call_options.market_data.ltp.toFixed(2)}
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-xs text-gray-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            Click to trade
                          </span>
                        </div>
                      </td>

                      {/* Strike Price */}
                      <td className={`px-2 py-2 text-center font-semibold ${
                        row.strike_price === atmStrike 
                          ? 'text-blue-400 bg-blue-500/20' 
                          : isLowerBracket(row.strike_price) || isUpperBracket(row.strike_price)
                            ? 'text-blue-300'
                            : 'text-gray-400'
                      }`}>
                        {row.strike_price.toFixed(1)}
                        {isLowerBracket(row.strike_price) && (
                          <div className="text-xs text-blue-400 font-normal flex items-center justify-center mt-1">
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                            Lower Bracket
                          </div>
                        )}
                        {isUpperBracket(row.strike_price) && (
                          <div className="text-xs text-blue-400 font-normal flex items-center justify-center mt-1">
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                            Upper Bracket
                          </div>
                        )}
                      </td>

                      {/* Put Side */}
                      <td 
                        className="px-2 py-2 text-white text-center cursor-pointer hover:text-blue-400 group relative"
                        onClick={() => onStrikeSelect?.(row.strike_price, 'PE', row.put_options.market_data.ltp)}
                      >
                        <div className="flex items-center justify-center">
                          {row.put_options.market_data.ltp.toFixed(2)}
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-xs text-gray-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            Click to trade
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-gray-300 text-center">
                        {row.put_options.market_data.bid_price.toFixed(2)}/{row.put_options.market_data.ask_price.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-gray-300 text-center">{formatNumber(row.put_options.market_data.oi)}</td>
                      <td className="px-2 py-2 text-gray-300 text-center">{formatNumber(row.put_options.market_data.volume)}</td>
                      <td className="px-2 py-2 text-gray-300 text-center">{row.put_options.option_greeks.delta.toFixed(2)}</td>
                      <td className="px-2 py-2 text-gray-300 text-center">{row.put_options.option_greeks.iv.toFixed(1)}%</td>
                    </tr>
                    
                    {/* Show the market price line after the lower bracket or in the middle of the range */}
                    {shouldShowMarketPriceLine && (
                      <tr key={`market-price-line-${row.strike_price}`} className="border-none">
                        <td colSpan={13} className="px-0 py-0">
                          <div className="relative w-full h-12 flex items-center">
                            {/* Horizontal line spanning the entire width */}
                            <div className="absolute w-full h-[2px] bg-blue-500"></div>
                            
                            {/* Market price badge */}
                            <div className="absolute left-1/2 transform -translate-x-1/2 px-4 py-1.5 bg-blue-600 rounded-full text-white text-sm font-medium z-10 shadow-lg shadow-blue-500/20 border border-blue-400/30 whitespace-nowrap">
                              Market Price: {actualSpotPrice.toFixed(2)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 