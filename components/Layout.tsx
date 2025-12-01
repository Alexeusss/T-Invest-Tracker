import React from 'react';
import { useApp } from '../context/AppContext';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Settings, Globe, FileText } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, state, dispatch } = useApp();

  const toggleLang = () => {
    dispatch({ type: 'SET_LANGUAGE', payload: state.language === 'en' ? 'ru' : 'en' });
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-yellow-500 w-10 h-10 rounded-lg flex items-center justify-center shadow-lg shadow-yellow-500/20 shrink-0">
            <span className="text-slate-900 font-black text-2xl select-none">T</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Invest Tracker</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink 
            to="/" 
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-yellow-500/10 text-yellow-500' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            {t('nav.dashboard')}
          </NavLink>
          <NavLink 
            to="/operations" 
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-yellow-500/10 text-yellow-500' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`}
          >
            <FileText className="w-5 h-5" />
            {t('nav.operations')}
          </NavLink>
          <NavLink 
            to="/forecast" 
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-yellow-500/10 text-yellow-500' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`}
          >
            <TrendingUp className="w-5 h-5" />
            {t('nav.forecast')}
          </NavLink>
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-yellow-500/10 text-yellow-500' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'}`}
          >
            <Settings className="w-5 h-5" />
            {t('nav.settings')}
          </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={toggleLang}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white w-full px-4 py-2 rounded transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>{state.language === 'en' ? 'English' : 'Русский'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header (visible only on small screens) */}
      <div className="md:hidden fixed top-0 w-full bg-slate-800 z-50 p-4 border-b border-slate-700 flex justify-between items-center">
         <div className="flex items-center gap-2">
            <div className="bg-yellow-500 w-8 h-8 rounded-md flex items-center justify-center shrink-0">
                <span className="text-slate-900 font-black text-lg select-none">T</span>
            </div>
            <span className="font-bold text-lg text-white">Invest Tracker</span>
         </div>
         <button onClick={toggleLang} className="p-2 text-slate-400"><Globe className="w-5 h-5"/></button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-auto mt-14 md:mt-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};