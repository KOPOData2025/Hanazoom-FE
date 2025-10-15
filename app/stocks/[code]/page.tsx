"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import NavBar from "@/app/components/Navbar";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Wifi,
  WifiOff,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockPriceInfo } from "@/components/wts/StockPriceInfo";
import { OrderBookDisplay } from "@/components/wts/OrderBookDisplay";
import { CandlestickChart } from "@/components/wts/CandlestickChart";
import { TradingTabs } from "@/components/wts/TradingTabs";
import { FloatingEmojiBackground } from "@/components/floating-emoji-background";
import {
  getStockOrderBook,
  validateStockCode,
  type StockPriceData,
  type OrderBookData,
} from "@/lib/api/stock";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";

import TickerStrip from "@/components/TickerStrip";
import { MouseFollower } from "@/components/mouse-follower";
import { getStock, type Stock } from "@/lib/api/stock";
import { useAuthStore } from "@/app/utils/auth";
import {
  addToWatchlist,
  removeFromWatchlist,
  checkIsInWatchlist,
} from "@/lib/api/watchlist";
import { toast } from "sonner";

export default function StockDetailPage() {
  const params = useParams();
  const stockCode = params.code as string;
  const { accessToken } = useAuthStore();
  const [orderBookData, setOrderBookData] = useState<OrderBookData | null>(
    null
  );
  const [stockInfo, setStockInfo] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);


  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(false);




  const {
    connected: wsConnected,
    connecting: wsConnecting,
    error: wsError,
    stockData: wsStockData,
    lastUpdate,
    getStockData,
    connect: wsConnect,
    disconnect: wsDisconnect,
  } = useStockWebSocket({
    stockCodes: validateStockCode(stockCode) ? [stockCode] : [],
    onStockUpdate: (data) => {
      console.log("📊 주식 상세 페이지 실시간 데이터 수신:", {
        stockCode: data.stockCode,
        stockName: data.stockName,
        currentPrice: data.currentPrice,
        changePrice: data.changePrice,
        changeRate: data.changeRate,
        timestamp: new Date().toISOString()
      });
    },
    autoReconnect: true,
    reconnectInterval: 3000,
  });


  const stockData = getStockData(stockCode);
  

  useEffect(() => {
    if (stockData) {
      console.log("📈 주식 상세 페이지 stockData 업데이트:", {
        stockCode: stockData.stockCode,
        currentPrice: stockData.currentPrice,
        changePrice: stockData.changePrice,
        changeRate: stockData.changeRate,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log("📈 주식 상세 페이지 stockData 없음");
    }
  }, [stockData]);


  const checkWatchlistStatus = async () => {
    if (!accessToken || !stockCode) return;

    try {
      const status = await checkIsInWatchlist(stockCode);
      setIsInWatchlist(status);
    } catch (error) {
      console.error("관심종목 상태 확인 실패:", error);
    }
  };


  const toggleWatchlist = async () => {
    if (!accessToken) {
      toast.error("관심종목을 관리하려면 로그인이 필요합니다.");
      return;
    }

    setIsWatchlistLoading(true);
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(stockCode);
        setIsInWatchlist(false);


        const stockName = stockData?.stockName || stockInfo?.name || stockCode;
        const josa = getKoreanJosa(stockName);
        toast.success(`${stockName}이(가) 관심종목에서 제거되었습니다.`);
      } else {
        await addToWatchlist({ stockSymbol: stockCode });
        setIsInWatchlist(true);


        const stockName = stockData?.stockName || stockInfo?.name || stockCode;
        const josa = getKoreanJosa(stockName);
        toast.success(`${stockName}${josa} 관심종목에 추가되었습니다.`);
      }
    } catch (error) {
      console.error("관심종목 토글 실패:", error);
      toast.error("관심종목 변경에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsWatchlistLoading(false);
    }
  };


  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const meta = await getStock(stockCode);
        setStockInfo(meta);
      } catch (e) {
        console.warn("주식 메타 정보를 불러오지 못했습니다:", e);
      }
    };
    if (stockCode) fetchMeta();
  }, [stockCode]);


  useEffect(() => {
    if (stockCode && accessToken) {
      checkWatchlistStatus();
    }
  }, [stockCode, accessToken]);


  const fetchOrderBookData = async () => {
    if (!validateStockCode(stockCode)) {
      setError("유효하지 않은 종목코드입니다. (6자리 숫자여야 합니다)");
      setLoading(false);
      return;
    }

    try {
      setError(null);


      if (stockData && stockData.askOrders && stockData.bidOrders) {
        console.log("📊 웹소켓 호가창 데이터 사용");
        const wsOrderBookData: OrderBookData = {
          stockCode: stockData.stockCode,
          stockName: stockData.stockName,
          currentPrice: stockData.currentPrice,
          updatedTime: stockData.updatedTime,
          askOrders: stockData.askOrders,
          bidOrders: stockData.bidOrders,
          totalAskQuantity: stockData.totalAskQuantity || "0",
          totalBidQuantity: stockData.totalBidQuantity || "0",
          imbalanceRatio: stockData.imbalanceRatio || 0.5,
          spread: stockData.spread || 0,
          buyDominant: stockData.buyDominant || false,
          sellDominant: stockData.sellDominant || false,
        };
        setOrderBookData(wsOrderBookData);
        return;
      }


      console.log("📊 HTTP API 호가창 데이터 사용");
      const orderBookData = await getStockOrderBook(stockCode);
      setOrderBookData(orderBookData);
    } catch (err) {
      console.error("호가창 데이터 fetch 실패:", err);
      setError(
        err instanceof Error
          ? err.message
          : "호가창 데이터를 불러올 수 없습니다."
      );
    } finally {

      if (!wsConnected) {
        setLoading(false);
      }
      setInitialLoad(false);
    }
  };


  useEffect(() => {
    if (stockCode) {
      fetchOrderBookData();
    }
  }, [stockCode]);


  useEffect(() => {
    console.log("🔌 WebSocket 상태 변경:", {
      wsConnected,
      wsConnecting,
      wsError,
      initialLoad,
      hasStockData: !!stockData,
      stockCode
    });
    
    if (wsConnected) {

      setError(null);
      setInitialLoad(false);

      if (stockData) {

        setLoading(false);
      }
    } else if (!wsConnected && !wsConnecting && !initialLoad) {

      setError(wsError || "웹소켓 연결이 끊어졌습니다.");
      setLoading(false);
    }
  }, [wsConnected, wsConnecting, stockData, wsError, initialLoad, stockCode]);


  useEffect(() => {
    if (stockData && wsConnected) {
      setLoading(false);
      setError(null);
      console.log("📈 주식 데이터 수신 완료:", stockData.stockCode);
    }
  }, [stockData, wsConnected]);


  useEffect(() => {
    if (stockData && stockData.askOrders && stockData.bidOrders) {
      console.log("📊 웹소켓 호가창 데이터 자동 업데이트");
      const wsOrderBookData: OrderBookData = {
        stockCode: stockData.stockCode,
        stockName: stockData.stockName,
        currentPrice: stockData.currentPrice,
        updatedTime: stockData.updatedTime,
        askOrders: stockData.askOrders,
        bidOrders: stockData.bidOrders,
        totalAskQuantity: stockData.totalAskQuantity || "0",
        totalBidQuantity: stockData.totalBidQuantity || "0",
        imbalanceRatio: stockData.imbalanceRatio || 0.5,
        spread: stockData.spread || 0,
        buyDominant: stockData.buyDominant || false,
        sellDominant: stockData.sellDominant || false,
      };
      setOrderBookData(wsOrderBookData);
    }
  }, [stockData]);


  useEffect(() => {
    if (!wsConnected && !error && stockCode && validateStockCode(stockCode)) {
      const interval = setInterval(() => {
        fetchOrderBookData();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [stockCode, error, wsConnected]);


  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setInitialLoad(false);


    if (!wsConnected) {
      console.log("🔄 웹소켓 수동 재연결 시도");
      wsConnect();
    }


    fetchOrderBookData();
  };

  const formatNumber = (num: string) => {
    return parseInt(num).toLocaleString();
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


  const getKoreanJosa = (word: string) => {
    if (!word) return "가";


    const lastChar = word.charAt(word.length - 1);
    const lastCharCode = lastChar.charCodeAt(0);


    if (lastCharCode >= 44032 && lastCharCode <= 55203) {

      const hangulCode = lastCharCode - 44032;
      const finalConsonant = hangulCode % 28;


      return finalConsonant === 0 ? "가" : "이";
    }


    return "가";
  };

  const getPriceChangeIcon = (changeSign: string) => {
    switch (changeSign) {
      case "1":
      case "2":
        return <TrendingUp className="w-4 h-4" />;
      case "4":
      case "5":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };


  const livePriceStr =
    stockData?.currentPrice ||
    orderBookData?.currentPrice ||
    (stockInfo?.currentPrice != null ? String(stockInfo.currentPrice) : null);
  const closePriceStr = stockData?.previousClose || null;
  const displayPriceStr = livePriceStr || closePriceStr || null;
  const isPriceFromClose = !livePriceStr && !!closePriceStr;

  let titlePriceColor = "text-gray-700 dark:text-gray-300";
  if (stockData?.changeSign) {
    titlePriceColor = getPriceChangeColor(stockData.changeSign);
  } else if (livePriceStr && closePriceStr) {
    const diff = parseInt(livePriceStr) - parseInt(closePriceStr);
    titlePriceColor =
      diff > 0
        ? "text-red-600 dark:text-red-400"
        : diff < 0
        ? "text-blue-600 dark:text-blue-400"
        : "text-gray-600 dark:text-gray-400";
  }

  if (loading || (initialLoad && wsConnecting)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
        <div className="fixed top-0 left-0 right-0 z-[100]">
          <NavBar />
        </div>
        <main className="pt-20 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mb-4"></div>
                <p className="text-lg text-green-700 dark:text-green-300">
                  종목 정보를 불러오는 중...
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  {wsConnected ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">
                        웹소켓 연결됨
                      </span>
                    </>
                  ) : wsConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                      <span className="text-sm text-yellow-600">
                        웹소켓 연결 중...
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">
                        웹소켓 연결 안됨
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error && !wsConnected && !wsConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
        <div className="fixed top-0 left-0 right-0 z-[100]">
          <NavBar />
        </div>
        <main className="pt-20 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <p className="text-lg text-red-600 dark:text-red-400 mb-4">
                  {error || wsError || "종목 정보를 불러올 수 없습니다."}
                </p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  {wsConnected ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600">
                        웹소켓 연결됨
                      </span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">
                        웹소켓 연결 안됨
                      </span>
                    </>
                  )}
                </div>
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={handleRetry}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    다시 시도
                  </Button>
                  <Link href="/stocks">
                    <Button
                      variant="outline"
                      className="border-green-600 text-green-600 hover:bg-green-50"
                    >
                      종목 목록으로 돌아가기
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      <FloatingEmojiBackground />

      <TickerStrip
        className="top-16"
        logoUrl={stockInfo?.logoUrl || "/placeholder-logo.png"}
        name={stockInfo?.name || stockData?.stockName || `종목 ${stockCode}`}
        ticker={stockCode}
        price={parseInt((stockData?.currentPrice || orderBookData?.currentPrice || displayPriceStr || "0"))}
        change={parseInt(stockData?.changePrice || "0")}
        changeRate={parseFloat(stockData?.changeRate || "0")}
        marketState={wsConnected ? "정규장" : "장마감"}
        lastUpdatedSec={lastUpdate > 0 ? Math.floor((Date.now() - lastUpdate) / 1000) : 0}
        realtimeOrderable={true}
      />

      <main className="relative z-10 pt-28 pb-4">
        <div className="container mx-auto px-4 max-w-none">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 pl-4 ml-4 border-l border-white/30 dark:border-gray-700">
                {wsConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-600" />
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-600"
                    >
                      실시간 연결
                    </Badge>
                  </>
                ) : wsConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                    <Badge
                      variant="outline"
                      className="text-yellow-600 border-yellow-600"
                    >
                      연결 중...
                    </Badge>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-600" />
                    <Badge
                      variant="outline"
                      className="text-red-600 border-red-600"
                    >
                      연결 안됨
                    </Badge>
                  </>
                )}
                {lastUpdate > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.floor((Date.now() - lastUpdate) / 1000)}초 전
                  </span>
                )}
              </div>
            </div>
          </div>

            <div className="flex-1 min-w-0 order-1 lg:order-1">
              <Card className="h-[700px] lg:h-[800px] xl:h-[900px] 2xl:h-[1000px] bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-gray-700 shadow-lg">
                <CardContent className="p-2 h-full">
                  <CandlestickChart stockCode={stockCode} />
                </CardContent>
              </Card>
            </div>

