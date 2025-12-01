
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PortfolioResponse } from '../types';
import { moneyToNumber, formatCurrency, calculateCompoundInterest } from '../utils';
import { Wallet, TrendingUp, TrendingDown, RefreshCw, Briefcase, CreditCard, ArrowUpRight, ArrowDownRight, Activity, Calendar } from 'lucide-react';
import { TBankService } from '../services/tbank';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface UpcomingPayment {
  id: string;
  date: Date;
  figi: string;
  name: string;
  type: 'dividend' | 'coupon';
  amountPerUnit: number;
  currency: string;
  projectedTotal: number;
  accountName: string; // Added account name field
}

export const DashboardPage: React.FC = () => {
  const { t, state, refreshData } = useApp();
  const { portfolios, accounts, isLoading, apiKey, instrumentNames } = state;
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [netFlowData, setNetFlowData] = useState<any[]>([]);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [avgMonthlyTopUp, setAvgMonthlyTopUp] = useState(0);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);

  // 1. Flatten all positions
  const allPositions = Object.entries(portfolios).flatMap(([accountId, portfolio]) => {
    const account = accounts.find(a => a.id === accountId);
    const accountName = account?.name || 'Unknown Account';

    return (portfolio as PortfolioResponse).positions.map(pos => {
        const qty = moneyToNumber(pos.quantity);
        const currentPrice = moneyToNumber(pos.currentPrice);
        const totalYield = moneyToNumber(pos.expectedYield);
        
        const currentVal = currentPrice * qty;
        
        // --- ALL TIME CALC ---
        const costBasisAll = currentVal - totalYield;
        const totalYieldPercent = costBasisAll !== 0 ? (totalYield / costBasisAll) * 100 : 0;
        
        // --- 1D CALC ---
        // Using dailyYield provided by API (GetPortfolio now supports this)
        const dayChange = moneyToNumber(pos.dailyYield);

        return {
            ...pos,
            qty,
            currentVal,
            totalYield,       // All Time Yield Value
            totalYieldPercent,// All Time Yield %
            dayChange,        // 1D Yield Value
            accountName,
            accountId
        };
    });
  });

  // 2. Calculate Aggregates
  const grandTotalValue = allPositions.reduce((sum, pos) => sum + pos.currentVal, 0);
  const grandTotalYieldAllTime = allPositions.reduce((sum, pos) => sum + pos.totalYield, 0);
  const grandTotalDayChange = allPositions.reduce((sum, pos) => sum + pos.dayChange, 0);

  // 3. Display Logic (Always ALL TIME for Period Change)
  const displayedYield = grandTotalYieldAllTime;
  const totalCostBasis = grandTotalValue - grandTotalYieldAllTime;
  const displayedYieldPercent = totalCostBasis !== 0 ? (displayedYield / totalCostBasis) * 100 : 0;
  
  // Day Change %
  const dayStartValue = grandTotalValue - grandTotalDayChange;
  const displayedDayYieldPercent = dayStartValue !== 0 ? (grandTotalDayChange / dayStartValue) * 100 : 0;

  const isProfit = displayedYield >= 0;
  const isDayProfit = grandTotalDayChange >= 0;

  // 4. Sort for Top Gainers and Losers
  const sortedPositions = [...allPositions].sort((a, b) => b.totalYieldPercent - a.totalYieldPercent);
  
  // Removed .slice(0, 5) to show all
  const topGainers = sortedPositions.filter(p => p.totalYield > 0);
  const topLosers = sortedPositions.filter(p => p.totalYield < 0).reverse();

  // 5. Load History, Forecast & Payment Data
  useEffect(() => {
     if (!apiKey || accounts.length === 0) return;

     const loadExtraData = async () => {
         setIsChartLoading(true);
         setIsPaymentsLoading(true);
         const api = new TBankService(apiKey);
         
         try {
             const now = new Date();
             
             // For Forecast, we need history from year 2000 to cover all operations
             const timeWindowStart = new Date("2000-01-01");

             // Fetch operations for all accounts safely
             const operationsByAccount = await Promise.all(accounts.map(async (acc) => {
                 try {
                     const opsRes = await api.getOperations(acc.id, timeWindowStart, now);
                     return opsRes.operations;
                 } catch (e) { 
                     console.warn(`Failed to fetch operations for account ${acc.id}`, e);
                     return []; 
                 }
             }));

             const allOperations = operationsByAccount.flat();

             let totalPayIns = 0;
             let firstOperationDate = new Date();
             let hasOperations = false;

             // Process for Forecast (Account Age & Avg Top Up)
             if (allOperations.length > 0) {
                 hasOperations = true;
                 // Find oldest operation to determine accurate account age
                 const timestamps = allOperations.map(o => new Date(o.date).getTime());
                 const oldestTs = Math.min(...timestamps);
                 firstOperationDate = new Date(oldestTs);
                 
                 // Count Pay-Ins for contribution average
                 const payIns = allOperations.filter(op => {
                     const typeKey = (op.operationType || op.type || '').toUpperCase();
                     return typeKey.includes('PAY_IN') || typeKey.includes('INPUT');
                 });
                 
                 payIns.forEach(op => {
                     totalPayIns += moneyToNumber(op.payment);
                 });
             }

             // --- Forecast 30 Years Calculation ---
             const msDiff = now.getTime() - firstOperationDate.getTime();
             const monthsDiff = Math.max(1, msDiff / (1000 * 60 * 60 * 24 * 30.44));
             const avgMonthly = totalPayIns > 0 ? totalPayIns / monthsDiff : 0;
             setAvgMonthlyTopUp(avgMonthly);

             const forecast = calculateCompoundInterest(grandTotalValue, avgMonthly, 30, 12); 
             setForecastData(forecast);

             // --- Net Flow Chart Calculation ---
             // Fix: Use operationType primarily, then fallback to type, and ensure all money types are caught
             const flowOps = allOperations.filter(op => {
                 const typeKey = (op.operationType || op.type || '').toUpperCase();
                 
                 return [
                     'PAY_IN', 
                     'PAY_OUT', 
                     'INPUT', 
                     'OUTPUT', 
                     'DIVIDEND', 
                     'COUPON', 
                     'TAX', 
                     'FEE',
                     'OVERNIGHT'
                 ].some(t => typeKey.includes(t));
             });

             const monthlyFlows: Record<string, number> = {};
             flowOps.forEach(op => {
                 const monthKey = op.date.substring(0, 7); // YYYY-MM
                 const amount = moneyToNumber(op.payment);
                 monthlyFlows[monthKey] = (monthlyFlows[monthKey] || 0) + amount;
             });

             const sortedMonths = Object.keys(monthlyFlows).sort();
             let runningTotal = 0;
             const flowChartData = sortedMonths.map(month => {
                 runningTotal += monthlyFlows[month];
                 return {
                     date: month,
                     value: runningTotal
                 };
             });

             setNetFlowData(flowChartData);
             
             // --- Upcoming Payments Calculation (Dividends & Coupons) ---
             
             // 1. Identify unique assets to avoid duplicate API calls
             const uniqueFigis = new Set<string>();
             allPositions.forEach(pos => uniqueFigis.add(pos.figi));
             
             // 2. Fetch payment info for each unique asset
             const paymentsMap = new Map<string, { type: 'dividend' | 'coupon', events: any[] }>();
             const oneYearFromNow = new Date();
             oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

             await Promise.all(Array.from(uniqueFigis).map(async (figi) => {
                 const instrumentName = instrumentNames[figi] || figi;
                 // Determine type loosely based on instrumentType or just try both if unknown
                 // Optimization: Check the first position with this FIGI to see instrumentType
                 const samplePos = allPositions.find(p => p.figi === figi);
                 if (!samplePos) return;

                 try {
                     if (samplePos.instrumentType === 'share') {
                         const divRes = await api.getDividends(figi, now, oneYearFromNow);
                         if (divRes.dividends && divRes.dividends.length > 0) {
                             paymentsMap.set(figi, { type: 'dividend', events: divRes.dividends });
                         }
                     } else if (samplePos.instrumentType === 'bond') {
                         const couponRes = await api.getBondCoupons(figi, now, oneYearFromNow);
                         if (couponRes.events && couponRes.events.length > 0) {
                             paymentsMap.set(figi, { type: 'coupon', events: couponRes.events });
                         }
                     }
                 } catch (e) {
                     console.warn(`Failed to fetch payments for ${figi}`, e);
                 }
             }));

             // 3. Map payments back to specific account positions
             const payments: UpcomingPayment[] = [];

             allPositions.forEach(pos => {
                 const paymentInfo = paymentsMap.get(pos.figi);
                 if (!paymentInfo) return;

                 const name = instrumentNames[pos.figi] || pos.figi;

                 paymentInfo.events.forEach((event: any) => {
                     let payDate: Date;
                     let amount: number;
                     let currency: string;
                     let idBase: string;

                     if (paymentInfo.type === 'dividend') {
                         payDate = new Date(event.paymentDate);
                         amount = moneyToNumber(event.dividendNet);
                         currency = event.dividendNet.currency;
                         idBase = `div-${pos.accountId}`;
                     } else {
                         payDate = new Date(event.couponDate);
                         amount = moneyToNumber(event.payOneBond);
                         currency = event.payOneBond.currency;
                         idBase = `coup-${pos.accountId}`;
                     }

                     if (payDate > now) {
                         payments.push({
                             id: `${idBase}-${pos.figi}-${payDate.getTime()}`,
                             date: payDate,
                             figi: pos.figi,
                             name: name,
                             type: paymentInfo.type,
                             amountPerUnit: amount,
                             currency: currency,
                             projectedTotal: amount * pos.qty, // Calculate based on specific account quantity
                             accountName: pos.accountName
                         });
                     }
                 });
             });

             // Sort payments by date ASC
             payments.sort((a, b) => a.date.getTime() - b.date.getTime());
             setUpcomingPayments(payments);

         } catch (e) {
             console.error("Failed to load chart data", e);
         } finally {
             setIsChartLoading(false);
             setIsPaymentsLoading(false);
         }
     };

     loadExtraData();
  }, [apiKey, accounts.length, allPositions.length]); // Re-run if portfolio changes structure

  if (Object.keys(portfolios).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <Briefcase className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-xl">Please configure your API key in Settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <h1 className="text-3xl font-bold text-white">{t('nav.dashboard')}</h1>
        
        <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2 items-center">
                {apiKey === 'demo' && (
                    <span className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30">
                        {t('dashboard.demoMode')}
                    </span>
                )}
                <button 
                onClick={refreshData}
                disabled={isLoading}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
                title={t('dashboard.refresh')}
                >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </div>
      </div>

      {/* Global Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet className="w-24 h-24" />
          </div>
          <h3 className="text-slate-400 text-sm font-medium mb-1">{t('dashboard.totalBalance')}</h3>
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="text-2xl sm:text-3xl xl:text-4xl font-bold text-white tracking-tight break-words">
                {formatCurrency(grandTotalValue, 'rub', state.language === 'ru' ? 'ru-RU' : 'en-US')}
            </p>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <TrendingUp className="w-24 h-24 text-blue-500" />
          </div>
          <div className="flex items-center gap-2 mb-1">
             <h3 className="text-slate-400 text-sm font-medium">{t('dashboard.dayChange')}</h3>
             <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">1D</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
            <p className={`text-2xl sm:text-3xl xl:text-4xl font-bold tracking-tight break-words ${isDayProfit ? 'text-green-500' : 'text-red-500'}`}>
                {isDayProfit ? '+' : ''}{formatCurrency(grandTotalDayChange, 'rub', state.language === 'ru' ? 'ru-RU' : 'en-US')}
            </p>
            <span className={`text-sm font-bold px-2 py-1 rounded-md bg-slate-900/50 ${isDayProfit ? 'text-green-400' : 'text-red-400'}`}>
                {displayedDayYieldPercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group sm:col-span-2 lg:col-span-1">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            {isProfit ? <TrendingUp className="w-24 h-24 text-green-500" /> : <TrendingDown className="w-24 h-24 text-red-500" />}
          </div>
          <div className="flex items-center gap-2 mb-1">
             <h3 className="text-slate-400 text-sm font-medium">{t('dashboard.periodChange')}</h3>
             <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">ALL</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
            <p className={`text-2xl sm:text-3xl xl:text-4xl font-bold tracking-tight break-words ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                {isProfit ? '+' : ''}{formatCurrency(displayedYield, 'rub', state.language === 'ru' ? 'ru-RU' : 'en-US')}
            </p>
            <span className={`text-sm font-bold px-2 py-1 rounded-md bg-slate-900/50 ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                {displayedYieldPercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Account Breakdown */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-yellow-500"/>
            {t('dashboard.accounts')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(account => {
                const accountPositions = allPositions.filter(p => p.accountId === account.id);
                if (accountPositions.length === 0) return null;
                
                const accTotalVal = accountPositions.reduce((sum, p) => sum + p.currentVal, 0);
                const accDisplayYield = accountPositions.reduce((sum, p) => sum + p.totalYield, 0);
                const accIsProfit = accDisplayYield >= 0;

                return (
                    <div key={account.id} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg p-5 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                            <span className="font-medium text-slate-200 truncate pr-2">{account.name}</span>
                            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 whitespace-nowrap">
                                {account.type === 'ACCOUNT_TYPE_TINKOFF_IIS' ? 'IIS' : 'BROKER'}
                            </span>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <div className="text-xl sm:text-2xl font-bold text-white">
                                    {formatCurrency(accTotalVal)}
                                </div>
                                <div className={`text-sm ${accIsProfit ? 'text-green-500' : 'text-red-500'}`}>
                                    {accIsProfit ? '+' : ''}{formatCurrency(accDisplayYield)}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Charts Column */}
      <div className="space-y-6">
          
          {/* 30 Year Forecast Chart */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg h-[400px]">
             <div className="flex justify-between items-start mb-4">
                 <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-yellow-500" />
                        {t('dashboard.forecast30y')}
                    </h3>
                    <p className="text-xs text-slate-400">{t('dashboard.forecastSubtitle')}</p>
                 </div>
                 <div className="text-right">
                     <div className="text-xs text-slate-400">Avg. Top-up</div>
                     <div className="font-mono text-green-400 text-sm">+{formatCurrency(avgMonthlyTopUp)}/mo</div>
                 </div>
             </div>

            {isChartLoading ? (
                <div className="h-full flex items-center justify-center text-slate-500">Calculating...</div>
            ) : (
                <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={forecastData}>
                         <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} ticks={[0,5,10,15,20,25,30]} />
                        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `${(val/1000000).toFixed(1)}M`} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            formatter={(val: number) => [formatCurrency(val), 'Projected']}
                        />
                        <Area type="monotone" dataKey="total" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                    </AreaChart>
                </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Cumulative Net Flow Chart */}
             <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg h-[400px]">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            {t('dashboard.netFlow')}
                        </h3>
                    </div>
                </div>

                {isChartLoading ? (
                    <div className="h-full flex items-center justify-center text-slate-500">Processing Operations...</div>
                ) : netFlowData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-500">No flow data available</div>
                ) : (
                    <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={netFlowData}>
                            <defs>
                                <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                            <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                formatter={(val: number) => [formatCurrency(val), 'Net Invested']}
                            />
                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorFlow)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
             </div>

             {/* Upcoming Payments Widget */}
             <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg h-[400px] flex flex-col">
                <div className="flex items-center gap-2 mb-4 text-white">
                     <Calendar className="w-5 h-5 text-purple-500" />
                     <h3 className="text-lg font-semibold">{t('dashboard.upcomingPayments')}</h3>
                </div>
                
                <div className="flex-1 overflow-auto custom-scrollbar pr-2 space-y-3">
                     {isPaymentsLoading ? (
                         <div className="h-full flex items-center justify-center text-slate-500">Scanning portfolio...</div>
                     ) : upcomingPayments.length === 0 ? (
                         <div className="h-full flex items-center justify-center text-slate-500 text-sm text-center">
                             No declared payments found for the next 12 months.
                         </div>
                     ) : (
                         upcomingPayments.map(pay => (
                             <div key={pay.id} className="p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors border-l-4 border-purple-500">
                                 <div className="flex justify-between items-start">
                                     <div>
                                         <div className="font-medium text-slate-200">{pay.name}</div>
                                         <div className="flex flex-wrap items-center gap-2 mt-1">
                                             <span className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-600">
                                                 {pay.accountName}
                                             </span>
                                             <span className="text-xs bg-slate-900/50 px-1.5 py-0.5 rounded text-slate-400">
                                                 {t(`dashboard.paymentTypes.${pay.type}`)}
                                             </span>
                                             <span className="text-xs text-slate-500">{pay.date.toLocaleDateString()}</span>
                                         </div>
                                     </div>
                                     <div className="text-right">
                                         <div className="text-white font-bold text-sm">
                                             {formatCurrency(pay.projectedTotal, pay.currency)}
                                         </div>
                                         <div className="text-xs text-slate-500/70">
                                             {formatCurrency(pay.amountPerUnit, pay.currency)} / unit
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         ))
                     )}
                </div>
             </div>
          </div>
      </div>

      {/* Visualizations Row: Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Top Gainers */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col h-[500px]">
          <div className="flex items-center gap-2 mb-4 text-green-500">
            <ArrowUpRight className="w-5 h-5" />
            <h3 className="text-lg font-semibold">{t('dashboard.topGainers')}</h3>
          </div>
          <div className="flex-1 overflow-auto space-y-3 pr-2 custom-scrollbar">
            {topGainers.length > 0 ? topGainers.map((pos, idx) => {
                const yieldVal = pos.totalYield;
                const yieldPct = pos.totalYieldPercent;
                
                return (
                <div key={`gain-${idx}`} className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors border-l-4 border-green-500">
                    <div>
                        <div className="font-medium text-slate-200">{instrumentNames[pos.figi] || pos.figi}</div>
                        <div className="text-xs text-slate-500">{pos.accountName}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-green-400 font-bold text-sm">
                            +{yieldPct.toFixed(2)}%
                        </div>
                        <div className="text-xs text-green-500/70">
                            +{formatCurrency(yieldVal)}
                        </div>
                    </div>
                </div>
            )}) : (
                <div className="text-center py-8 text-slate-500 text-sm">No gainers found</div>
            )}
          </div>
        </div>

        {/* Right Column: Top Losers */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col h-[500px]">
          <div className="flex items-center gap-2 mb-4 text-red-500">
            <ArrowDownRight className="w-5 h-5" />
            <h3 className="text-lg font-semibold">{t('dashboard.topLosers')}</h3>
          </div>
          <div className="flex-1 overflow-auto space-y-3 pr-2 custom-scrollbar">
            {topLosers.length > 0 ? topLosers.map((pos, idx) => {
                const yieldVal = pos.totalYield;
                const yieldPct = pos.totalYieldPercent;

                return (
                <div key={`loss-${idx}`} className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors border-l-4 border-red-500">
                    <div>
                        <div className="font-medium text-slate-200">{instrumentNames[pos.figi] || pos.figi}</div>
                        <div className="text-xs text-slate-500">{pos.accountName}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-red-400 font-bold text-sm">
                            {yieldPct.toFixed(2)}%
                        </div>
                        <div className="text-xs text-red-500/70">
                            {formatCurrency(yieldVal)}
                        </div>
                    </div>
                </div>
            )}) : (
                 <div className="text-center py-8 text-slate-500 text-sm">No losers found</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
    