"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { TrendingUp, TrendingDown, Wifi, WifiOff } from "lucide-react";
import type { StockPriceData } from "@/lib/api/stock";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";

interface StockTicker {
  symbol: string;
  name: string;
  price: string;
  change: string;
  changeRate: string;
  logoUrl?: string;
  emoji?: string;
}


const TICKER_STOCKS = [
  { symbol: "005930", name: "삼성전자", emoji: "📱" },
  { symbol: "000660", name: "SK하이닉스", emoji: "💻" },
  { symbol: "035420", name: "NAVER", emoji: "🔍" },
  { symbol: "035720", name: "카카오", emoji: "💬" },
  { symbol: "005380", name: "현대자동차", emoji: "🚗" },
  { symbol: "051910", name: "LG화학", emoji: "🧪" },
  { symbol: "207940", name: "삼성바이오", emoji: "🧬" },
  { symbol: "068270", name: "셀트리온", emoji: "💊" },
  { symbol: "323410", name: "카카오뱅크", emoji: "🏦" },
  { symbol: "373220", name: "LG에너지", emoji: "🔋" },
];

export function StockTicker() {
  const [stocks, setStocks] = useState<StockTicker[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const animationRef = useRef<HTMLDivElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const {
    connected: wsConnected,
    stockData: wsStockData,
    lastUpdate,
    lastDataReceived,
    isMarketOpen,
    getStockDataMap,
  } = useStockWebSocket({
    stockCodes: TICKER_STOCKS.map((stock) => stock.symbol),
    onStockUpdate: (data) => {

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }

      updateTimeoutRef.current = setTimeout(() => {
        updateStockDisplay();
        updateTimeoutRef.current = null;
      }, 100); 
    },
    autoReconnect: true,
    reconnectInterval: 3000,
  });


  const updateStockDisplayWithMap = useCallback((stockDataMap: Map<string, any>): void => {
    if (stockDataMap.size === 0) {
      return;
    }


    const newStocks: StockTicker[] = TICKER_STOCKS.map((tickerStock) => {
      const stockData = stockDataMap.get(tickerStock.symbol);
      
      if (!stockData) {

        return {
          symbol: tickerStock.symbol,
          name: tickerStock.name,
          price: "0",
          change: "0.00%",
          changeRate: "0",
          emoji: tickerStock.emoji,
        };
      }


      const changePrefix =
        stockData.changeSign === "2" || stockData.changeSign === "1" ? "+" : "";
      const change =
        stockData.changePrice === "0"
          ? "0.00%"
          : `${changePrefix}${stockData.changeRate}%`;

      return {
        symbol: tickerStock.symbol,
        name: tickerStock.name,
        price: stockData.currentPrice,
        change: change,
        changeRate: stockData.changeRate,
        emoji: tickerStock.emoji,
      };
    });

    setStocks((prev) => {

      const sameLength = prev.length === newStocks.length;
      const sameAll =
        sameLength &&
        prev.every(
          (p, i) =>
            p.symbol === newStocks[i].symbol &&
            p.price === newStocks[i].price &&
            p.change === newStocks[i].change
        );
      
      return sameAll ? prev : newStocks;
    });
  }, []); 


  const updateStockDisplay = useCallback((): void => {


    const stockDataMap = getStockDataMap();

    if (stockDataMap.size === 0) {
      return;
    }


    const newStocks: StockTicker[] = TICKER_STOCKS.map((tickerStock) => {
      const stockData = stockDataMap.get(tickerStock.symbol);
      
      if (!stockData) {

        return {
          symbol: tickerStock.symbol,
          name: tickerStock.name,
          price: "0",
          change: "0.00%",
          changeRate: "0",
          emoji: tickerStock.emoji,
        };
      }


      const changePrefix =
        stockData.changeSign === "2" || stockData.changeSign === "1" ? "+" : "";
      const change =
        stockData.changePrice === "0"
          ? "0.00%"
          : `${changePrefix}${stockData.changeRate}%`;

      return {
        symbol: tickerStock.symbol,
        name: tickerStock.name,
        price: stockData.currentPrice,
        change: change,
        changeRate: stockData.changeRate,
        emoji: tickerStock.emoji,
      };
    });

    setStocks((prev) => {

      const sameLength = prev.length === newStocks.length;
      const sameAll =
        sameLength &&
        prev.every(
          (p, i) =>
            p.symbol === newStocks[i].symbol &&
            p.price === newStocks[i].price &&
            p.change === newStocks[i].change
        );
      
      return sameAll ? prev : newStocks;
    });
  }, []);


  useEffect(() => {
    setIsMounted(true);
  }, []);


  useEffect(() => {
    if (wsConnected && lastUpdate) {
      const map = getStockDataMap();
      if (map.size > 0) {

        updateStockDisplayWithMap(map);
      }
    }
  }, [wsConnected, lastUpdate]);


  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("ko-KR").format(Number(price));
  };

  const getChangeNumber = (change: string): number => {
    return parseFloat(change.replace("%", ""));
  };

  const renderStockItem = (stock: StockTicker, index: number) => (
    <div
      key={`${stock.symbol}-${index}`}
      className="inline-flex items-center space-x-2 mx-4"
    >
      <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-2 py-1 hover:bg-white/20 transition-all duration-300">
        <span className="text-base hover:scale-110 transition-transform duration-300">
          {stock.emoji}
        </span>
        <span className="font-semibold text-xs">{stock.name}</span>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-green-100 font-mono text-xs">
          ₩{formatPrice(stock.price)}
        </span>
        <div className="flex items-center space-x-1">
          {getChangeNumber(stock.change) > 0 ? (
            <TrendingUp className="w-3 h-3 text-green-300" />
          ) : getChangeNumber(stock.change) < 0 ? (
            <TrendingDown className="w-3 h-3 text-red-300" />
          ) : (
            <div className="w-3 h-3" />
          )}
          <span
            className={`text-xs font-medium transition-colors duration-200 ${
              getChangeNumber(stock.change) > 0
                ? "text-green-300"
                : getChangeNumber(stock.change) < 0
                ? "text-red-300"
                : "text-gray-300"
            }`}
          >
            {stock.change}
          </span>
        </div>
      </div>
      <div className="w-px h-3 bg-white/20"></div>
    </div>
  );

  if (!isMounted) {
    return (
      <div className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 dark:from-green-700 dark:via-emerald-700 dark:to-green-700 text-white py-2 overflow-hidden relative shadow-lg animate-pulse">
        <div className="flex items-center justify-center h-8">
          <div className="h-3 bg-white/20 rounded w-32 mx-2"></div>
          <div className="h-3 bg-white/20 rounded w-24 mx-2"></div>
          <div className="h-3 bg-white/20 rounded w-16 mx-2"></div>
        </div>
      </div>
    );
  }


  const getConnectionStatus = () => {
    if (!wsConnected) {
      return { status: 'disconnected', bgColor: 'from-red-600 via-red-500 to-red-600', icon: WifiOff, text: '연결이 끊어졌습니다. 재연결 중...' };
    }
    
    if (wsConnected && !isMarketOpen) {
      return { status: 'market-closed', bgColor: 'from-yellow-600 via-yellow-500 to-yellow-600', icon: WifiOff, text: '장종료' };
    }
    
    if (wsConnected && isMarketOpen) {
      return { status: 'market-open', bgColor: 'from-green-600 via-emerald-600 to-green-600', icon: Wifi, text: '장 열림' };
    }
    
    return { status: 'loading', bgColor: 'from-yellow-600 via-yellow-500 to-yellow-600', icon: Wifi, text: '주식 데이터 로딩 중...' };
  };

  const connectionStatus = getConnectionStatus();

  if (!wsConnected) {

    return (
      <div className={`w-full bg-gradient-to-r ${connectionStatus.bgColor} dark:from-red-700 dark:via-red-600 dark:to-red-700 text-white py-2 overflow-hidden relative shadow-lg`}>
        <div className="flex items-center justify-center gap-2 h-8">
          <connectionStatus.icon className="w-3 h-3" />
          <span className="text-sm">{connectionStatus.text}</span>
        </div>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className={`w-full bg-gradient-to-r ${connectionStatus.bgColor} dark:from-yellow-700 dark:via-yellow-600 dark:to-yellow-700 text-white py-2 overflow-hidden relative shadow-lg`}>
        <div className="flex items-center justify-center gap-2 h-8">
          <connectionStatus.icon className={`w-3 h-3 ${isMarketOpen ? 'animate-pulse' : ''}`} />
          <span className="text-sm">{connectionStatus.text}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full bg-gradient-to-r ${connectionStatus.bgColor} dark:from-green-700 dark:via-emerald-700 dark:to-green-700 text-white py-2 overflow-hidden relative shadow-lg`}>
      <div className="absolute top-1 right-2 flex items-center gap-1 text-xs opacity-80">
        <connectionStatus.icon className={`w-3 h-3 ${isMarketOpen ? 'animate-pulse' : ''}`} />
        <span>{connectionStatus.text}</span>
      </div>

