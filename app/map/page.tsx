"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Map, useKakaoLoader } from "react-kakao-maps-sdk";
import { RegionMarker } from "@/app/components/RegionMarker";
import NavBar from "@/app/components/Navbar";
import { StockTicker } from "@/components/stock-ticker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Compass,
  Layers,
  TrendingUp,
  Loader2,
  ExternalLink,
  Heart,
  BarChart3,
  X,
  Star,
  Flame,
  Award,
  Crown,
  Sparkles,
  Info
} from "lucide-react";
import { useAuthStore } from "@/app/utils/auth";
import api from "@/app/config/api";
import { API_ENDPOINTS, type ApiResponse } from "@/app/config/api";
import { getTopStocksByRegion } from "@/lib/api/stock";
import { getPopularityDetails, type PopularityDetailsResponse } from "@/lib/api/stock";
import { MouseFollower } from "@/components/mouse-follower";
import { FloatingEmojiBackground } from "@/components/floating-emoji-background";
import { useUserSettingsStore } from "@/lib/stores/userSettingsStore";
import { useRouter } from "next/navigation";
import { useMapBounds } from "@/app/hooks/useMapBounds";
import { filterMarkersByLOD } from "@/app/utils/lodUtils";
import { SearchJump } from "@/components/search-jump";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";
import { getMarketStatus, isMarketOpen } from "@/lib/utils/marketUtils";
import type { StockPriceData } from "@/lib/api/stock";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import OfflineIndicator from "@/components/OfflineIndicator";
import PopularityDonut from "@/components/popularity-donut";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";


export interface Region {
  id: number;
  name: string;
  type: "CITY" | "DISTRICT" | "NEIGHBORHOOD";
  parentId: number | null;
  latitude: number;
  longitude: number;
}


interface TopStock {
  symbol: string;
  name: string;
  price: string | null; 
  change: string;
  logoUrl?: string;
  emoji?: string; 
  sector: string; 
  currentPrice?: number; 
  rank?: number; 

  realtimeData?: StockPriceData;
  lastUpdated?: Date;
}

const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

export default function MapPage() {
  const user = useAuthStore((state) => state.user);
  const { settings, isInitialized } = useUserSettingsStore();
  const [regions, setRegions] = useState<Region[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [topStocks, setTopStocks] = useState<TopStock[]>([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedStock, setSelectedStock] = useState<TopStock | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [popDetails, setPopDetails] = useState<PopularityDetailsResponse | null>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const router = useRouter();


  const handlePopDetailsLoaded = useCallback((data: PopularityDetailsResponse | null) => {
    setPopDetails(data);
  }, []);


  const [marketStatus, setMarketStatus] = useState(getMarketStatus());
  const [isRealtimeMode, setIsRealtimeMode] = useState(isMarketOpen());


  const stockCodes = useMemo(() => {
    return topStocks.map((stock: TopStock) => stock.symbol);
  }, [topStocks]);

  const {
    connected: wsConnected,
    stockData: wsStockData,
    subscribe,
    unsubscribe,
    getStockData,
  } = useStockWebSocket({
    stockCodes,
    onStockUpdate: (data: StockPriceData) => {
      console.log("📊 실시간 주식 데이터 업데이트:", data);


      if (data.stockCode === "023530") {
        console.log("🏪 롯데쇼핑 실시간 데이터 수신:", {
          stockCode: data.stockCode,
          stockName: data.stockName,
          currentPrice: data.currentPrice,
          changeRate: data.changeRate,
          timestamp: new Date().toISOString(),
        });
      }


      setTopStocks((prevStocks) =>
        prevStocks.map((stock: TopStock) => {
          if (stock.symbol === data.stockCode) {
            return {
              ...stock,
              price: data.currentPrice || "데이터 없음",
              change: data.changeRate?.replace("%", "") || "0.00",
              realtimeData: data,
              lastUpdated: new Date(),
            };
          }
          return stock;
        })
      );
    },
  });


  const { viewport, updateBounds, isPointInBounds } = useMapBounds();


  const { isOffline } = useOfflineStatus();


  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedZoomLevel, setDebouncedZoomLevel] = useState(9);


  useKakaoLoader({
    appkey: KAKAO_MAP_API_KEY!,
    libraries: ["services"],
  });


  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    console.log("🗺️ 지도 위치 변경:", { lat, lng });
    setCenter({ lat, lng });
    setZoomLevel(4);
    setDebouncedZoomLevel(4);
  }, []);


  const handleResetMap = useCallback(() => {
    console.log("🔄 지도 상태 초기화");
    setSelectedRegion(null);
    setTopStocks([]);
    setSelectedStock(null);

    if (user?.latitude && user?.longitude && mapRef.current) {
      const lat = Number(user.latitude);
      const lng = Number(user.longitude);
      console.log("📍 지도 중심 이동:", { lat, lng });


      const defaultZoom = getDefaultZoomLevel();
      console.log("🎯 기본 줌 레벨 적용:", defaultZoom);


      const newCenter = new kakao.maps.LatLng(lat, lng);
      mapRef.current.panTo(newCenter);
      mapRef.current.setLevel(defaultZoom);


      setCenter({ lat, lng });
      setZoomLevel(defaultZoom);
      setDebouncedZoomLevel(defaultZoom);
    }
  }, [user?.latitude, user?.longitude, isInitialized, settings.defaultMapZoom]);


  const moveToUserLocation = useCallback(() => {
    if (user?.latitude && user?.longitude && mapRef.current) {
      const lat = Number(user.latitude);
      const lng = Number(user.longitude);
      console.log("📍 초기 사용자 위치로 이동:", { lat, lng });


      const defaultZoom = getDefaultZoomLevel();
      console.log("🎯 기본 줌 레벨 적용:", defaultZoom);


      const newCenter = new kakao.maps.LatLng(lat, lng);
      mapRef.current.panTo(newCenter);
      mapRef.current.setLevel(defaultZoom);


      setCenter({ lat, lng });
      setZoomLevel(defaultZoom);
      setDebouncedZoomLevel(defaultZoom);
    }
  }, [user?.latitude, user?.longitude, isInitialized, settings.defaultMapZoom]);


  const [center, setCenter] = useState({ lat: 37.5665, lng: 126.978 }); 


  const getDefaultZoomLevel = () => {
    if (isInitialized && settings.defaultMapZoom) {
      return settings.defaultMapZoom;
    }
    return 9; 
  };

  const [zoomLevel, setZoomLevel] = useState(getDefaultZoomLevel());


  useEffect(() => {
    if (user?.latitude && user?.longitude) {
      console.log("👤 사용자 정보 로드됨 - 초기 위치 설정");
      const lat = Number(user.latitude);
      const lng = Number(user.longitude);
      setCenter({ lat, lng });


      const defaultZoom = getDefaultZoomLevel();
      console.log("🎯 초기 줌 레벨 적용:", defaultZoom);
      setZoomLevel(defaultZoom);
      setDebouncedZoomLevel(defaultZoom);
    }
  }, [user?.latitude, user?.longitude, isInitialized, settings.defaultMapZoom]);


  useEffect(() => {
    if (isInitialized && settings.defaultMapZoom) {
      console.log("🎯 사용자 설정 줌 레벨 적용:", settings.defaultMapZoom);
      setZoomLevel(settings.defaultMapZoom);
      setDebouncedZoomLevel(settings.defaultMapZoom);
    }
  }, [isInitialized, settings.defaultMapZoom]);


  useEffect(() => {
    const checkMarketStatus = () => {
      const newStatus = getMarketStatus();
      const newIsRealtimeMode = isMarketOpen();

      setMarketStatus(newStatus);
      setIsRealtimeMode(newIsRealtimeMode);

      console.log("📈 시장 상태 체크:", {
        status: newStatus.marketStatus,
        isOpen: newStatus.isMarketOpen,
        isRealtimeMode: newIsRealtimeMode,
        wsConnected,
      });
    };


    checkMarketStatus();


    const interval = setInterval(checkMarketStatus, 60000);

    return () => clearInterval(interval);
  }, [wsConnected]);


  useEffect(() => {
    if (mapRef.current && user?.latitude && user?.longitude) {
      const currentCenter = mapRef.current.getCenter();
      const userLat = Number(user.latitude);
      const userLng = Number(user.longitude);


      if (
        Math.abs(currentCenter.getLat() - userLat) > 0.001 ||
        Math.abs(currentCenter.getLng() - userLng) > 0.001
      ) {
        console.log("🚀 지도 준비됨 - 사용자 위치로 이동");
        moveToUserLocation();
      }
    }
  }, [mapRef.current, user?.latitude, user?.longitude, moveToUserLocation]);


  useEffect(() => {
    const fetchRegions = async () => {
      try {

        if (isOffline) {
          console.log("📱 오프라인 모드 - 캐시된 지역 데이터 사용");
          try {
            const cachedData = await caches.match("/api/regions");
            if (cachedData) {
              const response = await cachedData.json();
              if (response.success) {
                setRegions(response.data);
                console.log(
                  "🗺️ 캐시된 지역 데이터 로드 완료:",
                  response.data.length,
                  "개"
                );
              }
            }
          } catch (cacheError) {
            console.log("📱 캐시된 데이터 없음 - 기본 데이터 사용");
            setRegions([]);
          }
        } else {

          const { data } = await api.get<ApiResponse<Region[]>>(
            API_ENDPOINTS.regions
          );
          setRegions(data.data);
          console.log("🗺️ 지역 데이터 로드 완료:", data.data.length, "개");
        }


        setTimeout(() => setIsMapReady(true), 100);
      } catch (err) {
        console.error("지역 데이터를 불러오는 데 실패했습니다.", err);

        setRegions([]);
        setTimeout(() => setIsMapReady(true), 100);

      }
    };
    fetchRegions();
  }, [isOffline]);


  const handleZoomChange = useCallback((newZoomLevel: number) => {

    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }


    setZoomLevel(newZoomLevel);


    zoomTimeoutRef.current = setTimeout(() => {
      setDebouncedZoomLevel(newZoomLevel);
    }, 150); 
  }, []);


  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []);


  const visibleMarkers = useMemo(() => {
    if (!regions || regions.length === 0 || !viewport) {
      return [];
    }

    const filtered = filterMarkersByLOD(
      regions,
      debouncedZoomLevel,
      viewport.center.lat,
      viewport.center.lng,
      isPointInBounds
    );

    return filtered;
  }, [regions, debouncedZoomLevel, viewport, isPointInBounds]);


  const fetchTopStocks = useCallback(
    async (regionId: number) => {
      setLoadingStocks(true);
      try {
        const response = await getTopStocksByRegion(regionId);
        console.log("🔍 받아온 주식 데이터:", response.data);
        console.log("🔍 첫 번째 주식 섹터:", response.data[0]?.sector);


        const stocksWithRealtime = response.data.map((stock: any) => {

          const realtimeData = getStockData(stock.symbol);

          return {
            ...stock,

            price:
              realtimeData?.currentPrice ||
              (stock.price === null ||
              stock.price === "null" ||
              stock.price === "데이터 없음"
                ? "데이터 없음"
                : stock.price),
            change:
              realtimeData?.changeRate ||
              (stock.change === "nu%" ? "0.00" : stock.change),
            realtimeData: realtimeData || undefined,
            lastUpdated: realtimeData ? new Date() : new Date(),
          };
        });

        setTopStocks(stocksWithRealtime);


        if (isRealtimeMode && wsConnected && stocksWithRealtime.length > 0) {
          const symbols = stocksWithRealtime.map(
            (stock: TopStock) => stock.symbol
          );
          console.log("📡 실시간 모드: 종목 구독 시작", symbols);
          console.log("📡 웹소켓 연결 상태:", wsConnected);
          console.log("📡 시장 상태:", marketStatus);
          subscribe(symbols);
        } else {
          console.log("📴 구독하지 않는 이유:", {
            isRealtimeMode,
            wsConnected,
            stocksLength: stocksWithRealtime.length,
            marketStatus,
          });
        }
      } catch (err) {
        console.error("상위 주식 정보를 가져오는 데 실패했습니다.", err);
        setTopStocks([]);
      } finally {
        setLoadingStocks(false);
      }
    },
    [isRealtimeMode, wsConnected, subscribe]
  );


  useEffect(() => {
    if (topStocks.length > 0) {
      const symbols = topStocks.map((stock: TopStock) => stock.symbol);

      if (isRealtimeMode && wsConnected) {
        console.log("📡 실시간 모드 활성화: 종목 구독", symbols);
        console.log("📡 롯데쇼핑 포함 여부:", symbols.includes("023530"));
        subscribe(symbols);
      } else {
        console.log("📴 실시간 모드 비활성화: 종목 구독 해제", symbols);
        unsubscribe(symbols);
      }
    }
  }, [isRealtimeMode, wsConnected, topStocks, subscribe, unsubscribe]);


  const handleMarkerClick = useCallback(
    (region: Region) => {
      setSelectedRegion(region);


      const moveToMarker = () => {
        if (mapRef.current) {

          const currentCenter = mapRef.current.getCenter();
          const targetPosition = new kakao.maps.LatLng(region.latitude, region.longitude);
          const distance = Math.sqrt(
            Math.pow(currentCenter.getLat() - region.latitude, 2) +
            Math.pow(currentCenter.getLng() - region.longitude, 2)
          );


          let newZoomLevel: number;
          if (region.type === "CITY") {
            newZoomLevel = 7;
          } else if (region.type === "DISTRICT") {
            newZoomLevel = 4;
          } else {
            newZoomLevel = Math.max(zoomLevel, 3); 
          }


          setZoomLevel(newZoomLevel);
          setDebouncedZoomLevel(newZoomLevel);


          if (zoomTimeoutRef.current) {
            clearTimeout(zoomTimeoutRef.current);
            zoomTimeoutRef.current = null;
          }


          if (distance > 0.01) { 
            mapRef.current.panTo(targetPosition);


            setTimeout(() => {
              mapRef.current?.setLevel(newZoomLevel, {
                animate: true
              });
            }, 150);
          } else {

            mapRef.current.setCenter(targetPosition);
            mapRef.current.setLevel(newZoomLevel, {
              animate: true
            });
          }


          setCenter({ lat: region.latitude, lng: region.longitude });
        }
      };


      setTimeout(moveToMarker, 100);


      fetchTopStocks(region.id);
    },
    [fetchTopStocks, zoomLevel]
  );


  const renderedMarkers = useMemo(() => {
    const markers = visibleMarkers.map((region) => (
      <RegionMarker
        key={region.id}
        region={region}
        onClick={handleMarkerClick}
        isVisible={true} 
        isSelected={selectedRegion?.id === region.id} 
      />
    ));

    return markers;
  }, [visibleMarkers, handleMarkerClick, selectedRegion]);


  const handleStockClick = (stock: TopStock) => {
    setSelectedStock(stock);
    setShowStockModal(true);
  };


  const handleCloseStockDetail = () => {
    setSelectedStock(null);
    setShowStockModal(false);
    setPopDetails(null);
  };


  const handleGoToCommunity = (stock: TopStock) => {
    router.push(`/community/${stock.symbol}`);
  };


  const handleToggleFavorite = (stock: TopStock) => {

    console.log("찜하기:", stock.symbol);
  };


  const handleViewChart = (stock: TopStock) => {

    console.log("차트 보기:", stock.symbol);
  };


  if (!isMapReady) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              지도 준비 중
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              지역 정보를 불러오는 중입니다...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
      <FloatingEmojiBackground />

      <SearchJump
        regions={regions}
        onLocationSelect={handleLocationSelect}
        onResetMap={handleResetMap}
      />


      <main className="relative z-10 pt-20">
        <div className="w-full px-6 py-4 h-[calc(100vh-8rem)] flex gap-6">
          <Card className="w-80 hidden md:flex flex-col bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                <Compass className="w-5 h-5 text-emerald-600" />
                <span className="font-bold">지역 탐색</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto space-y-4 max-h-[calc(100vh-12rem)]">
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <label className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>탐색 범위</span>
                </label>

                <div className="bg-white dark:bg-gray-700 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      줌 레벨: {zoomLevel}
                    </span>
                    <div className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-full font-medium">
                      {zoomLevel <= 4 ? "동네" : zoomLevel <= 7 ? "도시" : "전국"}
                    </div>
                  </div>

                  <Slider
                    value={[zoomLevel]}
                    max={14}
                    min={1}
                    step={1}
                    onValueChange={(value) => handleZoomChange(value[0])}
                    className="mb-3"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-gray-200">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>
                      {selectedRegion
                        ? `${selectedRegion.name} 인기 종목`
                        : "지역을 선택하세요"}
                    </span>
                  </h4>

                </div>

                    {topStocks.map((stock, index) => {
                      const isSelected = selectedStock?.symbol === stock.symbol;
                      const actualRank = index + 1;


                      const getRankStyle = (rank: number) => {
                        switch (rank) {
                          case 1:
                            return {
                              badgeColor:
                                "bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900",
                              borderColor:
                                "border-yellow-300 dark:border-yellow-600",
                              cardSize: "scale-[1.02]",
                              label: "1위",
                            };
                          case 2:
                            return {
                              badgeColor:
                                "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900",
                              borderColor:
                                "border-gray-300 dark:border-gray-600",
                              cardSize: "scale-[1.01]",
                              label: "2위",
                            };
                          case 3:
                            return {
                              badgeColor:
                                "bg-gradient-to-r from-orange-400 to-amber-500 text-orange-900",
                              borderColor:
                                "border-orange-300 dark:border-orange-600",
                              cardSize: "scale-[1.005]",
                              label: "3위",
                            };
                          default:
                            return {
                              badgeColor:
                                "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300",
                              borderColor:
                                "border-gray-200 dark:border-gray-700",
                              cardSize: "",
                              label: `${rank}위`,
                            };
                        }
                      };

                      const rankStyle = getRankStyle(actualRank);


                      const getChangeColor = (change: string) => {
                        if (change === "0.00%" || change === "0.00") {
                          return "text-gray-500 dark:text-gray-400";
                        }
                        if (change.startsWith("-")) {
                          return "text-red-500 dark:text-red-400";
                        }
                        return "text-green-500 dark:text-green-400";
                      };


                      const getChangeIcon = (change: string) => {
                        if (change === "0.00%" || change === "0.00") {
                          return (
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          );
                        }
                        if (change.startsWith("-")) {
                          return <TrendingUp className="w-3 h-3 rotate-180" />;
                        }
                        return <TrendingUp className="w-3 h-3" />;
                      };

                      return (
                        <div
                          key={stock.symbol}
                          className={`relative bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200 cursor-pointer group ${
                            rankStyle.cardSize
                          } ${
                            isSelected
                              ? `${rankStyle.borderColor} shadow-lg`
                              : `${rankStyle.borderColor} hover:shadow-md`
                          }`}
                          onClick={() => handleStockClick(stock)}
                        >
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                {stock.logoUrl ? (
                                  <img
                                    src={stock.logoUrl}
                                    alt={stock.name}
                                    className="w-12 h-12 rounded-full object-contain bg-gray-50 dark:bg-gray-700 p-1 shadow-sm"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                      const parent = (
                                        e.target as HTMLImageElement
                                      ).parentElement;
                                      if (parent && stock.emoji) {
                                        const span =
                                          document.createElement("span");
                                        span.className = "text-xl";
                                        span.textContent = stock.emoji;
                                        parent.appendChild(span);
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-xl shadow-sm">
                                    {stock.emoji || "📈"}
                                  </div>
                                )}
                              </div>

                                <div className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight mb-1">
                                  {stock.name}
                                </div>

              {isSelected && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
              )}
                        </div>
                      );
                    })}
                  </div>
                ) : selectedRegion ? (
                  <div className="text-center py-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                      종목 정보가 없습니다
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedRegion.name} 지역의 종목 정보가 아직 등록되지 않았습니다
                    </p>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </CardContent>
          </Card>

      {showStockModal && selectedStock && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-[9999] animate-in fade-in duration-300">
            <div className="md:hidden flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 pt-12 md:pt-6">
                  {selectedStock.rank && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">
                          {selectedStock.rank}
                        </span>
                      </div>
                    </div>
                  )}

                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 dark:from-emerald-900/30 dark:via-green-900/30 dark:to-emerald-800/30 border border-emerald-200 dark:border-emerald-700/50 shadow-lg">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      {selectedStock.price === "데이터 없음" ||
                      selectedStock.price === null
                        ? "데이터 없음"
                        : `₩${Number(selectedStock.price).toLocaleString()}`}
                    </div>
                    <div
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold shadow-sm ${
                        selectedStock.change.startsWith("-")
                          ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-700"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                      }`}
                    >
                      <TrendingUp
                        className={`w-4 h-4 ${
                          selectedStock.change.startsWith("-") ? "rotate-180" : ""
                        }`}
                      />
                      {selectedStock.change === "0.00%"
                        ? selectedStock.change
                        : selectedStock.change.startsWith("-")
                        ? `${selectedStock.change}%`
                        : selectedStock.change.includes("%")
                        ? selectedStock.change
                        : `${selectedStock.change}%`}
                    </div>
                  </div>
                </div>

            <div className="flex-shrink-0 px-4 sm:px-6 pb-4 sm:pb-6 pt-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push(`/community/${selectedStock.symbol}`)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <span>커뮤니티</span>
                </button>
                <button
                  onClick={() => router.push(`/stocks/${selectedStock.symbol}`)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <span>WTS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
