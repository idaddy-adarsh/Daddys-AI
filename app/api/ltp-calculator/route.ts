import { NextResponse } from 'next/server';

const LTP_USERNAME = "classesdaddys@gmail.com";
const LTP_PASSWORD = "Schools@12345";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const expiry = searchParams.get('expiry') || "05-06-2025"; // Default expiry
  const lotSize = searchParams.get('lotSize') || "75"; // Default lot size

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Format the response
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
    console.error("Error fetching LTP Calculator data:", error);
    return NextResponse.json(
      { error: 'Failed to fetch LTP Calculator data' },
      { status: 500 }
    );
  }
} 