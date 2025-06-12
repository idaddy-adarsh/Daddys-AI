import { NextRequest, NextResponse } from 'next/server';
import { getUserLedger } from '@/app/lib/mongodb';

// GET /api/ledger - Get user's trade ledger with optional date filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const ledgerEntries = await getUserLedger(userId, startDate || undefined, endDate || undefined);
    
    // Group entries by date
    const groupedByDate: Record<string, any[]> = {};
    
    ledgerEntries.forEach(entry => {
      const date = entry.tradeDate;
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(entry);
    });
    
    return NextResponse.json({
      ledger: groupedByDate,
      totalEntries: ledgerEntries.length
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 });
  }
} 