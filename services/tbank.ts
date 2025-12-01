import { TBANK_API_URL, DEMO_PORTFOLIO, DEMO_INSTRUMENTS, DEMO_OPERATIONS } from '../constants';
import { AccountsResponse, PortfolioResponse, OperationsResponse, GetDividendsResponse, GetBondCouponsResponse } from '../types';

export class TBankService {
  private token: string;

  constructor(token: string) {
    this.token = token.trim();
  }

  private async request<T>(endpoint: string, body: any = {}): Promise<T> {
    if (this.token === 'demo') {
      // Simulate network delay for demo
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (endpoint.includes('GetAccounts')) {
        return {
          accounts: [
            { id: 'demo_1', name: 'Брокерский счет', type: 'ACCOUNT_TYPE_TINKOFF', status: 'ACCOUNT_STATUS_OPEN' },
            { id: 'demo_2', name: 'ИИС', type: 'ACCOUNT_TYPE_TINKOFF_IIS', status: 'ACCOUNT_STATUS_OPEN' }
          ]
        } as unknown as T;
      }
      
      if (endpoint.includes('GetPortfolio')) {
        const accountId = body.accountId;
        // Return slightly different data for IIS vs Brokerage for realism
        if (accountId === 'demo_2') {
             const iisPortfolio = JSON.parse(JSON.stringify(DEMO_PORTFOLIO));
             iisPortfolio.totalAmountShares = { units: "80000", nano: 0, currency: "rub" };
             iisPortfolio.totalAmountBonds = { units: "120000", nano: 0, currency: "rub" };
             iisPortfolio.expectedYield = { units: "18000", nano: 0 };
             // Modify daily yields for variety
             iisPortfolio.positions = iisPortfolio.positions.map((p: any) => ({
                 ...p,
                 dailyYield: { units: "42", nano: 0, currency: "rub" }
             }));
             return iisPortfolio as unknown as T;
        }
        return DEMO_PORTFOLIO as unknown as T;
      }

      if (endpoint.includes('InstrumentsService/GetInstrumentBy')) {
          return { instrument: { name: DEMO_INSTRUMENTS[body.id] || body.id } } as unknown as T;
      }

      if (endpoint.includes('OperationsService/GetOperations')) {
        const fromDate = new Date(body.from);
        const filteredOps = DEMO_OPERATIONS.filter(op => new Date(op.date) >= fromDate);
        return { operations: filteredOps.length > 0 ? filteredOps : DEMO_OPERATIONS } as unknown as T;
      }
      
      if (endpoint.includes('MarketDataService/GetCandles')) {
          return {
              candles: Array.from({length: 30}).map((_, i) => {
                 const basePrice = 100;
                 // Create a slight upward trend with noise
                 const close = basePrice + (i * 0.5) + (Math.random() * 5 - 2.5);
                 return {
                     open: { units: Math.floor(close), nano: 0 },
                     close: { units: Math.floor(close), nano: 0 },
                     high: { units: Math.floor(close + 1), nano: 0 },
                     low: { units: Math.floor(close - 1), nano: 0 },
                     time: new Date(Date.now() - (30 - i) * 86400000).toISOString()
                 };
              })
          } as unknown as T;
      }

      if (endpoint.includes('InstrumentsService/GetDividends')) {
        // Mock Dividends for Sberbank only in demo
        if (body.figi === 'BBG004730N88') {
             return {
                 dividends: [
                     {
                         dividendNet: { units: "30", nano: 0, currency: "rub" },
                         paymentDate: new Date(Date.now() + 86400000 * 45).toISOString(), // +45 days
                         declaredDate: new Date().toISOString(),
                         recordDate: new Date().toISOString(),
                         yieldValue: { units: "0", nano: 0 }
                     }
                 ]
             } as unknown as T;
        }
        return { dividends: [] } as unknown as T;
      }

      if (endpoint.includes('InstrumentsService/GetBondCoupons')) {
         // Mock Bond coupons
         if (body.figi === 'BBG00T22ZKV2') {
             return {
                 events: [
                     {
                         figi: body.figi,
                         couponDate: new Date(Date.now() + 86400000 * 20).toISOString(), // +20 days
                         couponNumber: 1,
                         fixDate: new Date().toISOString(),
                         payOneBond: { units: "35", nano: 0, currency: "rub" },
                         couponType: "COUPON_TYPE_FIX"
                     },
                     {
                         figi: body.figi,
                         couponDate: new Date(Date.now() + 86400000 * 200).toISOString(), // +200 days
                         couponNumber: 2,
                         fixDate: new Date().toISOString(),
                         payOneBond: { units: "35", nano: 0, currency: "rub" },
                         couponType: "COUPON_TYPE_FIX"
                     }
                 ]
             } as unknown as T;
         }
         return { events: [] } as unknown as T;
      }

      throw new Error("Demo endpoint not found");
    }

    try {
      const response = await fetch(`${TBANK_API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-app-name': 't-invest-tracker'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        let errorDetails = response.statusText;
        
        try {
          // Attempt to parse structured error from API
          const jsonError = await response.json();
          errorDetails = jsonError.message || jsonError.description || jsonError.error || JSON.stringify(jsonError);
        } catch (e) {
          // Fallback to text if JSON parsing fails
          const textError = await response.text();
          if (textError && textError.length < 200) {
             errorDetails = textError;
          }
        }
        
        // Provide user-friendly hints for common codes
        if (response.status === 401) errorDetails = `Unauthorized (401) - Check your API Token. Message: ${errorDetails}`;
        else if (response.status === 403) errorDetails = `Forbidden (403) - Token may lack 'Read' scopes. Message: ${errorDetails}`;
        else errorDetails = `API Error ${response.status}: ${errorDetails}`;

        throw new Error(errorDetails);
      }

      return await response.json();
    } catch (error: any) {
      console.error("T-Bank API Error:", error);
      
      // If the error comes from the response.ok block above, re-throw it
      if (error.message && error.message.includes('API Error')) {
          throw error;
      }

      // SyntaxError means we got a response but it wasn't valid JSON
      if (error instanceof SyntaxError) {
         throw new Error("API Error: Received invalid response from server.");
      }

      // If we get here, fetch() likely threw, which almost always means Network Error or CORS in a browser
      // Browser security policies (CORS) block direct requests to T-Bank API from client-side apps.
      throw new Error(
        "Network/CORS Error: Browser blocked the request. T-Bank API does not support direct access from the browser. Please use 'demo' mode to test the application."
      );
    }
  }

  async getAccounts(): Promise<AccountsResponse> {
    return this.request<AccountsResponse>('tinkoff.public.invest.api.contract.v1.UsersService/GetAccounts');
  }

  async getPortfolio(accountId: string): Promise<PortfolioResponse> {
    return this.request<PortfolioResponse>('tinkoff.public.invest.api.contract.v1.OperationsService/GetPortfolio', {
      accountId
    });
  }

  async getOperations(accountId: string, from: Date, to: Date): Promise<OperationsResponse> {
    return this.request<OperationsResponse>('tinkoff.public.invest.api.contract.v1.OperationsService/GetOperations', {
      accountId,
      from: from.toISOString(),
      to: to.toISOString(),
      state: "OPERATION_STATE_EXECUTED"
    });
  }

  async getInstrumentByFigi(figi: string): Promise<string> {
    if (this.token === 'demo') {
       return DEMO_INSTRUMENTS[figi] || figi;
    }
    
    try {
        const res = await this.request<any>('tinkoff.public.invest.api.contract.v1.InstrumentsService/GetInstrumentBy', {
            idType: "INSTRUMENT_ID_TYPE_FIGI",
            id: figi
        });
        return res.instrument?.name || figi;
    } catch (e) {
        console.warn(`Failed to fetch instrument name for ${figi}`, e);
        return figi;
    }
  }

  async getDividends(figi: string, from: Date, to: Date): Promise<GetDividendsResponse> {
      return this.request<GetDividendsResponse>('tinkoff.public.invest.api.contract.v1.InstrumentsService/GetDividends', {
          figi,
          from: from.toISOString(),
          to: to.toISOString()
      });
  }

  async getBondCoupons(figi: string, from: Date, to: Date): Promise<GetBondCouponsResponse> {
      return this.request<GetBondCouponsResponse>('tinkoff.public.invest.api.contract.v1.InstrumentsService/GetBondCoupons', {
          figi,
          from: from.toISOString(),
          to: to.toISOString()
      });
  }
}