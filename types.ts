// API Types based on T-Bank Invest API
export interface MoneyValue {
  currency: string;
  units: string;
  nano: number;
}

export interface Quotation {
  units: string;
  nano: number;
}

export interface PortfolioPosition {
  figi: string;
  instrumentType: string;
  quantity: Quotation;
  averagePositionPrice: MoneyValue;
  currentPrice: MoneyValue;
  expectedYield: Quotation;
  dailyYield?: MoneyValue;
  instrumentUid: string;
}

export interface PortfolioResponse {
  totalAmountShares: MoneyValue;
  totalAmountBonds: MoneyValue;
  totalAmountEtf: MoneyValue;
  totalAmountCurrencies: MoneyValue;
  totalAmountFutures: MoneyValue;
  expectedYield: Quotation;
  positions: PortfolioPosition[];
}

export interface Operation {
  id: string;
  parentOperationId?: string;
  currency: string;
  payment: MoneyValue;
  price?: MoneyValue;
  state: string;
  quantity?: number;
  figi?: string;
  instrumentType?: string;
  date: string;
  type: string;
  operationType: string;
}

export interface OperationsResponse {
  operations: Operation[];
}

export interface Account {
  id: string;
  type: string;
  name: string;
  status: string;
}

export interface AccountsResponse {
  accounts: Account[];
}

export interface Dividend {
  dividendNet: MoneyValue;
  paymentDate: string;
  declaredDate: string;
  recordDate: string;
  yieldValue: Quotation;
}

export interface GetDividendsResponse {
  dividends: Dividend[];
}

export interface Coupon {
  figi: string;
  couponDate: string;
  couponNumber: number;
  fixDate: string;
  payOneBond: MoneyValue;
  couponType: string;
}

export interface GetBondCouponsResponse {
  events: Coupon[];
}

// Internal App Types
export interface AppState {
  apiKey: string | null;
  geminiKey: string | null;
  accounts: Account[];
  selectedAccountId: string | null;
  portfolios: Record<string, PortfolioResponse>; // Map accountId -> Portfolio
  instrumentNames: Record<string, string>; // Map FIGI -> Name
  isLoading: boolean;
  error: string | null;
  language: 'en' | 'ru';
}

export interface ForecastData {
  year: number;
  invested: number;
  interest: number;
  total: number;
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTED = 'connected',
  ERROR = 'error'
}