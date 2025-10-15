"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Maximize2,
  Settings,
  Trash2,
  Wifi,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";

import { getChartData, formatCandleForChart } from "@/lib/api/chart";
import type { CandleData } from "@/types/chart";
import type { StockPriceData } from "@/lib/api/stock";


interface CandlestickChartProps {
  stockCode: string;
}

interface ChartDataPoint {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  isComplete: boolean;
}

export function CandlestickChart({ stockCode }: CandlestickChartProps) {
  const [timeframe, setTimeframe] = useState("5M");
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<number | null>(null);
  const [hoveredVolume, setHoveredVolume] = useState<number | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    data: ChartDataPoint;
    type: "candle" | "volume";
  } | null>(null);

  const [showBB, setShowBB] = useState<boolean>(true);
  const [showSMA5, setShowSMA5] = useState<boolean>(true);
  const [showSMA20, setShowSMA20] = useState<boolean>(true);
  const [showSMA60, setShowSMA60] = useState<boolean>(false);

  const [viewStart, setViewStart] = useState<number>(0);
  const [viewEnd, setViewEnd] = useState<number>(0);
  const [showMinuteToggle, setShowMinuteToggle] = useState(false);
  const [lastMinuteTimeframe, setLastMinuteTimeframe] = useState("5M");
  

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<number>(0);
  const [panOffset, setPanOffset] = useState<number>(0);
  

  const [zoomLevel, setZoomLevel] = useState<number>(1); 
  const [zoomCenter, setZoomCenter] = useState<number>(0.5); 
  const [isZooming, setIsZooming] = useState(false);
  
  const currentCandleRef = useRef<ChartDataPoint | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const volumeCanvasRef = useRef<HTMLCanvasElement | null>(null);


  const getMinuteKey = useCallback(() => `lastMinuteTimeframe_${stockCode}`, [stockCode]);


  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const key = getMinuteKey();
      const saved = localStorage.getItem(key);
      if (saved && ["1M", "5M", "15M"].includes(saved)) {
        console.log("🗂️ 저장된 분봉 초기화:", saved);
        setLastMinuteTimeframe(saved);

        if (timeframe === "1M" || timeframe === "5M" || timeframe === "15M") {
          setTimeframe(saved);
        }
      }
    } catch (e) {
      console.warn("분봉 초기값 로드 실패:", e);
    }
  }, [getMinuteKey]);


  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = getMinuteKey();
    const sync = () => {
      try {
        const saved = localStorage.getItem(key);
        if (saved && ["1M", "5M", "15M"].includes(saved) && saved !== lastMinuteTimeframe) {
          console.log("🔁 분봉 동기화:", lastMinuteTimeframe, "→", saved);
          setLastMinuteTimeframe(saved);
          if (timeframe === "1M" || timeframe === "5M" || timeframe === "15M") {
            setTimeframe(saved);
          }
        }
      } catch (e) {
        console.warn("분봉 동기화 실패:", e);
      }
    };
    const interval = setInterval(sync, 5000);
    return () => clearInterval(interval);
  }, [getMinuteKey, lastMinuteTimeframe, timeframe]);


  const {
    connected: wsConnected,
    getStockData,
    lastUpdate,
  } = useStockWebSocket({
    stockCodes: [stockCode],
    onStockUpdate: (data) => {
      updateCurrentCandle(data);
    },
    autoReconnect: true,
  });





  const timeframes = [
    { label: "1일", value: "1D" },
    { label: "1주", value: "1W" },
    { label: "1달", value: "1MO" },
  ];

  const minuteTimeframes = [
    { label: "1분", value: "1M" },   
    { label: "5분", value: "5M" },   
    { label: "15분", value: "15M" }, 
  ];


  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: ChartDataPoint[] = [];

      if (timeframe === "1M" || timeframe === "5M" || timeframe === "15M" || timeframe === "1H") {

        const minuteLabels = {
          "1M": "1분봉",
          "5M": "5분봉", 
          "15M": "15분봉"
        };
        const selectedLabel = minuteLabels[timeframe as keyof typeof minuteLabels] || timeframe;
        
        console.log("🚀 API 호출 시작:", selectedLabel, "(", timeframe, ") - 종목:", stockCode);
        
        const dataLimit = 100;
        const pastCandles = await getChartData(stockCode, timeframe, dataLimit);
        console.log(
          "📊 분봉 데이터 응답:",
          pastCandles.length,
          "개, 타임프레임:",
          timeframe,
          "첫 번째:",
          pastCandles[0]
        );
        data = pastCandles.map(formatCandleForChart);
        console.log(
          "📊 포맷팅된 분봉 데이터:",
          data.length,
          "개, 타임프레임:",
          timeframe,
          "첫 번째:",
          data[0]
        );
      } else {

        console.log("📊 일/주/월봉 차트 요청됨:", timeframe, "종목:", stockCode);
        const dataLimit =
          timeframe === "1D" ? 2500 : timeframe === "1W" ? 520 : 120; 
        const pastCandles = await getChartData(stockCode, timeframe, dataLimit);
        data = pastCandles.map(formatCandleForChart);
      }


      data.sort((a, b) => a.timestamp - b.timestamp);

      setChartData(data);

      const maxVisibleCandles = 50; 
      const startIndex = Math.max(0, data.length - maxVisibleCandles);
      setViewStart(startIndex);
      setViewEnd(data.length);
      

      setZoomLevel(1);
      setZoomCenter(0.5);
      setIsZooming(false);
      
      console.log(
        "✅ 차트 데이터 로드 완료:",
        data.length,
        "개 캔들, 타임프레임:",
        timeframe,
        "뷰포트:",
        startIndex,
        "-",
        data.length
      );
    } catch (err) {
      console.error("차트 데이터 로드 실패:", err);
      setError(
        err instanceof Error ? err.message : "차트 데이터를 불러올 수 없습니다."
      );
    } finally {
      setLoading(false);
    }
  };


  const updateCurrentCandle = (stockData: StockPriceData) => {
    if (!currentCandleRef.current) return;

    const currentPrice = parseFloat(stockData.currentPrice);
    const volume = parseFloat(stockData.volume);

    setChartData((prevData) => {
      const newData = [...prevData];
      const lastIndex = newData.length - 1;

      if (lastIndex >= 0 && !newData[lastIndex].isComplete) {

        const currentCandle = { ...newData[lastIndex] };

        currentCandle.close = currentPrice;
        currentCandle.high = Math.max(currentCandle.high, currentPrice);
        currentCandle.low = Math.min(currentCandle.low, currentPrice);
        currentCandle.volume = volume;
        currentCandle.change = currentPrice - currentCandle.open;
        currentCandle.changePercent =
          ((currentPrice - currentCandle.open) / currentCandle.open) * 100;
        currentCandle.timestamp = parseInt(stockData.updatedTime);

        newData[lastIndex] = currentCandle;
        currentCandleRef.current = currentCandle;
      }

      return newData;
    });
  };


  const handleMinuteToggle = () => {
    setShowMinuteToggle(!showMinuteToggle);
  };


  const handleMinuteTextClick = () => {
    console.log("🎯 분봉 텍스트 버튼 클릭됨 - lastMinuteTimeframe:", lastMinuteTimeframe);
    setTimeframe(lastMinuteTimeframe);
    setShowMinuteToggle(false);
  };


  const handleMinuteSelect = (minuteTf: string) => {

    const minuteLabels = {
      "1M": "1분봉",
      "5M": "5분봉", 
      "15M": "15분봉"
    };
    const selectedLabel = minuteLabels[minuteTf as keyof typeof minuteLabels] || minuteTf;
    
    console.log("🎯 분봉 드롭다운에서 선택됨:", selectedLabel, "(", minuteTf, ")");
    console.log("🎯 현재 timeframe:", timeframe, "새로 선택할 timeframe:", minuteTf);
    

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http:
    const apiUrl = `${API_BASE_URL}/api/v1/stocks/chart/${stockCode}?timeframe=${minuteTf}&limit=100`;
    console.log("🌐 API 요청 URL:", apiUrl);
    

    if (timeframe !== minuteTf) {
      console.log("🔄 타임프레임 변경:", timeframe, "→", minuteTf);
      setTimeframe(minuteTf);
      setLastMinuteTimeframe(minuteTf);

      try {
        const key = getMinuteKey();
        localStorage.setItem(key, minuteTf);
        console.log("💾 분봉 저장:", key, "=", minuteTf);
      } catch (e) {
        console.warn("분봉 저장 실패:", e);
      }
      setShowMinuteToggle(false);

    } else {
      console.log("ℹ️ 같은 타임프레임이므로 토글만 닫기");

      setShowMinuteToggle(false);
    }
  };


  const getMinuteToggleLabel = () => {
    if (timeframe === "1M" || timeframe === "5M" || timeframe === "15M") {
      return (
        minuteTimeframes.find((tf) => tf.value === timeframe)?.label || "분봉"
      );
    }
    return (
      minuteTimeframes.find((tf) => tf.value === lastMinuteTimeframe)?.label ||
      "분봉"
    );
  };


  useEffect(() => {
    if (stockCode) {
      loadChartData();
    }
  }, [stockCode, timeframe]);









  const getCandleColor = (dataPoint: ChartDataPoint) => {
    return dataPoint.close >= dataPoint.open ? "#ef4444" : "#3b82f6"; 
  };


  const formatTimeLabel = (timeString: string, tf: string) => {
    try {
      const date = new Date(timeString);

      if (tf === "1M" || tf === "5M" || tf === "15M") {

        return date.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      } else if (tf === "1D") {

        return date.toLocaleDateString("ko-KR", {
          month: "2-digit",
          day: "2-digit",
        });
      } else if (tf === "1W") {

        return date.toLocaleDateString("ko-KR", {
          month: "2-digit",
          day: "2-digit",
        });
      } else if (tf === "1MO") {

        return date.toLocaleDateString("ko-KR", {
          year: "2-digit",
          month: "2-digit",
        });
      }


      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      console.warn("시간 포맷팅 실패:", timeString, error);
      return timeString;
    }
  };


  const renderChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = chartContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;


    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padding = 80; 
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const total = chartData.length;
    const start = Math.max(0, Math.min(viewStart, total - 1));
    const end = Math.max(start + 1, Math.min(viewEnd, total));
    const visibleData = chartData.slice(start, end);
    const candleWidth = Math.max(2, (chartWidth / visibleData.length) * 0.8);
    const candleSpacing = chartWidth / Math.max(1, visibleData.length);


    const prices = visibleData.flatMap((d) => [d.high, d.low]);


    const calcSMA = (data: ChartDataPoint[], period: number) => {
      const result: (number | null)[] = Array(data.length).fill(null);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i].close;
        if (i >= period) sum -= data[i - period].close;
        if (i >= period - 1) result[i] = sum / period;
      }
      return result;
    };

    const calcBB = (data: ChartDataPoint[], period: number, k: number) => {
      const ma = calcSMA(data, period);
      const upper: (number | null)[] = Array(data.length).fill(null);
      const lower: (number | null)[] = Array(data.length).fill(null);
      for (let i = 0; i < data.length; i++) {
        if (i >= period - 1 && ma[i] != null) {
          let variance = 0;
          for (let j = i - period + 1; j <= i; j++) {
            const diff = data[j].close - (ma[i] as number);
            variance += diff * diff;
          }
          const std = Math.sqrt(variance / period);
          upper[i] = (ma[i] as number) + k * std;
          lower[i] = (ma[i] as number) - k * std;
        }
      }
      return { ma, upper, lower };
    };

    const sma5 = showSMA5 ? calcSMA(visibleData, 5) : [];
    const sma20 = showSMA20 ? calcSMA(visibleData, 20) : [];
    const sma60 = showSMA60 ? calcSMA(visibleData, 60) : [];
    const bb = showBB ? calcBB(visibleData, 20, 2) : { ma: [], upper: [], lower: [] };


    if (showSMA5) {
      sma5.forEach((v) => {
        if (v != null) prices.push(v);
      });
    }
    if (showSMA20) {
      sma20.forEach((v) => {
        if (v != null) prices.push(v);
      });
    }
    if (showSMA60) {
      sma60.forEach((v) => {
        if (v != null) prices.push(v);
      });
    }
    if (showBB) {
      bb.upper.forEach((v) => {
        if (v != null) prices.push(v);
      });
      bb.lower.forEach((v) => {
        if (v != null) prices.push(v);
      });
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;


    ctx.strokeStyle = "#374151"; 
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);


    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }


    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();
    }


    ctx.setLineDash([]); 
    ctx.strokeStyle = "#6b7280"; 
    ctx.lineWidth = 2; 


    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();


    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();


    visibleData.forEach((dataPoint, index) => {
      const x =
        padding + candleSpacing * index + (candleSpacing - candleWidth) / 2;
      const isUp = dataPoint.close >= dataPoint.open;
      const color = getCandleColor(dataPoint);


      const highY =
        padding + ((maxPrice - dataPoint.high) / priceRange) * chartHeight;
      const lowY =
        padding + ((maxPrice - dataPoint.low) / priceRange) * chartHeight;

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();


      const openY =
        padding + ((maxPrice - dataPoint.open) / priceRange) * chartHeight;
      const closeY =
        padding + ((maxPrice - dataPoint.close) / priceRange) * chartHeight;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 1);

      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
      ctx.strokeRect(x, bodyTop, candleWidth, bodyHeight);


      if (hoveredCandle === index) {

        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 3, bodyTop - 3, candleWidth + 6, bodyHeight + 6);


        ctx.fillStyle = color + "CC"; 
        ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);


        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, bodyTop, candleWidth, bodyHeight);
      }
    });


    const drawLineSeries = (series: (number | null)[], color: string, width = 2) => {
      if (!series.length) return;
      ctx.beginPath();
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      let started = false;
      for (let i = 0; i < series.length; i++) {
        const v = series[i];
        if (v == null) continue;
        const x = padding + candleSpacing * i + candleSpacing / 2;
        const y = padding + ((maxPrice - v) / priceRange) * chartHeight;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      if (started) ctx.stroke();
    };

    if (showBB && bb.upper.length) {

      drawLineSeries(bb.upper, "#8b5cf6", 1.5);
      drawLineSeries(bb.lower, "#8b5cf6", 1.5);

      ctx.beginPath();
      let started = false;
      for (let i = 0; i < bb.upper.length; i++) {
        const u = bb.upper[i];
        if (u == null) continue;
        const x = padding + candleSpacing * i + candleSpacing / 2;
        const y = padding + ((maxPrice - u) / priceRange) * chartHeight;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      for (let i = bb.lower.length - 1; i >= 0; i--) {
        const l = bb.lower[i];
        if (l == null) continue;
        const x = padding + candleSpacing * i + candleSpacing / 2;
        const y = padding + ((maxPrice - l) / priceRange) * chartHeight;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(139, 92, 246, 0.1)";
      ctx.fill();
    }

    if (showSMA5) drawLineSeries(sma5, "#10b981", 2);
    if (showSMA20) drawLineSeries(sma20, "#f59e0b", 2);
    if (showSMA60) drawLineSeries(sma60, "#6366f1", 2);


    ctx.fillStyle = "#f3f4f6"; 
    ctx.font = "bold 12px Arial"; 


    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const price = maxPrice - (priceRange / 5) * i;
      const y = padding + (chartHeight / 5) * i;
      ctx.fillText(price.toLocaleString(), padding - 15, y + 4);
    }


    ctx.textAlign = "center";
    for (
      let i = 0;
      i < visibleData.length;
      i += Math.max(1, Math.floor(visibleData.length / 10))
    ) {
      const x = padding + candleSpacing * i + candleSpacing / 2;
      const time = formatTimeLabel(visibleData[i].time, timeframe);
      ctx.fillText(time, x, canvas.height - padding + 25);
    }


    if (visibleData.length > 0) {
      const lastPrice = visibleData[visibleData.length - 1].close;
      const currentPriceY =
        padding + ((maxPrice - lastPrice) / priceRange) * chartHeight;


      ctx.strokeStyle = "#ef4444"; 
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]); 
      ctx.beginPath();
      ctx.moveTo(padding, currentPriceY);
      ctx.lineTo(canvas.width - padding, currentPriceY);
      ctx.stroke();


      ctx.setLineDash([]);
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`현재가: ${lastPrice.toLocaleString()}원`, canvas.width - padding + 10, currentPriceY + 4);
    }
  }, [chartData, timeframe, hoveredCandle, tooltipData, showBB, showSMA5, showSMA20, showSMA60, viewStart, viewEnd]);


  const handleChartMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button === 0) { 
      event.preventDefault(); 
      setIsPanning(true);
      setPanStart(event.clientX);
      setPanOffset(0);

      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing';
      }
    }
  };


  const handleChartMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;


    if (isPanning) {
      const deltaX = event.clientX - panStart;
      const total = chartData.length;
      const visibleLen = viewEnd - viewStart;
      

      const padding = 60;
      const chartWidth = canvas.width - padding * 2;
      const candleSpacing = chartWidth / Math.max(1, visibleLen);
      const deltaCandles = Math.round(deltaX / candleSpacing);
      

      let newStart = viewStart - deltaCandles;
      let newEnd = viewEnd - deltaCandles;
      

      newStart = Math.max(0, Math.min(newStart, total - visibleLen));
      newEnd = Math.max(visibleLen, Math.min(newEnd, total));
      

      setViewStart(newStart);
      setViewEnd(newEnd);
      setPanOffset(deltaX);
      

      setPanStart(event.clientX);
      
      return; 
    }


    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const total = chartData.length;
    const start = Math.max(0, Math.min(viewStart, total - 1));
    const end = Math.max(start + 1, Math.min(viewEnd, total));
    const visibleLen = Math.max(1, end - start);
    const candleSpacing = chartWidth / visibleLen;

    const localIndex = Math.floor((x - padding) / candleSpacing);
    const globalIndex = start + localIndex;
    if (localIndex >= 0 && localIndex < visibleLen && globalIndex >= 0 && globalIndex < chartData.length) {
      setHoveredCandle(localIndex);
      setHoveredVolume(localIndex); 
      setTooltipData({
        x: event.clientX,
        y: event.clientY,
        data: chartData[globalIndex],
        type: "candle",
      });
    } else {
      setHoveredCandle(null);
      setHoveredVolume(null);
      setTooltipData(null);
    }
  };


  const handleChartMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(0);
      setPanOffset(0);

      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
      }
    }
  };


  const handleChartClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning) {
      console.log("차트 클릭됨");
    }
  };


  const updateViewportForZoom = (newZoomLevel: number, newZoomCenter: number) => {
    const total = chartData.length;
    if (total === 0) return;
    

    const baseVisibleCandles = 50;
    const visibleCandles = Math.max(5, Math.min(total, Math.round(baseVisibleCandles / newZoomLevel)));
    

    const centerIndex = Math.round(newZoomCenter * (total - 1));
    const halfVisible = Math.floor(visibleCandles / 2);
    
    let newStart = Math.max(0, centerIndex - halfVisible);
    let newEnd = Math.min(total, newStart + visibleCandles);
    

    if (newEnd === total) {
      newStart = Math.max(0, total - visibleCandles);
    }
    
    setViewStart(newStart);
    setViewEnd(newEnd);
    
    console.log(`🔍 줌 업데이트: 레벨=${newZoomLevel.toFixed(2)}x, 중심=${newZoomCenter.toFixed(2)}, 뷰포트=${newStart}-${newEnd}`);
  };



  const handleChartWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.stopPropagation();
    

    if (isPanning) return;
    
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    

    const relativeX = (x - padding) / chartWidth;
    const newZoomCenter = Math.max(0, Math.min(1, relativeX));
    

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1; 
    const newZoomLevel = Math.max(0.1, Math.min(10, zoomLevel * zoomFactor)); 
    

    if (Math.abs(newZoomLevel - zoomLevel) > 0.01) {
      setZoomLevel(newZoomLevel);
      setZoomCenter(newZoomCenter);
      setIsZooming(true);
      

      updateViewportForZoom(newZoomLevel, newZoomCenter);
      

      setTimeout(() => {
        setIsZooming(false);
      }, 150);
    }
  };


  const handleChartMouseLeave = () => {

    if (isPanning) {
      setIsPanning(false);
      setPanStart(0);
      setPanOffset(0);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
      }
    }
    setHoveredCandle(null);
    setHoveredVolume(null); 
    setTooltipData(null);
  };


  const handleVolumeMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button === 0) { 
      event.preventDefault(); 
      setIsPanning(true);
      setPanStart(event.clientX);
      setPanOffset(0);

      if (volumeCanvasRef.current) {
        volumeCanvasRef.current.style.cursor = 'grabbing';
      }
    }
  };


  const handleVolumeMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => {
    const canvas = event.currentTarget;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;


    if (isPanning) {
      const deltaX = event.clientX - panStart;
      const total = chartData.length;
      const visibleLen = viewEnd - viewStart;
      

      const padding = 60;
      const chartWidth = canvas.width - padding * 2;
      const barSpacing = chartWidth / Math.max(1, visibleLen);
      const deltaCandles = Math.round(deltaX / barSpacing);
      

      let newStart = viewStart - deltaCandles;
      let newEnd = viewEnd - deltaCandles;
      

      newStart = Math.max(0, Math.min(newStart, total - visibleLen));
      newEnd = Math.max(visibleLen, Math.min(newEnd, total));
      

      setViewStart(newStart);
      setViewEnd(newEnd);
      setPanOffset(deltaX);
      

      setPanStart(event.clientX);
      
      return; 
    }


    const padding = 60; 
    const chartWidth = canvas.width - padding * 2;
    const total = chartData.length;
    const start = Math.max(0, Math.min(viewStart, total - 1));
    const end = Math.max(start + 1, Math.min(viewEnd, total));
    const visibleLen = Math.max(1, end - start);
    const barSpacing = chartWidth / visibleLen;

    const localIndex = Math.floor((x - padding) / barSpacing);
    const globalIndex = start + localIndex;
    if (localIndex >= 0 && localIndex < visibleLen && globalIndex >= 0 && globalIndex < chartData.length) {
      setHoveredVolume(localIndex);
      setHoveredCandle(localIndex); 
      setTooltipData({
        x: event.clientX,
        y: event.clientY,
        data: chartData[globalIndex],
        type: "volume",
      });
    } else {
      setHoveredVolume(null);
      setHoveredCandle(null);
      setTooltipData(null);
    }
  };


  const handleVolumeMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(0);
      setPanOffset(0);

      if (volumeCanvasRef.current) {
        volumeCanvasRef.current.style.cursor = 'grab';
      }
    }
  };


  const handleVolumeMouseLeave = () => {

    if (isPanning) {
      setIsPanning(false);
      setPanStart(0);
      setPanOffset(0);
      if (volumeCanvasRef.current) {
        volumeCanvasRef.current.style.cursor = 'grab';
      }
    }
    setHoveredVolume(null);
    setHoveredCandle(null); 
    setTooltipData(null);
  };


  const handleVolumeWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.stopPropagation();
    

    if (isPanning) return;
    
    const canvas = volumeCanvasRef.current;
    if (!canvas || chartData.length === 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    

    const relativeX = (x - padding) / chartWidth;
    const newZoomCenter = Math.max(0, Math.min(1, relativeX));
    

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1; 
    const newZoomLevel = Math.max(0.1, Math.min(10, zoomLevel * zoomFactor)); 
    

    if (Math.abs(newZoomLevel - zoomLevel) > 0.01) {
      setZoomLevel(newZoomLevel);
      setZoomCenter(newZoomCenter);
      setIsZooming(true);
      

      updateViewportForZoom(newZoomLevel, newZoomCenter);
      

      setTimeout(() => {
        setIsZooming(false);
      }, 150);
    }
  };


  const renderVolumeChart = useCallback(() => {
    const canvas = volumeCanvasRef.current as HTMLCanvasElement | null;
    if (!canvas || chartData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;


    ctx.clearRect(0, 0, canvas.width, canvas.height);


    const padding = 80; 
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const total = chartData.length;
    const start = Math.max(0, Math.min(viewStart, total - 1));
    const end = Math.max(start + 1, Math.min(viewEnd, total));
    const visibleData = chartData.slice(start, end);
    const barWidth = Math.max(3, (chartWidth / visibleData.length) * 0.8); 
    const barSpacing = chartWidth / Math.max(1, visibleData.length); 


    const volumes = visibleData.map((d) => d.volume);
    const maxVolume = Math.max(...volumes);


    const gradient = ctx.createLinearGradient(
      0,
      padding,
      0,
      canvas.height - padding
    );
    gradient.addColorStop(0, "rgba(16, 185, 129, 0.03)");
    gradient.addColorStop(1, "rgba(16, 185, 129, 0.08)");
    ctx.fillStyle = gradient;
    ctx.fillRect(padding, padding, chartWidth, chartHeight);


    ctx.strokeStyle = "#374151"; 
    ctx.lineWidth = 0.5; 
    ctx.setLineDash([6, 6]); 


    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }


    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, canvas.height - padding);
      ctx.stroke();
    }


    ctx.setLineDash([]); 
    ctx.strokeStyle = "#6b7280"; 
    ctx.lineWidth = 2; 


    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();


    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();


    visibleData.forEach((dataPoint, index) => {
      const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;
      const height = (dataPoint.volume / maxVolume) * chartHeight;
      const y = canvas.height - padding - height;


      const color = getCandleColor(dataPoint);


      ctx.fillStyle = color + "E6"; 
      ctx.fillRect(x, y, barWidth, height);


      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]); 
      ctx.strokeRect(x, y, barWidth, height);


      if (hoveredVolume === index) {

        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 4;
        ctx.setLineDash([]); 
        ctx.strokeRect(x - 3, y - 3, barWidth + 6, height + 6);


        ctx.fillStyle = color + "FF"; 
        ctx.fillRect(x, y, barWidth, height);


        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([]); 
        ctx.strokeRect(x, y, barWidth, height);
      }
    });


    ctx.setLineDash([]);


    ctx.fillStyle = "#f3f4f6"; 
    ctx.font = "bold 12px Arial"; 
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const volume = maxVolume - (maxVolume / 4) * i;
      const y = padding + (chartHeight / 4) * i;
      ctx.fillText(`${(volume / 1000000).toFixed(1)}M`, padding - 15, y + 4);
    }


    ctx.fillStyle = "#f3f4f6"; 
    ctx.font = "bold 12px Arial"; 
    ctx.textAlign = "center";
    for (let i = 0; i < visibleData.length; i += Math.max(1, Math.floor(visibleData.length / 10))) {
      const x = padding + barSpacing * i + barSpacing / 2;
      const time = formatTimeLabel(visibleData[i].time, timeframe);
      ctx.fillText(time, x, canvas.height - padding + 25);
    }


    ctx.fillStyle = "#f3f4f6";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "right";
    ctx.fillText(
      `${(maxVolume / 1000000).toFixed(1)}M`,
      canvas.width - padding + 10,
      padding + 15
    );
  }, [chartData, timeframe, hoveredVolume, viewStart, viewEnd]);


  useEffect(() => {
    renderChart();
    renderVolumeChart();
  }, [chartData, timeframe, hoveredCandle, hoveredVolume, tooltipData, showBB, showSMA5, showSMA20, showSMA60, viewStart, viewEnd]);


  useEffect(() => {
    const handleResize = () => {
      renderChart();
      renderVolumeChart();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [chartData, timeframe, hoveredCandle, hoveredVolume, tooltipData, showBB, showSMA5, showSMA20, showSMA60, viewStart, viewEnd]);


  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const chartContainer = chartContainerRef.current;
      const volumeContainer = volumeCanvasRef.current?.parentElement;
      

      if (chartContainer && (
        chartContainer.contains(target) || 
        chartContainer === target ||
        (volumeContainer && (volumeContainer.contains(target) || volumeContainer === target))
      )) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const chartContainer = chartContainerRef.current;
      const volumeContainer = volumeCanvasRef.current?.parentElement;
      

      if (chartContainer && (
        chartContainer.contains(target) || 
        chartContainer === target ||
        (volumeContainer && (volumeContainer.contains(target) || volumeContainer === target))
      )) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };


    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    
    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);




  useEffect(() => {
    if (chartData.length > 0) {
      renderVolumeChart();
    }
  }, [chartData, timeframe, hoveredVolume, viewStart, viewEnd]);

  if (loading) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg h-full">
        <CardContent className="flex items-center justify-center h-80">
          <div className="text-center space-y-4">
            <Activity className="w-8 h-8 text-green-500 mx-auto animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              차트 데이터 로딩 중...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg h-full">
        <CardContent className="flex items-center justify-center h-80">
          <div className="text-center space-y-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={loadChartData} variant="outline" size="sm">
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-green-200 dark:border-green-700 shadow-lg h-full"
      onWheel={(e) => {

        const target = e.target as HTMLElement;
        const chartContainer = chartContainerRef.current;
        const volumeContainer = volumeCanvasRef.current?.parentElement;
        
        if (chartContainer && (
          chartContainer.contains(target) || 
          chartContainer === target ||
          (volumeContainer && (volumeContainer.contains(target) || volumeContainer === target))
        )) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      style={{ overscrollBehavior: 'none' }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-bold text-green-800 dark:text-green-200">
              캔들 차트
            </CardTitle>
            <div className="flex items-center gap-1">
              {wsConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600 dark:text-green-400">
                    실시간
                  </span>
                </>
              ) : (
                <>
                  <Activity className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">연결중...</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {timeframe}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {chartData.length}개 캔들
            </Badge>
            <Badge variant="outline" className="text-xs">
              {zoomLevel.toFixed(1)}x
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={loadChartData}
              title="데이터 새로고침"
            >
              <Activity className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-1"
              onClick={() => {
                setZoomLevel(1);
                setZoomCenter(0.5);
                setIsZooming(false);

                setViewStart(0);
                setViewEnd(chartData.length);
              }}
              title="줌 리셋"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
          <div className="flex flex-wrap items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setShowSMA5((v) => !v)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                showSMA5
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              title="단기 이동평균선 (5)"
            >
              SMA5
            </button>
            <button
              onClick={() => setShowSMA20((v) => !v)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                showSMA20
                  ? "bg-amber-500 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              title="중기 이동평균선 (20)"
            >
              SMA20
            </button>
            <button
              onClick={() => setShowSMA60((v) => !v)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                showSMA60
                  ? "bg-indigo-500 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              title="장기 이동평균선 (60)"
            >
              SMA60
            </button>
            <button
              onClick={() => setShowBB((v) => !v)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                showBB
                  ? "bg-violet-500 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              title="볼린저밴드 (20, 2σ)"
            >
              BB
            </button>
          </div>
            {showMinuteToggle && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                {minuteTimeframes.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => handleMinuteSelect(tf.value)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      timeframe === tf.value
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                        : "text-gray-700 dark:text-gray-300"
                    } ${
                      tf.value === minuteTimeframes[0].value
                        ? "rounded-t-lg"
                        : ""
                    } ${
                      tf.value ===
                      minuteTimeframes[minuteTimeframes.length - 1].value
                        ? "rounded-b-lg"
                        : ""
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            )}
          </div>

        <div
          ref={chartContainerRef}
          className="relative h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          onWheel={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onScroll={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          style={{ 
            touchAction: 'none',
            overscrollBehavior: 'none',
            overflow: 'hidden'
          }}
        >
          {chartData.length > 0 ? (
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-grab select-none"
              onMouseDown={handleChartMouseDown}
              onMouseUp={handleChartMouseUp}
              onClick={handleChartClick}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
              onWheel={handleChartWheel}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{ 
                touchAction: 'none',
                overscrollBehavior: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Activity className="w-8 h-8 text-green-500 mx-auto animate-pulse" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  차트 데이터 준비 중...
                </p>
              </div>
            </div>
          )}
        </div>

        {tooltipData && (
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 min-w-[200px] pointer-events-none"
            style={{
              left: tooltipData.x + 10,
              top: tooltipData.y - 10,
              transform: "translateY(-100%)",
            }}
          >
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <p className="text-gray-500 dark:text-gray-400">시가</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {tooltipData.data.open.toLocaleString()}원
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 dark:text-gray-400">고가</p>
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    {tooltipData.data.high.toLocaleString()}원
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 dark:text-gray-400">저가</p>
                  <p className="font-semibold text-blue-600 dark:text-blue-400">
                    {tooltipData.data.low.toLocaleString()}원
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500 dark:text-gray-400">종가</p>
                  <p
                    className={`font-semibold ${
                      tooltipData.data.close >= tooltipData.data.open
                        ? "text-red-600 dark:text-red-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {tooltipData.data.close.toLocaleString()}원
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    거래량
                  </span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {tooltipData.data.volume.toLocaleString()}주
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    거래대금
                  </span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {(
                      (tooltipData.data.volume * tooltipData.data.close) /
                      1000000
                    ).toFixed(1)}
                    M원
                  </span>
                </div>
              </div>

