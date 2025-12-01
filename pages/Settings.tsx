
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Save, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import { ConnectionStatus } from '../types';

export const SettingsPage: React.FC = () => {
  const { t, state, dispatch, refreshData, connectionStatus } = useApp();
  // If key is 'demo', show empty string to allow user to input a real key easily
  const [localKey, setLocalKey] = useState(state.apiKey === 'demo' ? '' : state.apiKey || '');

  const handleSave = async () => {
    // If user saves empty string, revert to 'demo' so app stays functional
    const keyToSave = localKey.trim() === '' ? 'demo' : localKey.trim();
    
    dispatch({ type: 'SET_API_KEY', payload: keyToSave });
    // Trigger refresh immediately (useEffect in AppContext will also trigger it, but this feels snappier)
    if (keyToSave !== state.apiKey) {
        // Only if changed, to avoid double fetch if effect handles it
    } else {
        await refreshData();
    }
  };

  const isDemo = state.apiKey === 'demo';

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-8">{t('settings.title')}</h1>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl max-w-2xl">
        
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-4 mb-8 bg-slate-900/50 p-4 rounded-lg">
          <div className={`w-3 h-3 rounded-full ${
            !isDemo && connectionStatus === ConnectionStatus.CONNECTED ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 
            connectionStatus === ConnectionStatus.ERROR ? 'bg-red-500' : 'bg-slate-500'
          }`} />
          <div className="flex-1">
            <h3 className="font-medium text-white">
              {isDemo ? t('settings.noConnection') : 
               connectionStatus === ConnectionStatus.CONNECTED ? t('settings.connected') : 
               connectionStatus === ConnectionStatus.ERROR ? t('settings.failed') : 'Disconnected'}
            </h3>
            {state.error && <p className="text-sm text-red-400 mt-1">{state.error}</p>}
          </div>
          {!isDemo && connectionStatus === ConnectionStatus.CONNECTED && <CheckCircle className="text-green-500 w-6 h-6" />}
          {connectionStatus === ConnectionStatus.ERROR && <XCircle className="text-red-500 w-6 h-6" />}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-400">
                {t('settings.tbankKey')}
                </label>
            </div>
            <input
              type="password"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="Enter your API token..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
            />
            <p className="text-xs text-slate-500 mt-2">
              Leave empty to use Demo Mode.
            </p>
          </div>

          <div className="flex items-start gap-3 bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
            <ShieldAlert className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-200/80">
              {t('settings.securityNote')}
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={state.isLoading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isLoading ? (
              <span className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {t('settings.save')} & {t('settings.testConnection')}
          </button>
        </div>
      </div>
    </div>
  );
};