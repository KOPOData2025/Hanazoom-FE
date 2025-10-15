"use client";

import { ChartDataDto } from "@/types/chart";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ChartSummaryProps {
  data: ChartDataDto[];
  className?: string;
}

export function ChartSummary({ data, className }: ChartSummaryProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const firstData = data[0];
  const lastData = data[data.length - 1];


  const priceChange = lastData.priceChange || 0;
  const priceChangePercent = lastData.priceChangePercent || 0;


  const getPriceChangeColor = (change: number) => {
    if (change > 0) return "text-red-600 dark:text-red-400";
    if (change < 0) return "text-blue-600 dark:text-blue-400";
    return "text-gray-600 dark:text-gray-400";
  };

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-blue-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };


  const avgVolume =
    data.reduce((sum, item) => sum + (item.volume || 0), 0) / data.length;


  const maxPrice = Math.max(...data.map((item) => item.highPrice || 0));
  const minPrice = Math.min(...data.map((item) => item.lowPrice || 0));

  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-4 gap-4 text-sm ${className}`}
    >
      <div className="text-center">
        <p className="text-gray-500 dark:text-gray-400">시가</p>
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          {firstData.openPrice?.toLocaleString()}원
        </p>
      </div>

      <div className="text-center">
        <p className="text-gray-500 dark:text-gray-400">현재가</p>
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          {lastData.closePrice?.toLocaleString()}원
        </p>
      </div>

      <div className="text-center">
        <p className="text-gray-500 dark:text-gray-400">변동</p>
        <div className="flex items-center justify-center gap-1">
          {getPriceChangeIcon(priceChange)}
          <span className={`font-semibold ${getPriceChangeColor(priceChange)}`}>
            {priceChange.toLocaleString()}원
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-gray-500 dark:text-gray-400">변동률</p>
        <span className={`font-semibold ${getPriceChangeColor(priceChange)}`}>
          {priceChangePercent.toFixed(2)}%
        </span>
      </div>

