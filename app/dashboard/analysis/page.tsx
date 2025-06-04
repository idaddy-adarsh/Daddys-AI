'use client';

import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createChart, ColorType, Time, LineStyle, DeepPartial, ChartOptions, LineWidth } from 'lightweight-charts';
import { Search, TrendingUp, TrendingDown, Clock, Calendar, Volume2, CandlestickChart, ChevronDown, BarChart4 } from 'lucide-react';
import { useNotifications } from '../layout';

interface ChartData {
  time: string;  // ISO string format for intraday data
  open: number;
  high: number;
  low: number;
  close: number;
}

interface LTPData {
  fetchTime: string;
  direction: string;
  riskyResistance: number;
  riskySupport: number;
  moderateResistance: number;
  moderateSupport: number;
  rMaxGain: number;
  sMaxGain: number;
  rMaxPain: number;
  sMaxPain: number;
  scenario: string;
}

interface FormattedChartData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

// Add PriceLine type
interface PriceLine {
  id: string;
  options: {
    price: number;
    color: string;
    lineWidth: number;
    lineStyle: number;
    axisLabelVisible: boolean;
    title: string;
  };
}

interface TimeInterval {
  label: string;
  value: string;
  range: string;
}

const timeIntervals: TimeInterval[] = [
  { label: '1M', value: '1m', range: '1d' },
  { label: '5M', value: '5m', range: '1d' },
  { label: '15M', value: '15m', range: '1d' },
  { label: '30M', value: '30m', range: '5d' },
  { label: '1H', value: '60m', range: '5d' },
  { label: '1D', value: '1d', range: '1mo' },
];

const popularSymbols = [
  // Indices
  { name: 'NIFTY 50', symbol: '^NSEI' },
  { name: 'Bank NIFTY', symbol: '^NSEBANK' },
  { name: 'FINNIFTY', symbol: 'NIFTY_FIN_SERVICE.NS' },
  { name: 'MIDCPNIFTY', symbol: 'MIDCPNIFTY.NS' },
  { name: 'NIFTYNXT50', symbol: 'NIFTYNXT50.NS' },
  
  // Stocks
  { name: 'HINDALCO', symbol: 'HINDALCO.NS' },
  { name: 'RVNL', symbol: 'RVNL.NS' },
  { name: 'IDEA', symbol: 'IDEA.NS' },
  { name: 'ONGC', symbol: 'ONGC.NS' },
  { name: 'DABUR', symbol: 'DABUR.NS' },
  { name: 'AXISBANK', symbol: 'AXISBANK.NS' },
  { name: 'NBCC', symbol: 'NBCC.NS' },
  { name: 'ABCAPITAL', symbol: 'ABCAPITAL.NS' },
  { name: 'AMBUJACEM', symbol: 'AMBUJACEM.NS' },
  { name: 'MANAPPURAM', symbol: 'MANAPPURAM.NS' },
  { name: 'IGL', symbol: 'IGL.NS' },
  { name: 'BANKBARODA', symbol: 'BANKBARODA.NS' },
  { name: 'SYNGENE', symbol: 'SYNGENE.NS' },
  { name: 'IEX', symbol: 'IEX.NS' },
  { name: 'ULTRACEMCO', symbol: 'ULTRACEMCO.NS' },
  { name: 'TATACONSUM', symbol: 'TATACONSUM.NS' },
  { name: 'HDFCBANK', symbol: 'HDFCBANK.NS' },
  { name: 'BOSCHLTD', symbol: 'BOSCHLTD.NS' },
  { name: 'DLF', symbol: 'DLF.NS' },
  { name: 'AUROPHARMA', symbol: 'AUROPHARMA.NS' },
  { name: 'NHPC', symbol: 'NHPC.NS' },
  { name: 'TRENT', symbol: 'TRENT.NS' },
  { name: 'BIOCON', symbol: 'BIOCON.NS' },
  { name: 'HINDUNILVR', symbol: 'HINDUNILVR.NS' },
  { name: 'NAUKRI', symbol: 'NAUKRI.NS' },
  { name: 'TATACHEM', symbol: 'TATACHEM.NS' },
  { name: 'PIIND', symbol: 'PIIND.NS' },
  { name: 'TITAGARH', symbol: 'TITAGARH.NS' },
  { name: 'UNITDSPR', symbol: 'UNITDSPR.NS' },
  { name: 'BPCL', symbol: 'BPCL.NS' },
  { name: 'GODREJCP', symbol: 'GODREJCP.NS' },
  { name: 'JIOFIN', symbol: 'JIOFIN.NS' },
  { name: 'SJVN', symbol: 'SJVN.NS' },
  { name: 'MANKIND', symbol: 'MANKIND.NS' },
  { name: 'JINDALSTEL', symbol: 'JINDALSTEL.NS' },
  { name: 'BHARTIARTL', symbol: 'BHARTIARTL.NS' },
  { name: 'HEROMOTOCO', symbol: 'HEROMOTOCO.NS' },
  { name: 'TATAMOTORS', symbol: 'TATAMOTORS.NS' },
  { name: 'PAYTM', symbol: 'PAYTM.NS' },
  { name: 'PNBHOUSING', symbol: 'PNBHOUSING.NS' },
  { name: 'POLYCAB', symbol: 'POLYCAB.NS' },
  { name: 'LUPIN', symbol: 'LUPIN.NS' },
  { name: 'ITC', symbol: 'ITC.NS' },
  { name: 'UNIONBANK', symbol: 'UNIONBANK.NS' },
  { name: 'SONACOMS', symbol: 'SONACOMS.NS' },
  { name: 'COALINDIA', symbol: 'COALINDIA.NS' },
  { name: 'AARTIIND', symbol: 'AARTIIND.NS' },
  { name: 'TORNTPHARM', symbol: 'TORNTPHARM.NS' },
  { name: 'KAYNES', symbol: 'KAYNES.NS' },
  { name: 'BHEL', symbol: 'BHEL.NS' },
  { name: 'NMDC', symbol: 'NMDC.NS' },
  { name: 'CDSL', symbol: 'CDSL.NS' },
  { name: 'CAMS', symbol: 'CAMS.NS' },
  { name: 'OFSS', symbol: 'OFSS.NS' },
  { name: 'MOTHERSON', symbol: 'MOTHERSON.NS' },
  { name: 'COFORGE', symbol: 'COFORGE.NS' },
  { name: 'MARUTI', symbol: 'MARUTI.NS' },
  { name: 'KALYANKJIL', symbol: 'KALYANKJIL.NS' },
  { name: 'ADANIENSOL', symbol: 'ADANIENSOL.NS' },
  { name: 'RECLTD', symbol: 'RECLTD.NS' },
  { name: 'JSWSTEEL', symbol: 'JSWSTEEL.NS' },
  { name: 'FORTIS', symbol: 'FORTIS.NS' },
  { name: 'TORNTPOWER', symbol: 'TORNTPOWER.NS' },
  { name: 'DRREDDY', symbol: 'DRREDDY.NS' },
  { name: 'BHARATFORG', symbol: 'BHARATFORG.NS' },
  { name: 'IDFCFIRSTB', symbol: 'IDFCFIRSTB.NS' },
  { name: 'LICI', symbol: 'LICI.NS' },
  { name: 'SBICARD', symbol: 'SBICARD.NS' },
  { name: 'PATANJALI', symbol: 'PATANJALI.NS' },
  { name: 'SBILIFE', symbol: 'SBILIFE.NS' },
  { name: 'MUTHOOTFIN', symbol: 'MUTHOOTFIN.NS' },
  { name: 'LTIM', symbol: 'LTIM.NS' },
  { name: 'BAJAJFINSV', symbol: 'BAJAJFINSV.NS' },
  { name: 'VBL', symbol: 'VBL.NS' },
  { name: 'ICICIGI', symbol: 'ICICIGI.NS' },
  { name: 'INFY', symbol: 'INFY.NS' },
  { name: 'ADANIPORTS', symbol: 'ADANIPORTS.NS' },
  { name: 'CGPOWER', symbol: 'CGPOWER.NS' },
  { name: 'NCC', symbol: 'NCC.NS' },
  { name: 'ABFRL', symbol: 'ABFRL.NS' },
  { name: 'MPHASIS', symbol: 'MPHASIS.NS' },
  { name: 'ETERNAL', symbol: 'ETERNAL.NS' },
  { name: 'BSOFT', symbol: 'BSOFT.NS' },
  { name: 'VOLTAS', symbol: 'VOLTAS.NS' },
  { name: 'PETRONET', symbol: 'PETRONET.NS' },
  { name: 'JUBLFOOD', symbol: 'JUBLFOOD.NS' },
  { name: 'HDFCAMC', symbol: 'HDFCAMC.NS' },
  { name: 'NESTLEIND', symbol: 'NESTLEIND.NS' },
  { name: 'HDFCLIFE', symbol: 'HDFCLIFE.NS' },
  { name: 'PEL', symbol: 'PEL.NS' },
  { name: 'DALBHARAT', symbol: 'DALBHARAT.NS' },
  { name: 'DMART', symbol: 'DMART.NS' },
  { name: 'PFC', symbol: 'PFC.NS' },
  { name: 'RBLBANK', symbol: 'RBLBANK.NS' },
  { name: 'HINDCOPPER', symbol: 'HINDCOPPER.NS' },
  { name: 'UPL', symbol: 'UPL.NS' },
  { name: 'TATACOMM', symbol: 'TATACOMM.NS' },
  { name: 'LICHSGFIN', symbol: 'LICHSGFIN.NS' },
  { name: 'PIDILITIND', symbol: 'PIDILITIND.NS' },
  { name: 'ASIANPAINT', symbol: 'ASIANPAINT.NS' },
  { name: 'M&MFIN', symbol: 'M&MFIN.NS' },
  { name: 'ASHOKLEY', symbol: 'ASHOKLEY.NS' },
  { name: 'APOLLOHOSP', symbol: 'APOLLOHOSP.NS' },
  { name: 'IOC', symbol: 'IOC.NS' },
  { name: 'CIPLA', symbol: 'CIPLA.NS' },
  { name: 'PHOENIXLTD', symbol: 'PHOENIXLTD.NS' },
  { name: 'MGL', symbol: 'MGL.NS' },
  { name: 'PAGEIND', symbol: 'PAGEIND.NS' },
  { name: 'M&M', symbol: 'M&M.NS' },
  { name: 'HAVELLS', symbol: 'HAVELLS.NS' },
  { name: 'POLICYBZR', symbol: 'POLICYBZR.NS' },
  { name: 'TATAPOWER', symbol: 'TATAPOWER.NS' },
  { name: 'FEDERALBNK', symbol: 'FEDERALBNK.NS' },
  { name: 'CYIENT', symbol: 'CYIENT.NS' },
  { name: 'LTF', symbol: 'LTF.NS' },
  { name: 'TECHM', symbol: 'TECHM.NS' },
  { name: 'IRCTC', symbol: 'IRCTC.NS' },
  { name: 'TCS', symbol: 'TCS.NS' },
  { name: 'INDHOTEL', symbol: 'INDHOTEL.NS' },
  { name: 'INDUSTOWER', symbol: 'INDUSTOWER.NS' },
  { name: 'SUNPHARMA', symbol: 'SUNPHARMA.NS' },
  { name: 'BAJAJ-AUTO', symbol: 'BAJAJ-AUTO.NS' },
  { name: 'PRESTIGE', symbol: 'PRESTIGE.NS' },
  { name: 'ZOMATO', symbol: 'ZOMATO.NS' },
  { name: 'SRF', symbol: 'SRF.NS' },
  { name: 'CESC', symbol: 'CESC.NS' },
  { name: 'CROMPTON', symbol: 'CROMPTON.NS' },
  { name: 'ICICIPRULI', symbol: 'ICICIPRULI.NS' },
  { name: 'INDIGO', symbol: 'INDIGO.NS' },
  { name: 'MAXHEALTH', symbol: 'MAXHEALTH.NS' },
  { name: 'DELHIVERY', symbol: 'DELHIVERY.NS' },
  { name: 'BAJFINANCE', symbol: 'BAJFINANCE.NS' },
  { name: 'PPLPHARMA', symbol: 'PPLPHARMA.NS' },
  { name: 'NTPC', symbol: 'NTPC.NS' },
  { name: 'NYKAA', symbol: 'NYKAA.NS' },
  { name: 'OIL', symbol: 'OIL.NS' },
  { name: 'WIPRO', symbol: 'WIPRO.NS' },
  { name: 'BALKRISIND', symbol: 'BALKRISIND.NS' },
  { name: 'EICHERMOT', symbol: 'EICHERMOT.NS' },
  { name: 'JSWENERGY', symbol: 'JSWENERGY.NS' },
  { name: 'SUPREMEIND', symbol: 'SUPREMEIND.NS' },
  { name: 'DIXON', symbol: 'DIXON.NS' },
  { name: 'TITAN', symbol: 'TITAN.NS' },
  { name: 'EXIDEIND', symbol: 'EXIDEIND.NS' },
  { name: 'GODREJPROP', symbol: 'GODREJPROP.NS' },
  { name: 'APLAPOLLO', symbol: 'APLAPOLLO.NS' },
  { name: 'HINDPETRO', symbol: 'HINDPETRO.NS' },
  { name: 'BANKINDIA', symbol: 'BANKINDIA.NS' },
  { name: 'MCX', symbol: 'MCX.NS' },
  { name: 'ATGL', symbol: 'ATGL.NS' },
  { name: 'INDUSINDBK', symbol: 'INDUSINDBK.NS' },
  { name: 'BRITANNIA', symbol: 'BRITANNIA.NS' },
  { name: 'TATATECH', symbol: 'TATATECH.NS' },
  { name: 'LT', symbol: 'LT.NS' },
  { name: 'CONCOR', symbol: 'CONCOR.NS' },
  { name: 'DIVISLAB', symbol: 'DIVISLAB.NS' },
  { name: 'ADANIGREEN', symbol: 'ADANIGREEN.NS' },
  { name: 'BLUESTARCO', symbol: 'BLUESTARCO.NS' },
  { name: 'OBEROIRLTY', symbol: 'OBEROIRLTY.NS' },
  { name: 'GAIL', symbol: 'GAIL.NS' },
  { name: 'HCLTECH', symbol: 'HCLTECH.NS' },
  { name: 'ANGELONE', symbol: 'ANGELONE.NS' },
  { name: 'MARICO', symbol: 'MARICO.NS' },
  { name: 'ACC', symbol: 'ACC.NS' },
  { name: 'HUDCO', symbol: 'HUDCO.NS' },
  { name: 'VEDL', symbol: 'VEDL.NS' },
  { name: 'BEL', symbol: 'BEL.NS' },
  { name: 'NIFTY', symbol: 'NIFTY.NS' },
  { name: 'CUMMINSIND', symbol: 'CUMMINSIND.NS' },
  { name: 'HAL', symbol: 'HAL.NS' },
  { name: 'SIEMENS', symbol: 'SIEMENS.NS' },
  { name: 'SHREECEM', symbol: 'SHREECEM.NS' },
  { name: 'CHAMBLFERT', symbol: 'CHAMBLFERT.NS' },
  { name: 'COLPAL', symbol: 'COLPAL.NS' },
  { name: 'INDIANB', symbol: 'INDIANB.NS' },
  { name: 'GRANULES', symbol: 'GRANULES.NS' },
  { name: 'GMRAIRPORT', symbol: 'GMRAIRPORT.NS' },
  { name: 'RELIANCE', symbol: 'RELIANCE.NS' },
  { name: 'MAZDOCK', symbol: 'MAZDOCK.NS' },
  { name: 'IRB', symbol: 'IRB.NS' },
  { name: 'ICICIBANK', symbol: 'ICICIBANK.NS' },
  { name: 'CHOLAFIN', symbol: 'CHOLAFIN.NS' },
  { name: 'ABB', symbol: 'ABB.NS' },
  { name: 'ALKEM', symbol: 'ALKEM.NS' },
  { name: 'CANBK', symbol: 'CANBK.NS' },
  { name: 'SBIN', symbol: 'SBIN.NS' },
  { name: 'BDL', symbol: 'BDL.NS' },
  { name: 'TATAELXSI', symbol: 'TATAELXSI.NS' },
  { name: 'MFSL', symbol: 'MFSL.NS' },
  { name: 'IRFC', symbol: 'IRFC.NS' },
  { name: 'NATIONALUM', symbol: 'NATIONALUM.NS' },
  { name: 'HINDZINC', symbol: 'HINDZINC.NS' },
  { name: 'GLENMARK', symbol: 'GLENMARK.NS' },
  { name: 'KOTAKBANK', symbol: 'KOTAKBANK.NS' },
  { name: 'TVSMOTOR', symbol: 'TVSMOTOR.NS' },
  { name: 'POONAWALLA', symbol: 'POONAWALLA.NS' },
  { name: 'POWERGRID', symbol: 'POWERGRID.NS' },
  { name: 'KEI', symbol: 'KEI.NS' },
  { name: 'IREDA', symbol: 'IREDA.NS' },
  { name: 'LAURUSLABS', symbol: 'LAURUSLABS.NS' },
  { name: 'KPITTECH', symbol: 'KPITTECH.NS' },
  { name: 'UNOMINDA', symbol: 'UNOMINDA.NS' },
  { name: 'SOLARINDS', symbol: 'SOLARINDS.NS' },
  { name: 'LODHA', symbol: 'LODHA.NS' },
  { name: 'TIINDIA', symbol: 'TIINDIA.NS' },
  { name: 'AUBANK', symbol: 'AUBANK.NS' },
  { name: 'BANDHANBNK', symbol: 'BANDHANBNK.NS' },
  { name: 'SHRIRAMFIN', symbol: 'SHRIRAMFIN.NS' },
  { name: 'PNB', symbol: 'PNB.NS' },
  { name: 'TATASTEEL', symbol: 'TATASTEEL.NS' },
  { name: 'ASTRAL', symbol: 'ASTRAL.NS' },
  { name: 'ZYDUSLIFE', symbol: 'ZYDUSLIFE.NS' },
  { name: 'ADANIENT', symbol: 'ADANIENT.NS' },
  { name: 'YESBANK', symbol: 'YESBANK.NS' },
  { name: 'SAIL', symbol: 'SAIL.NS' },
  { name: 'INOXWIND', symbol: 'INOXWIND.NS' },
  { name: 'BSE', symbol: 'BSE.NS' },
  { name: 'IIFL', symbol: 'IIFL.NS' },
  { name: 'HFCL', symbol: 'HFCL.NS' },
  { name: 'GRASIM', symbol: 'GRASIM.NS' },
  { name: 'PERSISTENT', symbol: 'PERSISTENT.NS' },
];

const CHART_BACKGROUND = 'rgba(0, 0, 0, 0)';
const GRID_COLOR = '#2a2a2a';
const TEXT_COLOR = '#d1d4dc';
const BORDER_COLOR = '#303030';
const CROSSHAIR_COLOR = '#ff9800';
const UP_COLOR = '#4CAF50';
const DOWN_COLOR = '#FF5252';
const PRICE_SCALE_WIDTH = 100; // Width of the price scale in pixels

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export default function AnalysisPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const currentCandleRef = useRef<{
    open: number;
    high: number;
    low: number;
    close: number;
    startTime: number;
  } | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [ltpData, setLtpData] = useState<LTPData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [expiryType, setExpiryType] = useState<'spot' | 'monthly'>('monthly');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const previousPriceRef = useRef<number | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const symbol = searchParams.get('symbol') || '^NSEI';
  
  // Add state for OHLC info card
  const [ohlcData, setOhlcData] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    time: string;
  } | null>(null);
  const [showOhlcCard, setShowOhlcCard] = useState(false);
  
  // Get notification context
  const { addNotification } = useNotifications();

  // Define default symbols to show without search
  const defaultSymbols = ['^NSEI', '^NSEBANK', 'RELIANCE.NS', 'TATAMOTORS.NS'];
  
  // Filter symbols based on search query
  const filteredSymbols = popularSymbols.filter(item => 
    // Always show default symbols when search is empty
    (searchQuery === '' && defaultSymbols.includes(item.symbol)) || 
    // Show matching symbols when searching
    (searchQuery !== '' && (
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchLTPData = async () => {
    try {
      // Get the base symbol name for LTP calculation
      let ltpSymbol = '';
      
      // Handle special cases for indices
      if (symbol === '^NSEI') {
        ltpSymbol = 'NIFTY';
      } else if (symbol === '^NSEBANK') {
        ltpSymbol = 'BANKNIFTY';
      } else if (symbol === 'NIFTY_FIN_SERVICE.NS') {
        ltpSymbol = 'FINNIFTY';
      } else if (symbol === 'MIDCPNIFTY.NS') {
        ltpSymbol = 'MIDCPNIFTY';
      } else if (symbol === 'NIFTYNXT50.NS') {
        ltpSymbol = 'NIFTYNXT50';
      } else {
        // For regular stocks, remove the .NS suffix if present
        ltpSymbol = symbol.replace('.NS', '');
      }
      
      // API now handles expiry date selection automatically
      console.log(`Fetching LTP data for symbol: ${symbol} (mapped to: ${ltpSymbol})`);
      const response = await fetch(`/api/ltp-calculator?symbol=${ltpSymbol}`);
      
      // Handle response errors
      if (!response.ok) {
        const status = response.status;
        
        // Don't log for rate limiting errors
        if (status !== 429) {
          try {
            // Try to parse error JSON if available
            const errorData = await response.json();
            console.error(`Failed to fetch LTP data for ${ltpSymbol} (${status}):`, errorData);
          } catch (parseError) {
            // If JSON parsing fails, get the error text
            const errorText = await response.text();
            console.error(`Failed to fetch LTP data for ${ltpSymbol} (${status}): ${errorText}`);
          }
        }
        
        // Don't throw error, just return to prevent UI disruption
        return;
      }

      // Parse successful response
      const data = await response.json();
      console.log(`LTP data received for ${ltpSymbol}:`, data);
      
      // Check if we have valid data
      if (!data || !data.riskyResistance) {
        console.warn(`Incomplete LTP data received for ${ltpSymbol}:`, data);
      }
      
      setLtpData(data);
    } catch (error) {
      // Log the complete error object for better debugging
      console.error(`Error in fetchLTPData for ${symbol}:`, error);
      
      // Don't disrupt UI, continue without LTP data
      setLtpData(null);
    }
  };

  // Function to get the current 5-minute interval boundaries
  const getCandleBoundaries = () => {
    const now = new Date();
    
    // Calculate the number of 5-minute intervals since the start of the day
    const minutesSinceStartOfDay = now.getHours() * 60 + now.getMinutes();
    const intervalNumber = Math.floor(minutesSinceStartOfDay / 5);
    
    // Calculate the start time of the current 5-minute interval
    const startTime = new Date(now);
    startTime.setHours(Math.floor(intervalNumber * 5 / 60));
    startTime.setMinutes((intervalNumber * 5) % 60);
    startTime.setSeconds(0);
    startTime.setMilliseconds(0);
    
    // Calculate the end time (start time + 5 minutes)
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 5);

    // Calculate the previous interval's start time
    const prevStartTime = new Date(startTime);
    prevStartTime.setMinutes(prevStartTime.getMinutes() - 5);

    return {
      currentStartTime: Math.floor(startTime.getTime() / 1000),
      currentEndTime: Math.floor(endTime.getTime() / 1000),
      previousStartTime: Math.floor(prevStartTime.getTime() / 1000)
    };
  };

  // Function to update latest candle data
  const updateLatestCandle = async () => {
    try {
      const response = await fetch(`/api/yahoo-finance/latest-price?symbol=${symbol}`);
      if (!response.ok) throw new Error('Failed to fetch latest data');
      const latestData = await response.json();
      const price = latestData.price;
      
      setCurrentPrice(price);

      // Check for price alerts
      if (ltpData && price && previousPriceRef.current !== null) {
        // Define price levels to check for alerts
        const priceLevels = [
          { price: ltpData.riskyResistance, title: 'Risky Resistance' },
          { price: ltpData.moderateResistance, title: 'Moderate Resistance' },
          { price: ltpData.rMaxGain, title: 'Resistance Target' },
          { price: ltpData.rMaxPain, title: 'Resistance Stop Loss' },
          { price: ltpData.riskySupport, title: 'Risky Support' },
          { price: ltpData.moderateSupport, title: 'Moderate Support' },
          { price: ltpData.sMaxGain, title: 'Support Target' },
          { price: ltpData.sMaxPain, title: 'Support Stop Loss' }
        ];

        // Check each level to see if price crossed it
        priceLevels.forEach(level => {
          if (!level.price || isNaN(Number(level.price))) return;
          
          const levelPrice = Number(level.price);
          const previousPrice = previousPriceRef.current!;
          
          // Check if price crossed the level (from below to above or from above to below)
          const crossedAbove = previousPrice < levelPrice && price >= levelPrice;
          const crossedBelow = previousPrice > levelPrice && price <= levelPrice;
          
          if (crossedAbove || crossedBelow) {
            const direction = crossedAbove ? 'above' : 'below';
            
            // Get the symbol name for the notification
            let displaySymbol = symbol;
            if (symbol === '^NSEI') displaySymbol = 'NIFTY';
            else if (symbol === '^NSEBANK') displaySymbol = 'BANKNIFTY';
            else if (symbol === 'NIFTY_FIN_SERVICE.NS') displaySymbol = 'FINNIFTY';
            else displaySymbol = symbol.replace('.NS', '');
            
            // Add to global notifications
            addNotification({
              title: `${displaySymbol} Price Alert: ${level.title}`,
              message: `Price (${formatPrice(price)}) moved ${direction} ${level.title} level (${formatPrice(levelPrice)})`,
              type: direction === 'above' ? 'success' : 'warning',
            });
          }
        });
      }
      
      // Update previous price reference
      previousPriceRef.current = price;

      // Update LTP data periodically
      if (!ltpData || Date.now() - new Date(ltpData.fetchTime || 0).getTime() > 10000) {
        await fetchLTPData();
      }

      // Get current candle boundaries
      const { currentStartTime, previousStartTime } = getCandleBoundaries();

      setChartData(prevData => {
        const newData = [...prevData];
        
        // Find the current candle if it exists
        const currentCandleIndex = newData.findIndex(candle => 
          Number(candle.time) === currentStartTime
        );

        if (currentCandleIndex === -1) {
          // If this is the first price for this time period, create a new candle
          // First, find the previous candle to get the opening price
          const previousCandle = newData.find(candle => 
            Number(candle.time) === previousStartTime
          );

          newData.push({
            time: currentStartTime.toString(),
            open: previousCandle ? previousCandle.close : price,
            high: price,
            low: price,
            close: price
          });
        } else {
          // Update existing candle
          const currentCandle = newData[currentCandleIndex];
          newData[currentCandleIndex] = {
            ...currentCandle,
            high: Math.max(currentCandle.high, price),
            low: Math.min(currentCandle.low, price),
            close: price
          };
        }

        // Remove any invalid candles (future candles or partial candles)
        const validData = newData.filter(candle => {
          const candleTime = Number(candle.time);
          return candleTime <= currentStartTime && candleTime % 300 === 0; // 300 seconds = 5 minutes
        });
        
        // Sort data by time in ascending order
        const sortedData = validData.sort((a: ChartData, b: ChartData) => Number(a.time) - Number(b.time));

        // Update the candlestick series with the sorted data
        if (candlestickSeriesRef.current) {
          const formattedData = sortedData.map(item => ({
            ...item,
            time: Number(item.time) as Time
          }));
          candlestickSeriesRef.current.setData(formattedData);
        }

        return sortedData;
      });
    } catch (error) {
      console.error('Error updating latest candle:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch historical 5-minute candles
        console.log(`Fetching data for symbol: ${symbol}`);
        const marketResponse = await fetch(`/api/yahoo-finance/intraday?symbol=${symbol}&interval=5m&range=1d`);
        if (!marketResponse.ok) throw new Error('Failed to fetch data');
        const data = await marketResponse.json();
        console.log(`Received ${data.length} data points from API`);
        
        // Get current candle boundaries
        const { currentStartTime } = getCandleBoundaries();
        
        // Filter and validate historical data
        const historicalData = data.filter((candle: ChartData) => {
          const candleTime = Number(candle.time);
          return candleTime < currentStartTime && candleTime % 300 === 0;
        });
        
        console.log(`After filtering, have ${historicalData.length} valid candles`);
        
        // Sort historical data by time
        const sortedData = historicalData.sort((a: ChartData, b: ChartData) => Number(a.time) - Number(b.time));
        
        setChartData(sortedData);
        
        // Fetch LTP data for all symbols - ensure this happens for every symbol
        await fetchLTPData();
        console.log('LTP data fetched for symbol:', symbol);
      } catch (error) {
        console.error('Error fetching market data:', error);
        setChartData([]);
        setLtpData(null);
      }
      setIsLoading(false);
    };

    fetchData();

    // Set up real-time data updates - update every second
    const updateInterval = setInterval(updateLatestCandle, 1000);

    return () => {
      clearInterval(updateInterval);
    };
  }, [symbol]);

  // Use layout effect for chart initialization to ensure DOM measurements are accurate
  useLayoutEffect(() => {
    console.log(`useLayoutEffect triggered, chartData length: ${chartData.length}`);
    if (!chartContainerRef.current) {
      console.log('Chart container ref is not available');
      return;
    }

    // Create chart if it doesn't exist
    if (!chartRef.current) {
      console.log('Creating new chart instance (layout effect)');
      const chartOptions: DeepPartial<ChartOptions> = {
        layout: {
          background: { 
            type: ColorType.Solid, 
            color: 'rgba(0, 0, 0, 0)' // Fully transparent background
          },
          textColor: TEXT_COLOR,
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 12,
        },
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
        grid: {
          vertLines: { 
            color: GRID_COLOR,
            style: LineStyle.Solid,
            visible: true,
          },
          horzLines: { 
            color: GRID_COLOR,
            style: LineStyle.Solid,
            visible: true,
          },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            width: 1,
            color: CROSSHAIR_COLOR,
            style: LineStyle.Solid,
            labelBackgroundColor: CROSSHAIR_COLOR,
          },
          horzLine: {
            width: 1,
            color: CROSSHAIR_COLOR,
            style: LineStyle.Solid,
            labelBackgroundColor: CROSSHAIR_COLOR,
          },
        },
        rightPriceScale: {
          borderColor: BORDER_COLOR,
          borderVisible: true,
          scaleMargins: {
            top: 0.1,
            bottom: 0.05,
          },
          autoScale: true,
          visible: true,
          alignLabels: true,
          ticksVisible: true,
          mode: 1,
          entireTextOnly: true,
        },
        timeScale: {
          borderColor: BORDER_COLOR,
          timeVisible: true,
          secondsVisible: false,
          borderVisible: true,
          rightOffset: 0,
          barSpacing: 6,
          minBarSpacing: 2,
          fixLeftEdge: true,
          fixRightEdge: true,
          lockVisibleTimeRangeOnResize: true,
          tickMarkFormatter: (time: number) => {
            return formatTime(time);
          }
        },
        localization: {
          timeFormatter: (time: number) => {
            return formatTime(time);
          },
          priceFormatter: (price: number) => {
            return formatPrice(price);
          },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: {
            time: true,
            price: true,
          },
          mouseWheel: true,
          pinch: true,
        },
      };

      try {
        chartRef.current = createChart(chartContainerRef.current, chartOptions);
        console.log('Chart created successfully');
        
        candlestickSeriesRef.current = chartRef.current.addCandlestickSeries({
          upColor: UP_COLOR,
          downColor: DOWN_COLOR,
          borderVisible: false,
          wickUpColor: UP_COLOR,
          wickDownColor: DOWN_COLOR,
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
          lastValueVisible: true,
          priceLineVisible: true,
          priceLineWidth: 1,
          priceLineColor: BORDER_COLOR,
          priceLineStyle: LineStyle.Solid,
        });
        console.log('Candlestick series added successfully');

        // If we already have data, set it immediately
        if (chartData.length > 0) {
          console.log(`Setting initial chart data with ${chartData.length} points`);
          const formattedData = chartData.map(item => ({
            ...item,
            time: Number(item.time) as Time
          }));
          candlestickSeriesRef.current.setData(formattedData);
          chartRef.current.timeScale().fitContent();
          console.log('Initial chart data set successfully');
        } else {
          console.log('No initial chart data available');
        }
        
        // Add crosshair move handler for OHLC info card
        chartRef.current.subscribeCrosshairMove((param: any) => {
          if (
            param === undefined || 
            param.point === undefined || 
            param.time === undefined || 
            param.point.x < 0 || 
            param.point.y < 0
          ) {
            // Hide card when cursor leaves the chart
            setShowOhlcCard(false);
            return;
          }
          
          // Get the candle data at the crosshair position
          const candle = param.seriesData.get(candlestickSeriesRef.current);
          if (candle) {
            const dateObj = new Date(param.time * 1000);
            const timeStr = dateObj.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });
            
            // Update OHLC data
            setOhlcData({
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
              time: timeStr
            });
            
            // Show the card
            setShowOhlcCard(true);
          } else {
            setShowOhlcCard(false);
          }
        });
      } catch (error) {
        console.error('Error creating chart:', error);
      }
    } else {
      console.log('Chart already exists, updating if needed');
      // Update existing chart with new data if available
      if (chartData.length > 0 && candlestickSeriesRef.current) {
        console.log(`Updating existing chart with ${chartData.length} data points`);
        const formattedData = chartData.map(item => ({
          ...item,
          time: Number(item.time) as Time
        }));
        candlestickSeriesRef.current.setData(formattedData);
        chartRef.current.timeScale().fitContent();
      }
    }

    // Handle resize immediately
    if (chartRef.current) {
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
      chartRef.current.timeScale().fitContent();
    }
  }, [chartData]);

  // Remove the regular useEffect for chart creation since we're using useLayoutEffect instead
  useEffect(() => {
    // Chart initialization - only once when component mounts
    return () => {
      // Clean up on component unmount
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
    };
  }, []);

  // Update chart data when chartData changes
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || chartData.length === 0) return;
    
    console.log(`Updating chart with ${chartData.length} data points`);

    // Update data
    const formattedData = chartData.map(item => ({
      ...item,
      time: Number(item.time) as Time
    }));

    candlestickSeriesRef.current.setData(formattedData);

    // Fit content to show all data
    chartRef.current.timeScale().fitContent();
  }, [chartData]);

  // Update price lines when LTP data changes
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current) return;

    // Update price lines for all symbols when LTP data is available
    if (ltpData) {
      // Remove existing price lines
      if (candlestickSeriesRef.current._priceLines) {
        candlestickSeriesRef.current._priceLines.forEach((line: PriceLine) => {
          candlestickSeriesRef.current.removePriceLine(line);
        });
      }
      candlestickSeriesRef.current._priceLines = [] as PriceLine[];

      // Define all price levels with their properties
      const priceLevels = [
        {
          price: ltpData.riskyResistance,
          color: '#FF5252',
          lineWidth: 2 as LineWidth,
          lineStyle: LineStyle.Solid,
          title: 'Risky R',
          axisLabelVisible: true,
        },
        {
          price: ltpData.moderateResistance,
          color: '#FF8A80',
          lineWidth: 1 as LineWidth,
          lineStyle: LineStyle.Dashed,
          title: 'Mod R',
          axisLabelVisible: true,
        },
        {
          price: ltpData.rMaxGain,
          color: '#4CAF50',
          lineWidth: 1 as LineWidth,
          lineStyle: LineStyle.Dotted,
          title: 'R Target',
          axisLabelVisible: true,
        },
        {
          price: ltpData.rMaxPain,
          color: '#FF9800',
          lineWidth: 1 as LineWidth,
          lineStyle: LineStyle.Dotted,
          title: 'R SL',
          axisLabelVisible: true,
        },
        {
          price: ltpData.riskySupport,
          color: '#4CAF50',
          lineWidth: 2 as LineWidth,
          lineStyle: LineStyle.Solid,
          title: 'Risky S',
          axisLabelVisible: true,
        },
        {
          price: ltpData.moderateSupport,
          color: '#81C784',
          lineWidth: 1 as LineWidth,
          lineStyle: LineStyle.Dashed,
          title: 'Mod S',
          axisLabelVisible: true,
        },
        {
          price: ltpData.sMaxGain,
          color: '#4CAF50',
          lineWidth: 1 as LineWidth,
          lineStyle: LineStyle.Dotted,
          title: 'S Target',
          axisLabelVisible: true,
        },
        {
          price: ltpData.sMaxPain,
          color: '#FF9800',
          lineWidth: 1 as LineWidth,
          lineStyle: LineStyle.Dotted,
          title: 'S SL',
          axisLabelVisible: true,
        }
      ];

      // Get all valid prices including candle data
      const allPrices = [...chartData.flatMap(candle => [
        Number(candle.high),
        Number(candle.low)
      ]), ...priceLevels
        .map(level => level.price)
        .filter(price => price && !isNaN(Number(price)))
      ].filter(price => !isNaN(price)) as number[];

      // Calculate the min and max prices
      if (allPrices.length > 0) {
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      
      // Calculate price range and padding
      const priceRange = maxPrice - minPrice;
      const padding = priceRange * 0.1; // 10% padding

      // Set the visible range with padding
      chartRef.current.applyOptions({
        rightPriceScale: {
          autoScale: false,
          scaleMargins: {
            top: 0.2,    // Increased top margin
            bottom: 0.2, // Increased bottom margin
          },
        },
      });

      // Apply the price range to the series
      candlestickSeriesRef.current.applyOptions({
        autoscaleInfoProvider: () => ({
          priceRange: {
            minValue: minPrice - padding,
            maxValue: maxPrice + padding,
          },
        }),
      });
      }

      // Create price lines
      priceLevels.forEach(level => {
        if (level.price && level.price !== null && !isNaN(Number(level.price))) {
          try {
            const priceLine = candlestickSeriesRef.current.createPriceLine({
              price: Number(level.price),
              color: level.color,
              lineWidth: level.lineWidth,
              lineStyle: level.lineStyle,
              axisLabelVisible: level.axisLabelVisible,
              title: `${level.title} (${formatPrice(level.price)})`,
            });

            // Store the price line reference
            if (!candlestickSeriesRef.current._priceLines) {
              candlestickSeriesRef.current._priceLines = [];
            }
            candlestickSeriesRef.current._priceLines.push(priceLine);
          } catch (error) {
            console.error(`Error creating price line for ${level.title}:`, error);
          }
        }
      });
    } else {
      // For symbols without LTP data, just ensure proper chart scaling
      const prices = chartData.flatMap(candle => [Number(candle.high), Number(candle.low)]);
      if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const padding = (maxPrice - minPrice) * 0.1;

      chartRef.current.applyOptions({
        rightPriceScale: {
          autoScale: false,
          scaleMargins: {
            top: 0.2,
            bottom: 0.2,
          },
        },
      });

      candlestickSeriesRef.current.applyOptions({
        autoscaleInfoProvider: () => ({
          priceRange: {
            minValue: minPrice - padding,
            maxValue: maxPrice + padding,
          },
        }),
      });
    }
    }
  }, [chartData, ltpData, symbol]);

  const handleSymbolClick = (newSymbol: string) => {
    // Set loading state before navigation
    setIsLoading(true);
    
    // Use window.location for full page refresh instead of router.push
    window.location.href = `/dashboard/analysis?symbol=${newSymbol}`;
  };

  // Handle smooth symbol transitions
  useEffect(() => {
    // Reset chart data when symbol changes
    setChartData([]);
    setLtpData(null);
    setCurrentPrice(null);
    previousPriceRef.current = null;
  }, [symbol]);

  // Add window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
        chartRef.current.timeScale().fitContent();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* Top Controls with Dropdown - make background transparent */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-transparent">
        {/* Symbol Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 bg-gray-800/50 text-white px-4 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
          >
            <div>
              <span className="font-medium">{popularSymbols.find(s => s.symbol === symbol)?.name || symbol}</span>
              <span className="text-sm text-gray-400 ml-2">{symbol}</span>
            </div>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-50 mt-2 w-80 rounded-lg bg-gray-900 border border-gray-800 shadow-xl">
              <div className="p-3">
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Search symbols..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800/50 text-white px-4 py-2.5 rounded-lg pr-10 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                    autoFocus
                  />
                  <Search className="absolute right-3 top-3 text-gray-400 h-5 w-5" />
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400 mb-2 px-1">
                  <span className="font-medium">
                    {searchQuery === '' ? 'Popular Symbols' : 'Search Results'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Live</span>
                  </div>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto py-2">
                {filteredSymbols.length > 0 ? (
                  filteredSymbols.map((item) => (
                    <button
                      key={item.symbol}
                      onClick={() => {
                        handleSymbolClick(item.symbol);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-800/50 ${
                        symbol === item.symbol ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs opacity-75">{item.symbol}</div>
                        </div>
                        {symbol === item.symbol && (
                          <CandlestickChart className="h-4 w-4 text-orange-400" />
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No symbols found. Try a different search.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current Price and Direction */}
        <div className="flex items-center space-x-4">
          {currentPrice && (
            <div className="text-xl font-bold text-white">
              {formatPrice(currentPrice)}
            </div>
          )}
          {ltpData?.direction && (
            <div className={`flex items-center gap-2 text-sm font-medium rounded-md px-3 py-1.5 ${
              ltpData.direction.includes('BULLISH') 
                ? 'bg-green-500/10 text-green-400'
                : ltpData.direction.includes('BEARISH')
                ? 'bg-red-500/10 text-red-400'
                : 'bg-yellow-500/10 text-yellow-400'
            }`}>
              {ltpData.direction.includes('BULLISH') ? (
                <TrendingUp className="h-4 w-4" />
              ) : ltpData.direction.includes('BEARISH') ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              <span>{ltpData.direction}</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 relative w-full bg-transparent">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-orange-500/20 border-t-orange-500"></div>
          </div>
        ) : (
          <>
            <div ref={chartContainerRef} className="w-full h-full absolute inset-0 bg-transparent"></div>
            
            {/* OHLC Info Card - simplified */}
            <div 
              className={`absolute top-4 right-4 z-50 bg-gray-900/90 border border-gray-700 rounded-md p-3 shadow-lg transition-all duration-200 ${
                showOhlcCard ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  <BarChart4 className="h-4 w-4 text-orange-400" />
                  OHLC Data
                </div>
                <div className="text-xs font-medium text-gray-400">{ohlcData?.time || ''}</div>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span className="text-gray-300 text-sm">Open:</span>
                  <span className="text-white font-medium text-sm ml-2">
                    {ohlcData ? formatPrice(ohlcData.open) : '-'}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-gray-300 text-sm">High:</span>
                  <span className="text-white font-medium text-sm ml-2">
                    {ohlcData ? formatPrice(ohlcData.high) : '-'}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-gray-300 text-sm">Low:</span>
                  <span className="text-white font-medium text-sm ml-2">
                    {ohlcData ? formatPrice(ohlcData.low) : '-'}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                  <span className="text-gray-300 text-sm">Close:</span>
                  <span className="text-white font-medium text-sm ml-2">
                    {ohlcData ? formatPrice(ohlcData.close) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 