import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeStocks, updateStocks, getMarketFlowData, isMarketOpen, mergeStockData } from './services/stockService';
import { analyzeMarket, fetchAllStockPrices } from './services/geminiService';
import { Stock, FilterType, AIAnalysisResult, MarketFlowData } from './types';
import StockChart from './components/StockChart';
import AIInsightPanel from './components/AIInsightPanel';
import MarketFlowWidget from './components/MarketFlowWidget';
import StockDetailModal from './components/StockDetailModal';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Activity, 
  Filter,
  Search,
  Clock,
  RefreshCcw,
  Download,
  QrCode,
  X,
  Smartphone,
  LayoutGrid,
  List,
  Zap,
  TrendingUp,
  Sun,
  Moon
} from 'lucide-react';

const App: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [marketFlow, setMarketFlow] = useState<MarketFlowData | null>(null);
  const [filter, setFilter] = useState<FilterType>(FilterType.ALL);
  const [search, setSearch] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [marketStatus, setMarketStatus] = useState<boolean>(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'heatmap'>('list');
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  
  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Toggle Theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#020617');
    } else {
      document.documentElement.classList.remove('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f1f5f9');
    }
  };

  // Initialize Data
  useEffect(() => {
    const initialStocks = initializeStocks();
    setStocks(initialStocks);
    setMarketFlow(getMarketFlowData());
    setMarketStatus(isMarketOpen());

    // Ensure correct class is set on load
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Auto-fetch real data on load
    const loadRealData = async () => {
      setIsSyncing(true);
      const liveData = await fetchAllStockPrices(initialStocks);
      if (Object.keys(liveData).length > 0) {
        setStocks(prev => mergeStockData(prev, liveData));
      }
      setIsSyncing(false);
      setInitialFetchDone(true);
    };

    loadRealData();
  }, []);

  // Listen for PWA Install Prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Live Simulation Tick
  useEffect(() => {
    const interval = setInterval(() => {
      const isOpen = isMarketOpen();
      setMarketStatus(isOpen);
      
      setStocks(prevStocks => updateStocks(prevStocks));
      
      if (isOpen && Math.random() > 0.9) {
          setMarketFlow(getMarketFlowData());
      }
    }, 2000); 
    return () => clearInterval(interval);
  }, []);

  // Filter Logic
  const filteredStocks = useMemo(() => {
    let result = stocks;

    if (search) {
      result = result.filter(s => 
        s.symbol.toLowerCase().includes(search.toLowerCase()) || 
        s.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    switch (filter) {
      case FilterType.TOP_GAINERS:
        return [...result].sort((a, b) => b.percentChange - a.percentChange).slice(0, 10);
      case FilterType.TOP_LOSERS:
        return [...result].sort((a, b) => a.percentChange - b.percentChange).slice(0, 10);
      case FilterType.RSI_OVERBOUGHT:
        return result.filter(s => s.rsi > 70).sort((a, b) => b.rsi - a.rsi);
      case FilterType.RSI_OVERSOLD:
        return result.filter(s => s.rsi < 30).sort((a, b) => a.rsi - b.rsi);
      case FilterType.VOLUME_SHOCKERS:
        return [...result].sort((a, b) => (b.volume/b.avgVolume) - (a.volume/a.avgVolume)).slice(0, 10);
      case FilterType.MOMENTUM_BULLISH:
        return result.filter(s => s.percentChange > 1 && s.rsi > 50 && s.rsi < 75);
      case FilterType.DAY_BREAKOUT:
        // Filter: Price within 1% of Day High, > 1.5% Gain, High Volume
        return result.filter(s => 
          s.percentChange > 1.5 && 
          s.price >= (s.high * 0.99) && 
          s.volume > s.avgVolume
        ).sort((a, b) => b.percentChange - a.percentChange);
      case FilterType.WEEK_BREAKOUT:
        // Price above simulated Week High OR very close to breaking it, High Volume
        return result.filter(s => 
          s.price >= (s.weekHigh * 0.99) && 
          s.volume > (s.avgVolume * 1.2)
        ).sort((a, b) => b.percentChange - a.percentChange);
      default:
        return result; // ALL
    }
  }, [stocks, filter, search]);

  // Handle AI Analysis
  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    const result = await analyzeMarket(stocks);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  }, [stocks]);

  // Handle Live Price Sync (Google Search)
  const handleSyncPrices = useCallback(async () => {
    setIsSyncing(true);
    const liveData = await fetchAllStockPrices(stocks);
    if (Object.keys(liveData).length > 0) {
      setStocks(prev => mergeStockData(prev, liveData));
    }
    setIsSyncing(false);
  }, [stocks]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const advances = stocks.filter(s => s.percentChange > 0).length;
  const declines = stocks.filter(s => s.percentChange < 0).length;

  const FilterButton = ({ type, label, activeColor }: { type: FilterType, label: string, activeColor: string }) => {
    const isActive = filter === type;
    return (
      <button 
        onClick={() => setFilter(type)}
        className={`relative px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 whitespace-nowrap overflow-hidden group ${
          isActive 
            ? `${activeColor} text-white shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-105 border-transparent` 
            : 'bg-slate-200/50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        <span className="relative z-10 flex items-center gap-1.5">
          {label}
        </span>
        {isActive && <div className="absolute inset-0 bg-white/20 blur-sm"></div>}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-slate-200 pb-24 selection:bg-cyan-500/30">
      
      {/* Header - Sticky with Safe Area support */}
      <header className="glass-panel sticky top-0 z-40 border-b border-slate-200/50 dark:border-slate-800/50 shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Activity className="text-white" size={20} />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                Nifty<span className="text-cyan-600 dark:text-cyan-400">Pulse</span>
              </h1>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-widest uppercase">Momentum Scanner</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Desktop Sync Button */}
             <button 
                onClick={handleSyncPrices}
                disabled={isSyncing}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all active:scale-95 text-xs font-medium ${isSyncing ? 'text-cyan-600 dark:text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-slate-600 dark:text-slate-300'}`}
             >
                <RefreshCcw size={14} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? "SYNCING..." : "SYNC PRICES"}
             </button>

             {/* Mobile Sync Icon */}
             <button 
                onClick={handleSyncPrices}
                disabled={isSyncing}
                className={`md:hidden p-2 rounded-full transition-colors ${isSyncing ? 'text-cyan-600 dark:text-cyan-400 animate-spin' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
             >
                <RefreshCcw size={20} />
             </button>

             {installPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white transition-all shadow-lg shadow-emerald-500/20 active:scale-95 text-xs font-bold uppercase tracking-wide"
                >
                  <Download size={14} />
                  Install
                </button>
             )}

             <button
               onClick={() => setShowQrModal(true)}
               className="p-2 text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors"
               title="Get Mobile Link"
             >
               <QrCode size={20} />
             </button>

             {/* Theme Toggle */}
             <button
               onClick={toggleTheme}
               className="p-2 text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-yellow-400 transition-colors"
               title="Toggle Theme"
             >
               {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             
             {/* Market Status Pulse */}
             <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800">
                {marketStatus ? (
                   <>
                     <span className="relative flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                     </span>
                     <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Live</span>
                   </>
                ) : (
                   <>
                     <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                     <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide">Closed</span>
                   </>
                )}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Top Section: AI & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Left: Quick Stats (Horizontal Scroll on Mobile) */}
           <div className="lg:col-span-2 space-y-6">
              
              {/* Quick Stats Container - Swipeable on mobile */}
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-2 md:grid-cols-4 no-scrollbar">
                
                {/* Card 1: Advances/Declines */}
                <div className="snap-center shrink-0 w-64 sm:w-auto bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/50 shadow-lg flex flex-col justify-between h-32 relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
                   <div className="relative z-10 flex justify-between items-start">
                      <h3 className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">Market Breadth</h3>
                      <Activity size={16} className="text-blue-500 dark:text-blue-400" />
                   </div>
                   <div className="relative z-10 flex items-end gap-4 mt-2">
                      <div>
                         <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xl">
                            <ArrowUpCircle size={18} /> {advances}
                         </div>
                         <div className="text-[10px] text-slate-500">Advances</div>
                      </div>
                      <div className="h-8 w-px bg-slate-300 dark:bg-slate-700"></div>
                      <div>
                         <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-xl">
                            <ArrowDownCircle size={18} /> {declines}
                         </div>
                         <div className="text-[10px] text-slate-500">Declines</div>
                      </div>
                   </div>
                </div>

                {/* Card 2: Top Gainer */}
                <div className="snap-center shrink-0 w-64 sm:w-auto bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/40 dark:to-slate-900/80 rounded-2xl p-4 border border-emerald-500/20 shadow-lg flex flex-col justify-between h-32 relative overflow-hidden group cursor-pointer hover:border-emerald-500/40 transition-colors"
                   onClick={() => stocks.length > 0 && setSelectedStock([...stocks].sort((a,b) => b.percentChange - a.percentChange)[0])}
                >
                   <div className="absolute -right-6 -top-6 bg-emerald-500/10 w-24 h-24 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors"></div>
                   <div className="relative z-10 flex justify-between items-start">
                      <h3 className="text-emerald-600/80 dark:text-emerald-400/80 text-[10px] font-bold uppercase tracking-wider">Top Gainer</h3>
                      <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
                   </div>
                   {stocks.length > 0 && (() => {
                      const best = [...stocks].sort((a,b) => b.percentChange - a.percentChange)[0];
                      return (
                        <div className="relative z-10">
                          <div className="text-xl font-bold text-slate-800 dark:text-white truncate">{best.symbol}</div>
                          <div className="flex items-baseline gap-2">
                             <div className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-lg">+{best.percentChange.toFixed(2)}%</div>
                             <div className="text-xs text-slate-500 dark:text-slate-400">₹{best.price.toFixed(0)}</div>
                          </div>
                        </div>
                      )
                   })()}
                </div>

                {/* Card 3: Top Loser */}
                <div className="snap-center shrink-0 w-64 sm:w-auto bg-gradient-to-br from-rose-50 to-white dark:from-rose-900/40 dark:to-slate-900/80 rounded-2xl p-4 border border-rose-500/20 shadow-lg flex flex-col justify-between h-32 relative overflow-hidden group cursor-pointer hover:border-rose-500/40 transition-colors"
                   onClick={() => stocks.length > 0 && setSelectedStock([...stocks].sort((a,b) => a.percentChange - b.percentChange)[0])}
                >
                   <div className="absolute -right-6 -top-6 bg-rose-500/10 w-24 h-24 rounded-full blur-xl group-hover:bg-rose-500/20 transition-colors"></div>
                   <div className="relative z-10 flex justify-between items-start">
                      <h3 className="text-rose-600/80 dark:text-rose-400/80 text-[10px] font-bold uppercase tracking-wider">Top Loser</h3>
                      <TrendingUp size={16} className="text-rose-600 dark:text-rose-400 rotate-180" />
                   </div>
                   {stocks.length > 0 && (() => {
                      const worst = [...stocks].sort((a,b) => a.percentChange - b.percentChange)[0];
                      return (
                        <div className="relative z-10">
                          <div className="text-xl font-bold text-slate-800 dark:text-white truncate">{worst.symbol}</div>
                          <div className="flex items-baseline gap-2">
                             <div className="text-rose-600 dark:text-rose-400 font-mono font-bold text-lg">{worst.percentChange.toFixed(2)}%</div>
                             <div className="text-xs text-slate-500 dark:text-slate-400">₹{worst.price.toFixed(0)}</div>
                          </div>
                        </div>
                      )
                   })()}
                </div>

                {/* Card 4: Volume Shocker */}
                <div className="snap-center shrink-0 w-64 sm:w-auto bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/30 dark:to-slate-900/80 rounded-2xl p-4 border border-amber-500/20 shadow-lg flex flex-col justify-between h-32 relative overflow-hidden group cursor-pointer hover:border-amber-500/40 transition-colors"
                    onClick={() => stocks.length > 0 && setSelectedStock([...stocks].sort((a, b) => (b.volume/b.avgVolume) - (a.volume/a.avgVolume))[0])}
                >
                   <div className="absolute -right-6 -top-6 bg-amber-500/10 w-24 h-24 rounded-full blur-xl group-hover:bg-amber-500/20 transition-colors"></div>
                   <div className="relative z-10 flex justify-between items-start">
                      <h3 className="text-amber-600/80 dark:text-amber-400/80 text-[10px] font-bold uppercase tracking-wider">Vol Shocker</h3>
                      <Zap size={16} className="text-amber-500 dark:text-amber-400" />
                   </div>
                   {stocks.length > 0 && (() => {
                      const shocker = [...stocks].sort((a, b) => (b.volume/b.avgVolume) - (a.volume/a.avgVolume))[0];
                      const volMultiple = (shocker.volume / shocker.avgVolume).toFixed(1);
                      return (
                        <div className="relative z-10">
                          <div className="text-xl font-bold text-slate-800 dark:text-white truncate">{shocker.symbol}</div>
                          <div className="flex items-baseline gap-2">
                             <div className="text-amber-600 dark:text-amber-400 font-mono font-bold text-lg">{volMultiple}x</div>
                             <div className="text-xs text-slate-500 dark:text-slate-400">Avg Vol</div>
                          </div>
                        </div>
                      )
                   })()}
                </div>
              </div>

              {/* AI Panel */}
              <AIInsightPanel analysis={aiAnalysis} loading={isAnalyzing} onAnalyze={handleAnalyze} />
           </div>

           {/* Right: Institutional Flow */}
           <div className="lg:col-span-1 h-full min-h-[300px]">
              <MarketFlowWidget data={marketFlow} />
           </div>
        </div>

        {/* Filters & Search Toolbar - Sticky */}
        <div className="sticky top-[64px] z-30 pt-2 pb-4 -mx-4 px-4 bg-gradient-to-b from-[var(--bg-color)] via-[var(--bg-color)] to-transparent">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            
            {/* Filter Chips - Horizontal Scroll */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
              <FilterButton type={FilterType.ALL} label="All Stocks" activeColor="bg-indigo-500 shadow-indigo-500/50" />
              <FilterButton type={FilterType.DAY_BREAKOUT} label="Day Breakout" activeColor="bg-blue-600 shadow-blue-500/50" />
              <FilterButton type={FilterType.WEEK_BREAKOUT} label="Wk Breakout" activeColor="bg-violet-600 shadow-violet-500/50" />
              <FilterButton type={FilterType.TOP_GAINERS} label="Top Gainers" activeColor="bg-emerald-600 shadow-emerald-500/50" />
              <FilterButton type={FilterType.TOP_LOSERS} label="Top Losers" activeColor="bg-rose-600 shadow-rose-500/50" />
              <FilterButton type={FilterType.MOMENTUM_BULLISH} label="Momentum Bull" activeColor="bg-cyan-600 shadow-cyan-500/50" />
              <FilterButton type={FilterType.VOLUME_SHOCKERS} label="Vol Shockers" activeColor="bg-amber-600 shadow-amber-500/50" />
              <FilterButton type={FilterType.RSI_OVERBOUGHT} label="Overbought" activeColor="bg-purple-600 shadow-purple-500/50" />
            </div>

            {/* View & Search */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="bg-white/80 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700/50 flex shrink-0">
                 <button 
                   onClick={() => setViewMode('list')}
                   className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-slate-200 dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                 >
                   <List size={18} />
                 </button>
                 <button 
                   onClick={() => setViewMode('heatmap')}
                   className={`p-2 rounded-md transition-all ${viewMode === 'heatmap' ? 'bg-cyan-100 dark:bg-cyan-600 text-cyan-700 dark:text-white shadow-[0_0_10px_rgba(8,145,178,0.4)]' : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
                 >
                   <LayoutGrid size={18} />
                 </button>
              </div>

              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search Nifty 50..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="animate-fade-in min-h-[400px]">
          {viewMode === 'list' ? (
            /* List View */
            <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4 font-semibold">Stock</th>
                      <th className="p-4 font-semibold text-right">Price</th>
                      <th className="p-4 font-semibold text-right">Change</th>
                      <th className="p-4 font-semibold text-right">Volume</th>
                      <th className="p-4 font-semibold text-center">RSI</th>
                      <th className="p-4 font-semibold">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                    {filteredStocks.map((stock) => {
                      const isUp = stock.percentChange >= 0;
                      
                      return (
                        <tr 
                          key={stock.symbol} 
                          onClick={() => setSelectedStock(stock)}
                          className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        >
                          <td className="p-4">
                            <div className="font-bold text-slate-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{stock.symbol}</div>
                            <div className="text-[10px] text-slate-500">{stock.name}</div>
                          </td>
                          <td className="p-4 text-right font-mono text-slate-700 dark:text-slate-200">
                            ₹{stock.price.toFixed(2)}
                          </td>
                          <td className="p-4 text-right">
                             <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold ${isUp ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                               {isUp ? '+' : ''}{stock.percentChange.toFixed(2)}%
                             </span>
                          </td>
                          <td className="p-4 text-right text-slate-500 dark:text-slate-400 font-mono text-xs">
                            {(stock.volume / 1000).toFixed(1)}K
                          </td>
                          <td className="p-4 text-center">
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 max-w-[60px] mx-auto overflow-hidden">
                               <div 
                                 className={`h-full ${stock.rsi > 70 ? 'bg-rose-500' : stock.rsi < 30 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                 style={{width: `${stock.rsi}%`}}
                               ></div>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1 block">{stock.rsi.toFixed(0)}</span>
                          </td>
                          <td className="p-4 w-32">
                            <StockChart 
                              data={stock.history} 
                              color={isUp ? '#34d399' : '#fb7185'} 
                              mini 
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredStocks.length === 0 && (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
                    <Filter size={32} className="opacity-20" />
                    <p>No stocks match current criteria.</p>
                </div>
              )}
            </div>
          ) : (
            /* Heatmap View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-8">
                {filteredStocks.map(stock => {
                    let bgClass = '';
                    let textClass = '';
                    let borderClass = 'border-transparent';
                    const p = stock.percentChange;

                    // Smoother Gradient Logic for Heatmap
                    if (p >= 3.0) {
                      // Extreme Bull (>3.0%)
                      bgClass = 'bg-emerald-600 dark:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.7)] z-10 scale-[1.03] ring-2 ring-emerald-400 dark:ring-emerald-300';
                      textClass = 'text-white font-bold';
                      borderClass = 'border-transparent';
                    } else if (p >= 1.5) {
                      // Strong Bull (>1.5%)
                      bgClass = 'bg-emerald-500 dark:bg-emerald-600 shadow-lg scale-[1.01]';
                      textClass = 'text-white font-bold';
                      borderClass = 'border-emerald-400/50';
                    } else if (p >= 0.8) {
                      // Moderate Bull (>0.8%)
                      bgClass = 'bg-emerald-400 dark:bg-emerald-700';
                      textClass = 'text-white dark:text-emerald-50 font-semibold';
                      borderClass = 'border-emerald-300/30 dark:border-emerald-500/30';
                    } else if (p >= 0.3) {
                      // Mild Bull (>0.3%)
                      bgClass = 'bg-emerald-300 dark:bg-emerald-800';
                      textClass = 'text-emerald-900 dark:text-emerald-100';
                      borderClass = 'border-emerald-400/30 dark:border-emerald-600/30';
                    } else if (p > 0) {
                      // Subtle Bull (>0.0%)
                      bgClass = 'bg-emerald-100 dark:bg-emerald-900/30';
                      textClass = 'text-emerald-800 dark:text-emerald-200';
                      borderClass = 'border-emerald-200 dark:border-emerald-800/30';
                    } else if (p <= -3.0) {
                      // Extreme Bear (<-3.0%)
                      bgClass = 'bg-rose-600 dark:bg-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.7)] z-10 scale-[1.03] ring-2 ring-rose-400 dark:ring-rose-300';
                      textClass = 'text-white font-bold';
                      borderClass = 'border-transparent';
                    } else if (p <= -1.5) {
                      // Strong Bear (<-1.5%)
                      bgClass = 'bg-rose-500 dark:bg-rose-600 shadow-lg scale-[1.01]';
                      textClass = 'text-white font-bold';
                      borderClass = 'border-rose-400/50';
                    } else if (p <= -0.8) {
                      // Moderate Bear (<-0.8%)
                      bgClass = 'bg-rose-400 dark:bg-rose-700';
                      textClass = 'text-white dark:text-rose-50 font-semibold';
                      borderClass = 'border-rose-300/30 dark:border-rose-500/30';
                    } else if (p <= -0.3) {
                      // Mild Bear (<-0.3%)
                      bgClass = 'bg-rose-300 dark:bg-rose-800';
                      textClass = 'text-rose-900 dark:text-rose-100';
                      borderClass = 'border-rose-400/30 dark:border-rose-600/30';
                    } else if (p < 0) {
                      // Subtle Bear (<0.0%)
                      bgClass = 'bg-rose-100 dark:bg-rose-900/30';
                      textClass = 'text-rose-800 dark:text-rose-200';
                      borderClass = 'border-rose-200 dark:border-rose-800/30';
                    } else {
                      // Neutral (0.00%) - Distinct from subtle
                      bgClass = 'bg-slate-200 dark:bg-slate-800';
                      textClass = 'text-slate-600 dark:text-slate-300 font-medium';
                      borderClass = 'border-slate-300 dark:border-slate-700';
                    }

                    return (
                        <div 
                           key={stock.symbol} 
                           onClick={() => setSelectedStock(stock)}
                           className={`${bgClass} ${textClass} border ${borderClass} p-3 rounded-xl backdrop-blur-sm transition-all hover:scale-105 active:scale-95 cursor-pointer flex flex-col items-center justify-center text-center h-28`}
                        >
                            <div className="font-bold text-sm tracking-tight">{stock.symbol}</div>
                            <div className="font-mono font-bold text-lg leading-none my-1.5 drop-shadow-sm">
                                {p > 0 ? '+' : ''}{p.toFixed(2)}%
                            </div>
                            <div className="opacity-80 text-[10px] font-mono">₹{stock.price.toFixed(0)}</div>
                        </div>
                    )
                })}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {selectedStock && <StockDetailModal stock={selectedStock} onClose={() => setSelectedStock(null)} />}

      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setShowQrModal(false)}>
          <div className="glass-panel p-6 rounded-2xl w-full max-w-xs relative text-center" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              <X size={20} />
            </button>
            <Smartphone className="text-cyan-500 mx-auto mb-4" size={40} />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Scan to Mobile</h3>
            <div className="bg-white p-3 rounded-xl inline-block mb-4 shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`} 
                alt="QR Code" 
                className="w-40 h-40"
              />
            </div>
            <p className="text-xs text-slate-500">Scan with your camera to open NiftyPulse on your phone.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;