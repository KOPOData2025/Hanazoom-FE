"use client";

import { useState, useEffect } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import {
  PortfolioSummary,
  PortfolioStock,
  TradeHistory,
} from "@/types/portfolio";
import PortfolioSummaryCard from "./PortfolioSummaryCard";
import PortfolioStocksTable from "./PortfolioStocksTable";
import TradeHistoryTable from "./TradeHistoryTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, History, Wallet, Users, X } from "lucide-react";
import PortfolioAnalysis from "./PortfolioAnalysis";
import RegionPortfolioComparison from "./RegionPortfolioComparison";
import { useRouter } from "next/navigation";
import ConsultationBooking from "../pb/ConsultationBooking";

export default function PortfolioDashboard() {
  const router = useRouter();
  const {
    loading,
    error,
    getPortfolioSummary,
    getPortfolioStocks,
    getTradeHistory,
    clearError,
  } = usePortfolio();

  const [portfolioSummary, setPortfolioSummary] =
    useState<PortfolioSummary | null>(null);
  const [portfolioStocks, setPortfolioStocks] = useState<PortfolioStock[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [activeTab, setActiveTab] = useState("regional");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    setIsInitialLoading(true);
    setLoadErrors([]);
    clearError();

    try {

      const summary = await getPortfolioSummary();
      if (summary) {
        console.log("🚀 PortfolioSummary API 응답:", summary);
        setPortfolioSummary(summary);
      }

      const stocks = await getPortfolioStocks();
      if (stocks) setPortfolioStocks(stocks);

      const trades = await getTradeHistory();
      if (trades) {
        console.log("📊 TradeHistory API 응답:", trades);
        setTradeHistory(trades);
      }


      const errors: string[] = [];
      if (!summary) errors.push("포트폴리오 요약");
      if (!stocks) errors.push("보유 주식 목록");
      if (!trades) errors.push("거래 내역");

      if (errors.length > 0) {
        setLoadErrors(errors);
      }
    } catch (err) {
      console.error("포트폴리오 데이터 로딩 실패:", err);
      setLoadErrors(["데이터 로딩 중 오류가 발생했습니다"]);
    } finally {
      setIsInitialLoading(false);
    }
  };


  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-green-700 dark:text-green-300 text-lg">
            포트폴리오 데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }


  if (
    loadErrors.length > 0 &&
    !portfolioSummary &&
    !portfolioStocks.length &&
    !tradeHistory.length
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center space-y-2">
          <div className="text-red-500 text-xl font-semibold">
            데이터 로딩에 실패했습니다
          </div>
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            {loadErrors.join(", ")} 조회에 실패했습니다.
          </div>
        </div>
        <button
          onClick={loadPortfolioData}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {portfolioSummary && <PortfolioSummaryCard summary={portfolioSummary} />}

            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-900 dark:text-green-100">
                  계좌 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    계좌번호
                  </span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {portfolioSummary?.accountNumber || "정보 없음"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    계좌명
                  </span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {portfolioSummary?.accountName || "정보 없음"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    증권사
                  </span>
                  <span className="text-green-900 dark:text-green-100">
                    하나증권
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    잔고일자
                  </span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {portfolioSummary?.balanceDate
                      ? new Date(
                          portfolioSummary.balanceDate
                        ).toLocaleDateString()
                      : "정보 없음"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-900 dark:text-green-100">
                  주식 현황
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    보유종목
                  </span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {portfolioSummary?.totalStockCount || 0}종목
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    평가금액
                  </span>
                  <span className="font-medium text-green-900 dark:text-green-100">
                    {portfolioSummary?.totalStockValue?.toLocaleString() || "0"}
                    원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-300">
                    평가손익
                  </span>
                  <span
                    className={`font-medium ${
                      (portfolioSummary?.totalProfitLoss || 0) >= 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {portfolioSummary?.totalProfitLoss?.toLocaleString() || "0"}
                    원
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stocks">
          <PortfolioStocksTable
            stocks={portfolioStocks}
            onRefresh={loadPortfolioData}
          />
        </TabsContent>

        <TabsContent value="trades">
          <TradeHistoryTable trades={tradeHistory} />
        </TabsContent>

        <TabsContent value="analysis">
          <PortfolioAnalysis
            portfolioSummary={portfolioSummary}
            portfolioStocks={portfolioStocks}
          />
        </TabsContent>

        <TabsContent value="regional">
          <RegionPortfolioComparison
            portfolioSummary={portfolioSummary}
            portfolioStocks={portfolioStocks}
            userRegion="강남구"
          />
        </TabsContent>
      </Tabs>

