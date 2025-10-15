"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import NavBar from "@/app/components/Navbar";
import {
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { StockPriceData } from "@/lib/api/stock";
import { searchStocks, StockSearchResult } from "@/lib/api/stock";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";
import { StockTicker } from "@/components/stock-ticker";
import { MouseFollower } from "@/components/mouse-follower";
import { FloatingEmojiBackground } from "@/components/floating-emoji-background";
import api from "@/app/config/api";
import { useUserSettingsStore } from "@/lib/stores/userSettingsStore";

interface Stock {
  symbol: string;
  name: string;
  sector: string;
  logoUrl?: string;
  currentPrice?: string;
  priceChange?: string;
  changeRate?: string;
}

interface StockPage {
  content: Stock[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

interface StockItemProps {
  stock: Stock;
  priceData?: StockPriceData;
  wsConnected: boolean;
}

function StockItem({ stock, priceData, wsConnected }: StockItemProps) {
  const getSectorColor = (sector: string) => {
    switch (sector) {
      case "IT/전자":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "IT/인터넷":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "IT/게임":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200";
      case "자동차":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case "화학":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "바이오":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "금융":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "통신":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getPriceChangeColor = (changeSign: string) => {
    switch (changeSign) {
      case "1": 
      case "2": 
        return "text-red-600 dark:text-red-400";
      case "4": 
      case "5": 
        return "text-blue-600 dark:text-blue-400";
      default: 
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPriceChangeIcon = (changeSign: string) => {
    switch (changeSign) {
      case "1":
      case "2":
        return <TrendingUp className="w-3 h-3" />;
      case "4":
      case "5":
        return <TrendingDown className="w-3 h-3" />;
      default:
        return <DollarSign className="w-3 h-3" />;
    }
  };

  const formatNumber = (num: string) => {
    return parseInt(num).toLocaleString();
  };

  return (
    <Link href={`/stocks/${stock.symbol}`}>
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group h-48">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="mb-3">
            <h3 
              className="font-semibold text-gray-900 dark:text-gray-100 text-lg group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors leading-tight"
              title={stock.name} 
            >
              {stock.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              {stock.symbol}
            </p>
          </div>

          <div className="flex items-center justify-end mt-auto">
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
              <span className="text-xs font-medium">상세보기</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function StocksPage() {
  const { settings, isInitialized } = useUserSettingsStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState("symbol");
  const [sortDir, setSortDir] = useState("asc");

  const observer = useRef<IntersectionObserver | null>(null);
  const lastStockElementRef = useRef<HTMLDivElement>(null);

  const pageSize = 50;


  const stockCodes = stocks.map((stock) => stock.symbol);


  const {
    connected: wsConnected,
    connecting: wsConnecting,
    error: wsError,
    stockData: wsStockData,
    lastUpdate,
    subscribedCodes,
    connect: wsConnect,
    disconnect: wsDisconnect,
    getStockDataMap,
  } = useStockWebSocket({
    stockCodes: stockCodes,
    onStockUpdate: (data) => {
      console.log(
        "📈 목록 페이지 실시간 데이터:",
        data.stockCode,
        data.currentPrice
      );
    },
    autoReconnect: true,
    reconnectInterval: 3000,
  });


  const fetchStocks = useCallback(
    async (page: number, reset: boolean = false) => {
      if (isLoading) return;

      setIsLoading(true);
      try {
        const response = await api.get("/stocks/list", {
          params: {
            page,
            size: pageSize,
            sortBy,
            sortDir,
          },
        });

        if (response.data && response.data.success) {
          const stockPage: StockPage = response.data.data;

          if (reset) {
            setStocks(stockPage.content);
            setFilteredStocks(stockPage.content);
          } else {
            setStocks((prev) => [...prev, ...stockPage.content]);
            setFilteredStocks((prev) => [...prev, ...stockPage.content]);
          }

          setTotalPages(stockPage.totalPages);
          setTotalElements(stockPage.totalElements);
          setHasMore(!stockPage.last);
        }
      } catch (error) {
        console.error("주식 데이터 가져오기 실패:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [sortBy, sortDir]
  );


  useEffect(() => {
    fetchStocks(0, true);
  }, []);


  useEffect(() => {
    setCurrentPage(0);
    setStocks([]);
    setFilteredStocks([]);
    fetchStocks(0, true);
  }, [sortBy, sortDir, fetchStocks]);


  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (isLoading) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          const nextPage = currentPage + 1;
          setCurrentPage(nextPage);
          fetchStocks(nextPage);
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, currentPage, fetchStocks]
  );


  const [elasticSearchResults, setElasticSearchResults] = useState<
    StockSearchResult[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);


  useEffect(() => {
    if (!searchQuery.trim()) {
      setElasticSearchResults([]);
      setIsSearching(false);

      setFilteredStocks(stocks);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await searchStocks(searchQuery);
        if (response.success) {
          setElasticSearchResults(response.data);

          const converted = response.data.map((result) => ({
            symbol: result.symbol,
            name: result.name,
            sector: result.sector,
            logoUrl: result.logoUrl,
            currentPrice: result.currentPrice,
            priceChange: result.priceChangePercent,
            changeRate: result.priceChangePercent,
          }));
          setFilteredStocks(converted);
        }
      } catch (error) {
        console.error("Elasticsearch 검색 실패:", error);
        setElasticSearchResults([]);

        const filtered = stocks.filter(
          (stock) =>
            stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stock.symbol.includes(searchQuery) ||
            stock.sector.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredStocks(filtered);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, stocks]);


  const handleRefresh = () => {
    if (wsConnected) {
      wsDisconnect();
      setTimeout(() => wsConnect(), 1000);
    } else {
      wsConnect();
    }
  };


  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };


  const stockPricesMap = getStockDataMap();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      <div className="fixed top-0 left-0 right-0 z-[100]">
        <NavBar />
      </div>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="text-4xl font-bold text-green-800 dark:text-green-200">
                📊 WTS 거래 시스템
              </h1>
          <div className="mb-8 space-y-4">
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSortChange("symbol")}
                className={`border-green-600 ${
                  sortBy === "symbol"
                    ? "bg-green-50 text-green-600"
                    : "text-green-600"
                }`}
              >
                <ArrowUpDown className="w-4 h-4 mr-1" />
                종목코드
                {sortBy === "symbol" && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSortChange("name")}
                className={`border-green-600 ${
                  sortBy === "name"
                    ? "bg-green-50 text-green-600"
                    : "text-green-600"
                }`}
              >
                <ArrowUpDown className="w-4 h-4 mr-1" />
                종목명
                {sortBy === "name" && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSortChange("sector")}
                className={`border-green-600 ${
                  sortBy === "sector"
                    ? "bg-green-50 text-green-600"
                    : "text-green-600"
                }`}
              >
                <ArrowUpDown className="w-4 h-4 mr-1" />
                업종
                {sortBy === "sector" && (
                  <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </Button>
            </div>
          </div>

            {wsError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm">{wsError}</span>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    className="ml-auto border-red-600 text-red-600 hover:bg-red-50"
                  >
                    다시 시도
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredStocks.map((stock, index) => {
                if (filteredStocks.length === index + 1) {
                  return (
                    <div key={stock.symbol} ref={lastElementRef}>
                      <StockItem
                        stock={stock}
                        priceData={stockPricesMap.get(stock.symbol)}
                        wsConnected={wsConnected}
                      />
                    </div>
                  );
                } else {
                  return (
                    <StockItem
                      key={stock.symbol}
                      stock={stock}
                      priceData={stockPricesMap.get(stock.symbol)}
                      wsConnected={wsConnected}
                    />
                  );
                }
              })}
            </div>

            {filteredStocks.length > 0 && (
              <div className="text-center py-8">
                {searchQuery.trim() ? (

                  <>
                    <div className="text-2xl mb-2">🔍</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        "{searchQuery}"
                      </span>{" "}
                      검색 결과
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {filteredStocks.length}개 종목
                      {isSearching && " (검색 중...)"}
                    </p>
                  </>
                ) : !hasMore ? (

                  <>
                    <div className="text-2xl mb-2">🏁</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      모든 종목을 불러왔습니다
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      총 {totalElements.toLocaleString()}개 종목
                    </p>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
