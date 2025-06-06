# MongoDB Integration for Trade History

This document explains how the trade history feature works with MongoDB integration.

## Overview

The application uses MongoDB to store and retrieve trade history for each user. Each trade is stored with a unique ID and user ID to ensure data segregation and security.

## Data Model

Trades are stored with the following structure:

```typescript
interface Trade {
  id: string;         // Unique trade ID
  userId: string;     // User ID from Clerk authentication
  type: 'buy' | 'sell';
  asset: string;      // Asset symbol
  amount: number;     // Quantity of shares/contracts
  price: number;      // Price per share/contract
  timestamp: string;  // ISO date string
  orderType: 'market' | 'limit' | 'stop' | 'stoplimit';
  status: 'executed' | 'pending' | 'cancelled' | 'completed' | 'partially_completed';
  completedWith?: string;     // ID of matching trade (if applicable)
  remainingAmount?: number;   // Remaining quantity for partially filled orders
  originalAmount?: number;    // Original quantity before partial fills
  lotSize?: number;           // Lot size for options/futures
  isOption?: boolean;         // Whether this is an option trade
  strikePrice?: number;       // Strike price for options
  optionType?: 'CE' | 'PE';   // Call or Put for options
  premium?: number;           // Option premium
}
```

## API Endpoints

The following API endpoints are available for trade history:

- `GET /api/trades?userId=<userId>` - Get all trades for a specific user
- `POST /api/trades` - Create a new trade
- `PUT /api/trades/:tradeId` - Update an existing trade

## Authentication and Security

- All API endpoints require a valid user ID
- Users can only access and modify their own trades
- Trade updates are validated to ensure data integrity

## Environment Setup

To use MongoDB with this application, set the following environment variable:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/daddysai?retryWrites=true&w=majority
```

## Implementation Details

1. When a user executes a trade, it's saved to MongoDB with their user ID
2. When a user views their portfolio, their trade history is fetched from MongoDB
3. When a trade is updated (e.g., closed position), the trade record is updated in MongoDB
4. All algorithmic trades are also saved to the user's trade history

This implementation ensures that users have a persistent record of all their trading activity across sessions. 