export interface Trade {
  id: string;
  userId: string;
  type: 'buy' | 'sell';
  asset: string;
  amount: number;
  price: number;
  timestamp: string;
  orderType: 'market' | 'limit' | 'stop' | 'stoplimit';
  status: 'executed' | 'pending' | 'cancelled' | 'completed' | 'partially_completed';
  completedWith?: string;
  completedAt?: string;
  remainingAmount?: number;
  originalAmount?: number;
  lotSize?: number;
  isOption?: boolean;
  strikePrice?: number;
  optionType?: 'CE' | 'PE';
  premium?: number;
}

// Helper function to validate a trade object
export function validateTrade(trade: Partial<Trade>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!trade.userId) errors.push('User ID is required');
  if (!trade.type) errors.push('Trade type is required');
  if (!trade.asset) errors.push('Asset is required');
  if (trade.amount === undefined || trade.amount <= 0) errors.push('Valid amount is required');
  if (trade.price === undefined || trade.price <= 0) errors.push('Valid price is required');
  if (!trade.timestamp) errors.push('Timestamp is required');
  if (!trade.orderType) errors.push('Order type is required');
  if (!trade.status) errors.push('Status is required');
  
  // Validate trade type
  if (trade.type && !['buy', 'sell'].includes(trade.type)) {
    errors.push('Trade type must be either "buy" or "sell"');
  }
  
  // Validate order type
  if (trade.orderType && !['market', 'limit', 'stop', 'stoplimit'].includes(trade.orderType)) {
    errors.push('Invalid order type');
  }
  
  // Validate status
  if (trade.status && !['executed', 'pending', 'cancelled', 'completed', 'partially_completed'].includes(trade.status)) {
    errors.push('Invalid status');
  }
  
  // Validate option type if present
  if (trade.optionType && !['CE', 'PE'].includes(trade.optionType)) {
    errors.push('Option type must be either "CE" or "PE"');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
} 