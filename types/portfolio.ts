export interface Account {
  id: number;
  accountNumber: string;
  accountName: string;
  accountType: "STOCK";
  broker: string;
  isMainAccount: boolean;
  createdDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountBalance {
  id: number;
  balanceDate: string;
  cashBalance: number;
  availableCash: number;
  frozenCash: number;
  settlementCash: number;
  withdrawableCash: number;
  totalStockValue: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;
  totalBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioStock {
  id: number;
  stockSymbol: string;
  stockName: string;
  quantity: number;
  availableQuantity: number;
  avgPurchasePrice: number;
  totalPurchaseAmount: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface TradeHistory {
  id: number;
  stockSymbol: string;
  tradeType: "BUY" | "SELL";
  tradeDate: string;
  tradeTime: string;
  quantity?: number;
  pricePerShare?: number;
  totalAmount?: number;
  commission?: number;
  tax?: number;
  netAmount?: number;
  balanceAfterTrade?: number;
  stockQuantityAfterTrade?: number;
  tradeMemo?: string;
  createdAt: string;
}

export interface PortfolioSummary {

  accountId: number;
  accountNumber: string;
  accountName: string;
  balanceDate: string;


  availableCash: number;
  settlementCash: number;
  withdrawableCash: number;
  frozenCash: number;
  totalCash: number;


  totalStockCount: number;
  totalStockValue: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;


  totalBalance: number;


  cashAllocationRate: number;
  stockAllocationRate: number;


  dailyReturn: number;
  monthlyReturn: number;
  yearlyReturn: number;
}

export interface TradeResult {
  success: boolean;
  message: string;
  data?: TradeHistory;
  error?: string;
}

export interface SettlementSchedule {
  id: number;
  settlementAmount: number;
  tradeDate: string;
  settlementDate: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
}


export interface MockStockData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}
