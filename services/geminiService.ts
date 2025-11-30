import { GoogleGenAI } from "@google/genai";
import { Stock, AIAnalysisResult } from '../types';

const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMarket = async (stocks: Stock[]): Promise<AIAnalysisResult> => {
  try {
    const ai = getAiClient();
    
    // Prepare a summary payload for the AI (too much data might hit token limits or be noisy)
    const topGainers = [...stocks].sort((a, b) => b.percentChange - a.percentChange).slice(0, 5);
    const topLosers = [...stocks].sort((a, b) => a.percentChange - b.percentChange).slice(0, 5);
    const volumeBuzzers = [...stocks].sort((a, b) => (b.volume / b.avgVolume) - (a.volume / a.avgVolume)).slice(0, 3);

    const prompt = `
      Act as a senior technical analyst for the Indian Stock Market (Nifty 50).
      Analyze the following intraday market snapshot and provide a concise momentum report.

      Top 5 Gainers: ${topGainers.map(s => `${s.symbol} (+${s.percentChange}%)`).join(', ')}
      Top 5 Losers: ${topLosers.map(s => `${s.symbol} (${s.percentChange}%)`).join(', ')}
      Volume Buzzers: ${volumeBuzzers.map(s => s.symbol).join(', ')}
      
      Provide the response in the following JSON format ONLY:
      {
        "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
        "summary": "One concise paragraph explaining the market breadth and momentum drivers.",
        "keyLevels": "Mention 1-2 key stocks to watch based on the data."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);

    return {
      sentiment: result.sentiment,
      summary: result.summary,
      keyLevels: result.keyLevels,
      timestamp: new Date().toLocaleTimeString()
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      sentiment: 'NEUTRAL',
      summary: 'AI Analysis currently unavailable. Please check your API configuration or try again later.',
      keyLevels: 'N/A',
      timestamp: new Date().toLocaleTimeString()
    };
  }
};

// Helper to chunk array
const chunkArray = (array: string[], size: number) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Fetch Real Prices for ALL stocks in batches with retries
export const fetchAllStockPrices = async (stocks: Stock[]): Promise<Record<string, { price: number; change: number }>> => {
  const ai = getAiClient();
  const allSymbols = stocks.map(s => s.symbol);
  
  // Batch size 10 to balance speed and reliability
  const batches = chunkArray(allSymbols, 10); 
  let mergedData: Record<string, { price: number; change: number }> = {};
  const MAX_RETRIES = 3;

  console.log(`Starting Batch Fetch for ${allSymbols.length} stocks in ${batches.length} batches...`);

  for (let i = 0; i < batches.length; i++) {
    // RATE LIMIT PROTECTION:
    // Add a delay between batches to respect the API quota (e.g. Free tier 15 RPM).
    // Skipping delay for the very first batch to show immediate progress.
    if (i > 0) {
      await delay(2000); 
    }

    const batch = batches[i];
    let attempts = 0;
    let success = false;

    while (attempts < MAX_RETRIES && !success) {
      try {
        attempts++;
        const symbolsStr = batch.join(", ");
        
        // Simplified and stricter prompt
        const prompt = `
          Task: Get the current realtime price (LTP) and percent change for these NSE stocks: ${symbolsStr}.
          
          Instructions:
          1. Use Google Search to find the latest market data.
          2. Return strictly a JSON object.
          3. Keys must be the exact Stock Symbol.
          4. Values must be an object with "price" (number) and "change" (number).
          5. Do not include any markdown, "Here is the data", or code blocks. Just the raw JSON string.
          
          Example:
          {
            "RELIANCE": { "price": 2500.50, "change": 1.25 },
            "TCS": { "price": 4100.00, "change": -0.5 }
          }
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            // responseMimeType is deliberately omitted as it conflicts with tools in some versions
          }
        });

        let text = response.text;
        
        if (text) {
          // Robust Extraction: Use Regex to find the JSON object { ... }
          // This ignores any conversational filler text before or after the JSON.
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          
          if (jsonMatch) {
             const jsonStr = jsonMatch[0];
             const batchData = JSON.parse(jsonStr);
             mergedData = { ...mergedData, ...batchData };
             success = true;
          } else {
             // Fallback: If regex fails, try cleaning markdown marks
             const cleanText = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
             if (cleanText.startsWith('{')) {
                const batchData = JSON.parse(cleanText);
                mergedData = { ...mergedData, ...batchData };
                success = true;
             } else {
                throw new Error("Could not extract JSON from response: " + text.substring(0, 50) + "...");
             }
          }
        } else {
             throw new Error("Empty response text from AI");
        }
      } catch (e: any) {
        console.warn(`Batch ${i + 1}/${batches.length} failed (Attempt ${attempts}/${MAX_RETRIES}).`);
        
        // Check for 429 Rate Limit Error
        const isRateLimit = e.message?.includes('429') || e.status === 429 || e.code === 429;
        
        if (isRateLimit) {
           console.error("Rate Limit Hit (429). Cooling down for 10 seconds...");
           // Wait significantly longer if we hit a rate limit
           await delay(10000);
        } else if (attempts < MAX_RETRIES) {
          // Standard exponential backoff for other errors: 1s, 2s, 4s
          const waitTime = 1000 * Math.pow(2, attempts - 1);
          await delay(waitTime);
        } else {
          console.error(`Batch ${i + 1} failed permanently.`, e);
        }
      }
    }
  }

  return mergedData;
};