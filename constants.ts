

export const TBANK_API_URL = 'https://invest-public-api.tinkoff.ru/rest';

export const TRANSLATIONS = {
  en: {
    nav: {
      dashboard: 'Dashboard',
      forecast: 'Calculator',
      settings: 'Settings',
      operations: 'Operations List',
    },
    dashboard: {
      totalBalance: 'Total Balance',
      dayChange: 'Total Day Change',
      periodChange: 'Total Period Change',
      assetAllocation: 'Asset Allocation',
      recentPositions: 'Top Positions',
      topGainers: 'Top Gainers',
      topLosers: 'Top Losers',
      accounts: 'My Accounts',
      stocks: 'Stocks',
      bonds: 'Bonds',
      etfs: 'ETFs',
      currencies: 'Currencies',
      refresh: 'Refresh Data',
      demoMode: 'Demo Mode Active',
      forecast30y: '30-Year Wealth Projection',
      forecastSubtitle: 'Based on historical top-ups',
      netFlow: 'Cumulative Net Flow',
      upcomingPayments: 'Upcoming Payments',
      paymentTypes: {
        dividend: 'Dividend',
        coupon: 'Coupon'
      },
      ranges: {
        '1d': 'Today',
        'all': 'All Time'
      }
    },
    operations: {
      title: 'Operations List',
      date: 'Date',
      type: 'Operation',
      asset: 'Asset',
      amount: 'Amount',
      account: 'Account',
      noOperations: 'No operations found.',
      loadMore: 'Load More',
      types: {
        'OPERATION_TYPE_BUY': 'Buy',
        'OPERATION_TYPE_SELL': 'Sell',
        'OPERATION_TYPE_DIVIDEND': 'Dividend',
        'OPERATION_TYPE_BROKER_FEE': 'Fee',
        'OPERATION_TYPE_TAX': 'Tax',
        'OPERATION_TYPE_PAY_IN': 'Top Up',
        'OPERATION_TYPE_PAY_OUT': 'Withdrawal'
      }
    },
    forecast: {
      title: 'Investment Calculator',
      initialAmount: 'Initial Amount',
      monthlyContribution: 'Avg. Monthly Top-up',
      years: 'Time Horizon (Years)',
      returnRate: 'Expected Return (%)',
      calculate: 'Projection',
      analyzeAi: 'Analyze with Gemini AI',
      invested: 'Principal',
      interest: 'Interest',
      total: 'Projected Wealth',
      aiInsight: 'AI Insight',
    },
    settings: {
      title: 'Configuration',
      tbankKey: 'T-Bank API Key (Read-Only)',
      geminiKey: 'Gemini API Key (Optional)',
      testConnection: 'Test Connection',
      language: 'Language',
      connected: 'Connected successfully',
      failed: 'Connection failed',
      noConnection: 'No connection',
      save: 'Save Settings',
      securityNote: 'Keys are stored locally in your browser.',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      rub: '₽',
    }
  },
  ru: {
    nav: {
      dashboard: 'Обзор',
      forecast: 'Калькулятор',
      settings: 'Настройки',
      operations: 'Список операций',
    },
    dashboard: {
      totalBalance: 'Общий баланс',
      dayChange: 'Общее изменение за день',
      periodChange: 'Общее изменение за период',
      assetAllocation: 'Распределение активов',
      recentPositions: 'Топ позиций',
      topGainers: 'Лидеры роста',
      topLosers: 'Лидеры падения',
      accounts: 'Мои счета',
      stocks: 'Акции',
      bonds: 'Облигации',
      etfs: 'Фонды',
      currencies: 'Валюта',
      refresh: 'Обновить',
      demoMode: 'Демо режим',
      forecast30y: 'Прогноз капитала на 30 лет',
      forecastSubtitle: 'На основе истории пополнений',
      netFlow: 'Накопленный денежный поток',
      upcomingPayments: 'Будущие выплаты',
      paymentTypes: {
        dividend: 'Дивиденды',
        coupon: 'Купон'
      },
      ranges: {
        '1d': 'За сегодня',
        'all': 'За все время'
      }
    },
    operations: {
      title: 'Список операций',
      date: 'Дата',
      type: 'Операция',
      asset: 'Актив',
      amount: 'Сумма',
      account: 'Счет',
      noOperations: 'Операций не найдено.',
      loadMore: 'Загрузить еще',
      types: {
        'OPERATION_TYPE_BUY': 'Покупка',
        'OPERATION_TYPE_SELL': 'Продажа',
        'OPERATION_TYPE_DIVIDEND': 'Дивиденды',
        'OPERATION_TYPE_BROKER_FEE': 'Комиссия',
        'OPERATION_TYPE_TAX': 'Налог',
        'OPERATION_TYPE_PAY_IN': 'Пополнение',
        'OPERATION_TYPE_PAY_OUT': 'Вывод'
      }
    },
    forecast: {
      title: 'Инвестиционный калькулятор',
      initialAmount: 'Начальная сумма',
      monthlyContribution: 'Сред. ежемес. пополнение',
      years: 'Срок (лет)',
      returnRate: 'Ожидаемая доходность (%)',
      calculate: 'Прогноз',
      analyzeAi: 'Анализ Gemini AI',
      invested: 'Вложено',
      interest: 'Проценты',
      total: 'Ожидаемый капитал',
      aiInsight: 'Мнение ИИ',
    },
    settings: {
      title: 'Конфигурация',
      tbankKey: 'API Токен Т-Банк (Только чтение)',
      geminiKey: 'API Токен Gemini (Опционально)',
      testConnection: 'Проверить соединение',
      language: 'Язык',
      connected: 'Успешное подключение',
      failed: 'Ошибка подключения',
      noConnection: 'Нет соединения',
      save: 'Сохранить',
      securityNote: 'Ключи хранятся локально в браузере.',
    },
    common: {
      loading: 'Загрузка...',
      error: 'Ошибка',
      rub: '₽',
    }
  }
};

// Mock data for demo mode
export const DEMO_PORTFOLIO = {
  totalAmountShares: { units: "150000", nano: 0, currency: "rub" },
  totalAmountBonds: { units: "50000", nano: 0, currency: "rub" },
  totalAmountEtf: { units: "25000", nano: 0, currency: "rub" },
  totalAmountCurrencies: { units: "10000", nano: 0, currency: "rub" },
  totalAmountFutures: { units: "0", nano: 0, currency: "rub" },
  expectedYield: { units: "12500", nano: 500000000 },
  positions: [
    {
      figi: "BBG004730N88",
      instrumentType: "share",
      quantity: { units: "10", nano: 0 },
      averagePositionPrice: { units: "250", nano: 0, currency: "rub" },
      currentPrice: { units: "280", nano: 0, currency: "rub" },
      expectedYield: { units: "300", nano: 0 },
      dailyYield: { units: "15", nano: 500000000, currency: "rub" }, // +15.5 rub
      instrumentUid: "sber-id"
    },
    {
      figi: "BBG004731489",
      instrumentType: "share",
      quantity: { units: "5", nano: 0 },
      averagePositionPrice: { units: "4000", nano: 0, currency: "rub" },
      currentPrice: { units: "4200", nano: 0, currency: "rub" },
      expectedYield: { units: "1000", nano: 0 },
      dailyYield: { units: "-50", nano: 0, currency: "rub" }, // -50 rub
      instrumentUid: "gazp-id"
    },
    {
        figi: "BBG000900",
        instrumentType: "share",
        quantity: { units: "100", nano: 0 },
        averagePositionPrice: { units: "150", nano: 0, currency: "rub" },
        currentPrice: { units: "130", nano: 0, currency: "rub" },
        expectedYield: { units: "-2000", nano: 0 },
        dailyYield: { units: "-10", nano: 0, currency: "rub" },
        instrumentUid: "bad-stock"
    },
    {
      figi: "TCS00A107J11",
      instrumentType: "share",
      quantity: { units: "50", nano: 0 },
      averagePositionPrice: { units: "2000", nano: 0, currency: "rub" },
      currentPrice: { units: "2150", nano: 0, currency: "rub" },
      expectedYield: { units: "7500", nano: 0 },
      dailyYield: { units: "120", nano: 0, currency: "rub" },
      instrumentUid: "tcs-id"
    },
    {
      figi: "BBG00T22ZKV2",
      instrumentType: "bond",
      quantity: { units: "10", nano: 0 },
      averagePositionPrice: { units: "950", nano: 0, currency: "rub" },
      currentPrice: { units: "960", nano: 0, currency: "rub" },
      expectedYield: { units: "100", nano: 0 },
      dailyYield: { units: "1", nano: 0, currency: "rub" },
      instrumentUid: "bond-id"
    }
  ]
};

export const DEMO_INSTRUMENTS: Record<string, string> = {
  "BBG004730N88": "Sberbank",
  "BBG004731489": "Gazprom",
  "BBG000900": "LUKOIL",
  "TCS00A107J11": "T-Bank", 
  "BBG004S685M3": "Yandex",
  "BBG004S68CP5": "Norilsk Nickel",
  "BBG000W325F7": "Rosneft",
  "BBG004RVFCY3": "Magnit",
  "BBG004S68598": "Tatneft",
  "BBG000QF1Q17": "Surgutneftegas",
  "BBG00T22ZKV2": "OFZ 26238"
};

export const DEMO_OPERATIONS = [
  {
    id: "op1",
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    type: "OPERATION_TYPE_BUY",
    operationType: "Buy",
    state: "OPERATION_STATE_EXECUTED",
    currency: "rub",
    payment: { units: "-2800", nano: 0, currency: "rub" },
    figi: "BBG004730N88",
    instrumentType: "share"
  },
  {
    id: "op2",
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    type: "OPERATION_TYPE_DIVIDEND",
    operationType: "Dividend",
    state: "OPERATION_STATE_EXECUTED",
    currency: "rub",
    payment: { units: "150", nano: 0, currency: "rub" },
    figi: "BBG004731489",
    instrumentType: "share"
  },
  {
    id: "op3",
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    type: "OPERATION_TYPE_PAY_IN",
    operationType: "TopUp",
    state: "OPERATION_STATE_EXECUTED",
    currency: "rub",
    payment: { units: "50000", nano: 0, currency: "rub" },
    figi: "",
    instrumentType: ""
  },
  {
    id: "op4",
    date: new Date(Date.now() - 86400000 * 10).toISOString(),
    type: "OPERATION_TYPE_SELL",
    operationType: "Sell",
    state: "OPERATION_STATE_EXECUTED",
    currency: "rub",
    payment: { units: "12500", nano: 0, currency: "rub" },
    figi: "TCS00A107J11",
    instrumentType: "share"
  },
  {
    id: "op5_old",
    date: new Date(Date.now() - 86400000 * 365).toISOString(),
    type: "OPERATION_TYPE_PAY_IN",
    operationType: "TopUp",
    state: "OPERATION_STATE_EXECUTED",
    currency: "rub",
    payment: { units: "100000", nano: 0, currency: "rub" },
    figi: "",
    instrumentType: ""
  }
];