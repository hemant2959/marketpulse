import React from 'react';
import { AIAnalysisResult } from '../types';
import { Bot, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  analysis: AIAnalysisResult | null;
  loading: boolean;
  onAnalyze: () => void;
}

const AIInsightPanel: React.FC<Props> = ({ analysis, loading, onAnalyze }) => {
  return (
    <div className="glass-panel rounded-2xl p-5 shadow-lg relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-5 text-indigo-900 dark:text-white">
        <Bot size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 dark:bg-indigo-500/20 p-2 rounded-lg text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">AI Analyst</h2>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider font-bold">Hemant Intelligence</p>
            </div>
          </div>
          <button
            onClick={onAnalyze}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
              loading 
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
            }`}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Thinking..." : "Analyze"}
          </button>
        </div>

        {analysis ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
            <div className="bg-white/50 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200 dark:border-slate-700/50">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Market Sentiment</span>
              <div className="flex items-center gap-2 mt-1">
                {analysis.sentiment === 'BULLISH' && <TrendingUp className="text-emerald-500 dark:text-emerald-400" size={24} />}
                {analysis.sentiment === 'BEARISH' && <TrendingDown className="text-rose-500 dark:text-rose-400" size={24} />}
                {analysis.sentiment === 'NEUTRAL' && <Minus className="text-yellow-500 dark:text-yellow-400" size={24} />}
                <span className={`text-xl font-bold ${
                  analysis.sentiment === 'BULLISH' ? 'text-emerald-600 dark:text-emerald-400' : 
                  analysis.sentiment === 'BEARISH' ? 'text-rose-600 dark:text-rose-400' : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {analysis.sentiment}
                </span>
              </div>
            </div>

            <div className="md:col-span-2 bg-white/50 dark:bg-slate-900/40 rounded-xl p-3 border border-slate-200 dark:border-slate-700/50">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Executive Summary</span>
              <p className="text-slate-700 dark:text-slate-200 mt-1 leading-relaxed text-sm">
                {analysis.summary}
              </p>
            </div>

            <div className="md:col-span-3 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-between">
               <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <span className="text-indigo-600 dark:text-indigo-400 text-[10px] uppercase tracking-wider font-bold">Key Levels:</span>
                  <span className="text-indigo-800 dark:text-indigo-200 font-medium text-xs">{analysis.keyLevels}</span>
               </div>
               <span className="text-slate-500 text-[10px] whitespace-nowrap">{analysis.timestamp}</span>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-700/50 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
            <p className="text-sm">Generate AI market insights based on live data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightPanel;