import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, Account, PortfolioResponse, ConnectionStatus } from '../types';
import { TRANSLATIONS } from '../constants';
import { TBankService } from '../services/tbank';

// Safe storage helpers
const getStorageItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn('LocalStorage access denied or failed:', e);
    return null;
  }
};

const setStorageItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('LocalStorage access denied or failed:', e);
  }
};

type Action =
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SET_GEMINI_KEY'; payload: string }
  | { type: 'SET_ACCOUNTS'; payload: Account[] }
  | { type: 'SET_PORTFOLIOS'; payload: Record<string, PortfolioResponse> }
  | { type: 'SET_INSTRUMENT_NAMES'; payload: Record<string, string> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'ru' };

const initialState: AppState = {
  // Default to 'demo' if no key is found in storage so the app works immediately
  apiKey: getStorageItem('tbank_token') || 'demo',
  geminiKey: getStorageItem('gemini_token') || '',
  accounts: [],
  selectedAccountId: null,
  portfolios: {},
  instrumentNames: {},
  isLoading: false,
  error: null,
  language: (getStorageItem('lang') as 'en' | 'ru') || 'en',
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  t: (key: string) => string;
  refreshData: () => Promise<void>;
  connectionStatus: ConnectionStatus;
}>({
  state: initialState,
  dispatch: () => null,
  t: () => '',
  refreshData: async () => {},
  connectionStatus: ConnectionStatus.DISCONNECTED,
});

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_API_KEY':
      setStorageItem('tbank_token', action.payload);
      return { ...state, apiKey: action.payload };
    case 'SET_GEMINI_KEY':
      setStorageItem('gemini_token', action.payload);
      return { ...state, geminiKey: action.payload };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload, selectedAccountId: action.payload[0]?.id || null };
    case 'SET_PORTFOLIOS':
      return { ...state, portfolios: action.payload };
    case 'SET_INSTRUMENT_NAMES':
      return { ...state, instrumentNames: { ...state.instrumentNames, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_LANGUAGE':
      setStorageItem('lang', action.payload);
      return { ...state, language: action.payload };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);

  // Translation helper
  const t = (path: string): string => {
    const keys = path.split('.');
    let current: any = TRANSLATIONS[state.language];
    for (const key of keys) {
      if (current[key] === undefined) return path;
      current = current[key];
    }
    return current;
  };

  const refreshData = async () => {
    if (!state.apiKey) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const api = new TBankService(state.apiKey);
      const accountsRes = await api.getAccounts();
      
      if (accountsRes.accounts.length === 0) {
        throw new Error("No accounts found");
      }
      
      dispatch({ type: 'SET_ACCOUNTS', payload: accountsRes.accounts });
      
      // Fetch portfolio for ALL accounts
      const portfolioMap: Record<string, PortfolioResponse> = {};
      
      await Promise.all(accountsRes.accounts.map(async (account) => {
        try {
          const portfolio = await api.getPortfolio(account.id);
          portfolioMap[account.id] = portfolio;
        } catch (e) {
          console.warn(`Failed to fetch portfolio for account ${account.id}`, e);
        }
      }));

      if (Object.keys(portfolioMap).length === 0) {
         throw new Error("Could not fetch data for any account");
      }

      dispatch({ type: 'SET_PORTFOLIOS', payload: portfolioMap });

      // Identify all unique FIGIs
      const allFigis = new Set<string>();
      Object.values(portfolioMap).forEach(p => {
        p.positions.forEach(pos => allFigis.add(pos.figi));
      });

      // 1. Fetch Missing Names
      const missingNamesFigis = Array.from(allFigis).filter(figi => !state.instrumentNames[figi]);
      if (missingNamesFigis.length > 0) {
        const newNames: Record<string, string> = {};
        await Promise.all(missingNamesFigis.map(async (figi) => {
             const name = await api.getInstrumentByFigi(figi);
             newNames[figi] = name;
        }));
        dispatch({ type: 'SET_INSTRUMENT_NAMES', payload: newNames });
      }

      setConnectionStatus(ConnectionStatus.CONNECTED);
    } catch (err: any) {
      console.error(err);
      dispatch({ type: 'SET_ERROR', payload: err.message });
      setConnectionStatus(ConnectionStatus.ERROR);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => {
    if (state.apiKey) {
      refreshData();
    }
  }, [state.apiKey]); // Re-run when API key changes

  return (
    <AppContext.Provider value={{ state, dispatch, t, refreshData, connectionStatus }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);