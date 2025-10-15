"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TestSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/v1/stocks/search?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (data.success) {
        setResults(data.data || []);
      } else {
        setError("검색 실패: " + (data.message || "알 수 없는 오류"));
      }
    } catch (err: any) {
      setError("네트워크 오류: " + err.message);
      console.error("검색 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  const getMatchTypeBadge = (matchType?: string) => {
    if (!matchType) return null;

    if (matchType === "SYMBOL_EXACT" || matchType === "NAME_EXACT") {
      return {
        label: "정확",
        variant: "default" as const,
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    }
    if (matchType.includes("FUZZY")) {
      return {
        label: "유사",
        variant: "secondary" as const,
        icon: <Sparkles className="w-3 h-3" />,
      };
    }
    if (matchType === "NAME_CONTAINS") {
      return { label: "포함", variant: "outline" as const, icon: null };
    }
    return null;
  };

  const testQueries = [
    { text: "삼성전자", desc: "정확한 검색" },
    { text: "삼송전자", desc: "오타 교정" },
    { text: "삼성", desc: "형태소 분석" },
    { text: "성전", desc: "부분 매칭" },
    { text: "005930", desc: "심볼 검색" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="주식명이나 종목코드를 입력하세요..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="text-lg"
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span className="ml-2">검색</span>
              </Button>
            </div>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                검색 결과 ({results.length}개)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((stock) => {
                  const matchBadge = getMatchTypeBadge(stock.matchType);
                  return (
                    <div
                      key={stock.symbol}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">
                              {stock.name}
                            </h3>
                            <span className="text-sm text-muted-foreground">
                              {stock.symbol}
                            </span>
                            {matchBadge && (
                              <Badge
                                variant={matchBadge.variant}
                                className="text-[10px] px-2 py-0 h-5 flex items-center gap-1"
                              >
                                {matchBadge.icon}
                                {matchBadge.label}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            {stock.sector && (
                              <span className="text-muted-foreground">
                                {stock.sector}
                              </span>
                            )}
                            <span className="text-muted-foreground">
                              {stock.currentPrice || stock.price}원
                            </span>
                            <span
                              className={
                                stock.priceChangePercent?.startsWith("-") ||
                                stock.change?.startsWith("-")
                                  ? "text-red-500"
                                  : "text-green-500"
                              }
                            >
                              {stock.priceChangePercent || stock.change}%
                            </span>
                          </div>
                          {stock.score && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              검색 점수: {stock.score.toFixed(2)} | 매칭 타입:{" "}
                              {stock.matchType}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

