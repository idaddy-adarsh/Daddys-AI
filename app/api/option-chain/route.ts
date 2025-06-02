import { NextResponse } from 'next/server';
import type { OptionChainResponse } from '@/app/types/optionChain';

// Cache for simulated data
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

  // For now, always return simulated data
  return NextResponse.json(generateMockData(instrumentKey, expiryDate));
} 