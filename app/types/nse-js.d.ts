declare module 'nse-js' {
  export class NSE {
    constructor();
    status(): Promise<any>;
    circulars(deptCode?: string, fromDate?: Date, toDate?: Date): Promise<any>;
    blockDeals(): Promise<any>;
    fnoLots(): Promise<any>;
    optionChain(symbol: string): Promise<{
      records: {
        underlyingValue: number;
        data: Array<{
          strikePrice: number;
          expiryDate: string;
          CE: {
            underlying: string;
            lastPrice: number;
            totalTradedVolume: number;
            openInterest: number;
            prevClose: number;
            bidprice: number;
            bidQty: number;
            askPrice: number;
            askQty: number;
            prevOpenInterest: number;
            impliedVolatility: number;
          };
          PE: {
            underlying: string;
            lastPrice: number;
            totalTradedVolume: number;
            openInterest: number;
            prevClose: number;
            bidprice: number;
            bidQty: number;
            askPrice: number;
            askQty: number;
            prevOpenInterest: number;
            impliedVolatility: number;
          };
        }>;
      };
    }>;
    maxpain(optionChain: any, expiryDate: Date): Promise<any>;
    compileOptionChain(symbol: string, expiryDate: Date): Promise<any>;
    advanceDecline(): Promise<any>;
    holidays(type: string): Promise<any>;
    equityMetaInfo(symbol: string): Promise<any>;
    quote(symbol: string, type?: string, section?: string): Promise<any>;
    equityQuote(symbol: string): Promise<any>;
    gainers(data: any, count?: number): Promise<any>;
    losers(data: any, count?: number): Promise<any>;
    listFnoStocks(): Promise<any>;
    listIndices(): Promise<any>;
    listIndexStocks(index: string): Promise<any>;
    listEtf(): Promise<any>;
    listSme(): Promise<any>;
    listSgb(): Promise<any>;
    listCurrentIPO(): Promise<any>;
    listUpcomingIPO(): Promise<any>;
    listPastIPO(fromDate: Date, toDate: Date): Promise<any>;
    actions(segment: string, symbol: string, fromDate: Date, toDate: Date): Promise<any>;
    announcements(index: string, symbol: string, fno: boolean, fromDate: Date, toDate: Date): Promise<any>;
    boardMeetings(index: string, symbol: string, fno: boolean, fromDate: Date, toDate: Date): Promise<any>;
  }

  export class Extras {
    constructor(basePath: string);
    equityBhavcopy(date: Date, folder: string): Promise<any>;
    deliveryBhavcopy(date: Date, folder: string): Promise<any>;
    fnoBhavcopy(date: Date, folder: string): Promise<any>;
    prBhavcopy(date: Date, folder: string): Promise<any>;
  }
} 