"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Users,
  Sparkles,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Map,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MouseFollower } from "@/components/mouse-follower";
import { LoadingAnimation } from "@/components/loading-animation";
import { StockMapPreview } from "@/components/stock-map-preview";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { FloatingEmojiBackground } from "@/components/floating-emoji-background";
import { useState, useEffect, useRef } from "react";
import NavBar from "./components/Navbar";
import { StockTicker } from "@/components/stock-ticker";
import { isLoggedIn } from "./utils/auth";
import { useUserSettingsStore } from "@/lib/stores/userSettingsStore";

export default function StockMapLanding() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const { settings, isInitialized } = useUserSettingsStore();
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const handleLoadingComplete = () => {
    setTimeout(() => {
      setShowContent(true);
    }, 500);
  };

  useEffect(() => {

    setLoggedIn(isLoggedIn());


    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); 

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrolled(scrollPosition > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  if (isLoading) {
    return <LoadingAnimation onComplete={handleLoadingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 overflow-hidden relative transition-colors duration-500">
      <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      <div className="fixed top-0 left-0 right-0 z-[100]">
        <NavBar />
      </div>

        <section
          ref={heroRef}
          className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden"
        >
                    <StockMapPreview />

            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <button
                onClick={scrollToFeatures}
                className="flex flex-col items-center text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors cursor-pointer"
              >
                <span className="text-sm mb-1">더 알아보기</span>
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden"
        >
              <div className="absolute top-24 left-1/2 right-0 h-0.5 bg-gradient-to-r from-green-300 to-emerald-300 dark:from-green-700 dark:to-emerald-700 hidden md:block"></div>
              <div className="absolute top-24 left-0 right-1/2 h-0.5 bg-gradient-to-r from-emerald-300 to-green-300 dark:from-emerald-700 dark:to-green-700 hidden md:block"></div>

              <AnimateOnScroll animation="fade-up" delay={100}>
                <div className="flex flex-col items-center space-y-4 text-center relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-green-500/30 z-10 hover:scale-110 transition-transform duration-300">
                    1️⃣
                  </div>
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                    지역 선택
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    관심 있는 지역을 클릭하여 선택하세요
                  </p>

                  <div className="mt-4 relative w-full max-w-[200px] h-[100px] bg-white/80 dark:bg-gray-900/80 rounded-lg shadow-md overflow-hidden border border-green-200 dark:border-green-800">
                    <div className="absolute inset-0 p-2">
                      <div className="w-full h-full bg-green-50 dark:bg-green-950 rounded overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 border-2 border-dashed border-green-500 dark:border-green-400 rounded-lg animate-[ping_2s_ease-in-out_infinite]"></div>
                          <div className="absolute w-8 h-8 border-2 border-green-600 dark:border-green-500 rounded-lg"></div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/90 to-transparent dark:from-gray-900/90"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-green-600 dark:text-green-400 font-bold text-lg">
                      🔍
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-up" delay={500}>
                <div className="flex flex-col items-center space-y-4 text-center relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-400 dark:from-green-600 dark:to-emerald-300 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-green-500/30 z-10 hover:scale-110 transition-transform duration-300">
                    3️⃣
                  </div>
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-100">
                    인기 종목 확인
                  </h3>
                  <p className="text-green-700 dark:text-green-300">
                    해당 지역의 핫한 주식 종목들을 확인하세요
                  </p>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-500 relative overflow-hidden">
          <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-white/10 blur-3xl"></div>

          <div className="container px-4 md:px-6 mx-auto relative z-10">
            <AnimateOnScroll
              animation="zoom-in"
              className="flex flex-col items-center space-y-4 text-center"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                지금 바로 시작해보세요! 🚀
              </h2>
              <p className="max-w-[600px] text-green-100 dark:text-green-200 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                우리 동네 주식 맛집을 찾아 떠나는 여행, 지금 시작하세요!
              </p>
              <div className="pt-4">
                <Link href="/community">
                  <Button
                    size="lg"
                    className="bg-white text-green-600 hover:bg-green-50 dark:bg-gray-900 dark:text-green-400 dark:hover:bg-gray-800 px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
                  >
                    <span>주식 토론방 참여하기</span>
                    <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">
                      💬✨
                    </span>
                  </Button>
                </Link>
              </div>
            </AnimateOnScroll>

      <footer className="relative z-10 flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-green-200 dark:border-green-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-colors duration-300">
        <p className="text-xs text-green-600 dark:text-green-400">
          © 2025 하나줌 . 모든 권리 보유. Made with 💚
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#"
            className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
          >
            이용약관
          </Link>
          <Link
            href="#"
            className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
          >
            개인정보처리방침
          </Link>
        </nav>
      </footer>

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
