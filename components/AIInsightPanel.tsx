import React from 'react';
import { AIAnalysisResult } from '../types';
import { Bot, RefreshCw, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

interface Props {
  analysis: AIAnalysisResult | null;
  loading: boolean;
  onAnalyze: () => void;
}

const AIInsightPanel: React.FC<Props> = ({ analysis, loading, onAnalyze }) => {
  return (
    <div className="dashboard-card rounded-xl p-5 relative overflow-hidden h-full">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <Sparkles size={140} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">AI Market Analyst</h2>
              <p className="text-slate-400 text-[10px] font-medium">Powered by Gemini 2.5</p>
            </div>
          </div>
          <button
            onClick={onAnalyze}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
              loading 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'
            }`}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            {loading ? "Thinking..." : "Analyze"}
          </button>
        </div>

        {analysis ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in flex-1">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center">
              <span className="text-slate-400 text-[10px] uppercase font-bold mb-1">Sentiment</span>
              <div className="flex items-center gap-2">
                {analysis.sentiment === 'BULLISH' && <TrendingUp className="text-emerald-500" size={20} />}
                {analysis.sentiment === 'BEARISH' && <TrendingDown className="text-rose-500" size={20} />}
                {analysis.sentiment === 'NEUTRAL' && <Minus className="text-amber-500" size={20} />}
                <span className={`text-lg font-bold ${
                  analysis.sentiment === 'BULLISH' ? 'text-emerald-600 dark:text-emerald-400' : 
                  analysis.sentiment === 'BEARISH' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {analysis.sentiment}
                </span>
              </div>
            </div>

            <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700/50">
              <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Insight</span>
              <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            <div className="md:col-span-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-between">
               <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-indigo-600 dark:text-indigo-400 text-[10px] uppercase font-bold">Watchlist:</span>
                  <span className="text-indigo-900 dark:text-indigo-200 font-medium text-xs">{analysis.keyLevels}</span>
               </div>
               <span className="text-slate-400 text-[9px] font-mono">{analysis.timestamp}</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800/20 min-h-[140px]">
            <Bot size={24} className="mb-2 opacity-50" />
            <p className="text-xs font-medium">Ready to analyze market data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightPanel;