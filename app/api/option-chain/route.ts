import { NextResponse } from 'next/server';
import type { OptionChainResponse } from '@/app/types/optionChain';

// Fallback simulation functions in case the API call fails
let lastSpotPrice: number | null = null;
let lastUpdateTime: number = Date.now();
let volatility = 0.15; // 15% annualized volatility

function getSimulatedSpotPrice(basePrice: number): number {
  if (!lastSpotPrice) {
    lastSpotPrice = basePrice;
    return basePrice;
  }

  const timeDiff = (Date.now() - lastUpdateTime) / (1000 * 60 * 60 * 24 * 365); // Convert to years
  const drift = 0.05; // 5% annual drift
  const randomWalk = Math.random() - 0.5;
  
  // Using geometric Brownian motion
  const deltaPrice = lastSpotPrice * (
    (drift - 0.5 * volatility * volatility) * timeDiff + 
    volatility * Math.sqrt(timeDiff) * randomWalk
  );

  lastSpotPrice = Math.max(lastSpotPrice + deltaPrice, basePrice * 0.9);
  lastUpdateTime = Date.now();
  
  return lastSpotPrice;
}

function calculateOptionPrices(spotPrice: number, strikePrice: number, daysToExpiry: number) {
  const r = 0.05; // Risk-free rate
  const t = daysToExpiry / 365; // Time to expiry in years
  
  // Black-Scholes approximation for testing
  const d1 = (Math.log(spotPrice / strikePrice) + (r + volatility * volatility / 2) * t) / (volatility * Math.sqrt(t));
  const d2 = d1 - volatility * Math.sqrt(t);
  
  const callPrice = spotPrice * Math.exp(-r * t) * Math.max(0, d1) - strikePrice * Math.exp(-r * t) * Math.max(0, d2);
  const putPrice = strikePrice * Math.exp(-r * t) * Math.max(0, -d2) - spotPrice * Math.exp(-r * t) * Math.max(0, -d1);
  
  // Calculate basic Greeks
  const delta = {
    call: Math.exp(-r * t) * Math.max(0, d1),
    put: -Math.exp(-r * t) * Math.max(0, -d1)
  };
  
  const gamma = Math.exp(-r * t) * Math.exp(-d1 * d1 / 2) / (spotPrice * volatility * Math.sqrt(2 * Math.PI * t));
  
  const theta = {
    call: -spotPrice * volatility * Math.exp(-d1 * d1 / 2) / (2 * Math.sqrt(2 * Math.PI * t)) - r * strikePrice * Math.exp(-r * t) * Math.max(0, d2),
    put: -spotPrice * volatility * Math.exp(-d1 * d1 / 2) / (2 * Math.sqrt(2 * Math.PI * t)) + r * strikePrice * Math.exp(-r * t) * Math.max(0, -d2)
  };
  
  const vega = spotPrice * Math.sqrt(t) * Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI);

  return {
    call: {
      price: Math.max(0.05, callPrice),
      delta: delta.call,
      gamma,
      theta: theta.call,
      vega,
      iv: volatility * 100
    },
    put: {
      price: Math.max(0.05, putPrice),
      delta: delta.put,
      gamma,
      theta: theta.put,
      vega,
      iv: volatility * 100
    }
  };
}

function generateMockData(instrumentKey: string, expiryDate: string): OptionChainResponse {
  // Base spot price based on instrument
  const baseSpotPrice = instrumentKey.includes('Nifty') ? 22000 : 18000;
  const spotPrice = getSimulatedSpotPrice(baseSpotPrice);
  
  // Calculate days to expiry
  const daysToExpiry = Math.max(1, Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  
  return {
    status: "success",
    data: Array.from({ length: 11 }, (_, i) => {
      const baseStrike = Math.round(spotPrice / 50) * 50;
      const strike = baseStrike + ((i - 5) * 50);
      const options = calculateOptionPrices(spotPrice, strike, daysToExpiry);
      
      // Simulate volume and OI with some randomness but maintain consistency
      const baseVolume = Math.floor(Math.random() * 1000000);
      const baseOI = Math.floor(Math.random() * 100000);
      
      return {
        expiry: expiryDate,
        pcr: Math.random() * 2 + 0.5, // PCR between 0.5 and 2.5
        strike_price: strike,
        underlying_key: instrumentKey,
        underlying_spot_price: spotPrice,
        call_options: {
          instrument_key: `NSE_FO|${50000 + i}`,
          market_data: {
            ltp: options.call.price,
            volume: baseVolume,
            oi: baseOI,
            close_price: options.call.price * (1 + (Math.random() - 0.5) * 0.01),
            bid_price: options.call.price * 0.99,
            bid_qty: Math.floor(Math.random() * 1000),
            ask_price: options.call.price * 1.01,
            ask_qty: Math.floor(Math.random() * 1000),
            prev_oi: baseOI * (1 + (Math.random() - 0.5) * 0.1)
          },
          option_greeks: {
            vega: options.call.vega,
            theta: options.call.theta,
            gamma: options.call.gamma,
            delta: options.call.delta,
            iv: options.call.iv,
            pop: Math.max(0, Math.min(100, 50 + (strike - spotPrice) / 10))
          }
        },
        put_options: {
          instrument_key: `NSE_FO|${51000 + i}`,
          market_data: {
            ltp: options.put.price,
            volume: baseVolume * 0.8,
            oi: baseOI * 0.8,
            close_price: options.put.price * (1 + (Math.random() - 0.5) * 0.01),
            bid_price: options.put.price * 0.99,
            bid_qty: Math.floor(Math.random() * 1000),
            ask_price: options.put.price * 1.01,
            ask_qty: Math.floor(Math.random() * 1000),
            prev_oi: baseOI * 0.8 * (1 + (Math.random() - 0.5) * 0.1)
          },
          option_greeks: {
            vega: options.put.vega,
            theta: options.put.theta,
            gamma: options.put.gamma,
            delta: options.put.delta,
            iv: options.put.iv,
            pop: Math.max(0, Math.min(100, 50 - (strike - spotPrice) / 10))
          }
        }
      };
    })
  };
}

// Function to transform Upstox data to our format
function transformUpstoxData(upstoxData: any): OptionChainResponse {
  try {
    const { strategyChainData, assetKey, expiry } = upstoxData.data;
    const { strikeMap } = strategyChainData;
    
    // Extract spot price from the first entry (assuming it's consistent)
    let spotPrice = 22000; // Default fallback
    const firstStrike = Object.values(strikeMap)[0] as any;
    if (firstStrike?.callOptionData?.marketData) {
      // Try to infer spot price from option prices and strikes
      const strikes = Object.keys(strikeMap).map(Number);
      spotPrice = strikes.reduce((acc, strike) => acc + strike, 0) / strikes.length;
    }
    
    const data = Object.entries(strikeMap).map(([strikePrice, strikeData]: [string, any]) => {
      const strike = parseFloat(strikePrice);
      const { callOptionData, putOptionData, pcr } = strikeData;
      
      return {
        expiry,
        pcr: pcr || 1.0,
        strike_price: strike,
        underlying_key: assetKey,
        underlying_spot_price: spotPrice,
        call_options: {
          instrument_key: callOptionData.instrumentKey,
          market_data: {
            ltp: callOptionData.marketData.ltp,
            volume: callOptionData.marketData.volume,
            oi: callOptionData.marketData.oi,
            close_price: callOptionData.marketData.cp,
            bid_price: callOptionData.marketData.bidPrice,
            bid_qty: callOptionData.marketData.bidQty,
            ask_price: callOptionData.marketData.askPrice,
            ask_qty: callOptionData.marketData.askQty,
            prev_oi: callOptionData.marketData.prevOi
          },
          option_greeks: {
            vega: callOptionData.analytics.vega,
            theta: callOptionData.analytics.theta,
            gamma: callOptionData.analytics.gamma,
            delta: callOptionData.analytics.delta,
            iv: callOptionData.analytics.iv,
            pop: callOptionData.analytics.pop
          }
        },
        put_options: {
          instrument_key: putOptionData.instrumentKey,
          market_data: {
            ltp: putOptionData.marketData.ltp,
            volume: putOptionData.marketData.volume,
            oi: putOptionData.marketData.oi,
            close_price: putOptionData.marketData.cp,
            bid_price: putOptionData.marketData.bidPrice,
            bid_qty: putOptionData.marketData.bidQty,
            ask_price: putOptionData.marketData.askPrice,
            ask_qty: putOptionData.marketData.askQty,
            prev_oi: putOptionData.marketData.prevOi
          },
          option_greeks: {
            vega: putOptionData.analytics.vega,
            theta: putOptionData.analytics.theta,
            gamma: putOptionData.analytics.gamma,
            delta: putOptionData.analytics.delta,
            iv: putOptionData.analytics.iv,
            pop: putOptionData.analytics.pop
          }
        }
      };
    });
    
    return {
      status: "success",
      data
    };
  } catch (error) {
    
    throw new Error("Failed to transform Upstox data");
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const instrumentKey = searchParams.get('instrument_key');
  const expiryDate = searchParams.get('expiry_date');

  if (!instrumentKey || !expiryDate) {
    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }

  try {
    // Determine if we're dealing with Nifty
    const isNifty = instrumentKey.toLowerCase().includes('nifty');
    
    if (isNifty) {
      // Calculate the current NIFTY expiry (last Thursday of the month)
      const formattedExpiry = calculateNiftyExpiry(expiryDate);
      
      // Use the Upstox API for Nifty options with the calculated expiry
      const upstoxUrl = `https://service.upstox.com/option-analytics-tool/open/v1/strategy-chains?assetKey=NSE_INDEX%7CNifty+50&strategyChainType=PC_CHAIN&expiry=${formattedExpiry}`;
      
      try {
        const response = await fetch(upstoxUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Upstox API responded with status: ${response.status}`);
        }
        
        const upstoxData = await response.json();
        const transformedData = transformUpstoxData(upstoxData);
        
        return NextResponse.json(transformedData);
      } catch (error) {
        
        // Return error instead of using simulated data
        return NextResponse.json(
          { error: 'Failed to fetch real-time option chain data', status: 'error' },
          { status: 503 }
        );
      }
    } else {
      // For non-Nifty options, return an error as we don't support them without real data
      return NextResponse.json(
        { error: 'Only NIFTY option chain is supported with real-time data', status: 'error' },
        { status: 400 }
      );
    }
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Failed to fetch option chain data', status: 'error' },
      { status: 500 }
    );
  }
}

// Function to calculate the current NIFTY expiry date in DD-MM-YYYY format
function calculateNiftyExpiry(requestedExpiry: string): string {
  try {
    // Parse the requested expiry date
    const requestDate = new Date(requestedExpiry);
    
    // Get the current date
    const today = new Date();
    
    // If the requested date is valid, use it as the basis
    const baseDate = !isNaN(requestDate.getTime()) ? requestDate : today;
    
    // Get the current month and year
    const currentYear = baseDate.getFullYear();
    const currentMonth = baseDate.getMonth();
    
    // Find the last Thursday of the current month
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    let lastThursday = new Date(lastDayOfMonth);
    
    // Adjust to get the last Thursday
    while (lastThursday.getDay() !== 4) { // 4 is Thursday
      lastThursday.setDate(lastThursday.getDate() - 1);
    }
    
    // Find the nearest weekly expiry (every Thursday)
    let weeklyExpiry = new Date(baseDate);
    
    // If today is after Thursday, move to next week
    if (baseDate.getDay() > 4) {
      weeklyExpiry.setDate(baseDate.getDate() + (4 + 7 - baseDate.getDay()) % 7);
    } 
    // If today is before Thursday, move to this week's Thursday
    else if (baseDate.getDay() < 4) {
      weeklyExpiry.setDate(baseDate.getDate() + (4 - baseDate.getDay()));
    }
    // If today is Thursday, use today
    
    // Use the weekly expiry, unless it's the last Thursday of the month (monthly expiry)
    const expiryToUse = 
      weeklyExpiry.getDate() === lastThursday.getDate() && 
      weeklyExpiry.getMonth() === lastThursday.getMonth() ? 
      lastThursday : weeklyExpiry;
    
    // Format as DD-MM-YYYY
    const day = String(expiryToUse.getDate()).padStart(2, '0');
    const month = String(expiryToUse.getMonth() + 1).padStart(2, '0');
    const year = expiryToUse.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    
    
    // Fallback to the current date + 1 week (approximate next expiry)
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 7);
    
    const day = String(fallbackDate.getDate()).padStart(2, '0');
    const month = String(fallbackDate.getMonth() + 1).padStart(2, '0');
    const year = fallbackDate.getFullYear();
    
    return `${day}-${month}-${year}`;
  }
} 