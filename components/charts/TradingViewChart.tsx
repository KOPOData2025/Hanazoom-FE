"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Maximize2,
  Activity,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { ChartDataDto, ChartPeriod } from "@/types/chart";
import {
  getDailyChartData,
  getWeeklyChartData,
  getMonthlyChartData,
} from "@/lib/api/chart";
import { PeriodSelector } from "./PeriodSelector";
import { Loader2 } from "lucide-react";

interface TradingViewChartProps {
  stockSymbol: string;
  className?: string;
}

interface IndicatorSettings {
  showMA: boolean;
  showRSI: boolean;
  showBollinger: boolean;
}

export function TradingViewChart({
  stockSymbol,
  className,
}: TradingViewChartProps) {
  const [chartData, setChartData] = useState<ChartDataDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>("daily");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [indicators, setIndicators] = useState<IndicatorSettings>({
    showMA: true,
    showRSI: false,
    showBollinger: false,
  });
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);


  const loadChartData = async (period: ChartPeriod) => {
    setLoading(true);
    setError(null);

    try {
      let data: ChartDataDto[];

      switch (period) {
        case "daily":
          data = await getDailyChartData(stockSymbol, 2500); 
          break;
        case "weekly":
          data = await getWeeklyChartData(stockSymbol, 520); 
          break;
        case "monthly":
          data = await getMonthlyChartData(stockSymbol, 120); 
          break;
        default:
          data = await getDailyChartData(stockSymbol, 2500); 
      }


      data.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setChartData(data);
    } catch (err) {
      console.error("차트 데이터 로딩 실패:", err);
      setError(
        err instanceof Error ? err.message : "차트 데이터를 불러올 수 없습니다."
      );
    } finally {
      setLoading(false);
    }
  };


  const getCandleColor = (isUp: boolean) => {
    return isUp ? "#ef4444" : "#3b82f6";
  };


  const getVolumeColor = (item: ChartDataDto) => {
    const isUp = item.closePrice >= item.openPrice;
    return isUp ? "#ef4444" : "#3b82f6";
  };


  const calculateMA = (period: number) => {
    if (chartData.length < period) return [];

    const ma = [];
    for (let i = period - 1; i < chartData.length; i++) {
      const sum = chartData
        .slice(i - period + 1, i + 1)
        .reduce((acc, item) => acc + item.closePrice, 0);
      ma.push(sum / period);
    }
    return ma;
  };


  const calculateRSI = (period: number = 14) => {
    if (chartData.length < period + 1) return [];

    const gains = [];
    const losses = [];

    for (let i = 1; i < chartData.length; i++) {
      const change = chartData[i].closePrice - chartData[i - 1].closePrice;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const rsi = [];
    for (let i = period; i < gains.length; i++) {
      const avgGain =
        gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const avgLoss =
        losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const rs = avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }

    return rsi;
  };


  const calculateBollingerBands = (
    period: number = 20,
    multiplier: number = 2
  ) => {
    if (chartData.length < period) return { upper: [], middle: [], lower: [] };

    const ma = calculateMA(period);
    const upper = [];
    const lower = [];

    for (let i = period - 1; i < chartData.length; i++) {
      const slice = chartData.slice(i - period + 1, i + 1);
      const variance =
        slice.reduce((acc, item) => {
          return acc + Math.pow(item.closePrice - ma[i - period + 1], 2);
        }, 0) / period;
      const stdDev = Math.sqrt(variance);

      upper.push(ma[i - period + 1] + multiplier * stdDev);
      lower.push(ma[i - period + 1] - multiplier * stdDev);
    }

    return { upper, middle: ma, lower };
  };


  const getPriceChange = () => {
    if (chartData.length < 2) return { change: 0, changePercent: 0 };

    const current = chartData[chartData.length - 1].closePrice;
    const previous = chartData[chartData.length - 2].closePrice;
    const change = current - previous;
    const changePercent = (change / previous) * 100;

    return { change, changePercent };
  };


  useEffect(() => {
    loadChartData(selectedPeriod);
  }, [selectedPeriod, stockSymbol]);


  const toggleFullscreen = () => {
    if (chartRef.current) {
      if (!isFullscreen) {
        chartRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };


  const refreshChart = () => {
    loadChartData(selectedPeriod);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {stockSymbol} 차트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-2">차트 데이터를 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {stockSymbol} 차트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80 text-red-600">
            <span>오류: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { change, changePercent } = getPriceChange();
  const ma5 = calculateMA(5);
  const ma20 = calculateMA(20);
  const rsi = calculateRSI();
  const bollinger = calculateBollingerBands();

  return (
    <Card className={className} ref={chartRef}>
      <CardHeader className="space-y-4">
        {chartData.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                현재가
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {chartData[chartData.length - 1]?.closePrice?.toLocaleString()}
                원
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                change >= 0
                  ? "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-700"
                  : "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700"
              }`}
            >
              <div
                className={`text-xs font-medium ${
                  change >= 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {change >= 0 ? "상승" : "하락"}
              </div>
              <div
                className={`text-xl font-bold ${
                  change >= 0
                    ? "text-red-900 dark:text-red-100"
                    : "text-blue-900 dark:text-blue-100"
                }`}
              >
                {change >= 0 ? "+" : ""}
                {change.toLocaleString()}원
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                changePercent >= 0
                  ? "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-700"
                  : "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700"
              }`}
            >
              <div
                className={`text-xs font-medium ${
                  changePercent >= 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                등락률
              </div>
              <div
                className={`text-xl font-bold ${
                  changePercent >= 0
                    ? "text-red-900 dark:text-red-100"
                    : "text-blue-900 dark:text-blue-100"
                }`}
              >
                {changePercent >= 0 ? "+" : ""}
                {changePercent.toFixed(2)}%
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-xl border border-green-200 dark:border-green-700">
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                고가
              </div>
              <div className="text-xl font-bold text-green-900 dark:text-green-100">
                {Math.max(
                  ...chartData.map((d) => d.highPrice)
                ).toLocaleString()}
                원
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
              <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                저가
              </div>
              <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                {Math.min(...chartData.map((d) => d.lowPrice)).toLocaleString()}
                원
              </div>
            </div>
          </div>
        )}

        <PeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      </CardHeader>

      <CardContent className="space-y-6">
                <defs>
                  <pattern
                    id="grid"
                    width="50"
                    height="50"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 50 0 L 0 0 0 50"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="0.5"
                      opacity="0.3"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {indicators.showMA && (
                  <>
                    {ma5.length > 0 && (
                      <path
                        d={ma5
                          .map((value, index) => {
                            const x =
                              50 + ((index + 4) * 700) / (chartData.length - 1);
                            const y =
                              50 +
                              ((Math.max(...chartData.map((d) => d.highPrice)) -
                                value) *
                                300) /
                                (Math.max(
                                  ...chartData.map((d) => d.highPrice)
                                ) -
                                  Math.min(
                                    ...chartData.map((d) => d.lowPrice)
                                  ));
                            return `${index === 0 ? "M" : "L"} ${x} ${y}`;
                          })
                          .join(" ")}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        opacity="0.8"
                      />
                    )}
                    {ma20.length > 0 && (
                      <path
                        d={ma20
                          .map((value, index) => {
                            const x =
                              50 +
                              ((index + 19) * 700) / (chartData.length - 1);
                            const y =
                              50 +
                              ((Math.max(...chartData.map((d) => d.highPrice)) -
                                value) *
                                300) /
                                (Math.max(
                                  ...chartData.map((d) => d.highPrice)
                                ) -
                                  Math.min(
                                    ...chartData.map((d) => d.lowPrice)
                                  ));
                            return `${index === 0 ? "M" : "L"} ${x} ${y}`;
                          })
                          .join(" ")}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        opacity="0.8"
                      />
                    )}
                  </>
                )}

                      <line
                        x1={x + candleWidth / 2}
                        y1={highY}
                        x2={x + candleWidth / 2}
                        y2={lowY}
                        stroke="#64748b"
                        strokeWidth="1.5"
                        opacity="0.8"
                      />

                      {hoveredCandle === index && (
                        <g>
                          <rect
                            x={x - 80}
                            y={bodyTop - 100}
                            width="160"
                            height="90"
                            fill="white"
                            stroke="#64748b"
                            strokeWidth="1"
                            rx="8"
                            opacity="0.95"
                            filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
                          />
                          <text
                            x={x - 75}
                            y={bodyTop - 80}
                            fontSize="12"
                            fill="#374151"
                            fontWeight="600"
                          >
                            {new Date(item.date).toLocaleDateString()}
                          </text>
                          <text
                            x={x - 75}
                            y={bodyTop - 60}
                            fontSize="11"
                            fill="#6b7280"
                          >
                            시가: {item.openPrice?.toLocaleString()}원
                          </text>
                          <text
                            x={x - 75}
                            y={bodyTop - 45}
                            fontSize="11"
                            fill="#6b7280"
                          >
                            고가: {item.highPrice?.toLocaleString()}원
                          </text>
                          <text
                            x={x - 75}
                            y={bodyTop - 30}
                            fontSize="11"
                            fill="#6b7280"
                          >
                            저가: {item.lowPrice?.toLocaleString()}원
                          </text>
                          <text
                            x={x - 75}
                            y={bodyTop - 15}
                            fontSize="11"
                            fill="#6b7280"
                          >
                            종가: {item.closePrice?.toLocaleString()}원
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">차트 데이터가 없습니다</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {indicators.showRSI && rsi.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              RSI (14)
            </div>
            <div className="h-32 relative">
              <svg width="100%" height="100%" className="overflow-visible">
                <path
                  d={rsi
                    .map((value, index) => {
                      const x = (index * 100) / (rsi.length - 1);
                      const y = 20 + (80 - value) * 0.8;
                      return `${index === 0 ? "M" : "L"} ${x}% ${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
