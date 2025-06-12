export interface OptionMarketData {
  ltp: number;
  volume: number;
  oi: number;
  close_price: number;
  bid_price: number;
  bid_qty: number;
  ask_price: number;
  ask_qty: number;
  prev_oi: number;
}

export interface OptionGreeks {
  vega: number;
  theta: number;
  gamma: number;
  delta: number;
  iv: number;
  pop: number;
}

export interface OptionData {
  instrument_key: string;
  market_data: OptionMarketData;
  option_greeks: OptionGreeks;
}

export interface OptionChainData {
  expiry: string;
  pcr: number;
  strike_price: number;
  underlying_key: string;
  underlying_spot_price: number;
  call_options: OptionData;
  put_options: OptionData;
}

export interface OptionChainResponse {
  status: string;
  data?: OptionChainData[];
  error?: string;
} 