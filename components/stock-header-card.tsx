"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, BarChart3, Target } from "lucide-react";
import type { Stock } from "@/lib/api/stock";
import type { StockPriceData } from "@/lib/api/stock";

interface StockHeaderCardProps {
  stock: Stock | null;
  realtimeData: StockPriceData | null;
  wsConnected: boolean;
  lastUpdate?: number;
}

export function StockHeaderCard({ 
  stock, 
  realtimeData, 
  wsConnected, 
  lastUpdate 
}: StockHeaderCardProps) {
  if (!stock) return null;

  const currentPrice = realtimeData?.currentPrice 
    ? parseInt(realtimeData.currentPrice) 
    : stock.currentPrice || 0;
  
  const changePrice = realtimeData?.changePrice 
    ? parseInt(realtimeData.changePrice) 
    : stock.priceChange || 0;
  
  const changeRate = realtimeData?.changeRate 
    ? parseFloat(realtimeData.changeRate) 
    : stock.priceChangePercent ? stock.priceChangePercent : 0;
  
  const volume = realtimeData?.volume 
    ? parseInt(realtimeData.volume.toString()) 
    : stock.volume || 0;

  const isPositive = changeRate >= 0;
  const isRealtime = wsConnected && realtimeData;

  return (
    <div className="sticky top-16 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <Card className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">변동률</p>
                  <div className="flex items-center space-x-1">
                    {isPositive ? (
                      <TrendingUp className="w-5 h-5 text-red-500" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-blue-500" />
                    )}
                    <p className={`text-xl font-bold ${
                      isPositive 
                        ? "text-red-500 dark:text-red-400" 
                        : "text-blue-500 dark:text-blue-400"
                    }`}>
                      {isPositive ? "+" : ""}{changeRate.toFixed(2)}%
                    </p>
                  </div>
                  <p className={`text-sm ${
                    isPositive 
                      ? "text-red-500 dark:text-red-400" 
                      : "text-blue-500 dark:text-blue-400"
                  }`}>
                    {isPositive ? "+" : ""}{changePrice.toLocaleString()}원
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isRealtime ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`} />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {isRealtime ? "실시간" : "지연"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
