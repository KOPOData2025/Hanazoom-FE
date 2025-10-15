"use client";

import { TrendingUp, TrendingDown, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";
import type { Stock } from "@/lib/api/stock";
import type { StockPriceData } from "@/lib/api/stock";
import { getBrandColorByStock } from "@/utils/color-utils";

interface StockInfoBarProps {
  stock: Stock | null;
  realtimeData: StockPriceData | null;
  wsConnected: boolean;
}

export function StockInfoBar({
  stock,
  realtimeData,
  wsConnected,
}: StockInfoBarProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!stock) return null;

  const currentPrice = realtimeData?.currentPrice
    ? parseInt(realtimeData.currentPrice)
    : stock.currentPrice || 0;

  const changePrice = realtimeData?.changePrice
    ? parseInt(realtimeData.changePrice)
    : stock.priceChange || 0;

  const changeRate = realtimeData?.changeRate
    ? parseFloat(realtimeData.changeRate)
    : stock.priceChangePercent
    ? stock.priceChangePercent
    : 0;

  const isPositive = changeRate >= 0;
  const brandColor = getBrandColorByStock(stock.symbol, stock.name);

  return (
    <>
            <div className="flex items-center space-x-3">
              <div>
                <h1
                  className={`font-bold text-white font-['Pretendard'] transition-all duration-300 ${
                    isScrolled ? "text-base" : "text-lg"
                  }`}
                >
                  {stock.name}
                </h1>
                <p className="text-sm text-white/80 font-['Pretendard']">
                  {stock.symbol}
                </p>
              </div>
            </div>

                  <div className="flex items-center space-x-1">
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 text-green-300" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-300" />
                    )}
                    <span
                      className={`text-sm font-medium font-['Pretendard'] ${
                        isPositive ? "text-green-300" : "text-red-300"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {changeRate.toFixed(2)}%
                    </span>
                  </div>
                  <span
                    className={`text-sm font-['Pretendard'] ${
                      isPositive ? "text-green-300" : "text-red-300"
                    }`}
                  >
                    ({isPositive ? "+" : ""}
                    {changePrice.toLocaleString()})
                  </span>
                </div>
              </div>

      <div className="divider" />
    </>
  );
}
