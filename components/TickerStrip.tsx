"use client";




import React, { useEffect, useMemo, useState } from "react";

export type TickerStripProps = {
  logoUrl: string;
  name: string;
  ticker: string;
  price: number;
  change: number;
  changeRate: number; 
  marketState: "정규장" | "장마감" | "시간외";
  lastUpdatedSec: number;
  realtimeOrderable?: boolean; 
  className?: string;
};


const cn = (...arr: (string | undefined | false)[]) => arr.filter(Boolean).join(" ");

const formatNumber = (n: number) => (isFinite(n) ? n.toLocaleString("ko-KR") : "-");
const formatKRW = (n: number) => `₩ ${formatNumber(Math.round(n))}`;

const changeColor = (chg: number) =>
  chg > 0 ? "text-rose-400" : chg < 0 ? "text-sky-400" : "text-neutral-300";
const changeSymbol = (chg: number) => (chg > 0 ? "▲" : chg < 0 ? "▼" : "■");

const signalColor = (sec: number) => {
  if (sec <= 10) return "text-green-400";
  if (sec <= 30) return "text-amber-400";
  return "text-red-400";
};


const TickerStrip: React.FC<TickerStripProps> = ({
  logoUrl,
  name,
  ticker,
  price,
  change,
  changeRate,
  marketState,
  lastUpdatedSec,
  realtimeOrderable = true,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const pct = useMemo(() => (isFinite(changeRate) ? changeRate.toFixed(2) : "-"), [changeRate]);
  const changeAbs = Math.abs(change);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ticker);
      setCopied(true);
    } catch {}
  };

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <div
      className={cn(
        "sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-900/95 backdrop-blur",
        "text-neutral-50 tabular-nums whitespace-nowrap",
        className
      )}
      role="banner"
      aria-label="티커 스트립"
    >
      <div className="mx-auto max-w-screen-2xl px-3 md:px-4 h-14 flex items-center">
        <div className="grid w-full grid-cols-12 gap-2">
          <div className="col-span-12 md:col-span-4 flex items-center justify-center gap-3">
            <div
              className="text-lg md:text-xl font-extrabold leading-none"
              aria-label={`현재가 ${formatNumber(price)}원, 전일 대비 ${(change >= 0 ? "+" : "-") + formatNumber(changeAbs)}원 (${pct}%)`}
            >
              {formatKRW(price)}
            </div>
            <div className={cn("text-xs md:text-sm leading-none", changeColor(change))}>
              {changeSymbol(change)} {change >= 0 ? "+" : "-"}
              {formatNumber(changeAbs)} ({pct}%)
            </div>
          </div>

            <span className="text-xs md:text-sm flex items-center gap-1">
              <span className={cn("text-sm", signalColor(lastUpdatedSec))}>●</span>
              <span className="text-neutral-300">{lastUpdatedSec > 0 ? `${lastUpdatedSec}초 전` : "실시간"}</span>
            </span>

            <span
              className={cn(
                "text-xs md:text-sm rounded px-2 py-0.5 border",
                realtimeOrderable
                  ? "border-emerald-600 text-emerald-400"
                  : "border-neutral-700 text-neutral-400"
              )}
              aria-label={`실시간 주문 ${realtimeOrderable ? "가능" : "불가"}`}
            >
              {realtimeOrderable ? "실시간 주문 가능" : "실시간 주문 불가"}
            </span>
          </div>
        </div>
      </div>



