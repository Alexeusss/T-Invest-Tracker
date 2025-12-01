import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { calculateCompoundInterest, formatCurrency } from '../utils';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calculator } from 'lucide-react';

export const ForecastPage: React.FC = () => {
  const { t } = useApp();
  const [initial, setInitial] = useState(100000);
  const [monthly, setMonthly] = useState(10000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(12);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    setData(calculateCompoundInterest(initial, monthly, years, rate));
  }, [initial, monthly, years, rate]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white mb-8">{t('forecast.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg space-y-5 h-fit">
          <div className="flex items-center gap-2 text-yellow-500 mb-2">
            <Calculator className="w-5 h-5" />
            <span className="font-semibold uppercase tracking-wider text-sm">{t('forecast.calculate')}</span>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">{t('forecast.initialAmount')}</label>
            <input 
              type="number" 
              value={initial}
              onChange={e => setInitial(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">{t('forecast.monthlyContribution')}</label>
            <input 
              type="number" 
              value={monthly}
              onChange={e => setMonthly(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm text-slate-400 mb-1">{t('forecast.years')}</label>
                <input 
                type="number" 
                value={years}
                onChange={e => setYears(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                />
            </div>
            <div>
                <label className="block text-sm text-slate-400 mb-1">{t('forecast.returnRate')}</label>
                <input 
                type="number" 
                value={rate}
                onChange={e => setRate(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white"
                />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
             <div className="flex justify-between items-end mb-1">
                <span className="text-slate-400">{t('forecast.total')}</span>
                <span className="text-2xl font-bold text-yellow-500">
                    {formatCurrency(data[data.length-1]?.total || 0, 'rub', 'ru-RU')}
                </span>
             </div>
          </div>
        </div>

        {/* Chart Panel */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="year" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={(val) => `${val/1000}k`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="invested" name={t('forecast.invested')} stackId="a" fill="#3b82f6" barSize={20} />
                    <Bar dataKey="interest" name={t('forecast.interest')} stackId="a" fill="#22c55e" barSize={20} />
                    <Line type="monotone" dataKey="total" name={t('forecast.total')} stroke="#eab308" strokeWidth={3} dot={{r:4}} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};