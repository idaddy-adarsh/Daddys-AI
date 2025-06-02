import { NextResponse } from 'next/server';

const LTP_USERNAME = "classesdaddys@gmail.com";
const LTP_PASSWORD = "Schools@12345";

// Rate limiting variables
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const expiry = searchParams.get('expiry') || "05-06-2025"; // Default expiry
  const lotSize = searchParams.get('lotSize') || "75"; // Default lot size

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  // Implement rate limiting
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      { status: 429 }
    );
  }
  lastRequestTime = now;

  const url = `https://login.ltpcalculator.com/optionChain/fetch-data?symbol=${symbol}&expiry=${expiry}&lotSize=${lotSize}`;

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
        throw new Error(`HTTP error! status: ${retryResponse.status}`);
      }
      
      const data = await retryResponse.json();
      return formatResponse(data);
    }

    if (!response.ok) {
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
        retryAfter: 5 // Suggest retry after 5 seconds
      },
      { status: 500 }
    );
  }
}

// Helper function to format the response
function formatResponse(data: any) {
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
} 