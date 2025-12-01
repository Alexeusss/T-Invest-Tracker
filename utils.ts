import { MoneyValue, Quotation } from './types';

export const moneyToNumber = (money: MoneyValue | Quotation | undefined): number => {
  if (!money) return 0;
  return Number(money.units) + money.nano / 1e9;
};

export const formatCurrency = (value: number, currency: string = 'rub', locale: string = 'ru-RU') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

export const calculateCompoundInterest = (
  initial: number,
  monthly: number,
  years: number,
  rate: number
) => {
  const data = [];
  let currentTotal = initial;
  let totalInvested = initial;

  for (let year = 0; year <= years; year++) {
    if (year > 0) {
      for (let m = 0; m < 12; m++) {
        currentTotal += monthly;
        currentTotal *= (1 + (rate / 100) / 12);
        totalInvested += monthly;
      }
    }
    
    data.push({
      year,
      invested: Math.round(totalInvested),
      interest: Math.round(currentTotal - totalInvested),
      total: Math.round(currentTotal),
    });
  }
  return data;
};