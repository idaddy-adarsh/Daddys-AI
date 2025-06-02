import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
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

  // Generate expiry dates (next 4 Thursdays)
  useEffect(() => {
    const dates: string[] = [];
    let currentDate = new Date();
    
    while (dates.length < 4) {
      currentDate.setDate(currentDate.getDate() + 1);
      if (currentDate.getDay() === 4) { // Thursday
        dates.push(currentDate.toISOString().split('T')[0]); // YYYY-MM-DD format
      }
    }
    
    setExpiryDates(dates);
    setSelectedExpiry(dates[0]);
  }, []);

  // Fetch option chain data
  useEffect(() => {
    const fetchOptionChain = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/option-chain?instrument_key=NSE_INDEX|Nifty 50&expiry_date=${selectedExpiry}`
        );
        
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const data: OptionChainResponse = await response.json();
        if (data.status === 'success') {
          setOptionData(data.data);
        }
      } catch (error) {
        console.error('Error fetching option chain:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedExpiry) {
      fetchOptionChain();
      const interval = setInterval(fetchOptionChain, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedExpiry]);

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">NIFTY Option Chain</h3>
        <div className="flex items-center space-x-4">
          <select
            value={selectedExpiry}
            onChange={(e) => setSelectedExpiry(e.target.value)}
            className="bg-gray-700 text-white rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {expiryDates.map((date) => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
          <RefreshCw className={`h-5 w-5 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="px-4 py-2 text-center" colSpan={6}>CALLS</th>
              <th className="px-4 py-2 text-center">Strike</th>
              <th className="px-4 py-2 text-center" colSpan={6}>PUTS</th>
            </tr>
            <tr className="text-gray-400 text-xs">
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
            {optionData.map((row) => (
              <tr key={row.strike_price} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                {/* Call Side */}
                <td className="px-2 py-2 text-gray-300 text-center">{row.call_options.option_greeks.iv.toFixed(1)}%</td>
                <td className="px-2 py-2 text-gray-300 text-center">{row.call_options.option_greeks.delta.toFixed(3)}</td>
                <td className="px-2 py-2 text-gray-300 text-center">{row.call_options.market_data.volume.toLocaleString()}</td>
                <td className="px-2 py-2 text-gray-300 text-center">{row.call_options.market_data.oi.toLocaleString()}</td>
                <td className="px-2 py-2 text-gray-300 text-center">
                  {row.call_options.market_data.bid_price.toFixed(2)}/{row.call_options.market_data.ask_price.toFixed(2)}
                </td>
                <td 
                  className="px-2 py-2 text-white text-center cursor-pointer hover:text-blue-400 group relative"
                  onClick={() => onStrikeSelect?.(row.strike_price, 'CE', row.call_options.market_data.ltp)}
                >
                  <div className="flex items-center justify-center">
                    {row.call_options.market_data.ltp.toFixed(2)}
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-xs text-gray-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to trade
                    </span>
                  </div>
                </td>

                {/* Strike Price */}
                <td className={`px-2 py-2 text-center font-semibold ${
                  row.strike_price === Math.round(row.underlying_spot_price / 50) * 50 
                    ? 'text-blue-400 bg-blue-500/10' 
                    : 'text-gray-400'
                }`}>
                  {row.strike_price}
                </td>

                {/* Put Side */}
                <td 
                  className="px-2 py-2 text-white text-center cursor-pointer hover:text-blue-400 group relative"
                  onClick={() => onStrikeSelect?.(row.strike_price, 'PE', row.put_options.market_data.ltp)}
                >
                  <div className="flex items-center justify-center">
                    {row.put_options.market_data.ltp.toFixed(2)}
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-xs text-gray-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to trade
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 text-gray-300 text-center">
                  {row.put_options.market_data.bid_price.toFixed(2)}/{row.put_options.market_data.ask_price.toFixed(2)}
                </td>
                <td className="px-2 py-2 text-gray-300 text-center">{row.put_options.market_data.oi.toLocaleString()}</td>
                <td className="px-2 py-2 text-gray-300 text-center">{row.put_options.market_data.volume.toLocaleString()}</td>
                <td className="px-2 py-2 text-gray-300 text-center">{row.put_options.option_greeks.delta.toFixed(3)}</td>
                <td className="px-2 py-2 text-gray-300 text-center">{row.put_options.option_greeks.iv.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 