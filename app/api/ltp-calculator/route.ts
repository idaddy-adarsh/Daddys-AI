import { NextResponse } from 'next/server';

const LTP_USERNAME = "classesdaddys@gmail.com";
const LTP_PASSWORD = "Schools@12345";

// Rate limiting variables
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

// Default values for different symbols
const DEFAULT_CONFIG = {
  'NIFTY': {
    expiry: "05-06-2025",
    lotSize: "75"
  },
  'BANKNIFTY': {
    expiry: "", // Empty string as placeholder
    lotSize: "30"
  }
};

// Symbol mapping - LTP Calculator may use different symbol names
const SYMBOL_MAPPING = {
  'BANKNIFTY': 'BANKNIFTY',
  'NIFTY': 'NIFTY'
};

// Function to get the last Thursday of the current month
function getLastThursdayOfMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  
  // Move to the next month and then find the last Thursday of the current month
  const lastDay = new Date(year, month + 1, 0);
  
  // Find the last Thursday (4 = Thursday in JS Date)
  while (lastDay.getDay() !== 4) {
    lastDay.setDate(lastDay.getDate() - 1);
  }
  
  // Format as DD-MM-YYYY
  const day = String(lastDay.getDate()).padStart(2, '0');
  const monthStr = String(lastDay.getMonth() + 1).padStart(2, '0');
  const yearStr = lastDay.getFullYear();
  
  return `${day}-${monthStr}-${yearStr}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }
  
  // Get default config for the symbol or use NIFTY defaults
  const symbolConfig = DEFAULT_CONFIG[symbol as keyof typeof DEFAULT_CONFIG] || DEFAULT_CONFIG.NIFTY;
  
  // Get parameters with fallbacks to default config
  let expiry = searchParams.get('expiry');
  
  // For BANKNIFTY, if no expiry is specified, use the last Thursday of the month
  if (symbol === 'BANKNIFTY' && !expiry) {
    expiry = getLastThursdayOfMonth();
  } else {
    // Use the provided expiry or default from config
    expiry = expiry || symbolConfig.expiry;
  }
  
  const lotSize = searchParams.get('lotSize') || symbolConfig.lotSize;
  
  // Map the symbol to the correct format for LTP Calculator
  const mappedSymbol = SYMBOL_MAPPING[symbol as keyof typeof SYMBOL_MAPPING] || symbol;

  // Implement rate limiting
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      { status: 429 }
    );
  }
  lastRequestTime = now;

  const url = `https://login.ltpcalculator.com/optionChain/fetch-data?symbol=${mappedSymbol}&expiry=${expiry}&lotSize=${lotSize}`;
  console.log(`Fetching LTP data for: ${url}`);

  try {
    const headers = new Headers();
    headers.set(
      "Authorization",
      "Basic " + Buffer.from(`${LTP_USERNAME}:${LTP_PASSWORD}`).toString('base64')
    );

    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (response.status === 429) {
      // If we hit the rate limit, wait and retry once
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      const retryResponse = await fetch(url, {
        method: "GET",
        headers: headers,
      });
      
      if (!retryResponse.ok) {
        const errorText = await retryResponse.text();
        console.error(`LTP API error (${retryResponse.status}): ${errorText}`);
        throw new Error(`HTTP error! status: ${retryResponse.status}`);
      }
      
      const data = await retryResponse.json();
      return formatResponse(data);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`LTP API error (${response.status}): ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return formatResponse(data);

  } catch (error) {
    console.error("Error fetching LTP Calculator data:", error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch LTP Calculator data',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryAfter: 5, // Suggest retry after 5 seconds
        symbol: symbol,
        mappedSymbol: mappedSymbol,
        url: url
      },
      { status: 500 }
    );
  }
}

// Helper function to format the response
function formatResponse(data: any) {
  try {
    // Check if the expected data structure exists
    if (!data.symbolMarketDirection || !data.symbolMarketDirection.reversalModel) {
      console.error('Invalid response structure:', data);
      return NextResponse.json({
        error: 'Invalid response structure from LTP Calculator API'
      }, { status: 500 });
    }
    
    const result = {
      fetchTime: data.symbolMarketDirection.actualFetchTime,
      direction: data.symbolMarketDirection.marketDirection,
      riskyResistance: data.symbolMarketDirection.reversalModel.riskyResistance,
      riskySupport: data.symbolMarketDirection.reversalModel.riskySupport,
      moderateResistance: data.symbolMarketDirection.reversalModel.moderateResistance,
      moderateSupport: data.symbolMarketDirection.reversalModel.moderateSupport,
      rMaxGain: data.symbolMarketDirection.reversalModel.resistanceTarget,
      sMaxGain: data.symbolMarketDirection.reversalModel.supportTarget,
      rMaxPain: data.symbolMarketDirection.reversalModel.resistanceSL,
      sMaxPain: data.symbolMarketDirection.reversalModel.supportSL,
      scenario: data.symbolMarketDirection.reversalModel.scenario,
    };
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error formatting response:', error);
    return NextResponse.json({
      error: 'Error formatting LTP Calculator response',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 