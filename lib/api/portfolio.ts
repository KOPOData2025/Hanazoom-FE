import api from '@/app/config/api';

export interface Account {
  id: number;
  memberId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountBalance {
  id: number;
  accountId: number;
  availableCash: number;
  totalBalance: number;
  balanceDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioStock {
  id: number;
  stockSymbol: string;
  stockName: string;
  

  quantity: number;
  availableQuantity: number;
  frozenQuantity: number;
  

  avgPurchasePrice: number;
  totalPurchaseAmount: number;
  

  currentPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossRate: number;
  

  firstPurchaseDate: string;
  lastPurchaseDate: string;
  lastSaleDate: string;
  

  allocationRate: number;
  

  isProfitable: boolean;
  performanceStatus: string;
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
  

  totalStockValue: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;
  

  totalBalance: number;
  

  totalStockCount: number;
  stockAllocationRate: number;
  cashAllocationRate: number;
  

  dailyReturn: number;
  monthlyReturn: number;
  yearlyReturn: number;
}


export const getAccount = async (): Promise<Account> => {
  const response = await api.get('/portfolio/account');
  return response.data;
};


export const getAccountBalance = async (): Promise<AccountBalance> => {
  const response = await api.get('/portfolio/account/balance');
  return response.data;
};


export const getPortfolioSummary = async (): Promise<PortfolioSummary> => {
  const response = await api.get('/portfolio/summary');
  return response.data;
};


export const getPortfolioStocks = async (): Promise<PortfolioStock[]> => {
  const response = await api.get('/portfolio/stocks');
  return response.data;
};


export const getStockQuantity = async (stockCode: string): Promise<number> => {
  try {
    const stocks = await getPortfolioStocks();
    const stock = stocks.find(s => s.stockSymbol === stockCode);
    return stock?.availableQuantity ?? 0;
  } catch (error) {
    console.error('보유 수량 조회 실패:', error);
    return 0;
  }
};


export const getClientPortfolioSummary = async (clientId: string): Promise<PortfolioSummary> => {
  console.log("🔍 getClientPortfolioSummary 호출:", {
    clientId,
    url: `/portfolio/client/${clientId}/summary`
  });
  
  try {
    const response = await api.get(`/portfolio/client/${clientId}/summary`);
    console.log("✅ getClientPortfolioSummary 응답:", {
      status: response.status,
      data: response.data,
      dataKeys: response.data ? Object.keys(response.data) : []
    });
    return response.data;
  } catch (error) {
    console.error("❌ getClientPortfolioSummary 실패:", error);
    throw error;
  }
};


export const getClientPortfolioStocks = async (clientId: string): Promise<PortfolioStock[]> => {
  console.log("🔍 getClientPortfolioStocks 호출:", {
    clientId,
    url: `/portfolio/client/${clientId}/stocks`
  });
  
  try {
    const response = await api.get(`/portfolio/client/${clientId}/stocks`);
    console.log("✅ getClientPortfolioStocks 응답:", {
      status: response.status,
      data: response.data,
      dataLength: response.data ? response.data.length : 0
    });
    return response.data;
  } catch (error) {
    console.error("❌ getClientPortfolioStocks 실패:", error);
    throw error;
  }
};


export const getClientTradeHistory = async (clientId: string): Promise<any[]> => {
  console.log("🔍 getClientTradeHistory 호출:", {
    clientId,
    url: `/portfolio/client/${clientId}/trades`
  });
  
  try {
    const response = await api.get(`/portfolio/client/${clientId}/trades`);
    console.log("✅ getClientTradeHistory 응답:", {
      status: response.status,
      data: response.data,
      dataLength: response.data ? response.data.length : 0
    });
    return response.data;
  } catch (error) {
    console.error("❌ getClientTradeHistory 실패:", error);
    throw error;
  }
};