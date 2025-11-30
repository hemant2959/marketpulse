export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  percentChange: number;
  open: number;
  high: number;
  low: number;
  weekHigh: number; // Simulated Weekly/Swing High
  volume: number;
  avgVolume: number;
  rsi: number; // Relative Strength Index (14)
  history: { time: string; price: number }[]; // Intraday minute data for charts
}

export enum FilterType {
  ALL = 'ALL',
  TOP_GAINERS = 'TOP_GAINERS',
  TOP_LOSERS = 'TOP_LOSERS',
  VOLUME_SHOCKERS = 'VOLUME_SHOCKERS',
  RSI_OVERBOUGHT = 'RSI_OVERBOUGHT', // > 70
  RSI_OVERSOLD = 'RSI_OVERSOLD',     // < 30
  MOMENTUM_BULLISH = 'MOMENTUM_BULLISH',
  DAY_BREAKOUT = 'DAY_BREAKOUT',
  WEEK_BREAKOUT = 'WEEK_BREAKOUT'
}

export interface MarketSummary {
  advances: number;
  declines: number;
  neutral: number;
  topSector: string;
}

export interface AIAnalysisResult {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  summary: string;
  keyLevels: string;
  timestamp: string;
}

export interface InstitutionalFlow {
  participant: 'FII' | 'DII' | 'PRO';
  segment: 'Cash' | 'Index Options' | 'Stock Options' | 'Index Futures';
  buyAmount: number; // In Crores
  sellAmount: number; // In Crores
  netAmount: number; // In Crores
}

export interface MarketFlowData {
  flows: InstitutionalFlow[];
  timestamp: string;
}

export interface StockFlow {
  fii: { buy: number; sell: number; net: number };
  dii: { buy: number; sell: number; net: number };
}