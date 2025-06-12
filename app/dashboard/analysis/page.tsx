'use client';

import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createChart, ColorType, Time, LineStyle, DeepPartial, ChartOptions, LineWidth } from 'lightweight-charts';
import { Search, TrendingUp, TrendingDown, Clock, Calendar, Volume2, CandlestickChart, ChevronDown, BarChart4, BarChart2, Settings, X } from 'lucide-react';
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

// Add interface for indicators
interface Indicator {
  id: string;
  name: string;
  enabled: boolean;
  type: 'ltp' | 'bollinger' | 'fibonacci' | 'ichimoku';
  color?: string;
  series?: any;
  params?: any;
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

// Add this helper function to ensure data is properly ordered by time with no duplicates
const ensureUniqueTimeOrdering = <T extends { time: Time }>(data: T[]): T[] => {
  // Create a map to store the latest value for each timestamp
  const timeMap = new Map<number, T>();
  
  // For each data point, keep only the latest one for each timestamp
  data.forEach(item => {
    const timeValue = typeof item.time === 'number' ? item.time : Number(item.time);
    timeMap.set(timeValue, item);
  });
  
  // Convert map back to array and sort by time
  return Array.from(timeMap.values())
    .sort((a, b) => {
      const timeA = typeof a.time === 'number' ? a.time : Number(a.time);
      const timeB = typeof b.time === 'number' ? b.time : Number(b.time);
      return timeA - timeB;
  });
};

// Add this helper function to smooth the data points for curves
const smoothData = <T extends { time: Time; value: number }>(data: T[], smoothingFactor = 5): T[] => {
  if (data.length <= smoothingFactor) return data;
  
  const result: T[] = [];
  
  // Keep first point
  result.push(data[0]);
  
  // Apply moving average to middle points
  for (let i = 1; i < data.length - 1; i++) {
    const windowStart = Math.max(0, i - smoothingFactor);
    const windowEnd = Math.min(data.length - 1, i + smoothingFactor);
    const windowPoints = data.slice(windowStart, windowEnd + 1);
    
    const sum = windowPoints.reduce((acc, point) => acc + point.value, 0);
    const average = sum / windowPoints.length;
    
    result.push({
      ...data[i],
      value: average
    });
  }
  
  // Keep last point
  result.push(data[data.length - 1]);
  
  return result;
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
  
  // Add state for indicators
  const [indicators, setIndicators] = useState<Indicator[]>([
    { id: 'ltp', name: 'LTP Lines', enabled: false, type: 'ltp' },
    { id: 'bollinger', name: 'Bollinger Bands', enabled: false, type: 'bollinger', params: { period: 20, stdDev: 2 } },
    { id: 'fibonacci', name: 'Fibonacci Retracement', enabled: false, type: 'fibonacci' },
    { id: 'ichimoku', name: 'Ichimoku Cloud', enabled: false, type: 'ichimoku' }
  ]);
  const [isIndicatorsMenuOpen, setIsIndicatorsMenuOpen] = useState(false);
  const indicatorsMenuRef = useRef<HTMLDivElement>(null);
  
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

  // Close indicators menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (indicatorsMenuRef.current && !indicatorsMenuRef.current.contains(event.target as Node)) {
        setIsIndicatorsMenuOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to toggle indicator with animation
  const toggleIndicator = (id: string) => {
    // Apply the animation effect
    const indicatorElement = document.getElementById(`indicator-${id}`);
    if (indicatorElement) {
      indicatorElement.classList.add('animate-toggle');
      setTimeout(() => {
        indicatorElement.classList.remove('animate-toggle');
      }, 500);
    }
    
    // Toggle the indicator state
    setIndicators(prev => prev.map(indicator => 
      indicator.id === id 
        ? { ...indicator, enabled: !indicator.enabled } 
        : indicator
    ));
  };

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
      
      const response = await fetch(`/api/ltp-calculator?symbol=${ltpSymbol}`);
      
      // Handle response errors
      if (!response.ok) {
        const status = response.status;
        
        // Don't log for rate limiting errors
        if (status !== 429) {
          try {
            // Try to parse error JSON if available
            const errorData = await response.json();
            
          } catch (parseError) {
            // If JSON parsing fails, get the error text
            const errorText = await response.text();
            
          }
        }
        
        // Don't throw error, just return to prevent UI disruption
        return;
      }

      // Parse successful response
      const data = await response.json();
      
      
      // Check if we have valid data
      if (!data || !data.riskyResistance) {
        
      }
      
      setLtpData(data);
    } catch (error) {
      // Log the complete error object for better debugging
      
      
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
      
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Import the isMarketOpen function
        const { isMarketOpen } = await import('../../utils/marketTime');
        
        // Check if market is closed
        const isMarketClosed = !isMarketOpen();
        
        // Determine the range parameter based on market status
        // If market is closed, use '5d' to get data from previous days
        const rangeParam = isMarketClosed ? '5d' : '1d';
        
        // Fetch historical 5-minute candles
        const marketResponse = await fetch(`/api/yahoo-finance/intraday?symbol=${symbol}&interval=5m&range=${rangeParam}`);
        if (!marketResponse.ok) throw new Error('Failed to fetch data');
        const data = await marketResponse.json();
        
        // Get current candle boundaries
        const { currentStartTime } = getCandleBoundaries();
        
        // Filter and validate historical data
        let historicalData = data;
        
        if (isMarketClosed && data.length > 0) {
          // When market is closed, find the most recent trading day's data
          // Group data by day
          const dataByDay = {};
          data.forEach(candle => {
            const date = new Date(Number(candle.time) * 1000);
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            if (!dataByDay[dateKey]) {
              dataByDay[dateKey] = [];
            }
            dataByDay[dateKey].push(candle);
          });
          
          // Find the most recent day with data
          const sortedDays = Object.keys(dataByDay).sort().reverse();
          if (sortedDays.length > 0) {
            // Use the most recent day's data
            historicalData = dataByDay[sortedDays[0]];
          }
        } else {
          // For open market, filter as before
          historicalData = data.filter((candle: ChartData) => {
            const candleTime = Number(candle.time);
            return candleTime < currentStartTime && candleTime % 300 === 0;
          });
        }
        
        // Sort historical data by time
        const sortedData = historicalData.sort((a: ChartData, b: ChartData) => Number(a.time) - Number(b.time));
        
        setChartData(sortedData);
        
        // Fetch LTP data for all symbols - ensure this happens for every symbol
        await fetchLTPData();
        
      } catch (error) {
        
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
    
    if (!chartContainerRef.current) {
      
      return;
    }

    // Create chart if it doesn't exist
    if (!chartRef.current) {
      
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
            const date = new Date(time * 1000);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
          },
          ticksVisible: true,
          shiftVisibleRangeOnNewBar: false
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
        

        // If we already have data, set it immediately
        if (chartData.length > 0) {
          
          const formattedData = chartData.map(item => ({
            ...item,
            time: Number(item.time) as Time
          }));
          candlestickSeriesRef.current.setData(formattedData);
          
          // Set visible range to show full trading day (9:15 AM to 3:30 PM)
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset to start of day
          
          const marketOpen = new Date(today);
          marketOpen.setHours(9, 15, 0, 0); // Market opens at 9:15 AM
          
          const marketClose = new Date(today);
          marketClose.setHours(15, 30, 0, 0); // Market closes at 3:30 PM
          
          // Always show the full trading day regardless of current time
          chartRef.current.timeScale().setVisibleRange({
            from: Math.floor(marketOpen.getTime() / 1000),
            to: Math.floor(marketClose.getTime() / 1000)
          });
          
          // Configure time scale to show regular interval labels
          chartRef.current.applyOptions({
            timeScale: {
              tickMarkFormatter: (time: number) => {
                const date = new Date(time * 1000);
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                return `${hours}:${minutes}`;
              },
              secondsVisible: false,
              borderVisible: true,
              fixLeftEdge: true,
              fixRightEdge: true,
              ticksVisible: true,
              uniformDistribution: true
            }
          });
          
          
        } else {
          
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
        
      }
    } else {
      
      // Update existing chart with new data if available
      if (chartData.length > 0 && candlestickSeriesRef.current) {
        
        const formattedData = chartData.map(item => ({
          ...item,
          time: Number(item.time) as Time
        }));
        candlestickSeriesRef.current.setData(formattedData);
        
        // Set visible range to show full trading day (9:15 AM to 3:30 PM)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to start of day
        
        const marketOpen = new Date(today);
        marketOpen.setHours(9, 15, 0, 0); // Market opens at 9:15 AM
        
        const marketClose = new Date(today);
        marketClose.setHours(15, 30, 0, 0); // Market closes at 3:30 PM
        
        // Always show the full trading day regardless of current time
        chartRef.current.timeScale().setVisibleRange({
          from: Math.floor(marketOpen.getTime() / 1000),
          to: Math.floor(marketClose.getTime() / 1000)
        });
        
        // Configure time scale to show regular interval labels
        chartRef.current.applyOptions({
          timeScale: {
            tickMarkFormatter: (time: number) => {
              const date = new Date(time * 1000);
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              return `${hours}:${minutes}`;
            },
            secondsVisible: false,
            borderVisible: true,
            fixLeftEdge: true,
            fixRightEdge: true,
            ticksVisible: true,
            uniformDistribution: true
          }
        });
      }
    }

    // Handle resize immediately
    if (chartRef.current) {
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
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
    
    

    // Update data
    const formattedData = chartData.map(item => ({
      ...item,
      time: Number(item.time) as Time
    }));

    // Ensure data is properly ordered with no duplicates
    candlestickSeriesRef.current.setData(ensureUniqueTimeOrdering(formattedData));

    // Set visible range to show full trading day (9:15 AM to 3:30 PM)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    const marketOpen = new Date(today);
    marketOpen.setHours(9, 15, 0, 0); // Market opens at 9:15 AM
    
    const marketClose = new Date(today);
    marketClose.setHours(15, 30, 0, 0); // Market closes at 3:30 PM
    
    // Always show the full trading day regardless of current time
    chartRef.current.timeScale().setVisibleRange({
      from: Math.floor(marketOpen.getTime() / 1000),
      to: Math.floor(marketClose.getTime() / 1000)
    });
  }, [chartData]);

  // Update price lines when LTP data and indicators change
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current) return;

      // Remove existing price lines
      if (candlestickSeriesRef.current._priceLines) {
        candlestickSeriesRef.current._priceLines.forEach((line: PriceLine) => {
          candlestickSeriesRef.current.removePriceLine(line);
        });
      }
      candlestickSeriesRef.current._priceLines = [] as PriceLine[];

    // Check if LTP indicator is enabled
    const ltpIndicator = indicators.find(ind => ind.id === 'ltp');
    if (!ltpIndicator?.enabled || !ltpData) return;

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
            
          }
        }
      });
  }, [chartData, ltpData, indicators]);

  // Apply indicators when chart data or indicators change
  useEffect(() => {
    applyIndicators();
  }, [chartData, indicators.map(i => i.enabled).join(',')]);

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
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Function to calculate moving average
  const calculateMA = (data: ChartData[], period: number): {time: Time, value: number}[] => {
    const result: {time: Time, value: number}[] = [];
    
    if (data.length < period) return result;
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, candle) => acc + candle.close, 0);
      const ma = sum / period;
      result.push({
        time: Number(data[i].time) as Time,
        value: ma
      });
    }
    
    return result;
  };

  // Function to calculate Bollinger Bands
  const calculateBollingerBands = (data: ChartData[], period: number, stdDev: number): {
    time: Time, 
    upper: number, 
    middle: number, 
    lower: number
  }[] => {
    const result: {time: Time, upper: number, middle: number, lower: number}[] = [];
    
    if (data.length < period) return result;
    
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const closes = slice.map(candle => candle.close);
      
      // Calculate MA (middle band)
      const ma = closes.reduce((sum, close) => sum + close, 0) / period;
      
      // Calculate standard deviation
      const squaredDiffs = closes.map(close => Math.pow(close - ma, 2));
      const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
      const sd = Math.sqrt(variance);
      
      result.push({
        time: Number(data[i].time) as Time,
        upper: ma + (sd * stdDev),
        middle: ma,
        lower: ma - (sd * stdDev)
      });
    }
    
    return result;
  };

  // Function to apply indicators
  const applyIndicators = () => {
    if (!chartRef.current || !candlestickSeriesRef.current || chartData.length === 0) return;
    
    // Clear existing indicator series
    indicators.forEach(indicator => {
      if (indicator.series) {
        if (Array.isArray(indicator.series)) {
          indicator.series.forEach(series => chartRef.current.removeSeries(series));
        } else {
          chartRef.current.removeSeries(indicator.series);
        }
        indicator.series = undefined;
      }
    });
    
    // Apply enabled indicators
    const updatedIndicators = [...indicators];
    
    updatedIndicators.forEach((indicator, index) => {
      if (!indicator.enabled) return;
      
      switch (indicator.type) {
        case 'ltp':
          // LTP lines are handled separately in the useEffect
          break;
          
        case 'bollinger':
          if (indicator.params?.period && indicator.params?.stdDev) {
            const bbData = calculateBollingerBands(chartData, indicator.params.period, indicator.params.stdDev);
            
            // Middle band - blue
            const middleSeries = chartRef.current.addLineSeries({
              color: '#2962FF', // Blue color
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: true,
              title: `BB Middle (${indicator.params.period})`,
            });
            const middleData = bbData.map(item => ({
              time: item.time,
              value: item.middle
            }));
            // Apply smoothing to the data
            const smoothedMiddleData = smoothData(middleData, 3);
            middleSeries.setData(ensureUniqueTimeOrdering(smoothedMiddleData));
            
            // Upper band - red
            const upperSeries = chartRef.current.addLineSeries({
              color: '#FF4560', // Red color
              lineWidth: 2,
              lineStyle: LineStyle.Solid,
              priceLineVisible: false,
              lastValueVisible: true,
              title: `BB Upper (${indicator.params.period}, ${indicator.params.stdDev})`,
            });
            const upperData = bbData.map(item => ({
              time: item.time,
              value: item.upper
            }));
            // Apply smoothing to the data
            const smoothedUpperData = smoothData(upperData, 3);
            upperSeries.setData(ensureUniqueTimeOrdering(smoothedUpperData));
            
            // Lower band - green
            const lowerSeries = chartRef.current.addLineSeries({
              color: '#00E396', // Green color
              lineWidth: 2,
              lineStyle: LineStyle.Solid,
              priceLineVisible: false,
              lastValueVisible: true,
              title: `BB Lower (${indicator.params.period}, ${indicator.params.stdDev})`,
            });
            const lowerData = bbData.map(item => ({
              time: item.time,
              value: item.lower
            }));
            // Apply smoothing to the data
            const smoothedLowerData = smoothData(lowerData, 3);
            lowerSeries.setData(ensureUniqueTimeOrdering(smoothedLowerData));
            
            // Store all series references
            updatedIndicators[index].series = [middleSeries, upperSeries, lowerSeries];
          }
          break;
          
        case 'fibonacci':
          // Calculate Fibonacci retracement levels
          if (chartData.length > 0) {
            // Find high and low in the visible data
            const highPrice = Math.max(...chartData.map(candle => candle.high));
            const lowPrice = Math.min(...chartData.map(candle => candle.low));
            const priceDiff = highPrice - lowPrice;
            
            // Fibonacci levels: 0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%
            const levels = [
              { level: 0, value: highPrice, color: '#FF5252' },
              { level: 0.236, value: highPrice - priceDiff * 0.236, color: '#FF9800' },
              { level: 0.382, value: highPrice - priceDiff * 0.382, color: '#FFC107' },
              { level: 0.5, value: highPrice - priceDiff * 0.5, color: '#FFEB3B' },
              { level: 0.618, value: highPrice - priceDiff * 0.618, color: '#8BC34A' },
              { level: 0.786, value: highPrice - priceDiff * 0.786, color: '#4CAF50' },
              { level: 1, value: lowPrice, color: '#2196F3' }
            ];
            
            const fibSeries = levels.map(level => {
              const series = chartRef.current.addLineSeries({
                color: level.color,
                lineWidth: 1,
                lineStyle: LineStyle.Dashed,
              priceLineVisible: false,
              lastValueVisible: true,
                title: `Fib ${level.level * 100}%`,
              });
              
              // Create a horizontal line across the chart
              if (chartData.length > 1) {
                const startTime = Number(chartData[0].time);
                const endTime = Number(chartData[chartData.length - 1].time);
                
                // Ensure the times are different to avoid duplicate time error
                if (startTime !== endTime) {
                  series.setData([
                    { time: startTime as Time, value: level.value },
                    { time: endTime as Time, value: level.value }
                  ]);
                } else {
                  // If times are the same, create a single point
                  series.setData([
                    { time: startTime as Time, value: level.value }
                  ]);
                }
              }
              
              return series;
            });
            
            updatedIndicators[index].series = fibSeries;
          }
          break;
          
        case 'ichimoku':
          // Calculate Ichimoku Cloud components
          const conversionPeriod = 9;
          const basePeriod = 26;
          const leadingSpanBPeriod = 52;
          const displacement = 26;
          
          if (chartData.length >= leadingSpanBPeriod) {
            // Calculate Tenkan-sen (Conversion Line): (highest high + lowest low) / 2 for conversionPeriod
            const tenkanSen = chartData.map((_, i) => {
              if (i < conversionPeriod - 1) return null;
              
              const periodData = chartData.slice(i - conversionPeriod + 1, i + 1);
              const highestHigh = Math.max(...periodData.map(d => d.high));
              const lowestLow = Math.min(...periodData.map(d => d.low));
              
              return {
                time: Number(chartData[i].time) as Time,
                value: (highestHigh + lowestLow) / 2
              };
            }).filter(item => item !== null);
            
            // Calculate Kijun-sen (Base Line): (highest high + lowest low) / 2 for basePeriod
            const kijunSen = chartData.map((_, i) => {
              if (i < basePeriod - 1) return null;
              
              const periodData = chartData.slice(i - basePeriod + 1, i + 1);
              const highestHigh = Math.max(...periodData.map(d => d.high));
              const lowestLow = Math.min(...periodData.map(d => d.low));
              
              return {
                time: Number(chartData[i].time) as Time,
                value: (highestHigh + lowestLow) / 2
              };
            }).filter(item => item !== null);
            
            // Calculate Senkou Span A (Leading Span A): (Tenkan-sen + Kijun-sen) / 2, displaced forward
            const senkouSpanA = [];
            for (let i = 0; i < chartData.length; i++) {
              if (i < basePeriod - 1) continue;
            
              const tenkanIndex = i - (basePeriod - conversionPeriod);
              if (tenkanIndex < 0) continue;
              
              const tenkan = (Math.max(...chartData.slice(tenkanIndex - conversionPeriod + 1, tenkanIndex + 1).map(d => d.high)) +
                              Math.min(...chartData.slice(tenkanIndex - conversionPeriod + 1, tenkanIndex + 1).map(d => d.low))) / 2;
              
              const kijun = (Math.max(...chartData.slice(i - basePeriod + 1, i + 1).map(d => d.high)) +
                            Math.min(...chartData.slice(i - basePeriod + 1, i + 1).map(d => d.low))) / 2;
              
              // Displace forward
              const displaceTime = i + displacement < chartData.length 
                ? Number(chartData[i + displacement].time) as Time
                : Number(chartData[chartData.length - 1].time) as Time;
              
              senkouSpanA.push({
                time: displaceTime,
                value: (tenkan + kijun) / 2
              });
            }
            
            // Calculate Senkou Span B (Leading Span B): (highest high + lowest low) / 2 for leadingSpanBPeriod, displaced forward
            const senkouSpanB = [];
            for (let i = 0; i < chartData.length; i++) {
              if (i < leadingSpanBPeriod - 1) continue;
              
              const periodData = chartData.slice(i - leadingSpanBPeriod + 1, i + 1);
              const highestHigh = Math.max(...periodData.map(d => d.high));
              const lowestLow = Math.min(...periodData.map(d => d.low));
              
              // Displace forward
              const displaceTime = i + displacement < chartData.length 
                ? Number(chartData[i + displacement].time) as Time
                : Number(chartData[chartData.length - 1].time) as Time;
              
              senkouSpanB.push({
                time: displaceTime,
                value: (highestHigh + lowestLow) / 2
              });
            }
            
            // Calculate Chikou Span (Lagging Span): Current closing price, displaced backwards
            const chikouSpan = [];
            for (let i = displacement; i < chartData.length; i++) {
              chikouSpan.push({
                time: Number(chartData[i - displacement].time) as Time,
                value: chartData[i].close
              });
            }
            
            // Create series for each component
            const tenkanSeries = chartRef.current.addLineSeries({
              color: '#FF5252',
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: true,
              title: 'Tenkan-sen (9)',
            });
            tenkanSeries.setData(ensureUniqueTimeOrdering(tenkanSen));
            
            const kijunSeries = chartRef.current.addLineSeries({
              color: '#2196F3',
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: true,
              title: 'Kijun-sen (26)',
            });
            kijunSeries.setData(ensureUniqueTimeOrdering(kijunSen));
            
            const senkouSpanASeries = chartRef.current.addLineSeries({
              color: 'rgba(76, 175, 80, 0.5)',
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: true,
              title: 'Senkou Span A',
            });
            senkouSpanASeries.setData(ensureUniqueTimeOrdering(senkouSpanA));
            
            const senkouSpanBSeries = chartRef.current.addLineSeries({
              color: 'rgba(255, 82, 82, 0.5)',
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: true,
              title: 'Senkou Span B',
            });
            senkouSpanBSeries.setData(ensureUniqueTimeOrdering(senkouSpanB));
            
            const chikouSeries = chartRef.current.addLineSeries({
              color: '#9C27B0',
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: true,
              title: 'Chikou Span',
            });
            chikouSeries.setData(ensureUniqueTimeOrdering(chikouSpan));
            
            // Create cloud area between Senkou Span A and B
            // This is a simplified approach - ideally we would use an area series
            // but we'll approximate with lines for now
            
            updatedIndicators[index].series = [
              tenkanSeries, 
              kijunSeries, 
              senkouSpanASeries, 
              senkouSpanBSeries, 
              chikouSeries
            ];
          }
          break;
      }
    });
    
    setIndicators(updatedIndicators);
  };

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

        {/* Current Price, Direction, and Indicators Button */}
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
          
          {/* Indicators Button */}
          <div className="relative" ref={indicatorsMenuRef}>
            <button
              onClick={() => setIsIndicatorsMenuOpen(!isIndicatorsMenuOpen)}
              className={`flex items-center space-x-2 bg-gray-800/50 text-white px-3 py-2 rounded-lg border ${
                indicators.some(ind => ind.enabled) 
                  ? 'border-orange-500 animate-pulse-orange' 
                  : 'border-gray-700'
              } focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-300`}
            >
              <BarChart2 className={`h-5 w-5 ${
                indicators.some(ind => ind.enabled) ? 'text-orange-400' : 'text-gray-400'
              }`} />
              <span>Indicators</span>
              {indicators.some(ind => ind.enabled) && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
              )}
            </button>
            
            {isIndicatorsMenuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg bg-gray-900 border border-gray-800 shadow-xl animate-slideIn origin-top-right">
                <div className="p-3 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white">Indicators</h3>
                    <button 
                      onClick={() => setIsIndicatorsMenuOpen(false)}
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="py-2">{indicators.map((indicator, index) => (
                  <div 
                    key={indicator.id}
                    id={`indicator-${indicator.id}`}
                    className={`flex items-center justify-between px-4 py-2 hover:bg-gray-800/50 transition-all duration-300 ${
                      indicator.enabled ? 'bg-gray-800/30 border-l-2 border-orange-500' : ''
                    }`}
                  >
                    <span className={`text-gray-300 transition-all duration-300 ${
                      indicator.enabled ? 'text-white font-medium' : ''
                    }`}>{indicator.name}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={indicator.enabled}
                        onChange={() => toggleIndicator(indicator.id)}
                      />
                      <div className="relative w-11 h-6 bg-gray-300 rounded-full transition-colors duration-300">
                        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ease-in-out ${indicator.enabled ? 'translate-x-5' : 'translate-x-0'}`}></span>
                      </div>
                    </label>
                  </div>
                ))}</div>
              </div>
            )}
          </div>
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