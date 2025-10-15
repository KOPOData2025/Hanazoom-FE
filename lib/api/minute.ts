import api from '@/app/config/api';

export interface StockMinutePrice {
  id: number;
  stockSymbol: string;
  minuteInterval: 'ONE_MINUTE' | 'FIVE_MINUTES' | 'FIFTEEN_MINUTES';
  timestamp: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  closePrice: string;
  volume: string;
  priceChange: string;
  priceChangePercent: string;
  vwap?: string;
  tickCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MinuteInterval {
  ONE_MINUTE: 'ONE_MINUTE';
  FIVE_MINUTES: 'FIVE_MINUTES';
  FIFTEEN_MINUTES: 'FIFTEEN_MINUTES';
}

export const minuteApi = {
  getRecentMinutePrices: async (
    stockSymbol: string,
    minuteInterval: StockMinutePrice['minuteInterval'],
    limit: number = 100
  ): Promise<StockMinutePrice[]> => {
    const response = await api.get(
      `/api/stock-minute-prices/${stockSymbol}/${minuteInterval}`,
      {
        params: { limit }
      }
    );
    return response.data;
  },

  getMinutePricesByTimeRange: async (
    stockSymbol: string,
    minuteInterval: StockMinutePrice['minuteInterval'],
    startTime: string,
    endTime: string
  ): Promise<StockMinutePrice[]> => {
    const response = await api.get(
      `/api/stock-minute-prices/${stockSymbol}/${minuteInterval}/range`,
      {
        params: { startTime, endTime }
      }
    );
    return response.data;
  },

  getMinutePriceCount: async (
    stockSymbol: string,
    minuteInterval: StockMinutePrice['minuteInterval']
  ): Promise<number> => {
    const response = await api.get(
      `/api/stock-minute-prices/${stockSymbol}/${minuteInterval}/count`
    );
    return response.data;
  },

  cleanupOldMinutePrices: async (
    stockSymbol: string,
    minuteInterval: StockMinutePrice['minuteInterval'],
    cutoffTime: string
  ): Promise<void> => {
    await api.delete(
      `/api/stock-minute-prices/${stockSymbol}/${minuteInterval}/cleanup`,
      {
        params: { cutoffTime }
      }
    );
  },

  deleteAllMinutePrices: async (stockSymbol: string): Promise<void> => {
    await api.delete(`/api/stock-minute-prices/${stockSymbol}`);
  }
};

export const getMinuteIntervalLabel = (interval: StockMinutePrice['minuteInterval']): string => {
  switch (interval) {
    case 'ONE_MINUTE':
      return '1분';
    case 'FIVE_MINUTES':
      return '5분';
    case 'FIFTEEN_MINUTES':
      return '15분';
    default:
      return interval;
  }
};

export const getMinuteIntervalTimeframe = (interval: StockMinutePrice['minuteInterval']): string => {
  switch (interval) {
    case 'ONE_MINUTE':
      return '1M';
    case 'FIVE_MINUTES':
      return '5M';
    case 'FIFTEEN_MINUTES':
      return '15M';
    default:
      return '5M';
  }
};

export const getTimeframeMinuteInterval = (timeframe: string): StockMinutePrice['minuteInterval'] => {
  switch (timeframe) {
    case '1M':
      return 'ONE_MINUTE';
    case '5M':
      return 'FIVE_MINUTES';
    case '15M':
      return 'FIFTEEN_MINUTES';
    default:
      return 'FIVE_MINUTES';
  }
};
