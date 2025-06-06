import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, saveTradeToLedger } from '@/app/lib/mongodb';
import { validateTrade } from '@/app/models/Trade';

// PUT /api/trades/[tradeId] - Update an existing trade
export async function PUT(
  request: NextRequest,
  { params }: { params: { tradeId: string } }
) {
  const tradeId = params.tradeId;
  
  if (!tradeId) {
    return NextResponse.json({ error: 'Trade ID is required' }, { status: 400 });
  }

  try {
    const updates = await request.json();
    
    // Validate that we have a userId for security
    if (!updates.userId) {
      return NextResponse.json(
        { error: 'User ID is required for updating trades' },
        { status: 400 }
      );
    }
    
    // Validate the trade updates
    const validation = validateTrade(updates);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid trade data', details: validation.errors },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    
    // First check if the trade exists and belongs to this user
    const existingTrade = await db
      .collection('trades')
      .findOne({ id: tradeId, userId: updates.userId });
    
    if (!existingTrade) {
      return NextResponse.json(
        { error: 'Trade not found or you do not have permission to update it' },
        { status: 404 }
      );
    }
    
    // Update the trade
    const result = await db
      .collection('trades')
      .updateOne(
        { id: tradeId, userId: updates.userId },
        { $set: updates }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }
    
    // Add updated trade to ledger with update information
    const updatedTrade = {
      ...existingTrade,
      ...updates,
      updatedAt: new Date().toISOString(),
      previousState: existingTrade
    };
    
    // Save the updated trade to the ledger
    await saveTradeToLedger(updatedTrade);

    return NextResponse.json({
      message: 'Trade updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 });
  }
} 