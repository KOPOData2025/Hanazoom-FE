"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Maximize2,
  Wifi,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";
import type { StockPriceData } from "@/lib/api/stock";

interface TradingViewRealtimeChartProps {
  stockCode: string;
  className?: string;
}

interface ChartDataPoint {
  time: string;
  value: number;
}

export function TradingViewRealtimeChart({
  stockCode,
  className,
}: TradingViewRealtimeChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeframe, setTimeframe] = useState("1D");

  const {
    connected: isConnected,
    stockData,
    getStockData,
  } = useStockWebSocket({
    stockCodes: [stockCode],
    autoReconnect: true,
    reconnectInterval: 3000,
  });

  const currentStockData = getStockData(stockCode);


  useEffect(() => {
    if (currentStockData) {
      const timestamp = new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const price = parseFloat(currentStockData.currentPrice);

      const newDataPoint: ChartDataPoint = {
        time: timestamp,
        value: price,
      };


      setChartData((prev) => {
        const newData = [...prev, newDataPoint];
        return newData.slice(-100);
      });
    }
  }, [currentStockData]);


  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };


  const refreshChart = () => {
    setChartData([]);
  };


  const getPriceColor = () => {
    if (!currentStockData) return "#6b7280";

    const currentPrice = parseFloat(currentStockData.currentPrice);
    const previousPrice = parseFloat(currentStockData.previousClose);

    if (currentPrice > previousPrice) return "#ef4444";
    if (currentPrice < previousPrice) return "#3b82f6";
    return "#6b7280";
  };


  const getPriceChange = () => {
    if (!currentStockData) return { change: 0, changePercent: 0 };

    const currentPrice = parseFloat(currentStockData.currentPrice);
    const previousPrice = parseFloat(currentStockData.previousClose);
    const change = currentPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;

    return { change, changePercent };
  };

  const { change, changePercent } = getPriceChange();


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {label}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              가격:{" "}
              <span className="font-medium">
                {payload[0].value?.toLocaleString()}원
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {stockCode} 실시간 차트
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={isConnected ? "default" : "secondary"}
              className={`text-xs ${
                isConnected ? "bg-green-600" : "bg-gray-500"
              }`}
            >
              <Wifi className="h-3 w-3 mr-1" />
              {isConnected ? "연결됨" : "연결안됨"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshChart}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative h-96 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  className="dark:stroke-gray-600"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={["dataMin - 100", "dataMax + 100"]}
                  tick={{ fontSize: 10 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />

        {chartData.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-500">최고가</div>
              <div className="font-semibold text-red-600">
                {Math.max(...chartData.map((d) => d.value)).toLocaleString()}원
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">최저가</div>
              <div className="font-semibold text-blue-600">
                {Math.min(...chartData.map((d) => d.value)).toLocaleString()}원
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">평균가</div>
              <div className="font-semibold">
                {(
                  chartData.reduce((sum, d) => sum + d.value, 0) /
                  chartData.length
                ).toLocaleString()}
                원
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">데이터 포인트</div>
              <div className="font-semibold">{chartData.length}개</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
