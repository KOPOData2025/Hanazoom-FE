import api, { API_ENDPOINTS } from "@/app/config/api";

export interface Stock {
  symbol: string;
  name: string;
  market: string;
  sector: string;
  logoUrl: string;
  currentPrice: number | null;
  priceChange: number | null;
  priceChangePercent: number | null;
  volume: number | null;
  marketCap: number | null;
}


export interface StockSearchResult {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: string;
  priceChangePercent: string;
  logoUrl: string;
  score: number;
  matchType: string;
  highlightedName?: string;

  stockCode: string;
  stockName: string;
  price: string;
  change: string;
  changeRate: string;
}


export interface StockPriceData {
  stockCode: string;
  stockName: string;
  currentPrice: string;
  changePrice: string;
  changeRate: string;
  changeSign: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  marketCap: string;
  previousClose: string;
  updatedTime: string;
  changeStatus: string;
  positiveChange: boolean;
  negativeChange: boolean;

  isMarketOpen: boolean;
  isAfterMarketClose: boolean;
  marketStatus: string;

  askOrders?: OrderBookItem[];
  bidOrders?: OrderBookItem[];
  totalAskQuantity?: string;
  totalBidQuantity?: string;
  imbalanceRatio?: number;
  spread?: number;
  buyDominant?: boolean;
  sellDominant?: boolean;
}

export interface OrderBookItem {
  price: string;
  quantity: string;
  rank: number;
  priceAsLong: number;
  quantityAsLong: number;
}

export interface OrderBookData {
  stockCode: string;
  stockName: string;
  currentPrice: string;
  updatedTime: string;
  askOrders: OrderBookItem[];
  bidOrders: OrderBookItem[];
  totalAskQuantity: string;
  totalBidQuantity: string;
  imbalanceRatio: number;
  spread: number;
  sellDominant: boolean;
  buyDominant: boolean;
}

export const getStock = async (symbol: string): Promise<Stock> => {
  const response = await api.get<{ success: boolean; data: Stock }>(
    `/stocks/${symbol}`
  );
  return response.data.data;
};

export const getStocks = async (page = 0, size = 20) => {
  const response = await api.get("/stocks", {
    params: { page, size },
  });
  return response.data;
};


export const searchStocks = async (
  query: string
): Promise<{ success: boolean; data: StockSearchResult[] }> => {
  const response = await api.get("/stocks/search", {
    params: { query },
  });
  return response.data;
};


export const suggestStocks = async (
  prefix: string
): Promise<{ success: boolean; data: string[] }> => {
  const response = await api.get("/stocks/suggest", {
    params: { prefix },
  });
  return response.data;
};


export const searchStocksBySector = async (
  keyword: string,
  sector: string
): Promise<{ success: boolean; data: StockSearchResult[] }> => {
  const response = await api.get("/stocks/search/sector", {
    params: { keyword, sector },
  });
  return response.data;
};


export const syncStocksToElasticsearch = async (): Promise<{
  success: boolean;
  data: string;
}> => {
  const response = await api.post("/stocks/sync");
  return response.data;
};

export const getTopStocksByRegion = async (regionId: number) => {
  const response = await api.get(`/regions/${regionId}/top-stocks`);
  return response.data;
};


export interface PopularityDetailsResponse {
  regionId: number;
  symbol: string;
  date: string;
  score: number; 
  tradeTrend: number; 
  community: number; 
  momentum: number; 
  newsImpact: number; 
  weightTradeTrend: number;
  weightCommunity: number;
  weightMomentum: number;
  weightNews: number;
  postCount: number;
  commentCount: number;
  voteCount: number;
  viewCount: number;
}

export const getPopularityDetails = async (
  regionId: number,
  symbol: string,
  date: string = "latest"
): Promise<PopularityDetailsResponse> => {
  try {
    const res = await api.get<{
      success: boolean;
      data: PopularityDetailsResponse;
    }>(`/regions/${regionId}/stocks/${symbol}/popularity`, {
      params: { date },
    });

    return res.data.data;
  } catch (error) {
    console.error(`❌ [API] getPopularityDetails 에러:`, error);
    throw error;
  }
};


export const getStockRealTimePrice = async (
  stockCode: string
): Promise<StockPriceData> => {
  const response = await api.get<{ success: boolean; data: StockPriceData }>(
    `${API_ENDPOINTS.stockRealtime}/${stockCode}`
  );

  if (!response.data.success) {
    throw new Error(
      response.data.message || "실시간 가격 조회에 실패했습니다."
    );
  }

  return response.data.data;
};

export const getStockOrderBook = async (
  stockCode: string
): Promise<OrderBookData> => {
  const response = await api.get<{ success: boolean; data: OrderBookData }>(
    `${API_ENDPOINTS.stockOrderbook}/${stockCode}`
  );

  if (!response.data.success) {
    throw new Error(
      response.data.message || "호가창 정보 조회에 실패했습니다."
    );
  }

  return response.data.data;
};


export const getMultipleStockPrices = async (
  stockCodes: string[]
): Promise<StockPriceData[]> => {
  const promises = stockCodes.map((code) => getStockRealTimePrice(code));
  const results = await Promise.allSettled(promises);

  return results
    .filter(
      (result): result is PromiseFulfilledResult<StockPriceData> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value);
};


export const validateStockCode = (stockCode: string): boolean => {

  return /^\d{6}$/.test(stockCode);
};


export const searchStocksWTS = async (query: string) => {
  const response = await api.get(API_ENDPOINTS.stockSearch, {
    params: { query },
  });
  return response.data;
};
