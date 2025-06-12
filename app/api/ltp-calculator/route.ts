import { NextResponse } from 'next/server';

const LTP_USERNAME = "classesdaddys@gmail.com";
const LTP_PASSWORD = "Schools@12345";

// Rate limiting variables
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

// Cache for expiry dates to avoid repeated API calls
const expiryCache: Record<string, { dates: string[], timestamp: number }> = {};
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Default values for different symbols
const DEFAULT_CONFIG = {
  'NIFTY': {
    expiry: "", // Will be determined dynamically
    lotSize: "75"
  },
  'BANKNIFTY': {
    expiry: "", // Empty string as placeholder
    lotSize: "30"
  },
  'FINNIFTY': {
    expiry: "",
    lotSize: "40"
  },
  'MIDCPNIFTY': {
    expiry: "",
    lotSize: "75"
  },
  'NIFTYNXT50': {
    expiry: "",
    lotSize: "75"
  }
};

// Symbol mapping - LTP Calculator may use different symbol names
const SYMBOL_MAPPING = {
  'BANKNIFTY': 'BANKNIFTY',
  'NIFTY': 'NIFTY',
  'FINNIFTY': 'FINNIFTY',
  'MIDCPNIFTY': 'MIDCPNIFTY',
  'NIFTYNXT50': 'NIFTYNXT50'
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

// Function to format a date from YYYY-MM-DD to DD-MM-YYYY
function formatDateForLTP(dateStr: string): string {
  if (!dateStr) return '';
  
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  
  // Convert from YYYY-MM-DD to DD-MM-YYYY
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

// Function to fetch available expiry dates for a symbol
async function fetchExpiryDates(symbol: string): Promise<string[]> {
  // Check cache first
  const now = Date.now();
  if (expiryCache[symbol] && (now - expiryCache[symbol].timestamp) < CACHE_TTL) {
    
    return expiryCache[symbol].dates;
  }
  
  try {
    // Set up authentication headers
    const headers = new Headers();
    headers.set(
      "Authorization",
      "Basic " + Buffer.from(`${LTP_USERNAME}:${LTP_PASSWORD}`).toString('base64')
    );
    
    const url = `https://login.ltpcalculator.com/optionChain/symbol-expiry?symbol=${symbol}`;
    
    
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      return [];
    }
    
    // Parse the response which is a JSON array of date strings in DD-MM-YYYY format
    const dates = await response.json() as string[];
    
    // Cache the result
    expiryCache[symbol] = {
      dates,
      timestamp: now
    };
    
    return dates;
  } catch (error) {
    
    return [];
  }
}

// Function to find the nearest expiry date
function findNearestExpiry(dates: string[], preferWeekly: boolean = false): string {
  if (!dates || dates.length === 0) {
    return '';
  }
  
  const today = new Date();
  
  // Parse the dates into Date objects
  const parsedDates = dates.map(dateStr => {
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed in JS Date
  });
  
  // Filter for future dates only
  const futureDates = parsedDates.filter(date => date > today);
  
  if (futureDates.length === 0) {
    return dates[0]; // If no future dates, return the first available
  }
  
  // For weekly preference (like NIFTY), get the nearest Thursday
  if (preferWeekly) {
    // Sort by date (ascending)
    futureDates.sort((a, b) => a.getTime() - b.getTime());
    
    // Find the nearest date
    const nearestDate = futureDates[0];
    
    // Format back to DD-MM-YYYY
    const day = String(nearestDate.getDate()).padStart(2, '0');
    const month = String(nearestDate.getMonth() + 1).padStart(2, '0');
    const year = nearestDate.getFullYear();
    
    return `${day}-${month}-${year}`;
  } 
  // For monthly preference, find the nearest month-end expiry
  else {
    // Group dates by month
    const datesByMonth: Record<string, Date[]> = {};
    
    futureDates.forEach(date => {
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!datesByMonth[key]) {
        datesByMonth[key] = [];
      }
      datesByMonth[key].push(date);
    });
    
    // Get the current month key
    const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`;
    
    // If we have dates for the current month, get the last one
    if (datesByMonth[currentMonthKey] && datesByMonth[currentMonthKey].length > 0) {
      const monthDates = datesByMonth[currentMonthKey];
      monthDates.sort((a, b) => b.getTime() - a.getTime()); // Sort descending
      
      const lastDate = monthDates[0];
      const day = String(lastDate.getDate()).padStart(2, '0');
      const month = String(lastDate.getMonth() + 1).padStart(2, '0');
      const year = lastDate.getFullYear();
      
      return `${day}-${month}-${year}`;
    }
    
    // Otherwise, get the first date of the next available month
    const monthKeys = Object.keys(datesByMonth).sort();
    if (monthKeys.length > 0) {
      const nextMonthKey = monthKeys[0];
      const nextMonthDates = datesByMonth[nextMonthKey];
      nextMonthDates.sort((a, b) => b.getTime() - a.getTime()); // Sort descending
      
      const lastDate = nextMonthDates[0];
      const day = String(lastDate.getDate()).padStart(2, '0');
      const month = String(lastDate.getMonth() + 1).padStart(2, '0');
      const year = lastDate.getFullYear();
      
      return `${day}-${month}-${year}`;
    }
    
    // Fallback to the first future date
    const nearestDate = futureDates[0];
    const day = String(nearestDate.getDate()).padStart(2, '0');
    const month = String(nearestDate.getMonth() + 1).padStart(2, '0');
    const year = nearestDate.getFullYear();
    
    return `${day}-${month}-${year}`;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  
  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }
  
  try {
    // Get default config for the symbol or use NIFTY defaults
    const symbolConfig = DEFAULT_CONFIG[symbol as keyof typeof DEFAULT_CONFIG] || DEFAULT_CONFIG.NIFTY;
    
    // Map the symbol to the correct format for LTP Calculator
    const mappedSymbol = SYMBOL_MAPPING[symbol as keyof typeof SYMBOL_MAPPING] || symbol;
    
    // Get parameters with fallbacks to default config
    let expiry = searchParams.get('expiry');
    const expiryDate = searchParams.get('expiryDate');
    
    // If expiryDate is provided, convert it from YYYY-MM-DD to DD-MM-YYYY format
    if (expiryDate) {
      expiry = formatDateForLTP(expiryDate);
      
    }
    // If no expiry is specified, fetch available expiry dates and choose the nearest one
    else if (!expiry) {
      // Fetch available expiry dates
      const expiryDates = await fetchExpiryDates(mappedSymbol);
      
      if (expiryDates.length > 0) {
        // For NIFTY, prefer weekly expiry
        const preferWeekly = symbol === 'NIFTY';
        expiry = findNearestExpiry(expiryDates, preferWeekly);
        
      } else {
        // Fallback to default methods if API fetch fails
        if (symbol === 'NIFTY') {
          // For NIFTY, we'll use the next Thursday (weekly expiry)
          const now = new Date();
          const dayOfWeek = now.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
          let daysUntilThursday = (4 - dayOfWeek + 7) % 7; // Thursday is day 4
          
          // If today is Thursday, and it's before market close (3:30 PM IST), use today
          if (dayOfWeek === 4) {
            const hours = now.getHours();
            const minutes = now.getMinutes();
            if (hours < 15 || (hours === 15 && minutes < 30)) {
              daysUntilThursday = 0;
            }
          }
          
          const nextThursday = new Date(now);
          nextThursday.setDate(now.getDate() + daysUntilThursday);
          
          // Format as DD-MM-YYYY
          const day = String(nextThursday.getDate()).padStart(2, '0');
          const month = String(nextThursday.getMonth() + 1).padStart(2, '0');
          const year = nextThursday.getFullYear();
          
          expiry = `${day}-${month}-${year}`;
          
        } else {
          // For all other symbols, use the last Thursday of the month
          expiry = getLastThursdayOfMonth();
          
        }
      }
    }
    
    // Use default lot size or provided one
    const lotSize = searchParams.get('lotSize') || symbolConfig.lotSize;
    
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
    

    // Set up authentication headers
    const headers = new Headers();
    headers.set(
      "Authorization",
      "Basic " + Buffer.from(`${LTP_USERNAME}:${LTP_PASSWORD}`).toString('base64')
    );

    // Make the API request
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    // Handle rate limiting with retry
    if (response.status === 429) {
      // If we hit the rate limit, wait and retry once
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      const retryResponse = await fetch(url, {
        method: "GET",
        headers: headers,
      });
      
      if (!retryResponse.ok) {
        const errorText = await retryResponse.text();
        
        
        // Return a more informative error response
        return NextResponse.json({
          error: 'Failed to fetch data from LTP Calculator API after retry',
          status: retryResponse.status,
          details: errorText,
          url: url,
          symbol: symbol,
          mappedSymbol: mappedSymbol
        }, { status: 502 }); // Use 502 Bad Gateway for upstream API failures
      }
      
      const data = await retryResponse.json();
      return formatResponse(data, symbol);
    }

    // Handle other error responses
    if (!response.ok) {
      const errorText = await response.text();
      
      
      // Return a more informative error response
      return NextResponse.json({
        error: 'Failed to fetch data from LTP Calculator API',
        status: response.status,
        details: errorText,
        url: url,
        symbol: symbol,
        mappedSymbol: mappedSymbol
      }, { status: 502 }); // Use 502 Bad Gateway for upstream API failures
    }

    // Process successful response
    const data = await response.json();
    return formatResponse(data, symbol);
  } catch (error) {
    // Handle any unexpected errors
    
    return NextResponse.json(
      { 
        error: 'Unexpected error in LTP Calculator API route',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        symbol: symbol
      },
      { status: 500 }
    );
  }
}

// Helper function to format the response
function formatResponse(data: any, symbol: string) {
  try {
    // Check if the expected data structure exists
    if (!data || !data.symbolMarketDirection) {
      
      return NextResponse.json({
        error: 'Invalid response structure from LTP Calculator API - missing symbolMarketDirection',
        symbol: symbol
      }, { status: 502 });
    }

    if (!data.symbolMarketDirection.reversalModel) {
      
      return NextResponse.json({
        error: 'Invalid response structure from LTP Calculator API - missing reversalModel',
        symbol: symbol
      }, { status: 502 });
    }
    
    // Get references to make code more readable
    const direction = data.symbolMarketDirection;
    const model = data.symbolMarketDirection.reversalModel;
    
    // Create result with null checks for each field
    const result = {
      fetchTime: direction.actualFetchTime || new Date().toISOString(),
      direction: direction.marketDirection || 'UNKNOWN',
      riskyResistance: model.riskyResistance || null,
      riskySupport: model.riskySupport || null,
      moderateResistance: model.moderateResistance || null,
      moderateSupport: model.moderateSupport || null,
      rMaxGain: model.resistanceTarget || null,
      sMaxGain: model.supportTarget || null,
      rMaxPain: model.resistanceSL || null,
      sMaxPain: model.supportSL || null,
      scenario: model.scenario || 'UNKNOWN',
      symbol: symbol // Include the symbol in the response
    };
    
    
    return NextResponse.json(result);
  } catch (error) {
    
    
    return NextResponse.json({
      error: 'Error formatting LTP Calculator response',
      message: error instanceof Error ? error.message : 'Unknown error',
      rawData: typeof data === 'object' ? 'Data object received but could not be processed' : 'No valid data received',
      symbol: symbol
    }, { status: 500 });
  }
} 