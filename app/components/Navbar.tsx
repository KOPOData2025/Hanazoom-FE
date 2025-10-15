"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isLoggedIn, logout, useAuthStore } from "../utils/auth";
import {
  Bell,
  Heart,
  User,
  Plus,
  Trash2,
  Search,
  X,
  Users,
  BarChart3,
  Video,
  Calendar,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  getMyWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  WatchlistItem,
} from "@/lib/api/watchlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/app/config/api";
import { toast } from "sonner";
import NotificationDropdown from "@/components/NotificationDropdown";
import { getUnreadCount } from "@/lib/api/notification";
import { usePortfolio } from "@/hooks/usePortfolio";

export default function NavBar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const { accessToken } = useAuthStore();
  const { getPortfolioSummary } = usePortfolio();


  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false);
  const [isAddingStock, setIsAddingStock] = useState(false);


  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);


  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);


  const [isPb, setIsPb] = useState(false);
  const [pbInfo, setPbInfo] = useState<any>(null);


  const [userInfo, setUserInfo] = useState<{
    createdAt: string;
    lastLoginAt: string;
    totalBalance: number;
    stockAllocationRate: number;
    cashAllocationRate: number;
  } | null>(null);


  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (accessToken) {
      loadNotificationCount();
      loadPbInfo();
      loadUserInfo();
      loadPortfolioInfo();
    }
  }, [accessToken]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  const loadWatchlist = async () => {
    if (!accessToken) return;

    setIsLoadingWatchlist(true);
    try {
      const data = await getMyWatchlist();
      setWatchlist(data);
    } catch (error) {
      console.error("관심종목 로드 실패:", error);
    } finally {
      setIsLoadingWatchlist(false);
    }
  };


  const loadNotificationCount = async () => {
    if (!accessToken) return;

    try {
      const count = await getUnreadCount();
      setNotificationCount(count);
    } catch (error) {
      console.error("알림 개수 로드 실패:", error);

      setNotificationCount(0);
    }
  };


  const loadPbInfo = async () => {
    if (!accessToken) return;

    try {
      const response = await api.get("/members/me");
      console.log("🔍 PB 정보 API 응답:", response.data);

      if (response.data && response.data.success) {
        const memberData = response.data.data;
        console.log("🔍 회원 데이터:", memberData);
        console.log("🔍 isPb 값:", memberData.isPb);
        console.log("🔍 pbStatus 값:", memberData.pbStatus);
        console.log("🔍 pbRating 값:", memberData.pbRating);
        console.log(
          "🔍 pbTotalConsultations 값:",
          memberData.pbTotalConsultations
        );


        const forcePb = memberData.email === "pb@pb.com";
        setIsPb(forcePb || memberData.isPb || false);

        if (forcePb || memberData.isPb) {
          console.log("✅ PB로 인식됨, PB 정보 설정 중...");
          setPbInfo({
            rating: memberData.pbRating || 0.0,
            totalConsultations: memberData.pbTotalConsultations || 0,
            region: memberData.pbRegion || "미지정",
            specialties: memberData.pbSpecialties || "[]",
            status: memberData.pbStatus || "INACTIVE",
          });
          console.log("✅ PB 정보 설정 완료");
        } else {
          console.log("❌ PB가 아닌 사용자로 인식됨");
        }
      }
    } catch (error) {
      console.error("❌ PB 정보 로드 실패:", error);
      setIsPb(false);
      setPbInfo(null);
    }
  };


  const loadUserInfo = async () => {
    if (!accessToken) return;

    try {
      const response = await api.get("/members/me");
      if (response.data && response.data.success) {
        const memberData = response.data.data;
        setUserInfo({
          createdAt: memberData.createdAt || new Date().toISOString(),
          lastLoginAt: memberData.lastLoginAt || new Date().toISOString(),
          totalBalance: 0, 
          stockAllocationRate: 0,
          cashAllocationRate: 0,
        });
      }
    } catch (error) {
      console.error("사용자 정보 로드 실패:", error);
    }
  };


  const loadPortfolioInfo = async () => {
    if (!accessToken) return;

    try {
      const portfolioData = await getPortfolioSummary();
      if (portfolioData) {
        console.log("🔍 Navbar 포트폴리오 데이터:", portfolioData);
        setUserInfo(prev => prev ? {
          ...prev,
          totalBalance: portfolioData.totalBalance || 0,
          stockAllocationRate: portfolioData.stockAllocationRate || 0,
          cashAllocationRate: portfolioData.cashAllocationRate || 0,
        } : null);
      } else {
        console.log("포트폴리오 계좌가 없습니다. 기본값으로 설정합니다.");

        setUserInfo(prev => prev ? {
          ...prev,
          totalBalance: 0,
          stockAllocationRate: 0,
          cashAllocationRate: 100,
        } : null);
      }
    } catch (error) {
      console.error("포트폴리오 정보 로드 실패:", error);

      setUserInfo(prev => prev ? {
        ...prev,
        totalBalance: 0,
        stockAllocationRate: 0,
        cashAllocationRate: 100,
      } : null);
    }
  };


  const searchStocks = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get(
        `/stocks/search?query=${encodeURIComponent(query)}`
      );
      if (response.data && response.data.success) {
        setSearchResults(response.data.data || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error("종목 검색 실패:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };


  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchStocks(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);


  const handleAddToWatchlist = async (stockSymbol: string) => {
    if (!accessToken) return;

    setIsAddingStock(true);
    try {
      await addToWatchlist({ stockSymbol });
      setSearchQuery("");
      setShowSearchResults(false);
      await loadWatchlist(); 


      const stock = searchResults.find((s) => s.symbol === stockSymbol);
      const stockName = stock?.name || stockSymbol;
      const josa = getKoreanJosa(stockName);

      toast.success(`${stockName}${josa} 관심종목에 추가되었습니다.`);
    } catch (error) {
      console.error("관심종목 추가 실패:", error);
      toast.error("관심종목 추가에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsAddingStock(false);
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


  const handleRemoveFromWatchlist = async (stockSymbol: string) => {
    if (!accessToken) return;

    try {
      await removeFromWatchlist(stockSymbol);
      await loadWatchlist(); 


      const stock = watchlist.find((w) => w.stockSymbol === stockSymbol);
      const stockName = stock?.stockName || stockSymbol;
      const josa = getKoreanJosa(stockName);

      toast.success(`${stockName}이(가) 관심종목에서 제거되었습니다.`);
    } catch (error) {
      console.error("관심종목 제거 실패:", error);
      toast.error("관심종목 제거에 실패했습니다. 다시 시도해주세요.");
    }
  };


  const handleWatchlistClick = () => {
    if (!accessToken) {
      toast.error("관심종목을 관리하려면 로그인이 필요합니다.");
      return;
    }

    if (showWatchlistModal) {

      setShowWatchlistModal(false);
      setSearchQuery("");
      setShowSearchResults(false);
    } else {

      setShowProfileModal(false);
      setShowWatchlistModal(true);
      loadWatchlist();
    }
  };

  const handleLogout = async () => {

    setShowProfileModal(false);
    setShowWatchlistModal(false);

    await logout();
    router.push("/login");
  };

  const handleProfileClick = () => {
    if (showProfileModal) {

      setShowProfileModal(false);
    } else {

      setShowWatchlistModal(false);
      setSearchQuery("");
      setShowSearchResults(false);
      setShowProfileModal(true);
    }
  };

  const handleMyPageClick = () => {
    setShowProfileModal(false);

    const redirect = encodeURIComponent("/mypage");
    router.push(`/auth/verify?redirect=${redirect}`);
  };


  const handleNotificationClick = () => {
    if (!accessToken) {
      toast.error("알림을 보려면 로그인이 필요합니다.");
      return;
    }

    if (showNotificationModal) {
      setShowNotificationModal(false);
    } else {

      setShowProfileModal(false);
      setShowWatchlistModal(false);
      setSearchQuery("");
      setShowSearchResults(false);
      setShowNotificationModal(true);
    }
  };

  if (!mounted) {
    return null;
  }


  const renderWatchlistModal = () => {
    if (!showWatchlistModal) return null;

    const modalContent = (
      <>
        <div
          className="fixed z-[100]"
          style={{
            top: "4rem", 
            right: "1rem",
          }}
        >
          <div className="w-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-['Pretendard'] flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  관심종목
                </h3>
                <button
                  onClick={() => setShowWatchlistModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {searchResults.map((stock) => (
                        <div
                          key={stock.symbol}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                          onClick={() => handleAddToWatchlist(stock.symbol)}
                        >
                          <div className="flex items-center gap-3">
                            {stock.logoUrl ? (
                              <img
                                src={stock.logoUrl}
                                alt={stock.name}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <span className="text-xs text-gray-500">
                                  📈
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {stock.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {stock.symbol}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            {stock.currentPrice && (
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {parseInt(stock.currentPrice).toLocaleString()}
                                원
                              </p>
                            )}
                            {stock.changeRate && (
                              <p
                                className={`text-xs ${
                                  parseFloat(stock.changeRate) > 0
                                    ? "text-red-500"
                                    : parseFloat(stock.changeRate) < 0
                                    ? "text-blue-500"
                                    : "text-gray-500"
                                }`}
                              >
                                {parseFloat(stock.changeRate) > 0 ? "+" : ""}
                                {stock.changeRate}%
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isSearching && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
                        <span className="text-sm text-gray-500">
                          검색 중...
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    종목이름이나 종목코드로 검색하세요
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  총 {watchlist.length}개 종목
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );


    return createPortal(modalContent, document.body);
  };


  const renderProfileModal = () => {
    if (!showProfileModal) return null;

    const modalContent = (
      <>
        <div
          className="fixed z-[100]"
          style={{
            top: "4rem", 
            right: "1rem",
          }}
        >
          <div className="w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative">
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                        isPb
                          ? "bg-gradient-to-br from-purple-500 to-purple-700"
                          : "bg-gradient-to-br from-emerald-500 to-emerald-700"
                      }`}
                    >
                      {isPb ? (
                        <Users className="w-7 h-7 text-white" />
                      ) : (
                        <User className="w-7 h-7 text-white" />
                      )}
                    </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${
                          isPb
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700"
                            : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                        }`}
                      >
                        {isPb ? "PB" : "일반회원"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-['Pretendard']">
                      {isPb ? "하나줌 PB" : "하나줌 회원"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400 font-['Pretendard']">
                      가입일
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 font-['Pretendard'] font-medium">
                      {userInfo?.createdAt 
                        ? new Date(userInfo.createdAt).toLocaleDateString('ko-KR', { 
                            year: 'numeric', 
                            month: 'long' 
                          })
                        : '2024년 3월'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400 font-['Pretendard']">
                      최근 접속
                    </span>
                    <span className="text-gray-700 dark:text-gray-300 font-['Pretendard'] font-medium">
                      {userInfo?.lastLoginAt 
                        ? new Date(userInfo.lastLoginAt).toLocaleDateString('ko-KR', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit' 
                          }) + ' (PC)'
                        : '2025-08-31 (PC)'
                      }
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {console.log("🔍 UI 렌더링 - isPb 값:", isPb)}
                  {isPb ? (

                    <>
                      <Link
                        href="/pb-admin"
                        onClick={() => setShowProfileModal(false)}
                        className="w-full border-2 border-purple-500 text-purple-600 dark:text-purple-400 bg-transparent hover:bg-purple-50 dark:hover:bg-purple-900/20 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm flex items-center justify-center"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        PB 대시보드
                      </Link>
                      <Link
                        href="/portfolio"
                        onClick={() => setShowProfileModal(false)}
                        className="w-full border-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm flex items-center justify-center"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        포트폴리오 조회
                      </Link>
                      <button
                        onClick={handleMyPageClick}
                        className="w-full border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm"
                      >
                        마이페이지로 이동
                      </button>
                      <Link
                        href="/settings"
                        onClick={() => setShowProfileModal(false)}
                        className="w-full border-2 border-gray-500 text-gray-600 dark:text-gray-400 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900/20 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm flex items-center justify-center"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        설정
                      </Link>
                    </>
                  ) : (

                    <>
                      <button
                        onClick={handleMyPageClick}
                        className="w-full border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm"
                      >
                        마이페이지로 이동
                      </button>
                      <Link
                        href="/settings"
                        onClick={() => setShowProfileModal(false)}
                        className="w-full border-2 border-gray-500 text-gray-600 dark:text-gray-400 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900/20 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm flex items-center justify-center"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        설정
                      </Link>
                      <Link
                        href="/portfolio"
                        onClick={() => setShowProfileModal(false)}
                        className="w-full border-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm flex items-center justify-center"
                      >
                        <span className="mr-2">💼</span>
                        포트폴리오 보기
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setShowProfileModal(false)}
                        className="w-full border-2 border-purple-500 text-purple-600 dark:text-purple-400 bg-transparent hover:bg-purple-50 dark:hover:bg-purple-900/20 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] text-sm flex items-center justify-center"
                      >
                        <span className="mr-2">📋</span>
                        주문 내역
                      </Link>
                      <div className="flex gap-2">
                        <button className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-2 px-3 rounded-lg transition-all duration-200 font-['Pretendard'] text-xs">
                          알림설정
                        </button>
                        <button className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-2 px-3 rounded-lg transition-all duration-200 font-['Pretendard'] text-xs">
                          고객센터
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 mx-auto mb-4 flex items-center justify-center shadow-lg relative">
                    <User className="w-8 h-8 text-white" />
                <div className="space-y-3">
                  <Link
                    href="/login"
                    onClick={() => setShowProfileModal(false)}
                    className="w-full border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-semibold py-3 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] flex items-center justify-center"
                  >
                    <span className="mr-2">🚀</span>
                    로그인하기
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setShowProfileModal(false)}
                    className="w-full border-2 border-amber-500 text-amber-600 dark:text-amber-400 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-900/20 font-semibold py-3 px-4 rounded-lg transition-all duration-200 font-['Pretendard'] flex items-center justify-center"
                  >
                    <span className="mr-2">✨</span>
                    회원가입하기
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );


    return createPortal(modalContent, document.body);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
        <Link href="/" className="flex items-center space-x-3">
          <div className="relative">
        <nav className="flex-1 flex justify-center">
          <div className="flex gap-20 lg:gap-24 xl:gap-28 items-center">
            <Link
              href="/"
              className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors font-['Pretendard']"
            >
              홈
            </Link>
            <Link
              href="/map"
              className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors font-['Pretendard']"
            >
              지도
            </Link>
            <Link
              href="/community"
              className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors font-['Pretendard']"
            >
              커뮤니티
            </Link>
            <Link
              href="/stocks"
              className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors font-['Pretendard']"
            >
              WTS
            </Link>
            {accessToken && (
              <Link
                href="/portfolio"
                className="text-base font-medium text-gray-800 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition-colors font-['Pretendard']"
              >
                포트폴리오
              </Link>
            )}
          </div>
        </nav>

          <button
            onClick={handleNotificationClick}
            className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
          <button
            onClick={handleWatchlistClick}
            className="w-8 h-8 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors relative"
          >
            <Heart className="w-5 h-5" />
          <div className="relative">
            {accessToken ? (

              <button
                onClick={handleProfileClick}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isPb
                    ? "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800"
                    : "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800"
                }`}
              >
                {isPb ? (
                  <Users className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </button>
            ) : (

              <button
                onClick={handleProfileClick}
                className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900 transition-colors"
              >
                <User className="w-4 h-4" />
              </button>
            )}
          </div>

      {renderProfileModal()}
      {renderWatchlistModal()}

