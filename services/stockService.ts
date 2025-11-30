import { NIFTY_50_STOCKS } from '../constants';
import { Stock, MarketFlowData, InstitutionalFlow, StockFlow } from '../types';

// Helper to get random number in range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Helper to check if NSE Market is Open (09:15 to 15:30 IST, Mon-Fri)
export const isMarketOpen = (): boolean => {
  const now = new Date();
  // Convert current time to IST
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(utc + istOffset);

  const day = istDate.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = istDate.getHours();
  const minute = istDate.getMinutes();

  // Weekend check
  if (day === 0 || day === 6) return false;

  const currentMinutes = hour * 60 + minute;
  const openMinutes = 9 * 60 + 15;  // 09:15
  const closeMinutes = 15 * 60 + 30; // 15:30

  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
};

// Initialize mock data with somewhat realistic starting prices
export const initializeStocks = (): Stock[] => {
  return NIFTY_50_STOCKS.map(stock => {
    // Use the hardcoded approximate base price from constants
    const basePrice = (stock as any).basePrice || random(500, 3500);
    
    // Create a small random gap from the "previous close" (basePrice) for the open price
    const gapPercent = random(-0.5, 0.5); 
    const open = basePrice * (1 + gapPercent / 100);
    
    // Simulate some initial intraday movement
    const currentPrice = open * random(0.99, 1.01);
    const change = currentPrice - basePrice; // Change is usually calculated from Previous Close
    const percentChange = (change / basePrice) * 100;
    
    // Week High Simulation: 
    // Randomly place the week high either slightly above current price (resistance) 
    // or below current price (already broken out)
    const isBreakoutCandidate = Math.random() > 0.8;
    const weekHigh = isBreakoutCandidate 
        ? currentPrice * random(0.98, 1.00) // Already broken or testing
        : currentPrice * random(1.02, 1.10); // Resistance above

    return {
      ...stock,
      price: parseFloat(currentPrice.toFixed(2)),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(Math.max(open, currentPrice).toFixed(2)),
      low: parseFloat(Math.min(open, currentPrice).toFixed(2)),
      weekHigh: parseFloat(weekHigh.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      percentChange: parseFloat(percentChange.toFixed(2)),
      volume: Math.floor(random(50000, 1000000)),
      avgVolume: Math.floor(random(500000, 2000000)),
      rsi: parseFloat(random(30, 70).toFixed(2)), // Start neutral
      history: generateMockHistory(open, currentPrice),
    };
  });
};

function generateMockHistory(open: number, current: number): { time: string; price: number }[] {
  const points = 20;
  const history = [];
  const step = (current - open) / points;
  let runningPrice = open;

  for (let i = 0; i < points; i++) {
    // Add some noise
    runningPrice += step + random(-open * 0.001, open * 0.001);
    const hour = 9 + Math.floor((i * 15) / 60);
    const minute = (15 + i * 15) % 60;
    history.push({
      time: `${hour}:${minute < 10 ? '0' + minute : minute}`,
      price: parseFloat(runningPrice.toFixed(2)),
    });
  }
  return history;
}

// Function to update stocks slightly (simulating a tick)
export const updateStocks = (currentStocks: Stock[]): Stock[] => {
  // If market is closed, do not update prices
  if (!isMarketOpen()) {
    return currentStocks;
  }

  return currentStocks.map(stock => {
    // Random walk with momentum bias
    const momentumBias = stock.percentChange * 0.05;
    const volatility = stock.symbol === 'ADANIENT' ? 5 : 1.5; // Some stocks more volatile
    
    const changePercent = random(-0.1 + momentumBias, 0.1 + momentumBias) * (volatility / 100);
    const newPrice = Math.max(0.1, stock.price * (1 + changePercent));

    // Calculate change relative to Open (simulating change from prev close using open as proxy for day start)
    const newChange = newPrice - stock.open; 
    const newPercentChange = (newChange / stock.open) * 100;
    
    const volumeSpike = random(100, 5000);
    
    let newRsi = stock.rsi + random(-2, 2);
    if (newRsi > 80) newRsi -= random(0, 3);
    if (newRsi < 20) newRsi += random(0, 3);
    newRsi = Math.max(0, Math.min(100, newRsi));

    // Shallow copy history
    const newHistory = [...stock.history];
    if (Math.random() > 0.8) {
       const now = new Date();
       const timeStr = `${now.getHours()}:${now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes()}`;
       
       const lastIndex = newHistory.length - 1;
       const lastEntry = newHistory[lastIndex];

       if (lastEntry && lastEntry.time !== timeStr) {
         newHistory.push({ time: timeStr, price: parseFloat(newPrice.toFixed(2)) });
         if (newHistory.length > 50) newHistory.shift(); 
       } else if (lastEntry) {
         newHistory[lastIndex] = {
             ...lastEntry,
             price: parseFloat(newPrice.toFixed(2))
         };
       }
    }

    return {
      ...stock,
      price: parseFloat(newPrice.toFixed(2)),
      high: Math.max(stock.high, newPrice),
      low: Math.min(stock.low, newPrice),
      change: parseFloat(newChange.toFixed(2)),
      percentChange: parseFloat(newPercentChange.toFixed(2)),
      volume: stock.volume + Math.floor(volumeSpike),
      rsi: parseFloat(newRsi.toFixed(2)),
      history: newHistory
    };
  });
};

// Merge fetched live data with current state
export const mergeStockData = (currentStocks: Stock[], liveData: Record<string, { price: number; change: number }>): Stock[] => {
  if (Object.keys(liveData).length === 0) return currentStocks;

  return currentStocks.map(stock => {
    // Try matching symbol (preferred) or loose check
    const liveUpdate = liveData[stock.symbol] || liveData[stock.symbol.toUpperCase()];
    
    if (liveUpdate && liveUpdate.price > 0) {
      const newPrice = liveUpdate.price;
      const newPercentChange = liveUpdate.change;
      
      // Calculate Change amount based on %
      // Formula: Current = Base * (1 + %/100) -> Base = Current / (1 + %/100)
      // Change = Current - Base
      const impliedBase = newPrice / (1 + (newPercentChange / 100));
      const newChange = newPrice - impliedBase;

      // Update history with the real price to avoid jumps
      const newHistory = [...stock.history];
      if (newHistory.length > 0) {
         const lastIndex = newHistory.length - 1;
         newHistory[lastIndex] = {
             ...newHistory[lastIndex],
             price: newPrice
         };
      }

      return {
        ...stock,
        price: newPrice,
        percentChange: newPercentChange,
        change: parseFloat(newChange.toFixed(2)),
        // Adjust High/Low so they are consistent with the new real price
        high: Math.max(stock.high, newPrice),
        low: Math.min(stock.low, newPrice),
        // If price breaks week high, update it to reflect the breakout
        weekHigh: newPrice > stock.weekHigh ? newPrice : stock.weekHigh,
        // Update open if the gap is too large (sanity check)
        open: Math.abs(stock.open - newPrice) > (newPrice * 0.1) ? impliedBase : stock.open,
        history: newHistory
      };
    }
    return stock;
  });
};

// Mock FII/DII Data
export const getMarketFlowData = (): MarketFlowData => {
  const generateFlow = (participant: 'FII' | 'DII' | 'PRO', segment: 'Cash' | 'Index Options' | 'Stock Options' | 'Index Futures', base: number): InstitutionalFlow => {
    const buy = Math.floor(base + random(-500, 500));
    const sell = Math.floor(base + random(-500, 500));
    return {
      participant,
      segment,
      buyAmount: buy,
      sellAmount: sell,
      netAmount: buy - sell
    };
  };

  return {
    flows: [
      generateFlow('FII', 'Cash', 8500),
      generateFlow('DII', 'Cash', 7200),
      generateFlow('FII', 'Index Futures', 4200),
      generateFlow('FII', 'Index Options', 45000), // Options turnover is usually much higher
      generateFlow('FII', 'Stock Options', 12000),
    ],
    timestamp: new Date().toLocaleTimeString()
  };
};

// Generate Mock Stock Specific Flow based on price action
export const generateStockSpecificFlow = (stock: Stock): StockFlow => {
  // Estimate total traded value roughly
  const turnoverCr = (stock.volume * stock.price) / 10000000; 
  
  // Assume FII/DII participation is around 30-50% of volume
  const instParticipation = turnoverCr * random(0.3, 0.5);
  
  // Split between FII and DII (FIIs usually more active in momentum)
  const fiiShare = instParticipation * random(0.4, 0.7);
  const diiShare = instParticipation - fiiShare;

  // Determine bias based on price change
  // If stock is UP, likely Net Buy. If Down, Net Sell.
  // Add some randomness so it's not always perfectly correlated
  const sentiment = stock.percentChange > 0 ? 1 : -1;
  const strength = Math.min(Math.abs(stock.percentChange), 3) / 3; // 0 to 1

  const calcNet = (share: number) => {
    const bias = share * 0.2 * sentiment * strength; // Net flow is up to 20% of share
    const noise = share * 0.05 * random(-1, 1);
    return Math.floor(bias + noise);
  };

  const fiiNet = calcNet(fiiShare);
  const diiNet = calcNet(diiShare) * random(0.5, 1.5); // DII might counter-trade

  const fiiBuy = Math.floor(fiiShare / 2 + fiiNet / 2);
  const fiiSell = Math.floor(fiiShare / 2 - fiiNet / 2);

  const diiBuy = Math.floor(diiShare / 2 + diiNet / 2);
  const diiSell = Math.floor(diiShare / 2 - diiNet / 2);

  return {
    fii: { buy: fiiBuy, sell: fiiSell, net: fiiBuy - fiiSell },
    dii: { buy: diiBuy, sell: diiSell, net: diiBuy - diiSell }
  };
};