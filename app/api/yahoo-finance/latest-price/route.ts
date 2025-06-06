import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    // Get the latest quote
    const quote = await yahooFinance.quote(symbol);
    
    // Get current timestamp in seconds
    const currentTime = Math.floor(Date.now() / 1000);

    return NextResponse.json({
      time: currentTime.toString(),
      price: quote.regularMarketPrice,
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to fetch latest price' }, { status: 500 });
  }
} 