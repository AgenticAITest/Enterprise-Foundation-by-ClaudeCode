import { Currency } from '../types';

export function formatCurrency(
  amount: number,
  currency: Currency,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  }).format(amount);
}

export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency.code === toCurrency.code) {
    return amount;
  }
  
  const baseAmount = fromCurrency.isBase 
    ? amount 
    : amount / (fromCurrency.exchangeRate || 1);
    
  return toCurrency.isBase 
    ? baseAmount 
    : baseAmount * (toCurrency.exchangeRate || 1);
}

export function roundCurrency(amount: number, decimalPlaces: number): number {
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(amount * factor) / factor;
}