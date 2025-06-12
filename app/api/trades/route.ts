import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectToDatabase, saveTradeToLedger } from '@/app/lib/mongodb';
import { validateTrade } from '@/app/models/Trade';

// GET /api/trades - Get all trades for a user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const db = await connectToDatabase();
    const trades = await db
      .collection('trades')
      .find({ userId })
      .sort({ timestamp: -1 }) // Sort by timestamp descending (newest first)
      .toArray();

    return NextResponse.json({ trades });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}

// POST /api/trades - Create a new trade
export async function POST(request: NextRequest) {
  try {
    const trade = await request.json();
    
    // Validate the trade using our model
    const validation = validateTrade(trade);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid trade data', details: validation.errors },
        { status: 400 }
      );
    }

    // Save to trades collection
    const db = await connectToDatabase();
    const result = await db.collection('trades').insertOne(trade);
    
    // Also save to ledger collection
    await saveTradeToLedger(trade);

    return NextResponse.json({
      message: 'Trade saved successfully',
      tradeId: result.insertedId
    }, { status: 201 });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 });
  }
} 