"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Info,
  MapPin,
} from "lucide-react";
import RegionPortfolioComparison from "./RegionPortfolioComparison";
import EnhancedPortfolioChart from "./EnhancedPortfolioChart";

interface PortfolioAnalysisProps {
  portfolioSummary: any;
  portfolioStocks: any[];
}

const COLORS = [
  "#3B82F6", 
  "#10B981", 
  "#06B6D4", 
  "#F59E0B", 
  "#8B5CF6", 
  "#EC4899", 
  "#EF4444", 
  "#84CC16", 
  "#F97316", 
  "#6366F1", 
];

export default function PortfolioAnalysis({
  portfolioSummary,
  portfolioStocks,
}: PortfolioAnalysisProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [riskLevel, setRiskLevel] = useState<string>("보통");
  const [diversificationScore, setDiversificationScore] = useState<number>(0);
  const [diversificationDetails, setDiversificationDetails] =
    useState<any>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<
    "basic" | "region"
  >("basic");

  useEffect(() => {
    if (portfolioSummary && portfolioStocks) {
      generateChartData();
      calculateRiskLevel();
      calculateDiversificationScore();
    }
  }, [portfolioSummary, portfolioStocks]);

  const generateChartData = () => {
    const data = [];


    if (portfolioSummary.totalCash > 0) {
      data.push({
        name: "현금",
        value: portfolioSummary.totalCash,
        percentage: (
          (portfolioSummary.totalCash / portfolioSummary.totalBalance) *
          100
        ).toFixed(1),
        type: "cash",
        color: "#10B981",
      });
    }


    portfolioStocks.forEach((stock, index) => {
      if (stock.currentValue > 0) {
        const percentage = (
          (stock.currentValue / portfolioSummary.totalBalance) *
          100
        ).toFixed(1);


        const displayName = stock.stockName || stock.stockSymbol;

        data.push({
          name: displayName,
          value: stock.currentValue,
          percentage: percentage,
          type: "stock",
          color: COLORS[index % COLORS.length],
          profitLoss: stock.profitLoss,
          profitLossRate: stock.profitLossRate,
          stockSymbol: stock.stockSymbol, 
        });
      }
    });

    setChartData(data);
  };

  const calculateRiskLevel = () => {

    const stockRatio = portfolioSummary.stockAllocationRate;
    if (stockRatio < 30) setRiskLevel("낮음");
    else if (stockRatio < 70) setRiskLevel("보통");
    else setRiskLevel("높음");
  };

  const calculateDiversificationScore = () => {

    const weights = portfolioStocks.map(
      (stock) => stock.currentValue / portfolioSummary.totalBalance
    );

    const hhi = calculateHHI(weights);
    const interpretation = interpretHHI(hhi);
    const effectiveStocks = calculateEffectiveStocks(hhi);

    setDiversificationScore(interpretation.score);


    setDiversificationDetails({
      score: interpretation.score,
      level: interpretation.level,
      description: interpretation.description,
      hhi: hhi,
      effectiveStocks: effectiveStocks,
    });

    return {
      score: interpretation.score,
      level: interpretation.level,
      description: interpretation.description,
      hhi: hhi,
      effectiveStocks: effectiveStocks,
    };
  };


  const calculateHHI = (weights: number[]) => {
    if (weights.length === 0) return 1;
    return weights.reduce((sum, weight) => sum + Math.pow(weight, 2), 0);
  };


  const interpretHHI = (hhi: number) => {
    if (hhi <= 0.25)
      return {
        score: 90,
        level: "매우 잘 분산",
        description: "완벽한 분산 투자 - 리스크가 매우 낮음",
      };
    if (hhi <= 0.5)
      return {
        score: 75,
        level: "잘 분산",
        description: "적절한 분산 투자 - 리스크가 낮음",
      };
    if (hhi <= 0.75)
      return {
        score: 60,
        level: "보통",
        description: "보통 수준의 분산 - 리스크가 보통",
      };
    if (hhi <= 1.0)
      return {
        score: 40,
        level: "집중",
        description: "특정 종목에 집중 - 리스크가 높음",
      };
    return {
      score: 20,
      level: "매우 집중",
      description: "극도로 집중된 투자 - 리스크가 매우 높음",
    };
  };


  const calculateEffectiveStocks = (hhi: number) => {
    return hhi > 0 ? (1 / hhi).toFixed(1) : 0;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {data.name}
          </p>
          {data.type === "stock" && data.stockSymbol && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ({data.stockSymbol})
            </p>
          )}
          <p className="text-gray-600 dark:text-gray-400">
            비중: {data.percentage}%
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            금액: {data.value.toLocaleString()}원
          </p>
          {data.type === "stock" && (
            <>
              <p
                className={`font-medium ${
                  data.profitLoss >= 0 ? "text-red-600" : "text-blue-600"
                }`}
              >
                손익: {data.profitLoss >= 0 ? "+" : ""}
                {data.profitLoss.toLocaleString()}원
              </p>
              <p
                className={`font-medium ${
                  data.profitLossRate >= 0 ? "text-red-600" : "text-blue-600"
                }`}
              >
                수익률: {data.profitLossRate >= 0 ? "+" : ""}
                {data.profitLossRate.toFixed(2)}%
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "낮음":
        return "text-green-600 bg-green-100 dark:bg-green-900/20";
      case "보통":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
      case "높음":
        return "text-red-600 bg-red-100 dark:bg-red-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
    }
  };

  const getDiversificationColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100 dark:bg-green-900/20";
    if (score >= 60)
      return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
    return "text-red-600 bg-red-100 dark:bg-red-900/20";
  };

  return (
    <div className="space-y-6">
          <EnhancedPortfolioChart
            portfolioSummary={portfolioSummary}
            portfolioStocks={portfolioStocks}
          />

            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-900 dark:text-green-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  위험도
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={`text-sm ${getRiskColor(riskLevel)}`}>
                  {riskLevel}
                </Badge>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  주식 비중: {portfolioSummary.stockAllocationRate?.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-900 dark:text-green-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  수익률
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    (portfolioSummary.totalProfitLoss || 0) >= 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {portfolioSummary.totalProfitLossRate?.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  손익: {portfolioSummary.totalProfitLoss?.toLocaleString()}원
                </div>
              </CardContent>
            </Card>
          </div>

