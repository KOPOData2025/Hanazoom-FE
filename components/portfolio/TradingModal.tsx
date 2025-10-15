"use client";

import { useState, useEffect } from "react";
import { PortfolioStock } from "@/types/portfolio";
import { usePortfolio } from "@/hooks/usePortfolio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Calculator,
  AlertCircle,
} from "lucide-react";

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  portfolioStocks: PortfolioStock[];
}

export default function TradingModal({
  isOpen,
  onClose,
  onSuccess,
  portfolioStocks,
}: TradingModalProps) {
  const { buyStock, sellStock, loading, error, clearError } = usePortfolio();

  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [stockSymbol, setStockSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [selectedStock, setSelectedStock] = useState<PortfolioStock | null>(
    null
  );


  const mockStocks = [
    { symbol: "005930", name: "삼성전자", currentPrice: 75000 },
    { symbol: "000660", name: "SK하이닉스", currentPrice: 135000 },
    { symbol: "035420", name: "NAVER", currentPrice: 185000 },
    { symbol: "051910", name: "LG화학", currentPrice: 520000 },
    { symbol: "006400", name: "삼성SDI", currentPrice: 420000 },
  ];

  useEffect(() => {
    if (isOpen) {
      clearError();
      setStockSymbol("");
      setQuantity("");
      setPrice("");
      setSelectedStock(null);
    }
  }, [isOpen, clearError]);

  const handleStockSelect = (stock: (typeof mockStocks)[0]) => {
    setStockSymbol(stock.symbol);
    setPrice(stock.currentPrice.toString());
    setSelectedStock(
      portfolioStocks.find((s) => s.stockSymbol === stock.symbol) || null
    );
  };

  const handleBuy = async () => {
    if (!stockSymbol || !quantity || !price) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    const result = await buyStock(
      stockSymbol,
      parseInt(quantity),
      parseFloat(price)
    );
    if (result?.success) {
      alert("매수 주문이 완료되었습니다!");
      onSuccess();
    } else {
      alert(result?.error || "매수 주문에 실패했습니다.");
    }
  };

  const handleSell = async () => {
    if (!stockSymbol || !quantity || !price) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    if (!selectedStock || selectedStock.quantity < parseInt(quantity)) {
      alert("매도 가능한 수량이 부족합니다.");
      return;
    }

    const result = await sellStock(
      stockSymbol,
      parseInt(quantity),
      parseFloat(price)
    );
    if (result?.success) {
      alert("매도 주문이 완료되었습니다! 정산일: " + result.message);
      onSuccess();
    } else {
      alert(result?.error || "매도 주문에 실패했습니다.");
    }
  };

  const calculateTotal = () => {
    const qty = parseInt(quantity) || 0;
    const prc = parseFloat(price) || 0;
    const amount = qty * prc;
    const commission = Math.max(amount * 0.00015, 100); 
    return {
      amount,
      commission,
      total: amount + commission,
    };
  };

  const totalInfo = calculateTotal();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-green-200 dark:border-green-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-green-900 dark:text-green-100">
            <Calculator className="w-5 h-5" />
            주식 거래
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "buy" | "sell")}
        >
          <TabsList className="grid w-full grid-cols-2 bg-green-100 dark:bg-green-900/50">
            <TabsTrigger
              value="buy"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-green-700 dark:text-green-300"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              매수
            </TabsTrigger>
            <TabsTrigger
              value="sell"
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-green-700 dark:text-green-300"
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              매도
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-lg text-green-900 dark:text-green-100">
                    거래 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="buy-symbol"
                      className="text-green-900 dark:text-green-100"
                    >
                      종목코드
                    </Label>
                    <Input
                      id="buy-symbol"
                      value={stockSymbol}
                      onChange={(e) => setStockSymbol(e.target.value)}
                      placeholder="종목코드 입력"
                      className="border-green-200 dark:border-green-800 focus:border-green-500 dark:focus:border-green-400"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="buy-quantity"
                      className="text-green-900 dark:text-green-100"
                    >
                      수량
                    </Label>
                    <Input
                      id="buy-quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="주식 수량"
                      min="1"
                      className="border-green-200 dark:border-green-800 focus:border-green-500 dark:focus:border-green-400"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="buy-price"
                      className="text-green-900 dark:text-green-100"
                    >
                      단가
                    </Label>
                    <Input
                      id="buy-price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="주식 단가"
                      min="0"
                      className="border-green-200 dark:border-green-800 focus:border-green-500 dark:focus:border-green-400"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/50"
              >
                취소
              </Button>
              <Button
                onClick={handleBuy}
                disabled={loading || !stockSymbol || !quantity || !price}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? "처리중..." : "매수 주문"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-lg text-green-900 dark:text-green-100">
                    거래 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="sell-symbol"
                      className="text-green-900 dark:text-green-100"
                    >
                      종목코드
                    </Label>
                    <Input
                      id="sell-symbol"
                      value={stockSymbol}
                      onChange={(e) => setStockSymbol(e.target.value)}
                      placeholder="종목코드 입력"
                      className="border-green-200 dark:border-green-800 focus:border-green-500 dark:focus:border-green-400"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="sell-quantity"
                      className="text-green-900 dark:text-green-100"
                    >
                      수량
                    </Label>
                    <Input
                      id="sell-quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="매도 수량"
                      min="1"
                      max={selectedStock?.quantity || 0}
                      className="border-green-200 dark:border-green-800 focus:border-green-500 dark:focus:border-green-400"
                    />
                    {selectedStock && (
                      <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                        매도가능: {selectedStock.quantity.toLocaleString()}주
                      </div>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="sell-price"
                      className="text-green-900 dark:text-green-100"
                    >
                      단가
                    </Label>
                    <Input
                      id="sell-price"
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="매도 단가"
                      min="0"
                      className="border-green-200 dark:border-green-800 focus:border-green-500 dark:focus:border-green-400"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                  <div className="text-sm text-orange-800 dark:text-orange-200">
                    <p className="font-medium">매도 시 정산 안내</p>
                    <p>
                      매도 완료 후 3영업일이 지나면 인출 가능한 현금으로
                      전환됩니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

