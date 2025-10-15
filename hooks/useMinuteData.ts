import { useState, useEffect, useCallback } from 'react';
import { minuteApi, StockMinutePrice, getTimeframeMinuteInterval } from '@/lib/api/minute';

interface UseMinuteDataProps {
  stockSymbol: string;
  timeframe: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseMinuteDataReturn {
  data: StockMinutePrice[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateData: (newData: StockMinutePrice[]) => void;
}

export const useMinuteData = ({
  stockSymbol,
  timeframe,
  limit = 100,
  autoRefresh = false,
  refreshInterval = 5000
}: UseMinuteDataProps): UseMinuteDataReturn => {
  const [data, setData] = useState<StockMinutePrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!stockSymbol || !timeframe) return;


    if (!['1M', '5M', '15M'].includes(timeframe)) {
      setData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const minuteInterval = getTimeframeMinuteInterval(timeframe);
      const minuteData = await minuteApi.getRecentMinutePrices(stockSymbol, minuteInterval, limit);


      const sortedData = minuteData.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setData(sortedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '분봉 데이터 조회 실패';
      setError(errorMessage);
      console.error('분봉 데이터 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [stockSymbol, timeframe, limit]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const updateData = useCallback((newData: StockMinutePrice[]) => {
    setData(newData);
  }, []);


  useEffect(() => {
    fetchData();
  }, [fetchData]);


  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);


  const handleRealtimeUpdate = useCallback((newPrice: StockMinutePrice) => {
    setData(prevData => {

      const existingIndex = prevData.findIndex(
        item => item.timestamp === newPrice.timestamp
      );

      if (existingIndex >= 0) {

        const updatedData = [...prevData];
        updatedData[existingIndex] = newPrice;
        return updatedData;
      } else {

        return [...prevData, newPrice].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      }
    });
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
    updateData,
    handleRealtimeUpdate
  };
};

export const useMinuteDataByTimeRange = (
  stockSymbol: string,
  timeframe: string,
  startTime: string,
  endTime: string
) => {
  const [data, setData] = useState<StockMinutePrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!stockSymbol || !timeframe || !startTime || !endTime) return;


    if (!['1M', '5M', '15M'].includes(timeframe)) {
      setData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const minuteInterval = getTimeframeMinuteInterval(timeframe);
      const minuteData = await minuteApi.getMinutePricesByTimeRange(
        stockSymbol, 
        minuteInterval, 
        startTime, 
        endTime
      );


      const sortedData = minuteData.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setData(sortedData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '분봉 데이터 조회 실패';
      setError(errorMessage);
      console.error('분봉 데이터 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [stockSymbol, timeframe, startTime, endTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
};

