"use client";
import { getAccessToken } from "@/app/utils/auth";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/utils/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  MapPin,
  Search,
  Filter,
  Star,
  Users,
  Activity,
  Minus,
  Heart,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import NavBar from "@/app/components/Navbar";
import { MouseFollower } from "@/components/mouse-follower";
import { StockTicker } from "@/components/stock-ticker";
import { FloatingEmojiBackground } from "@/components/floating-emoji-background";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/app/config/api";
import { useUserSettingsStore } from "@/lib/stores/userSettingsStore";
import {
  addToWatchlist,
  removeFromWatchlist,
  getMyWatchlist,
} from "@/lib/api/watchlist";
import { toast } from "sonner";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";
import type { StockPriceData } from "@/lib/api/stock";
import { searchStocks, StockSearchResult } from "@/lib/api/stock";
import Select from "react-select";


interface SelectOption {
  value: string;
  label: string;
}

interface Stock {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePercent?: number;
  logoUrl?: string;
  emoji?: string; 
  sector?: string; 
  volume?: number; 

  currentPrice?: string;
  priceChange?: string;
  changeRate?: string;
  changeSign?: string;
}

interface UserRegionInfo {
  regionId: number;
  roomName: string;
}

import { getSectorBrandColor } from "@/data/stock-brand-colors";


const getSectorColor = (sector: string): string => {
  const brandColor = getSectorBrandColor(sector);
  return `text-white shadow-lg`;
};


const customSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: "48px",
    border: state.isFocused
      ? "2px solid #10b981"
      : "2px solid var(--select-border)",
    borderRadius: "12px",
    boxShadow: state.isFocused
      ? "0 0 0 3px rgba(16, 185, 129, 0.1)"
      : "var(--select-shadow)",
    backgroundColor: "var(--select-bg)",
    backdropFilter: "blur(8px)",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      borderColor: "#10b981",
      boxShadow: "var(--select-hover-shadow)",
    },
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    padding: "8px 16px",
  }),
  input: (provided: any) => ({
    ...provided,
    margin: "0",
    color: "var(--select-text)",
    fontSize: "14px",
    fontWeight: "500",
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "#9ca3af",
    fontSize: "14px",
    fontWeight: "500",
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "var(--select-text)",
    fontSize: "14px",
    fontWeight: "500",
  }),
  indicatorSeparator: (provided: any) => ({
    ...provided,
    backgroundColor: "var(--select-separator)",
  }),
  dropdownIndicator: (provided: any, state: any) => ({
    ...provided,
    color: "#9ca3af",
    transition: "all 0.2s ease-in-out",
    transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : null,
    "&:hover": {
      color: "#10b981",
    },
  }),
  menu: (provided: any) => ({
    ...provided,
    borderRadius: "12px",
    overflow: "hidden",
    marginTop: "8px",
    boxShadow: "var(--select-menu-shadow)",
    backgroundColor: "var(--select-menu-bg)",
    backdropFilter: "blur(8px)",
    border: "1px solid var(--select-menu-border)",
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: "500",
    backgroundColor: state.isSelected
      ? "var(--select-option-selected-bg)"
      : state.isFocused
      ? "var(--select-option-focused-bg)"
      : "transparent",
    color: state.isSelected
      ? "var(--select-option-selected-text)"
      : "var(--select-option-text)",
    "&:active": {
      backgroundColor: "var(--select-option-active-bg)",
    },
  }),
};

export default function CommunityPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { settings, isInitialized } = useUserSettingsStore();
  const [activeTab, setActiveTab] = useState("stocks");
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [userRegion, setUserRegion] = useState<UserRegionInfo | null>(null);
  const [isLoadingRegion, setIsLoadingRegion] = useState(false);
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);


  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "change" | "volume">("name");


  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20); 
  const [totalStocks, setTotalStocks] = useState(0);


  const [watchlistStatus, setWatchlistStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const [watchlistLoading, setWatchlistLoading] = useState<{
    [key: string]: boolean;
  }>({});


  const currentPageStocks = allStocks.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );


  const currentPageStockCodes = useMemo(() => {
    return currentPageStocks.map((stock) => stock.symbol).filter(Boolean);
  }, [currentPageStocks]);


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
    stockCodes: currentPageStockCodes,
    onStockUpdate: (data) => {

    },
    autoReconnect: true,
    reconnectInterval: 3000,
  });


  const fetchStocks = async (page: number = 0, reset: boolean = true) => {
    try {
      setIsLoadingStocks(true);
      const response = await api.get("/stocks/ticker", {
        params: {
          page,
          size: Math.max(pageSize, 50), 
          sortBy:
            sortBy === "change"
              ? "changeRate"
              : sortBy === "volume"
              ? "volume"
              : "name",
          sortDir: "desc",
        },
      });

      if (response.data && response.data.success) {
        const stocks = response.data.data.map((stock: any) => ({
          symbol: stock.symbol || stock.stockCode || "",
          name: stock.name || stock.stockName || "종목명 없음",
          price: stock.price
            ? parseInt(stock.price)
            : stock.currentPrice
            ? parseInt(stock.currentPrice)
            : undefined,
          change: stock.priceChange ? parseInt(stock.priceChange) : undefined,
          changePercent: stock.changeRate
            ? parseFloat(stock.changeRate)
            : stock.change
            ? parseFloat(stock.change)
            : undefined,
          logoUrl: stock.logoUrl,
          emoji: stock.emoji || "📈", 
          sector: stock.sector || "기타", 
          volume: stock.volume ? parseInt(stock.volume.toString()) || 0 : 0, 

          currentPrice: stock.currentPrice || stock.price || "0",
          priceChange: stock.priceChange || "0",
          changeRate: stock.changeRate || "0",
          changeSign: stock.changeSign || "3", 
        }));

        if (reset) {
          setAllStocks(stocks);
        } else {
          setAllStocks((prev) => [...prev, ...stocks]);
        }


        setTotalStocks(stocks.length * 10); 
      }
    } catch (error) {
      console.error("종목 데이터 가져오기 실패:", error);

      if (reset) {
        setAllStocks([]);
      }
    } finally {
      setIsLoadingStocks(false);
    }
  };


  useEffect(() => {
    fetchStocks(0, true);
  }, []);


  useEffect(() => {
    setCurrentPage(0);
    fetchStocks(0, true);
  }, [sortBy]);


  useEffect(() => {
    const loadUserWatchlist = async () => {
      if (!user) {
        setWatchlistStatus({});
        return;
      }

      try {

        const watchlist = await getMyWatchlist();


        const watchlistMap: { [key: string]: boolean } = {};
        watchlist.forEach((item) => {
          watchlistMap[item.stockSymbol] = true;
        });

        setWatchlistStatus(watchlistMap);
      } catch (error) {
        console.error("관심종목 목록 로드 실패:", error);
        setWatchlistStatus({});
      }
    };

    loadUserWatchlist();
  }, [user]);


  useEffect(() => {
    if (wsStockData && allStocks.length > 0) {
      const stockPricesMap = getStockDataMap();

      setAllStocks((prevStocks) => {
        let hasChanged = false;
        const newStocks = prevStocks.map((stock) => {
          const realtimeData = stockPricesMap.get(stock.symbol);
          if (realtimeData) {

            const newVolume = realtimeData.volume
              ? parseInt(realtimeData.volume.toString()) || 0
              : stock.volume;
            const newPrice = realtimeData.currentPrice
              ? parseInt(realtimeData.currentPrice)
              : stock.price;
            const newChange = realtimeData.changePrice
              ? parseInt(realtimeData.changePrice)
              : stock.change;
            const newChangePercent = realtimeData.changeRate
              ? parseFloat(realtimeData.changeRate)
              : stock.changePercent;

            if (
              stock.currentPrice !== realtimeData.currentPrice ||
              stock.priceChange !== realtimeData.changePrice ||
              stock.changeRate !== realtimeData.changeRate ||
              stock.volume !== newVolume ||
              stock.price !== newPrice ||
              stock.change !== newChange ||
              stock.changePercent !== newChangePercent
            ) {
              hasChanged = true;
              return {
                ...stock,

                currentPrice: realtimeData.currentPrice,
                priceChange: realtimeData.changePrice,
                changeRate: realtimeData.changeRate,
                changeSign: realtimeData.changeSign,
                volume: newVolume,

                price: newPrice,
                change: newChange,
                changePercent: newChangePercent,
              };
            }
          }
          return stock;
        });


        return hasChanged ? newStocks : prevStocks;
      });
    }
  }, [wsStockData, allStocks.length]); 


  useEffect(() => {

  }, [currentPage, currentPageStocks.length, currentPageStockCodes]);

  useEffect(() => {

    const refreshUserInfo = async () => {
      if (!user?.latitude || !user?.longitude) {
        try {
          const token = getAccessToken();
          if (token) {
            const response = await fetch(
              "http:
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (response.ok) {
              const data = await response.json();

            }
          }
        } catch (error) {

        }
      }
    };

    refreshUserInfo();

    const fetchUserRegion = async () => {
      if (activeTab !== "regions") return;

      const token = getAccessToken();
      if (!token) {
        setUserRegion(null);
        return;
      }

      try {
        setIsLoadingRegion(true);
        const response = await fetch(
          "http:
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUserRegion({
            regionId: data.data.regionId,
            roomName: data.data.roomName || `지역 ${data.data.regionId}`,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user region:", error);
      } finally {
        setIsLoadingRegion(false);
      }
    };

    fetchUserRegion();
  }, [activeTab]);


  const [elasticSearchResults, setElasticSearchResults] = useState<
    StockSearchResult[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);


  useEffect(() => {
    if (!searchQuery.trim()) {
      setElasticSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await searchStocks(searchQuery);
        if (response.success) {
          setElasticSearchResults(response.data);
        }
      } catch (error) {
        console.error("Elasticsearch 검색 실패:", error);
        setElasticSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);


  const filteredAndSortedStocks = useMemo(() => {
    let filtered: any[];


    if (searchQuery.trim() && elasticSearchResults.length > 0) {
      filtered = elasticSearchResults.map((result) => ({
        symbol: result.symbol,
        name: result.name,
        sector: result.sector,
        currentPrice: parseFloat(result.currentPrice) || 0,
        changePercent: parseFloat(result.priceChangePercent) || 0,
        volume: 0,
        logoUrl: result.logoUrl,
      }));
    } else {

      filtered = allStocks.filter((stock) => {
        const matchesSearch =
          !searchQuery.trim() ||
          stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.symbol.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSector =
          selectedSector === "all" || stock.sector === selectedSector;
        return matchesSearch && matchesSector;
      });
    }


    if (selectedSector !== "all") {
      filtered = filtered.filter((stock) => stock.sector === selectedSector);
    }


    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "change":
          return (b.changePercent || 0) - (a.changePercent || 0);
        case "volume":
          return (b.volume || 0) - (a.volume || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allStocks, searchQuery, selectedSector, sortBy, elasticSearchResults]);


  const uniqueSectors = useMemo(() => {
    const sectors = [...new Set(allStocks.map((stock) => stock.sector))];
    return sectors.sort();
  }, [allStocks]);


  const sectorOptions: SelectOption[] = useMemo(
    () => [
      { value: "all", label: "🏢 전체 업종" },
      ...uniqueSectors
        .filter((sector) => sector)
        .map((sector) => ({
          value: sector || "기타",
          label:
            sector === "IT"
              ? "💻 IT"
              : sector === "금융"
              ? "🏦 금융"
              : sector === "제조업"
              ? "🏭 제조업"
              : sector === "에너지"
              ? "⚡ 에너지"
              : sector === "소비재"
              ? "🛍️ 소비재"
              : sector === "헬스케어"
              ? "🏥 헬스케어"
              : sector === "바이오"
              ? "🧬 바이오"
              : sector === "반도체"
              ? "🔬 반도체"
              : sector === "자동차"
              ? "🚗 자동차"
              : sector === "건설"
              ? "🏗️ 건설"
              : `📊 ${sector}`,
        })),
    ],
    [uniqueSectors]
  );

  const sortOptions: SelectOption[] = [
    { value: "name", label: "📝 이름순" },
    { value: "change", label: "📈 등락률순" },
    { value: "volume", label: "💰 거래량순" },
  ];


  const isInWatchlist = (stockSymbol: string): boolean => {
    return watchlistStatus[stockSymbol] || false;
  };


  const toggleWatchlist = async (stockSymbol: string, stockName: string) => {
    if (!user) {
      toast.error("관심종목을 관리하려면 로그인이 필요합니다.");
      return;
    }

    setWatchlistLoading((prev) => ({ ...prev, [stockSymbol]: true }));
    try {
      if (watchlistStatus[stockSymbol]) {

        const success = await removeFromWatchlist(stockSymbol);
        if (success) {
          setWatchlistStatus((prev) => ({ ...prev, [stockSymbol]: false }));
          toast.success(`${stockName}이(가) 관심종목에서 제거되었습니다.`);
        } else {
          toast.error("관심종목 제거에 실패했습니다.");
        }
      } else {

        const newItem = await addToWatchlist({ stockSymbol });
        if (newItem) {
          setWatchlistStatus((prev) => ({ ...prev, [stockSymbol]: true }));
          toast.success(`${stockName}이(가) 관심종목에 추가되었습니다.`);
        } else {
          toast.error("관심종목 추가에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("관심종목 토글 실패:", error);
      toast.error("관심종목 변경에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setWatchlistLoading((prev) => ({ ...prev, [stockSymbol]: false }));
    }
  };


  const handleRefresh = () => {
    if (wsConnected) {
      wsDisconnect();
      setTimeout(() => wsConnect(), 1000);
    } else {
      wsConnect();
    }
  };


  const getKoreanJosa = (word: string) => {
    if (!word) return "이";

    const lastChar = word.charAt(word.length - 1);
    const lastCharCode = lastChar.charCodeAt(0);

    if (lastCharCode >= 44032 && lastCharCode <= 55203) {
      const hangulCode = lastCharCode - 44032;
      const finalConsonant = hangulCode % 28;
      return finalConsonant === 0 ? "가" : "이";
    }

    return "이";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 transition-colors duration-500">
      {isInitialized && settings.emojiAnimationEnabled && (
        <FloatingEmojiBackground />
      )}

      <NavBar />

      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      <main className="container mx-auto px-4 py-8 pt-36">
          <div className="flex items-center justify-center gap-4 mb-4">
            {wsConnected ? (
              <>
                <Wifi className="w-5 h-5 text-green-600 animate-pulse" />
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  실시간 연결
                </Badge>
              </>
            ) : wsConnecting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  연결 중...
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-600" />
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  연결 안됨
                </Badge>
              </>
            )}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={wsConnecting}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 ${wsConnecting ? "animate-spin" : ""}`}
              />
              {wsConnected ? "재연결" : "연결"}
            </Button>
          </div>
        </div>

        {activeTab === "stocks" && (
          <div>
              <div className="relative max-w-lg mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="🔍 종목명, 종목코드, 업종으로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-12 py-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-2 border-green-200 dark:border-green-700 rounded-2xl shadow-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-base font-medium placeholder:text-gray-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-green-200 dark:border-green-700 rounded-xl shadow-xl z-10">
                    <div className="p-3 text-sm text-gray-600 dark:text-gray-400">
                      "{searchQuery}" 검색 결과:{" "}
                      {filteredAndSortedStocks.length}개 종목
                    </div>
                  </div>
                )}
              </div>

                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                      업종 필터
                    </span>
                  </div>
                  <Select<SelectOption>
                    options={sectorOptions}
                    value={sectorOptions.find(
                      (option) => option.value === selectedSector
                    )}
                    onChange={(selectedOption) =>
                      setSelectedSector(selectedOption?.value || "all")
                    }
                    styles={customSelectStyles}
                    placeholder="업종을 선택하세요"
                    isSearchable={true}
                    isClearable={false}
                    className="w-56"
                    classNamePrefix="react-select"
                    menuPlacement="auto"
                    noOptionsMessage={() => "검색 결과가 없습니다"}
                    instanceId="sector-select"
                  />
                </div>

                <div className="flex items-end">
                  <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl border-2 border-green-200 dark:border-green-700 shadow-lg">
                    {wsConnected ? (
                      <>
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                        <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                          실시간 연결
                        </span>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                        <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                          ({currentPageStockCodes.length}개 구독)
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 bg-gray-400 rounded-full shadow-lg"></div>
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                          오프라인
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

                <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-green-200 dark:border-green-700 rounded-2xl shadow-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 flex items-center">
                      <Activity className="w-6 h-6 mr-2" />
                      현재 페이지 종목 {Math.min(10, currentPageStocks.length)}
                      개
                    </h3>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {wsConnected ? "실시간" : "DB 데이터"}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {currentPageStocks.slice(0, 10).map((stock, index) => (
                      <Link
                        key={stock.symbol}
                        href={`/community/${stock.symbol}`}
                      >
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer group">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleWatchlist(stock.symbol, stock.name);
                                }}
                                disabled={watchlistLoading[stock.symbol]}
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                                  watchlistStatus[stock.symbol]
                                    ? "text-pink-500"
                                    : "text-gray-400 hover:text-pink-400"
                                }`}
                              >
                                <Heart
                                  className={`w-4 h-4 ${
                                    watchlistStatus[stock.symbol]
                                      ? "fill-current"
                                      : ""
                                  }`}
                                />
                              </button>
                              <span className="text-lg font-bold text-gray-600 dark:text-gray-400 w-6">
                                {index + 1}
                              </span>
                            </div>

                            <div className="flex items-center space-x-3">
                              {stock.logoUrl ? (
                                <img
                                  src={stock.logoUrl}
                                  alt={stock.name}
                                  className="w-10 h-10 rounded-full object-contain bg-white dark:bg-gray-800 p-1"
                                  onError={(e) => {
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-800/50 dark:to-emerald-800/50 rounded-full flex items-center justify-center">
                                  <span className="text-lg">
                                    {stock.emoji || "📈"}
                                  </span>
                                </div>
                              )}

                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                  {stock.name}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                  {stock.symbol}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6">
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {stock.currentPrice &&
                                stock.currentPrice !== "0"
                                  ? `₩${parseInt(
                                      stock.currentPrice
                                    ).toLocaleString()}`
                                  : stock.price
                                  ? `₩${stock.price.toLocaleString()}`
                                  : "가격 정보 없음"}
                              </div>
                              <div
                                className={`text-sm font-semibold ${
                                  stock.changeSign === "1" ||
                                  stock.changeSign === "2" ||
                                  (stock.change && stock.change > 0)
                                    ? "text-red-600 dark:text-red-400"
                                    : stock.changeSign === "4" ||
                                      stock.changeSign === "5" ||
                                      (stock.change && stock.change < 0)
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-gray-600 dark:text-gray-400"
                                }`}
                              >
                                {stock.changeSign === "1" ||
                                stock.changeSign === "2" ||
                                (stock.change && stock.change > 0)
                                  ? "+"
                                  : ""}
                                {stock.changeRate
                                  ? parseFloat(stock.changeRate).toFixed(1)
                                  : stock.changePercent?.toFixed(1) || "0.0"}
                                %
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                거래량
                              </div>
                              <div className="text-lg font-bold text-green-700 dark:text-green-300">
                                {stock.volume && stock.volume > 0
                                  ? `${parseInt(
                                      stock.volume.toString()
                                    ).toLocaleString()}주`
                                  : stock.volume === 0
                                  ? "0주"
                                  : "데이터 없음"}
                              </div>
                            </div>

                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              <span>토론방</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="text-center mt-4">
                  {searchQuery.trim() ? (

                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        "{searchQuery}"
                      </span>{" "}
                      검색 결과: {filteredAndSortedStocks.length}개 종목
                      {isSearching && " (검색 중...)"}
                    </span>
                  ) : (

                    <>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {currentPage + 1} / {Math.ceil(totalStocks / pageSize)}{" "}
                        페이지
                      </span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        총 {totalStocks.toLocaleString()}개 종목
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

        {activeTab === "regions" && (
          <div className="space-y-6">
            {!user ||
            !user.address ||
            !user.latitude ||
            !user.longitude ||
            user.latitude === 0 ||
            user.longitude === 0 ? (

              <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-green-200 dark:border-green-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-2xl mb-6">
                    <MapPin className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-3">
                    위치 정보 설정 필요
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    지역별 채팅방을 이용하려면 위치 정보를 설정해주세요
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    최초 1회만 설정하면 됩니다
                  </p>
                  <Button
                    onClick={() => router.push("/auth/location-setup")}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    위치 설정하기
                  </Button>
                </CardContent>
              </Card>
            ) : isLoadingRegion ? (
              <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-green-200 dark:border-green-700 rounded-2xl shadow-xl">
                <CardContent className="p-16 text-center">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-2xl mb-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
                  </div>
                  <p className="text-xl text-green-700 dark:text-green-300 font-medium">
                    지역 정보를 불러오는 중...
                  </p>
                </CardContent>
              </Card>
            ) : userRegion ? (
              <Card className="hover:shadow-2xl hover:scale-105 transition-all duration-500 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-green-200 dark:border-green-700 rounded-2xl shadow-xl">
                <CardContent className="p-12">
                  <div className="text-center space-y-6">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-2xl mb-6">
                      <MapPin className="w-12 h-12 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-green-800 dark:text-green-200 mb-3">
                        나의 지역 채팅방
                      </h3>
                      <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                        {userRegion.roomName}
                      </p>
                      <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                        같은 지역 주민들과 실시간으로 투자 정보를 공유해보세요
                      </p>
                    </div>
                    <Link href={`/community/region/${userRegion.regionId}`}>
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-lg font-semibold"
                      >
                        <MessageSquare className="w-6 h-6 mr-2" />
                        채팅방 입장하기
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-green-200 dark:border-green-700 rounded-2xl shadow-xl hover:shadow-lg transition-all duration-300">
                <CardContent className="p-12 text-center">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-2xl mb-6">
                    <MapPin className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-xl text-gray-600 dark:text-gray-300 mb-3">
                    지역 정보를 불러올 수 없습니다.
                  </p>
                  <p className="text-lg text-gray-500 dark:text-gray-400">
                    로그인 후 이용해주세요.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
