import { NextResponse } from 'next/server';

interface QuoteData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

async function fetchIntradayData(symbol: string, interval: string = '5m', range: string = '1d') {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch data from Yahoo Finance');
    }

    const data = await response.json();
    
    if (!data.chart.result?.[0]) {
      throw new Error('Invalid data format from Yahoo Finance');
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    
    // Transform data into the format we need
    return timestamps.map((time: number, index: number) => {
      const timestamp = Number(new Date(time * 1000)) / 1000;
      return {
        time: timestamp,
        open: quotes.open[index],
        high: quotes.high[index],
        low: quotes.low[index],
        close: quotes.close[index],
      };
    }).filter((item: QuoteData) => 
      // Filter out any entries with null/undefined values
      item.open != null && 
      item.high != null && 
      item.low != null && 
      item.close != null
    );
  } catch (error) {
    
    throw new Error('Failed to fetch or process intraday data');
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval') || '5m';
  const range = searchParams.get('range') || '1d';

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  // Validate interval and range combinations
  const validIntervals = ['1m', '2m', '5m', '15m', '30m', '60m', '1h', '1d'];
  const validRanges = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'];

  if (!validIntervals.includes(interval)) {
    return NextResponse.json(
      { error: 'Invalid interval' },
      { status: 400 }
    );
  }

  if (!validRanges.includes(range)) {
    return NextResponse.json(
      { error: 'Invalid range' },
      { status: 400 }
    );
  }

  try {
    const data = await fetchIntradayData(symbol, interval, range);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch intraday data' },
      { status: 500 }
    );
  }
} 