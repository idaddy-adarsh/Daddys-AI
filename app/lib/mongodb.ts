import { MongoClient } from 'mongodb';
import { Trade } from '@/app/models/Trade';

// MongoDB connection string
const uri = process.env.MONGODB_URI || 'mongodb+srv://daddysartificialintelligence:Notch%401188@cluster0.rihvb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// MongoDB client
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise
export default clientPromise;

// Helper function to get database connection
export async function connectToDatabase() {
  try {
    const client = await clientPromise;
    return client.db('daddysai');
  } catch (error) {
    
    throw new Error('Unable to connect to database');
  }
}

// Helper function to save a trade to the ledger
export async function saveTradeToLedger(trade: Trade) {
  if (!trade.userId) {
    throw new Error('User ID is required for saving to ledger');
  }
  
  try {
    const db = await connectToDatabase();
    
    // Extract date from timestamp for organization
    const tradeDate = new Date(trade.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Create a ledger entry with user and date information
    const ledgerEntry = {
      userId: trade.userId,
      tradeDate,
      tradeId: trade.id,
      trade: trade,
      createdAt: new Date()
    };
    
    // Save to ledger collection
    await db.collection('ledger').insertOne(ledgerEntry);
    
    return { success: true };
  } catch (error) {
    
    throw error;
  }
}

// Helper function to get user's ledger entries
export async function getUserLedger(userId: string, startDate?: string, endDate?: string) {
  if (!userId) {
    throw new Error('User ID is required for fetching ledger');
  }
  
  try {
    const db = await connectToDatabase();
    
    // Build query with date range if provided
    const query: any = { userId };
    
    if (startDate || endDate) {
      query.tradeDate = {};
      
      if (startDate) {
        query.tradeDate.$gte = startDate;
      }
      
      if (endDate) {
        query.tradeDate.$lte = endDate;
      }
    }
    
    // Get ledger entries sorted by date and time
    const ledgerEntries = await db
      .collection('ledger')
      .find(query)
      .sort({ tradeDate: -1, createdAt: -1 })
      .toArray();
    
    return ledgerEntries;
  } catch (error) {
    
    throw error;
  }
} 