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
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price).replace('₹', '₹ ');
};

export default function AnalysisPage() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [ltpData, setLtpData] = useState<LTPData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterval, setSelectedInterval] = useState<TimeInterval>(timeIntervals[1]); // Default to 5M
  const searchParams = useSearchParams();
  const router = useRouter();
  const symbol = searchParams.get('symbol') || '^NSEI';

  const fetchLTPData = async () => {
    try {
      const ltpSymbol = symbol === '^NSEI' ? 'NIFTY' : 
                       symbol === '^NSEBANK' ? 'BANKNIFTY' :
                       symbol.replace('.NS', '');
      
      const response = await fetch(`/api/ltp-calculator?symbol=${ltpSymbol}`);
      if (!response.ok) throw new Error('Failed to fetch LTP data');
      const data = await response.json();
      setLtpData(data);
    } catch (error) {
      console.error('Error fetching LTP data:', error);
      setLtpData(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [marketResponse] = await Promise.all([
          fetch(`/api/yahoo-finance/intraday?symbol=${symbol}&interval=${selectedInterval.value}&range=${selectedInterval.range}`),
          fetchLTPData()
        ]);
        
        if (!marketResponse.ok) throw new Error('Failed to fetch data');
        const data = await marketResponse.json();
        setChartData(data);
      } catch (error) {
        console.error('Error fetching market data:', error);
        setChartData([]);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [symbol, selectedInterval, fetchLTPData]);

  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

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
      },
      localization: {
        timeFormatter: (time: number) => {
          const date = new Date(Number(time) * 1000);
          return selectedInterval.value === '1d' 
            ? date.toLocaleDateString()
            : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },
        priceFormatter: (price: number) => {
          if (price >= 10000) {
            return `₹${(price / 1000).toFixed(1)}K`;
          }
          return `₹${price.toFixed(2)}`;
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

    const chart = createChart(chartContainerRef.current, chartOptions);

    try {
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: UP_COLOR,
        downColor: DOWN_COLOR,
        borderVisible: false,
        wickUpColor: UP_COLOR,
        wickDownColor: DOWN_COLOR,
        priceFormat: {
          type: 'custom',
          minMove: 0.01,
          formatter: (price: number) => {
            if (price >= 10000) {
              return `₹${(price / 1000).toFixed(1)}K`;
            }
            return `₹${price.toFixed(2)}`;
          },
        },
        lastValueVisible: true,
        priceLineVisible: true,
        priceLineWidth: 1,
        priceLineColor: BORDER_COLOR,
        priceLineStyle: LineStyle.Solid,
      });

      // Convert ISO strings to timestamps for the chart
      const formattedData: FormattedChartData[] = chartData.map(item => ({
        ...item,
        time: Number(item.time) as Time
      }));

      candlestickSeries.setData(formattedData);

      // Create price lines for support and resistance levels
      if (ltpData) {
        const priceLevels = [
          {
            price: ltpData.riskyResistance,
            color: '#FF5252',
            lineWidth: 2 as LineWidth,
            lineStyle: LineStyle.Solid,
            title: 'Risky R'
          },
          {
            price: ltpData.moderateResistance,
            color: '#FF8A80',
            lineWidth: 1 as LineWidth,
            lineStyle: LineStyle.Dashed,
            title: 'Mod R'
          },
          {
            price: ltpData.rMaxGain,
            color: '#E040FB',
            lineWidth: 1 as LineWidth,
            lineStyle: LineStyle.Dotted,
            title: 'R Target'
          },
          {
            price: ltpData.rMaxPain,
            color: '#FFB74D',
            lineWidth: 1 as LineWidth,
            lineStyle: LineStyle.Dotted,
            title: 'R SL'
          },
          {
            price: ltpData.riskySupport,
            color: '#4CAF50',
            lineWidth: 2 as LineWidth,
            lineStyle: LineStyle.Solid,
            title: 'Risky S'
          },
          {
            price: ltpData.moderateSupport,
            color: '#81C784',
            lineWidth: 1 as LineWidth,
            lineStyle: LineStyle.Dashed,
            title: 'Mod S'
          },
          {
            price: ltpData.sMaxGain,
            color: '#E040FB',
            lineWidth: 1 as LineWidth,
            lineStyle: LineStyle.Dotted,
            title: 'S Target'
          },
          {
            price: ltpData.sMaxPain,
            color: '#FFB74D',
            lineWidth: 1 as LineWidth,
            lineStyle: LineStyle.Dotted,
            title: 'S SL'
          }
        ];

        // Only create lines for valid price levels
        priceLevels.forEach(level => {
          if (level.price && level.price !== null && !isNaN(Number(level.price))) {
            candlestickSeries.createPriceLine({
              price: Number(level.price),
              color: level.color,
              lineWidth: level.lineWidth,
              lineStyle: level.lineStyle,
              axisLabelVisible: true,
              title: level.title,
            });
          }
        });
      }

      // Add symbol info and stats container
      const statsContainer = document.createElement('div');
      statsContainer.className = 'absolute top-4 left-4 space-y-2 z-10';
      
      // Symbol info
      const symbolInfo = document.createElement('div');
      symbolInfo.className = 'bg-gray-800/90 backdrop-blur px-4 py-2 rounded-lg border border-gray-700';
      
      const symbolName = document.createElement('div');
      symbolName.className = 'text-lg font-semibold text-white';
      symbolName.textContent = symbol;
      
      const symbolStats = document.createElement('div');
      symbolStats.className = 'flex items-center space-x-4 mt-1 text-sm';
      
      const lastPrice = formattedData[formattedData.length - 1];
      const prevPrice = formattedData[formattedData.length - 2];
      const priceChange = lastPrice.close - prevPrice.close;
      const priceChangePercent = (priceChange / prevPrice.close) * 100;
      
      symbolStats.innerHTML = `
        <span class="text-gray-300">${formatPrice(lastPrice.close)}</span>
        <span class="${priceChange >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center">
          ${priceChange >= 0 ? '▲' : '▼'} ${formatPrice(Math.abs(priceChange)).replace('₹ ', '')} (${Math.abs(priceChangePercent).toFixed(2)}%)
        </span>
      `;

      // Add market direction if available
      if (ltpData && ltpData.direction) {
        const directionDiv = document.createElement('div');
        directionDiv.className = `text-sm mt-2 ${
          ltpData.direction === 'BULLISH' ? 'text-green-400' :
          ltpData.direction === 'BEARISH' ? 'text-red-400' :
          'text-yellow-400'
        }`;
        directionDiv.textContent = ltpData.direction;
        symbolStats.appendChild(directionDiv);
      }

      symbolInfo.appendChild(symbolName);
      symbolInfo.appendChild(symbolStats);
      statsContainer.appendChild(symbolInfo);

      // Add time intervals
      const intervals = document.createElement('div');
      intervals.className = 'flex bg-gray-800/90 backdrop-blur rounded-lg border border-gray-700 p-1';
      
      timeIntervals.forEach(interval => {
        const button = document.createElement('button');
        button.className = `px-3 py-1 rounded text-sm font-medium transition-colors ${
          selectedInterval.value === interval.value 
            ? 'bg-orange-500 text-white' 
            : 'text-gray-400 hover:text-white'
        }`;
        button.textContent = interval.label;
        button.onclick = () => setSelectedInterval(interval);
        intervals.appendChild(button);
      });
      
      statsContainer.appendChild(intervals);
      chartContainerRef.current.appendChild(statsContainer);

      // Create crosshair info container
      const crosshairInfo = document.createElement('div');
      crosshairInfo.className = 'hidden absolute top-4 right-4 bg-gray-800/90 backdrop-blur px-4 py-2 rounded-lg border border-gray-700 z-10';
      chartContainerRef.current.appendChild(crosshairInfo);

      // Subscribe to crosshair move
      chart.subscribeCrosshairMove(param => {
        if (
          param.point === undefined ||
          !param.time ||
          param.point.x < 0 ||
          param.point.y < 0
        ) {
          crosshairInfo.style.display = 'none';
          return;
        }

        const data = param.seriesData.get(candlestickSeries) as FormattedChartData;
        if (!data) {
          crosshairInfo.style.display = 'none';
          return;
        }

        crosshairInfo.style.display = 'block';
        const date = new Date(Number(data.time) * 1000);
        const color = data.close >= data.open ? UP_COLOR : DOWN_COLOR;
        
        crosshairInfo.innerHTML = `
          <div class="text-sm font-medium text-white mb-1">
            ${selectedInterval.value === '1d' 
              ? date.toLocaleDateString() 
              : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div class="text-gray-400">Open</div>
            <div class="text-right" style="color: ${color}">${formatPrice(data.open)}</div>
            <div class="text-gray-400">High</div>
            <div class="text-right text-green-400">${formatPrice(data.high)}</div>
            <div class="text-gray-400">Low</div>
            <div class="text-right text-red-400">${formatPrice(data.low)}</div>
            <div class="text-gray-400">Close</div>
            <div class="text-right" style="color: ${color}">${formatPrice(data.close)}</div>
          </div>
        `;
      });

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
        if (chartContainerRef.current?.contains(statsContainer)) {
          chartContainerRef.current.removeChild(statsContainer);
        }
        if (chartContainerRef.current?.contains(crosshairInfo)) {
          chartContainerRef.current.removeChild(crosshairInfo);
        }
      };
    } catch (error) {
      console.error('Error creating chart:', error);
      return () => {};
    }
  }, [chartData, selectedInterval, ltpData]);

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
          <div ref={chartContainerRef} className="w-full h-full" />
        )}
      </div>
    </div>
  );
} 