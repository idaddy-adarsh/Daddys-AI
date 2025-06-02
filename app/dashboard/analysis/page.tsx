'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createChart, ColorType, Time, LineStyle, DeepPartial, ChartOptions, LineWidth } from 'lightweight-charts';
import { Search, TrendingUp, TrendingDown, Clock, Calendar, Volume2, CandlestickChart } from 'lucide-react';

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
  { name: 'NIFTY 50', symbol: '^NSEI' },
  { name: 'Bank NIFTY', symbol: '^NSEBANK' },
  { name: 'Reliance', symbol: 'RELIANCE.NS' },
  { name: 'TCS', symbol: 'TCS.NS' },
  { name: 'HDFC Bank', symbol: 'HDFCBANK.NS' },
  { name: 'Infosys', symbol: 'INFY.NS' },
];

const CHART_BACKGROUND = '#1a1a1a';
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
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>(timeIntervals[1]); // Default to 5M
  const searchParams = useSearchParams();
  const router = useRouter();
  const symbol = searchParams.get('symbol') || '^NSEI';

  const fetchLTPData = async () => {
    // Only fetch LTP data for NIFTY
    if (symbol !== '^NSEI') {
      setLtpData(null);
      return;
    }

    try {
      const response = await fetch(`/api/ltp-calculator?symbol=NIFTY`);
      
      if (!response.ok) {
        if (response.status !== 429) { // Ignore rate limit errors
          console.error(`Failed to fetch LTP data: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      setLtpData(data);
    } catch (error) {
      console.error('Error fetching LTP data:', error);
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

      // Update LTP data only for NIFTY
      if (symbol === '^NSEI' && (!ltpData || Date.now() - new Date(ltpData.fetchTime).getTime() > 10000)) {
        await fetchLTPData();
      }

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
        const marketResponse = await fetch(`/api/yahoo-finance/intraday?symbol=${symbol}&interval=${selectedInterval.value}&range=${selectedInterval.range}`);
        if (!marketResponse.ok) throw new Error('Failed to fetch data');
        const data = await marketResponse.json();
        
        // Get current candle boundaries
        const { currentStartTime } = getCandleBoundaries();
        
        // Filter and validate historical data
        const historicalData = data.filter((candle: ChartData) => {
          const candleTime = Number(candle.time);
          return candleTime < currentStartTime && candleTime % 300 === 0;
        });
        
        // Sort historical data by time
        const sortedData = historicalData.sort((a: ChartData, b: ChartData) => Number(a.time) - Number(b.time));
        
        setChartData(sortedData);
        
        // Initial LTP fetch only for NIFTY
        if (symbol === '^NSEI') {
          await fetchLTPData();
        } else {
          setLtpData(null);
        }
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
  }, [symbol, selectedInterval]);

  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

    // Only create chart if it doesn't exist
    if (!chartRef.current) {
      const chartOptions: DeepPartial<ChartOptions> = {
        layout: {
          background: { type: ColorType.Solid, color: CHART_BACKGROUND },
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
    }

    // Update data
    const formattedData = chartData.map(item => ({
      ...item,
      time: Number(item.time) as Time
    }));

    candlestickSeriesRef.current.setData(formattedData);

    // Update price lines only for NIFTY
    if (symbol === '^NSEI' && ltpData) {
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

      // Ensure the chart fits all data
      chartRef.current.timeScale().fitContent();
    } else {
      // For other symbols, just ensure proper chart scaling
      const prices = chartData.flatMap(candle => [Number(candle.high), Number(candle.low)]);
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

    // Handle resize
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
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
    };
  }, [chartData, ltpData, symbol]);

  const handleSymbolClick = (newSymbol: string) => {
    router.push(`/dashboard/analysis?symbol=${newSymbol}`);
  };

  const filteredSymbols = popularSymbols.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Symbol Navigation Sidebar */}
      <div className="w-72 flex-shrink-0 bg-[#1a1a1a] border-r border-gray-800 p-4">
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800/50 text-white px-4 py-2.5 rounded-lg pr-10 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
          />
          <Search className="absolute right-3 top-3 text-gray-400 h-5 w-5" />
        </div>

        <div className="flex items-center justify-between text-sm text-gray-400 mb-3 px-1">
          <span className="font-medium">Popular Symbols</span>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Live</span>
          </div>
        </div>
        
        <div className="space-y-2">
          {filteredSymbols.map((item) => (
            <button
              key={item.symbol}
              onClick={() => handleSymbolClick(item.symbol)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                symbol === item.symbol
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm opacity-75">{item.symbol}</div>
                </div>
                {symbol === item.symbol && (
                  <CandlestickChart className="h-5 w-5 text-white" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 bg-[#1a1a1a] relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-orange-500/20 border-t-orange-500"></div>
          </div>
        ) : (
          <>
            {/* Info Card */}
            <div className="absolute top-4 left-4 z-10 bg-gray-800/90 backdrop-blur rounded-lg border border-gray-700 shadow-lg p-4 space-y-2">
              {/* Symbol and Price */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {popularSymbols.find(s => s.symbol === symbol)?.name || symbol}
                  </h3>
                  <div className="text-sm text-gray-400">{symbol}</div>
                </div>
                {currentPrice && (
                  <div className="text-xl font-bold text-white">
                    {formatPrice(currentPrice)}
                  </div>
                )}
              </div>

              {/* Market Direction */}
              {ltpData?.direction && (
                <div className={`flex items-center gap-2 text-sm font-medium rounded-md px-3 py-1.5 ${
                  ltpData.direction === 'BULLISH' 
                    ? 'bg-green-500/10 text-green-400'
                    : ltpData.direction === 'BEARISH'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {ltpData.direction === 'BULLISH' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : ltpData.direction === 'BEARISH' ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                  <span>{ltpData.direction}</span>
                </div>
              )}
            </div>

            <div ref={chartContainerRef} className="w-full h-full" />
          </>
        )}
      </div>
    </div>
  );
} 