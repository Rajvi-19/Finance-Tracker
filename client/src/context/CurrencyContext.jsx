import { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const CurrencyContext = createContext();

const CURRENCY_SYMBOLS = {
  'INR': '₹',
  'USD': '$',
  'EUR': '€',
  'GBP': '£'
};

const CURRENCY_LOCALES = {
  'INR': 'en-IN',
  'USD': 'en-US',
  'EUR': 'de-DE',
  'GBP': 'en-GB'
};

export const CurrencyProvider = ({ children }) => {
  const { user } = useAuth();
  
  const currencyCode = user?.settings?.currency || 'INR';
  const symbol = CURRENCY_SYMBOLS[currencyCode] || '₹';
  const locale = CURRENCY_LOCALES[currencyCode] || 'en-IN';

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const value = useMemo(() => ({
    currencyCode,
    symbol,
    formatCurrency
  }), [currencyCode, symbol, locale]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
