import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeStocks, updateStocks, getMarketFlowData, isMarketOpen, mergeStockData } from './services/stockService';
import { analyzeMarket, fetchAllStockPrices } from './services/geminiService';
import { Stock, FilterType, AIAnalysisResult, MarketFlowData } from './types';
import StockChart from './components/StockChart';
import AIInsightPanel from './components/AIInsightPanel';
import MarketFlowWidget from './components/MarketFlowWidget';
import StockDetailModal from './components/StockDetailModal';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Filter,
  Search,
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
  Moon,
  BarChart3,
  Layers
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

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0f172a');
    } else {
      document.documentElement.classList.remove('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#f8fafc');
    }
  };

  useEffect(() => {
    const initialStocks = initializeStocks();
    setStocks(initialStocks);
    setMarketFlow(getMarketFlowData());
    setMarketStatus(isMarketOpen());

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const loadRealData = async () => {
      setIsSyncing(true);
      const liveData = await fetchAllStockPrices(initialStocks);
      if (Object.keys(liveData).length > 0) {
        setStocks(prev => mergeStockData(prev, liveData));
      }
      setIsSyncing(false);
    };

    loadRealData();
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

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
        return result.filter(s => 
          s.percentChange > 1.5 && 
          s.price >= (s.high * 0.99) && 
          s.volume > s.avgVolume
        ).sort((a, b) => b.percentChange - a.percentChange);
      case FilterType.WEEK_BREAKOUT:
        return result.filter(s => 
          s.price >= (s.weekHigh * 0.99) && 
          s.volume > (s.avgVolume * 1.2)
        ).sort((a, b) => b.percentChange - a.percentChange);
      default:
        return result;
    }
  }, [stocks, filter, search]);

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    const result = await analyzeMarket(stocks);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  }, [stocks]);

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

  const FilterButton = ({ type, label }: { type: FilterType, label: string }) => {
    const isActive = filter === type;
    return (
      <button 
        onClick={() => setFilter(type)}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
          isActive 
            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform scale-105' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-800 dark:text-slate-200 pb-24 selection:bg-cyan-500/30">
      
      {/* App Bar / Header */}
      <header className="glass-panel sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-9 w-9 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Activity className="text-white" size={20} />
             </div>
             <div>
               <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                 Nifty<span className="text-cyan-600 dark:text-cyan-400">Pulse</span>
               </h1>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">MOMENTUM SCANNER</span>
                 {marketStatus ? (
                   <span className="flex items-center gap-1">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Live</span>
                   </span>
                 ) : (
                   <span className="text-[9px] font-bold text-rose-500 dark:text-rose-400 uppercase bg-rose-100 dark:bg-rose-900/30 px-1 rounded-sm">Closed</span>
                 )}
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
             {/* Action Buttons */}
             <button 
                onClick={handleSyncPrices}
                disabled={isSyncing}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${isSyncing ? 'text-cyan-600' : 'text-slate-600 dark:text-slate-300'}`}
             >
                <RefreshCcw size={14} className={isSyncing ? "animate-spin" : ""} />
                <span className="hidden md:inline">{isSyncing ? "Syncing..." : "Sync Prices"}</span>
             </button>

             <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>

             {installPrompt && (
                <button onClick={handleInstallClick} className="hidden md:flex p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400" title="Install App">
                  <Download size={18} />
                </button>
             )}

             <button onClick={() => setShowQrModal(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors" title="QR Code">
               <QrCode size={18} />
             </button>

             <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors" title="Toggle Theme">
               {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Dashboard Widgets Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           
           {/* Left Col: Market Overview & AI */}
           <div className="lg:col-span-8 space-y-6">
              
              {/* Quick Stats Row - Horizontal Scroll on Mobile */}
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:grid-cols-4 no-scrollbar">
                
                {/* Stat Card 1: Breadth */}
                <div className="dashboard-card rounded-xl p-4 flex flex-col justify-between h-28 min-w-[160px] snap-center">
                   <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Breadth</span>
                      <Activity size={16} className="text-indigo-500" />
                   </div>
                   <div className="flex items-center justify-between mt-2">
                      <div className="text-center">
                         <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 leading-none">{advances}</div>
                         <div className="text-[10px] text-slate-400 mt-1">Adv</div>
                      </div>
                      <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                      <div className="text-center">
                         <div className="text-lg font-bold text-rose-600 dark:text-rose-400 leading-none">{declines}</div>
                         <div className="text-[10px] text-slate-400 mt-1">Dec</div>
                      </div>
                   </div>
                </div>

                {/* Stat Card 2: Top Gainer */}
                <div 
                   className="dashboard-card rounded-xl p-4 flex flex-col justify-between h-28 min-w-[160px] snap-center cursor-pointer hover:border-emerald-500/30 transition-colors group"
                   onClick={() => stocks.length > 0 && setSelectedStock([...stocks].sort((a,b) => b.percentChange - a.percentChange)[0])}
                >
                   <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Top Gainer</span>
                      <TrendingUp size={16} className="text-emerald-500" />
                   </div>
                   {stocks.length > 0 && (() => {
                      const best = [...stocks].sort((a,b) => b.percentChange - a.percentChange)[0];
                      return (
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white truncate text-base">{best.symbol}</div>
                          <div className="flex items-baseline gap-2 mt-0.5">
                             <div className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm">+{best.percentChange.toFixed(2)}%</div>
                          </div>
                        </div>
                      )
                   })()}
                </div>

                {/* Stat Card 3: Top Loser */}
                <div 
                   className="dashboard-card rounded-xl p-4 flex flex-col justify-between h-28 min-w-[160px] snap-center cursor-pointer hover:border-rose-500/30 transition-colors"
                   onClick={() => stocks.length > 0 && setSelectedStock([...stocks].sort((a,b) => a.percentChange - b.percentChange)[0])}
                >
                   <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide">Top Loser</span>
                      <TrendingUp size={16} className="text-rose-500 rotate-180" />
                   </div>
                   {stocks.length > 0 && (() => {
                      const worst = [...stocks].sort((a,b) => a.percentChange - b.percentChange)[0];
                      return (
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white truncate text-base">{worst.symbol}</div>
                          <div className="flex items-baseline gap-2 mt-0.5">
                             <div className="text-rose-600 dark:text-rose-400 font-mono font-bold text-sm">{worst.percentChange.toFixed(2)}%</div>
                          </div>
                        </div>
                      )
                   })()}
                </div>

                {/* Stat Card 4: Vol Shocker */}
                <div 
                   className="dashboard-card rounded-xl p-4 flex flex-col justify-between h-28 min-w-[160px] snap-center cursor-pointer hover:border-amber-500/30 transition-colors"
                   onClick={() => stocks.length > 0 && setSelectedStock([...stocks].sort((a, b) => (b.volume/b.avgVolume) - (a.volume/a.avgVolume))[0])}
                >
                   <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Volume</span>
                      <Zap size={16} className="text-amber-500" />
                   </div>
                   {stocks.length > 0 && (() => {
                      const shocker = [...stocks].sort((a, b) => (b.volume/b.avgVolume) - (a.volume/a.avgVolume))[0];
                      const volMultiple = (shocker.volume / shocker.avgVolume).toFixed(1);
                      return (
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white truncate text-base">{shocker.symbol}</div>
                          <div className="flex items-baseline gap-2 mt-0.5">
                             <div className="text-amber-600 dark:text-amber-400 font-mono font-bold text-sm">{volMultiple}x <span className="text-[10px] text-slate-400 font-sans font-normal">Avg</span></div>
                          </div>
                        </div>
                      )
                   })()}
                </div>
              </div>

              {/* AI Panel */}
              <AIInsightPanel analysis={aiAnalysis} loading={isAnalyzing} onAnalyze={handleAnalyze} />
           </div>

           {/* Right Col: Institutional Flow */}
           <div className="lg:col-span-4 h-full min-h-[300px]">
              <MarketFlowWidget data={marketFlow} />
           </div>
        </div>

        {/* Floating Filter Bar */}
        <div className="sticky top-[72px] z-30 pt-2 pb-4 -mx-4 px-4 bg-gradient-to-b from-[var(--bg-color)] via-[var(--bg-color)] to-transparent">
          <div className="dashboard-card rounded-2xl p-2 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
            
            {/* Filter Chips - Horizontal Scroll */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto px-1">
              <FilterButton type={FilterType.ALL} label="All" />
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0"></div>
              <FilterButton type={FilterType.DAY_BREAKOUT} label="Day Breakout" />
              <FilterButton type={FilterType.WEEK_BREAKOUT} label="Wk Breakout" />
              <FilterButton type={FilterType.MOMENTUM_BULLISH} label="Bullish" />
              <FilterButton type={FilterType.VOLUME_SHOCKERS} label="Volume" />
              <FilterButton type={FilterType.TOP_GAINERS} label="Gainers" />
              <FilterButton type={FilterType.TOP_LOSERS} label="Losers" />
            </div>

            {/* View & Search */}
            <div className="flex items-center gap-2 w-full md:w-auto px-1">
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex shrink-0 border border-slate-200 dark:border-slate-700">
                 <button 
                   onClick={() => setViewMode('list')}
                   className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 text-cyan-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                 >
                   <List size={16} />
                 </button>
                 <button 
                   onClick={() => setViewMode('heatmap')}
                   className={`p-1.5 rounded-md transition-all ${viewMode === 'heatmap' ? 'bg-white dark:bg-slate-600 text-cyan-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                 >
                   <LayoutGrid size={16} />
                 </button>
              </div>

              <div className="relative flex-1 md:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Search Stocks..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pl-8 pr-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="animate-fade-in min-h-[400px]">
          {viewMode === 'list' ? (
            /* List View */
            <div className="dashboard-card rounded-xl overflow-hidden shadow-lg border-0 ring-1 ring-slate-900/5 dark:ring-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-3 px-4">Symbol</th>
                      <th className="py-3 px-4 text-right">Price</th>
                      <th className="py-3 px-4 text-right">Change</th>
                      <th className="py-3 px-4 text-right">Volume</th>
                      <th className="py-3 px-4 text-center">RSI</th>
                      <th className="py-3 px-4">Intraday</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStocks.map((stock) => {
                      const isUp = stock.percentChange >= 0;
                      return (
                        <tr 
                          key={stock.symbol} 
                          onClick={() => setSelectedStock(stock)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{stock.symbol}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{stock.name}</div>
                          </td>
                          <td className="py-3 px-4 text-right">
                             <div className="font-mono text-sm text-slate-700 dark:text-slate-300">₹{stock.price.toFixed(2)}</div>
                          </td>
                          <td className="py-3 px-4 text-right">
                             <div className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                               {isUp ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                               {Math.abs(stock.percentChange).toFixed(2)}%
                             </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-xs text-slate-500 font-mono">{(stock.volume / 1000).toFixed(0)}K</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="w-12 mx-auto bg-slate-200 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                               <div 
                                 className={`h-full rounded-full ${stock.rsi > 70 ? 'bg-rose-500' : stock.rsi < 30 ? 'bg-emerald-500' : 'bg-indigo-400'}`} 
                                 style={{width: `${stock.rsi}%`}}
                               ></div>
                            </div>
                            <span className="text-[9px] text-slate-400 mt-1 block font-mono">{stock.rsi.toFixed(0)}</span>
                          </td>
                          <td className="py-3 px-4 w-28">
                            <div className="opacity-80 group-hover:opacity-100 transition-opacity">
                              <StockChart 
                                data={stock.history} 
                                color={isUp ? '#10b981' : '#f43f5e'} 
                                mini 
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredStocks.length === 0 && (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
                    <Filter size={32} className="opacity-20" />
                    <p className="text-sm">No stocks found matching current criteria.</p>
                </div>
              )}
            </div>
          ) : (
            /* Heatmap View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-8">
                {filteredStocks.map(stock => {
                    const p = stock.percentChange;
                    let bgClass = '', textClass = '', borderClass = '';

                    // Template-style Heatmap Colors
                    if (p >= 3.0) {
                      bgClass = 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400/50';
                      borderClass = 'border-transparent';
                    } else if (p >= 1.5) {
                      bgClass = 'bg-emerald-500 text-white';
                      borderClass = 'border-transparent';
                    } else if (p >= 0.5) {
                      bgClass = 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200';
                      borderClass = 'border-emerald-200 dark:border-emerald-800';
                    } else if (p > 0) {
                      bgClass = 'bg-slate-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400';
                      borderClass = 'border-slate-200 dark:border-slate-700';
                    } else if (p <= -3.0) {
                      bgClass = 'bg-rose-600 text-white shadow-lg ring-2 ring-rose-400/50';
                      borderClass = 'border-transparent';
                    } else if (p <= -1.5) {
                      bgClass = 'bg-rose-500 text-white';
                      borderClass = 'border-transparent';
                    } else if (p <= -0.5) {
                      bgClass = 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200';
                      borderClass = 'border-rose-200 dark:border-rose-800';
                    } else {
                      bgClass = 'bg-slate-50 dark:bg-slate-800 text-rose-700 dark:text-rose-400';
                      borderClass = 'border-slate-200 dark:border-slate-700';
                    }

                    return (
                        <div 
                           key={stock.symbol} 
                           onClick={() => setSelectedStock(stock)}
                           className={`${bgClass} border ${borderClass} rounded-xl p-3 cursor-pointer transition-transform hover:-translate-y-1 hover:shadow-md flex flex-col items-center justify-center text-center h-24`}
                        >
                            <div className="font-bold text-xs tracking-tight">{stock.symbol}</div>
                            <div className="font-mono font-bold text-base leading-none my-1">
                                {p > 0 ? '+' : ''}{p.toFixed(2)}%
                            </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowQrModal(false)}>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-xs relative text-center shadow-2xl border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              <X size={20} />
            </button>
            <Smartphone className="text-cyan-600 dark:text-cyan-400 mx-auto mb-4" size={32} />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Mobile Access</h3>
            <div className="bg-white p-3 rounded-xl inline-block mb-4 border border-slate-100 shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.href)}`} 
                alt="QR Code" 
                className="w-32 h-32"
              />
            </div>
            <p className="text-xs text-slate-500">Scan to open on your phone.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;