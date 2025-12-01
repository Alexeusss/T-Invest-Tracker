import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { TBankService } from '../services/tbank';
import { Operation } from '../types';
import { moneyToNumber, formatCurrency } from '../utils';
import { Calendar, Briefcase, RefreshCw, ArrowDownLeft, ArrowUpRight, Percent, FileText } from 'lucide-react';

export const EventsPage: React.FC = () => {
  const { t, state } = useApp();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!state.apiKey) return;
    setIsLoading(true);
    setError(null);
    setOperations([]);

    try {
      const api = new TBankService(state.apiKey);
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 30); // Last 30 days

      let allOps: (Operation & { accountName: string })[] = [];

      // Fetch operations for all known accounts
      await Promise.all(state.accounts.map(async (account) => {
        try {
          const res = await api.getOperations(account.id, from, to);
          const opsWithAccount = res.operations.map(op => ({
            ...op,
            accountName: account.name
          }));
          allOps = [...allOps, ...opsWithAccount];
        } catch (e) {
          console.warn(`Failed to fetch operations for ${account.name}`, e);
        }
      }));

      // Sort by date descending
      allOps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setOperations(allOps);
    } catch (e: any) {
      setError(e.message || "Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (state.apiKey) {
      fetchEvents();
    }
  }, [state.apiKey]);

  const getIcon = (type: string) => {
    if (type.includes('BUY')) return <ArrowDownLeft className="text-red-400 w-5 h-5" />;
    if (type.includes('SELL')) return <ArrowUpRight className="text-green-400 w-5 h-5" />;
    if (type.includes('DIVIDEND') || type.includes('COUPON')) return <Percent className="text-yellow-400 w-5 h-5" />;
    return <FileText className="text-slate-400 w-5 h-5" />;
  };

  const getOperationLabel = (type: string) => {
    const key = `events.types.${type}`;
    // Simple check if translation key exists, else fallback to raw type
    const translation = t(key);
    return translation === key ? type.replace('OPERATION_TYPE_', '') : translation;
  };

  if (!state.apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <Briefcase className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-xl">Please configure your API key in Settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-yellow-500" />
            {t('events.title')}
        </h1>
        <button 
          onClick={fetchEvents}
          disabled={isLoading}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-sm border-b border-slate-700">
                <th className="p-4 font-medium">{t('events.date')}</th>
                <th className="p-4 font-medium">{t('events.type')}</th>
                <th className="p-4 font-medium">{t('events.asset')}</th>
                <th className="p-4 font-medium">{t('events.account')}</th>
                <th className="p-4 font-medium text-right">{t('events.amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {isLoading && operations.length === 0 ? (
                <tr>
                   <td colSpan={5} className="p-8 text-center text-slate-500">{t('common.loading')}</td>
                </tr>
              ) : operations.length === 0 ? (
                <tr>
                   <td colSpan={5} className="p-8 text-center text-slate-500">{t('events.noEvents')}</td>
                </tr>
              ) : (
                operations.map((op) => {
                  const amount = moneyToNumber(op.payment);
                  const isPositive = amount > 0;
                  const assetName = op.figi ? (state.instrumentNames[op.figi] || op.figi) : '-';

                  return (
                    <tr key={op.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-4 text-slate-300 text-sm whitespace-nowrap">
                        {new Date(op.date).toLocaleDateString()} <span className="text-slate-500 text-xs ml-1">{new Date(op.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="p-4 text-white">
                        <div className="flex items-center gap-3">
                          <div className="bg-slate-900 p-2 rounded-lg border border-slate-700">
                            {getIcon(op.type)}
                          </div>
                          <span className="font-medium">{getOperationLabel(op.type)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">
                         {assetName}
                      </td>
                       <td className="p-4 text-slate-400 text-sm">
                         {(op as any).accountName}
                      </td>
                      <td className={`p-4 text-right font-bold ${isPositive ? 'text-green-400' : 'text-slate-200'}`}>
                        {formatCurrency(amount, op.payment.currency)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
