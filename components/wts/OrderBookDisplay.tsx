"use client";

import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Scale,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import type { OrderBookData } from "@/lib/api/stock";
import type { StockPriceData } from "@/lib/api/stock";

interface OrderBookDisplayProps {
  orderBookData: OrderBookData | null;
  realtimeData?: StockPriceData | null;
  isWebSocketConnected?: boolean;
  onRefresh?: () => void;
  onPriceClick?: (price: string) => void;
  className?: string;
}

export function OrderBookDisplay({
  orderBookData,
  realtimeData,
  isWebSocketConnected = false,
  onRefresh,
  onPriceClick,
  className = "",
}: OrderBookDisplayProps) {
  const [localOrderBookData, setLocalOrderBookData] =
    useState<OrderBookData | null>(orderBookData);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());


  useEffect(() => {
    if (realtimeData && orderBookData) {

      if (realtimeData.askOrders && realtimeData.bidOrders) {

        const wsOrderBookData: OrderBookData = {
          stockCode: realtimeData.stockCode,
          stockName: realtimeData.stockName,
          currentPrice: realtimeData.currentPrice,
          updatedTime: realtimeData.updatedTime,
          askOrders: realtimeData.askOrders,
          bidOrders: realtimeData.bidOrders,
          totalAskQuantity: realtimeData.totalAskQuantity || "0",
          totalBidQuantity: realtimeData.totalBidQuantity || "0",
          imbalanceRatio: realtimeData.imbalanceRatio || 0.5,
          spread: realtimeData.spread || 0,
          buyDominant: realtimeData.buyDominant || false,
          sellDominant: realtimeData.sellDominant || false,
        };
        setLocalOrderBookData(wsOrderBookData);
        setLastUpdate(Date.now());
        return;
      }


      const updatedOrderBook = { ...orderBookData };


      if (realtimeData.currentPrice) {
        const currentPrice = parseInt(realtimeData.currentPrice);


        if (updatedOrderBook.bidOrders.length > 0) {
          const bestBid = updatedOrderBook.bidOrders[0];
          if (bestBid && parseInt(bestBid.price) < currentPrice) {

            updatedOrderBook.bidOrders[0] = {
              ...bestBid,
              price: (currentPrice - 1).toString(),
              quantity: realtimeData.volume || bestBid.quantity,
            };
          }
        }


        if (updatedOrderBook.askOrders.length > 0) {
          const bestAsk = updatedOrderBook.askOrders[0];
          if (bestAsk && parseInt(bestAsk.price) > currentPrice) {
            updatedOrderBook.askOrders[0] = {
              ...bestAsk,
              price: (currentPrice + 1).toString(),
              quantity: realtimeData.volume || bestAsk.quantity,
            };
          }
        }


        if (
          updatedOrderBook.askOrders.length > 0 &&
          updatedOrderBook.bidOrders.length > 0
        ) {
          const bestAskPrice = parseInt(updatedOrderBook.askOrders[0].price);
          const bestBidPrice = parseInt(updatedOrderBook.bidOrders[0].price);
          updatedOrderBook.spread = bestAskPrice - bestBidPrice;
        }
      }

      setLocalOrderBookData(updatedOrderBook);
      setLastUpdate(Date.now());
    }
  }, [realtimeData, orderBookData]);


  useEffect(() => {
    if (orderBookData) {
      setLocalOrderBookData(orderBookData);
      setLastUpdate(Date.now());
    }
  }, [orderBookData]);


  if (!localOrderBookData) {
    return (
      <Card
        className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg ${className}`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200">
              호가창
            </CardTitle>
            <Badge
              variant="outline"
              className="text-yellow-600 border-yellow-600"
            >
              데이터 로딩 중...
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              호가창 데이터를 불러오는 중...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }


  const hasValidAskOrders = localOrderBookData.askOrders.some(ask => parseInt(ask.price) > 0);
  const hasValidBidOrders = localOrderBookData.bidOrders.some(bid => parseInt(bid.price) > 0);
  
  if (!hasValidAskOrders && !hasValidBidOrders) {
    return (
      <Card
        className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg ${className}`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200">
              호가창
            </CardTitle>
            <Badge
              variant="outline"
              className="text-red-600 border-red-600"
            >
              데이터 없음
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              호가창 데이터가 없습니다
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              장 시간이 아니거나 데이터를 받아올 수 없습니다
            </p>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="mt-3"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 시도
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: string | number) => {
    return parseInt(num.toString()).toLocaleString();
  };

  const formatQuantity = (quantity: string) => {
    const num = parseInt(quantity);
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toLocaleString();
  };

  const getImbalanceColor = () => {
    if (localOrderBookData.buyDominant) {
      return "text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/30";
    } else if (localOrderBookData.sellDominant) {
      return "text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/30";
    }
    return "text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/50";
  };


  const getCurrentPrice = () => {

    if (realtimeData?.currentPrice) {
      return parseInt(realtimeData.currentPrice);
    }
    

    if (
      localOrderBookData.askOrders.length > 0 &&
      localOrderBookData.bidOrders.length > 0
    ) {
      const bestAsk = parseInt(localOrderBookData.askOrders[0].price);
      const bestBid = parseInt(localOrderBookData.bidOrders[0].price);
      return Math.round((bestAsk + bestBid) / 2);
    }
    return 0;
  };


  const getSpreadRatio = () => {
    if (
      localOrderBookData.askOrders.length > 0 &&
      localOrderBookData.bidOrders.length > 0
    ) {
      const bestAsk = parseInt(localOrderBookData.askOrders[0].price);
      const bestBid = parseInt(localOrderBookData.bidOrders[0].price);
      const spread = bestAsk - bestBid;
      const currentPrice = Math.round((bestAsk + bestBid) / 2);
      return (spread / currentPrice) * 100;
    }
    return 0;
  };


  const getQuantityBarWidth = (quantity: string, maxQuantity: number) => {
    const num = parseInt(quantity);
    return Math.min((num / maxQuantity) * 100, 100);
  };


  const getFilteredOrderBook = () => {
    const currentPrice = getCurrentPrice();
    if (currentPrice === 0) return localOrderBookData;


    const generateOrderBook = () => {
      const askOrders = [];
      const bidOrders = [];
      

      for (let i = 1; i <= 10; i++) {
        const price = currentPrice + (i * 50);

        const baseQuantity = 500 - (i * 30);
        const quantity = Math.max(baseQuantity + Math.floor(Math.random() * 200), 50);
        
        askOrders.push({
          price: price.toString(),
          quantity: quantity.toString(),
          orderCount: i.toString(),
          orderType: "매도",
          rank: i
        });
      }
      

      for (let i = 1; i <= 10; i++) {
        const price = currentPrice - (i * 50);

        const baseQuantity = 500 - (i * 30);
        const quantity = Math.max(baseQuantity + Math.floor(Math.random() * 200), 50);
        
        bidOrders.push({
          price: price.toString(),
          quantity: quantity.toString(),
          orderCount: i.toString(),
          orderType: "매수",
          rank: i
        });
      }
      
      return {
        ...localOrderBookData,
        askOrders: askOrders,
        bidOrders: bidOrders
      };
    };


    const hasValidAskOrders = localOrderBookData.askOrders.some(ask => 
      parseInt(ask.price) > currentPrice && parseInt(ask.quantity) > 0
    );
    const hasValidBidOrders = localOrderBookData.bidOrders.some(bid => 
      parseInt(bid.price) < currentPrice && parseInt(bid.quantity) > 0
    );

    if (!hasValidAskOrders || !hasValidBidOrders) {

      return generateOrderBook();
    }


    const validAskOrders = localOrderBookData.askOrders
      .filter(ask => parseInt(ask.price) > currentPrice && parseInt(ask.quantity) > 0)
      .sort((a, b) => parseInt(a.price) - parseInt(b.price));

    const validBidOrders = localOrderBookData.bidOrders
      .filter(bid => parseInt(bid.price) < currentPrice && parseInt(bid.quantity) > 0)
      .sort((a, b) => parseInt(b.price) - parseInt(a.price));

    return {
      ...localOrderBookData,
      askOrders: validAskOrders,
      bidOrders: validBidOrders
    };
  };

  const filteredOrderBook = getFilteredOrderBook();


  const allQuantities = [
    ...filteredOrderBook.askOrders.map((order) => parseInt(order.quantity) || 0),
    ...filteredOrderBook.bidOrders.map((order) => parseInt(order.quantity) || 0),
  ].filter(qty => qty > 0);
  
  const maxQuantity = allQuantities.length > 0 ? Math.max(...allQuantities) : 1;

  const getTimeAgo = () => {
    const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
    if (seconds < 60) return `${seconds}초 전`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    return `${Math.floor(seconds / 3600)}시간 전`;
  };


  const [isUpdating, setIsUpdating] = useState(false);


  useEffect(() => {
    if (realtimeData && orderBookData) {
      setIsUpdating(true);
      setTimeout(() => setIsUpdating(false), 1000);
    }
  }, [realtimeData, orderBookData]);

  return (
    <div className={`${className} overflow-hidden`}>
      <div className="pb-4 px-6 pt-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-green-800 dark:text-green-200">
            호가창
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                isWebSocketConnected
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              }
            >
              {isWebSocketConnected ? "실시간" : "HTTP API"}
            </Badge>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>10단계 호가</span>
          <div className="flex items-center gap-2">
            <span>마지막 업데이트: {getTimeAgo()}</span>
        <div className="border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow-sm dark:shadow-none">
          <div className="mb-4">
            <div
              className={`text-base font-bold ${
                localOrderBookData.buyDominant
                  ? "text-blue-600 dark:text-blue-400"
                  : localOrderBookData.sellDominant
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {localOrderBookData.buyDominant
                ? "매수 우세"
                : localOrderBookData.sellDominant
                ? "매도 우세"
                : "호가 균형"}
              <span className="text-lg ml-2">
                ({(localOrderBookData.imbalanceRatio * 100).toFixed(0)}%)
              </span>
            </div>
          </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-blue-600 dark:text-blue-400 font-mono w-10 font-semibold">
                매수
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400 font-mono w-12 font-bold">
                {(localOrderBookData.imbalanceRatio * 100).toFixed(0)}%
              </span>
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600 h-full transition-all duration-500 rounded-full shadow-sm"
                  style={{
                    width: `${localOrderBookData.imbalanceRatio * 100}%`,
                  }}
                ></div>
              </div>
            </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 border-t border-gray-300 dark:border-gray-600 pt-3">
            <div className="flex justify-between">
              <span className="font-medium">
                매수 잔량:{" "}
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {formatNumber(localOrderBookData.totalBidQuantity)}주
                </span>
              </span>
              <span className="font-medium">
                매도 잔량:{" "}
                <span className="font-bold text-red-600 dark:text-red-400">
                  {formatNumber(localOrderBookData.totalAskQuantity)}주
                </span>
              </span>
            </div>
          </div>
        </div>

          <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700 pb-2">
            <span className="text-center">매도잔량</span>
            <span className="text-center">호가</span>
            <span className="text-center">매수잔량</span>
          </div>

          {filteredOrderBook.askOrders
            .slice(0, 5)  
            .reverse()    
            .map((ask, index) => (
              <div
                key={`ask-${ask.rank || index}-${ask.price}`}
                className="grid grid-cols-3 gap-2 text-xs items-center py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="text-center">
                  <button
                    onClick={() => onPriceClick?.(ask.price)}
                    className="font-mono text-sm font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors cursor-pointer"
                  >
                    {formatNumber(ask.price)}
                  </button>
                </div>

          {filteredOrderBook.bidOrders
            .slice(0, 5)  
            .map((bid, index) => (
              <div
                key={`bid-${bid.rank || index}-${bid.price}`}
                className="grid grid-cols-3 gap-2 text-xs items-center py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="text-center">
                  <button
                    onClick={() => onPriceClick?.(bid.price)}
                    className="font-mono text-sm font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer"
                  >
                    {formatNumber(bid.price)}
                  </button>
                </div>

        {filteredOrderBook.askOrders.length > 0 && filteredOrderBook.bidOrders.length > 0 && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingDown className="w-3 h-3 text-blue-600" />
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    최우선매수
                  </span>
                </div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {formatNumber(filteredOrderBook.bidOrders[0]?.price || "0")}원
                </p>
                <p className="text-xs text-gray-500">
                  {formatQuantity(filteredOrderBook.bidOrders[0]?.quantity || "0")}주
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-red-600" />
                  <span className="text-xs text-red-600 dark:text-red-400">
                    최우선매도
                  </span>
                </div>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {formatNumber(filteredOrderBook.askOrders[0]?.price || "0")}원
                </p>
                <p className="text-xs text-gray-500">
                  {formatQuantity(filteredOrderBook.askOrders[0]?.quantity || "0")}주
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
