"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Sector,
} from "recharts";
import {
  PieChart as PieChartIcon,
  DollarSign,
  TrendingUp,
  HelpCircle,
} from "lucide-react";

interface ChartData {
  name: string;
  value: number;
  percentage: number;
  type: "cash" | "stock" | "unknown";
  color: string;
  stockSymbol?: string;
  profitLoss?: number;
  profitLossRate?: number;
  isVisible: boolean;
}

interface EnhancedPortfolioChartProps {
  portfolioSummary: any;
  portfolioStocks: any[];
}


const OKABE_ITO_PALETTE = [
  "#E69F00", 
  "#56B4E9", 
  "#009E73", 
  "#F0E442", 
  "#0072B2", 
  "#D55E00", 
  "#CC79A7", 
  "#999999", 
];


const adjustColorForDarkMode = (color: string, brightness: number = 15, saturation: number = 10) => {

  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  

  l = Math.min(1, l + brightness / 100);
  s = Math.min(1, s + saturation / 100);
  

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  if (s === 0) {
    const gray = Math.round(l * 255);
    return `#${gray.toString(16).padStart(2, '0').repeat(3)}`;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
};


const calculateColorDifference = (color1: string, color2: string) => {

  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);
  
  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);
  
  return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
};


const assignColors = (data: Omit<ChartData, 'color' | 'isVisible'>[]) => {
  const assignedColors = new Map<string, string>();
  const usedColors: string[] = [];
  
  return data.map((item, index) => {
    let color: string;
    

    if (assignedColors.has(item.name)) {
      color = assignedColors.get(item.name)!;
    } else {

      let colorIndex = index % OKABE_ITO_PALETTE.length;
      color = OKABE_ITO_PALETTE[colorIndex];
      

      while (usedColors.some(usedColor => calculateColorDifference(color, usedColor) < 20)) {
        colorIndex = (colorIndex + 1) % OKABE_ITO_PALETTE.length;
        color = OKABE_ITO_PALETTE[colorIndex];
      }
      
      assignedColors.set(item.name, color);
      usedColors.push(color);
    }
    

    const finalColor = color;
    console.log(`🎨 색상 할당: ${item.name} -> ${finalColor}`);
    
    return {
      ...item,
      color: finalColor,
      isVisible: true,
    };
  });
};

export default function EnhancedPortfolioChart({
  portfolioSummary,
  portfolioStocks,
}: EnhancedPortfolioChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (portfolioSummary && portfolioStocks) {
      generateChartData();
    }
  }, [portfolioSummary, portfolioStocks]);

  const generateChartData = () => {
    const data: Omit<ChartData, 'color' | 'isVisible'>[] = [];


    if (portfolioSummary.totalCash > 0) {
      data.push({
        name: "현금",
        value: portfolioSummary.totalCash,
        percentage: Number(
          ((portfolioSummary.totalCash / portfolioSummary.totalBalance) * 100).toFixed(1)
        ),
        type: "cash",
      });
    }


    portfolioStocks.forEach((stock) => {
      if (stock.currentValue > 0) {
        const percentage = Number(
          ((stock.currentValue / portfolioSummary.totalBalance) * 100).toFixed(1)
        );

        const displayName = stock.stockName || stock.stockSymbol || "알 수 없음";

        data.push({
          name: displayName,
          value: stock.currentValue,
          percentage: percentage,
          type: displayName === "알 수 없음" ? "unknown" : "stock",
          stockSymbol: stock.stockSymbol,
          profitLoss: stock.profitLoss,
          profitLossRate: stock.profitLossRate,
        });
      }
    });


    const dataWithColors = assignColors(data);
    console.log("🎨 차트 데이터 생성:", dataWithColors); 
    setChartData(dataWithColors);
  };


  const sortedChartData = useMemo(() => {
    return [...chartData]
      .sort((a, b) => b.percentage - a.percentage);
  }, [chartData]);


  const handleItemHover = (index: number) => {
    setHoveredIndex(index);
    setActiveIndex(index);
  };

  const handleItemLeave = () => {
    setHoveredIndex(null);
    setActiveIndex(null);
  };


  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
    } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill="rgba(255,255,255,0.15)"
          stroke="none"
          style={{
            shapeRendering: 'geometricPrecision',
            filter: 'drop-shadow(0px 0px 8px rgba(255,255,255,0.4))'
          }}
        />
        
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={innerRadius + 3}
          startAngle={startAngle}
          endAngle={endAngle}
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            shapeRendering: 'geometricPrecision',
            filter: 'drop-shadow(0px 0px 3px rgba(255,255,255,0.7))'
          }}
        />
        
          <div className="h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <clipPath id="donutClip">
                    <rect x="0" y="0" width="100%" height="100%"/>
                  </clipPath>
                </defs>
                <Pie
                  data={sortedChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={0}
                  dataKey="value"
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1.2}
                  style={{
                    shapeRendering: 'geometricPrecision'
                  }}
                >
                  {sortedChartData.map((entry, index) => {
                    console.log(`🎨 Cell ${index}:`, entry.name, entry.color); 
                    
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth={1.2}
                        style={{
                          filter: entry.percentage < 3 ? 'url(#hatchPattern)' : 'none',
                          shapeRendering: 'geometricPrecision'
                        }}
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

