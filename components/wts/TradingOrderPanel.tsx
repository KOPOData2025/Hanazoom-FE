import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, TrendingUp, TrendingDown, Loader2, CheckCircle, XCircle } from "lucide-react";
import { createOrder, type OrderRequest } from "@/lib/api/order";
import { useAuthStore } from "@/app/utils/auth";
import { toast } from "sonner";
import { getAccountBalance, getStockQuantity, type AccountBalance } from "@/lib/api/portfolio";
import { getTickSizeKRX, stepByTick } from "@/lib/utils/marketUtils";

interface TradingOrderPanelProps {
  stockCode: string;
  currentPrice: string;
  orderBookData: any;
}

export const TradingOrderPanel = forwardRef<any, TradingOrderPanelProps>(
  ({ stockCode, currentPrice, orderBookData }, ref) => {
    const { accessToken } = useAuthStore();
    const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [orderMethod, setOrderMethod] = useState<"LIMIT" | "MARKET">("LIMIT");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastOrderResult, setLastOrderResult] = useState<{
      success: boolean;
      message: string;
      orderId?: number;
    } | null>(null);
    

    const [accountBalance, setAccountBalance] = useState<AccountBalance | null>(null);
    const [stockQuantity, setStockQuantity] = useState<number>(0);
    const [isLoadingAccount, setIsLoadingAccount] = useState(false);


    const COMMISSION_RATE = 0.00015; 
    const COMMISSION_MIN = 15; 
    const TAX_RATE = 0.0023; 


    const toInt = (v: string) => {
      if (!v) return 0;
      const n = Math.floor(Number(v.toString().replace(/[^0-9.-]/g, "")));
      return isFinite(n) ? n : 0;
    };
    const fmt = (n: number) => n.toLocaleString();


    const effectivePrice = orderMethod === "MARKET" ? toInt(currentPrice || "0") : toInt(price);
    const qty = toInt(quantity);
    const gross = effectivePrice * qty; 
    const commission = Math.max(Math.floor(gross * COMMISSION_RATE), gross > 0 ? COMMISSION_MIN : 0);
    const tax = orderType === "SELL" ? Math.floor(gross * TAX_RATE) : 0;
    const netCashChange = orderType === "BUY" ? -(gross + commission) : gross - commission - tax;
    const postCash = (accountBalance?.availableCash ?? 0) + netCashChange;


    const insufficientCash = orderType === 'BUY' && qty > 0 && postCash < 0;
    const insufficientShares = orderType === 'SELL' && qty > stockQuantity;


    const calcMaxBuyQty = () => {
      const cash = accountBalance?.availableCash ?? 0;
      if (effectivePrice <= 0) return 0;
      const estPerShareCost = Math.ceil(effectivePrice * (1 + COMMISSION_RATE));
      const estQty = Math.floor((cash - COMMISSION_MIN) / estPerShareCost);
      return Math.max(estQty, 0);
    };

    const calcMaxSellQty = () => stockQuantity;
    const maxBuyQty = calcMaxBuyQty();
    const pctQtyBuy = (p: number) => Math.max(Math.floor(maxBuyQty * p), maxBuyQty > 0 ? 1 : 0);
    const pctQtySell = (p: number) => Math.max(Math.floor(stockQuantity * p), stockQuantity > 0 ? 1 : 0);


    const loadAccountInfo = async () => {
      if (!accessToken) return;
      
      setIsLoadingAccount(true);
      try {
        const [balance, quantity] = await Promise.all([
          getAccountBalance(),
          getStockQuantity(stockCode)
        ]);
        setAccountBalance(balance);
        setStockQuantity(quantity);
      } catch (error) {
        console.error('계좌 정보 로드 실패:', error);
        toast.error('계좌 정보를 불러올 수 없습니다.');
      } finally {
        setIsLoadingAccount(false);
      }
    };


    useEffect(() => {
      loadAccountInfo();
    }, [accessToken, stockCode]);


    useImperativeHandle(ref, () => ({
      setPrice: (newPrice: string) => {
        setPrice(newPrice);
        setOrderMethod("LIMIT"); 
      },
    }));


    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
        if (e.key.toLowerCase() === 'b') setOrderType('BUY');
        if (e.key.toLowerCase() === 's') setOrderType('SELL');
        if (e.key.toLowerCase() === 'l') setOrderMethod('LIMIT');
        if (e.key.toLowerCase() === 'm') setOrderMethod('MARKET');
        if (e.key === 'Enter') handleOrder();
        if (e.key === 'Escape') { setPrice(''); setQuantity(''); }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [orderMethod, orderType, price, quantity, currentPrice]);


    const handlePriceClick = (clickedPrice: string) => {
      setPrice(clickedPrice);
      setOrderMethod("LIMIT");
    };


    const stepPrice = (delta: number) => {
      const base = orderMethod === 'MARKET' ? toInt(currentPrice || '0') : toInt(price || '0');
      const next = stepByTick(base || 0, delta);
      setPrice(String(next));
      setOrderMethod('LIMIT');
    };
    const onPriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        stepPrice(e.shiftKey ? 5 : e.ctrlKey ? 10 : 1);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        stepPrice(-(e.shiftKey ? 5 : e.ctrlKey ? 10 : 1));
      }
    };


    const handleOrder = async () => {
      if (!accessToken) {
        toast.error("주문을 하려면 로그인이 필요합니다.");
        return;
      }

      if (!quantity) {
        toast.error("수량을 입력해주세요.");
        return;
      }

      if (orderMethod === "LIMIT" && (!price || parseFloat(price) <= 0)) {
        toast.error("지정가 주문에서는 가격을 입력해주세요.");
        return;
      }

      if (parseInt(quantity) <= 0) {
        toast.error("수량은 1 이상이어야 합니다.");
        return;
      }

      setIsSubmitting(true);
      setLastOrderResult(null);

      try {
        const orderRequest: OrderRequest = {
          stockCode,
          orderType,
          orderMethod,
          price: orderMethod === "MARKET" ? parseFloat(currentPrice || "0") : parseFloat(price),
          quantity: parseInt(quantity),
        };

        const result = await createOrder(orderRequest);
        
        setLastOrderResult({
          success: true,
          message: `${orderType === "BUY" ? "매수" : "매도"} 주문이 성공적으로 접수되었습니다.`,
          orderId: result.id,
        });

        toast.success(`${orderType === "BUY" ? "매수" : "매도"} 주문이 접수되었습니다. (주문번호: ${result.id})`);
        

        setPrice("");
        setQuantity("");
        

        loadAccountInfo();
        
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "주문 처리 중 오류가 발생했습니다.";
        
        setLastOrderResult({
          success: false,
          message: errorMessage,
        });

        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-1">
          <Button
            variant={orderMethod === "LIMIT" ? "default" : "outline"}
            size="sm"
            onClick={() => setOrderMethod("LIMIT")}
            className="flex-1"
          >
            지정가 (L)
          </Button>
          <Button
            variant={orderMethod === "MARKET" ? "default" : "outline"}
            size="sm"
            onClick={() => setOrderMethod("MARKET")}
            className="flex-1"
          >
            시장가 (M)
          </Button>
        </div>

          {((orderMethod === 'MARKET' && currentPrice && quantity) || (orderMethod === 'LIMIT' && price && quantity)) && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-1">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>예상 체결금액</span>
                <span className="font-semibold">{fmt(gross)}원</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>수수료</span>
                <span>{fmt(commission)}원</span>
              </div>
              {orderType === 'SELL' && (
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>세금</span>
                  <span>{fmt(tax)}원</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>사용 후 현금 잔액</span>
                <span className={`font-semibold ${postCash < 0 ? 'text-red-600' : 'text-green-600 dark:text-green-400'}`}>{fmt(Math.max(postCash, 0))}원</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>보유수량 변화</span>
                <span>
                  {orderType === 'BUY' ? `${stockQuantity}주 → ${stockQuantity + qty}주` : `${stockQuantity}주 → ${Math.max(stockQuantity - qty,0)}주`}
                </span>
              </div>
            </div>
          )}
        </div>

        {lastOrderResult && (
          <div className={`p-3 rounded-lg border ${
            lastOrderResult.success 
              ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700" 
              : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700"
          }`}>
            <div className="flex items-center gap-2">
              {lastOrderResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm ${
                lastOrderResult.success ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
              }`}>
                {lastOrderResult.message}
              </span>
            </div>
            {lastOrderResult.orderId && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                주문번호: {lastOrderResult.orderId}
              </div>
            )}
          </div>
        )}

