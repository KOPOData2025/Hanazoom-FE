import { useState, useEffect, useRef, useCallback } from "react";
import type { StockPriceData } from "@/lib/api/stock";

interface UseStockWebSocketOptions {
  stockCodes?: string[];
  onStockUpdate?: (data: StockPriceData) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

interface WebSocketMessage {
  type: string;
  message: string;
  timestamp: number;
  data?: any;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  stockData: Map<string, StockPriceData>;
  lastUpdate: number;
  lastDataReceived: number;
  isMarketOpen: boolean;
  pingInterval: number;
}

export function useStockWebSocket({
  stockCodes = [],
  onStockUpdate,
  autoReconnect = true,
  reconnectInterval = 5000,
}: UseStockWebSocketOptions = {}) {
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    stockData: new Map(),
    lastUpdate: 0,
    lastDataReceived: 0,
    isMarketOpen: false,
    pingInterval: 10000, 
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const subscribedCodesRef = useRef<Set<string>>(new Set());
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dataTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const updateDataReceivedStatus = useCallback(() => {
    const now = Date.now();
    setState((prev) => {

      if (prev.isMarketOpen === true && now - prev.lastDataReceived < 1000) {
        return prev;
      }

      return {
        ...prev,
        lastDataReceived: now,
        isMarketOpen: true, 
      };
    });


    if (dataTimeoutRef.current) {
      clearTimeout(dataTimeoutRef.current);
    }

    dataTimeoutRef.current = setTimeout(() => {
      setState((prev) => {

        if (prev.isMarketOpen === false) {
          return prev;
        }
        return {
          ...prev,
          isMarketOpen: false,
        };
      });
    }, 30000); 
  }, []);


  const setMarketOpen = useCallback(() => {
    setState((prev) => {

      if (prev.isMarketOpen === true) {
        return prev;
      }
      return {
        ...prev,
        isMarketOpen: true,
      };
    });
  }, []);

  const connect = useCallback(async () => {
    if (state.connecting || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState((prev) => {

      if (prev.connecting) return prev;
      return { ...prev, connecting: true, error: null };
    });


    try {
      const protocol =
        window.location.protocol === "https:" ? "https:" : "http:";
      const host = window.location.hostname;
      const port = process.env.NODE_ENV === "production" ? "" : ":8080";
      const healthCheckUrl = `${protocol}

      console.log("🔍 서버 상태 확인 중:", healthCheckUrl);

      const response = await fetch(healthCheckUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        console.warn(
          "⚠️ 서버 상태 확인 실패, WebSocket 연결 직접 시도:",
          response.status
        );
      } else {
        const healthData = await response.json();
        console.log("✅ 서버 상태 확인 완료:", healthData);
      }
    } catch (error) {
      console.warn("⚠️ 서버 상태 확인 실패, WebSocket 연결 직접 시도:", error);

    }

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname;
      const port = process.env.NODE_ENV === "production" ? ":8080" : ":8080";
      const wsUrl = `${protocol}

      console.log("🔄 웹소켓 연결 시도:", wsUrl);
      console.log("🔄 연결 환경:", {
        protocol,
        host,
        port,
        NODE_ENV: process.env.NODE_ENV,
        fullUrl: wsUrl,
        windowLocation: window.location.href,
      });


      if (!window.WebSocket) {
        throw new Error("이 브라우저는 웹소켓을 지원하지 않습니다.");
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;


      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log("⏰ 웹소켓 연결 시간 초과");
          ws.close();
          setState((prev) => ({
            ...prev,
            connected: false,
            connecting: false,
            error:
              "연결 시간이 초과되었습니다. 서버가 실행 중인지 확인해주세요.",
          }));
        }
      }, 10000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log("✅ 웹소켓 연결 성공");
        setState((prev) => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
        }));
        

        if (stockCodes.length > 0) {
          setTimeout(() => {
            console.log("🔄 onopen에서 구독 요청:", stockCodes);
            subscribe(stockCodes);
          }, 200); 
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case "CONNECTION_ESTABLISHED":
              console.log("✅ 서버 연결 확인:", message.message);

              if (stockCodes.length > 0) {
                setTimeout(() => {
                  console.log("🔄 구독 요청 지연 실행:", stockCodes);
                  subscribe(stockCodes);
                }, 100); 
              }
              break;

            case "SUBSCRIBED":
              if (message.data?.stockCodes) {

                message.data.stockCodes.forEach((code: string) => {
                  subscribedCodesRef.current.add(code);
                });
              }
              break;

            case "UNSUBSCRIBED":
              if (message.data?.stockCodes) {
                message.data.stockCodes.forEach((code: string) => {
                  subscribedCodesRef.current.delete(code);
                });
              }
              break;

            case "STOCK_UPDATE":
              if (message.data?.stockData) {
                const stockData: StockPriceData = message.data.stockData;
                

                console.log("📊 실시간 현재가 수신:", {
                  stockCode: stockData.stockCode,
                  stockName: stockData.stockName,
                  currentPrice: stockData.currentPrice,
                  changePrice: stockData.changePrice,
                  changeRate: stockData.changeRate,
                  volume: stockData.volume,
                  marketStatus: stockData.marketStatus,
                  timestamp: new Date().toISOString(),
                  wsReadyState: wsRef.current?.readyState,
                  subscribedCodes: Array.from(subscribedCodesRef.current)
                });

                setState((prev) => {

                  const existingData = prev.stockData.get(stockData.stockCode);
                  if (
                    existingData &&
                    existingData.currentPrice === stockData.currentPrice &&
                    existingData.changePrice === stockData.changePrice &&
                    existingData.changeRate === stockData.changeRate
                  ) {
                    return prev; 
                  }

                  const newStockData = new Map(prev.stockData);
                  newStockData.set(stockData.stockCode, stockData);
                  return {
                    ...prev,
                    stockData: newStockData,
                    lastUpdate: Date.now(),
                    isMarketOpen: true, 
                  };
                });


                updateDataReceivedStatus();
                onStockUpdate?.(stockData);
              }
              break;

            case "PONG":

              updateDataReceivedStatus();
              break;

            case "ERROR":
              console.error("🔴 서버 오류:", message.message);
              setState((prev) => ({ ...prev, error: message.message }));
              break;

            default:
              console.log("📨 알 수 없는 메시지:", message);
          }
        } catch (error) {
          console.error("🔴 웹소켓 메시지 파싱 오류:", error, event.data);
        }
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error("🔴 웹소켓 오류:", {
          error,
          readyState: ws.readyState,
          url: wsUrl,
          timestamp: new Date().toISOString(),
        });


        let errorMessage = "웹소켓 연결 오류";
        if (ws.readyState === WebSocket.CONNECTING) {
          errorMessage =
            "서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.";
        } else if (ws.readyState === WebSocket.CLOSED) {
          errorMessage = "연결이 종료되었습니다.";
        }

        setState((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
          error: errorMessage,
        }));


        if (autoReconnect && mountedRef.current) {
          console.log(`🔄 3초 후 재연결 시도...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log("🔄 재연결 시도 중...");
              connect();
            }
          }, 3000); 
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);


        let closeMessage = null;
        if (!event.wasClean) {
          switch (event.code) {
            case 1000:
              closeMessage = "정상 종료";
              break;
            case 1001:
              closeMessage = "서버가 종료됨";
              break;
            case 1002:
              closeMessage = "프로토콜 오류";
              break;
            case 1003:
              closeMessage = "지원하지 않는 데이터 타입";
              break;
            case 1006:
              closeMessage = "비정상 종료 (연결 실패)";
              break;
            case 1011:
              closeMessage = "서버 오류";
              break;
            default:
              closeMessage = `연결이 예기치 않게 종료되었습니다 (${event.code}: ${event.reason})`;
          }
        }

        setState((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
          error: closeMessage,

        }));

        subscribedCodesRef.current.clear();


        if (autoReconnect && mountedRef.current && !event.wasClean) {
          console.log(`🔄 3초 후 재연결 시도...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              console.log("🔄 재연결 시도 중...");
              connect();
            }
          }, 3000); 
        }
      };
    } catch (error) {
      console.error("🔴 웹소켓 생성 오류:", {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      setState((prev) => ({
        ...prev,
        connected: false,
        connecting: false,
        error: `웹소켓 생성 실패: ${
          error instanceof Error ? error.message : String(error)
        }`,
      }));
    }
  }, [autoReconnect, reconnectInterval, state.connecting]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }

    subscribedCodesRef.current.clear();

    setState((prev) => {

      if (!prev.connected && !prev.connecting) return prev;
      return {
        ...prev,
        connected: false,
        connecting: false,
        stockData: new Map(), 
      };
    });
  }, []);

  const sendMessage = useCallback((message: any) => {
    console.log("📤 메시지 전송 시도:", {
      messageType: message.type,
      wsReadyState: wsRef.current?.readyState,
      wsOpen: wsRef.current?.readyState === WebSocket.OPEN,
      hasWsRef: !!wsRef.current
    });
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        const messageStr = JSON.stringify(message);
        console.log("📤 전송할 메시지:", messageStr);
        wsRef.current.send(messageStr);
        console.log("✅ 메시지 전송 성공");
        return true;
      } catch (error) {
        console.error("🔴 메시지 전송 실패:", error);
        return false;
      }
    }
    console.warn("⚠️ 웹소켓이 연결되지 않음:", {
      readyState: wsRef.current?.readyState,
      expected: WebSocket.OPEN
    });
    return false;
  }, []);

  const subscribe = useCallback(
    (newStockCodes: string[]) => {
      const uniqueCodes = [...new Set(newStockCodes)].filter(
        (code) => code && code.trim()
      );
      if (uniqueCodes.length === 0) return false;

      console.log("📡 구독 요청 전송:", {
        stockCodes: uniqueCodes,
        connected: state.connected,
        wsReadyState: wsRef.current?.readyState
      });

      const success = sendMessage({
        type: "SUBSCRIBE",
        stockCodes: uniqueCodes,
      });

      if (success) {
        console.log("✅ 구독 메시지 전송 성공");

      } else {
        console.error("❌ 구독 메시지 전송 실패");
      }

      return success;
    },
    [sendMessage, state.connected]
  );

  const unsubscribe = useCallback(
    (stockCodesToRemove: string[]) => {
      const validCodes = stockCodesToRemove.filter(
        (code) => code && code.trim()
      );
      if (validCodes.length === 0) return false;

      const success = sendMessage({
        type: "UNSUBSCRIBE",
        stockCodes: validCodes,
      });

      if (success) {

      }

      return success;
    },
    [sendMessage]
  );

  const ping = useCallback(() => {
    return sendMessage({ type: "PING" });
  }, [sendMessage]);


  useEffect(() => {
    connect();

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, []);


  useEffect(() => {
    if (state.connected && stockCodes.length > 0) {

      const currentCodes = new Set(subscribedCodesRef.current);
      const requestedCodes = new Set(stockCodes);


      const hasDifference =
        currentCodes.size !== requestedCodes.size ||
        [...currentCodes].some((code) => !requestedCodes.has(code)) ||
        [...requestedCodes].some((code) => !currentCodes.has(code));

      if (hasDifference) {

        const codesToUnsubscribe = [...currentCodes].filter(
          (code) => !requestedCodes.has(code)
        );
        if (codesToUnsubscribe.length > 0) {
          unsubscribe(codesToUnsubscribe);
        }


        const codesToSubscribe = [...requestedCodes].filter(
          (code) => !currentCodes.has(code)
        );
        if (codesToSubscribe.length > 0) {
          setTimeout(() => {
            if (state.connected) {
              subscribe(codesToSubscribe);
            }
          }, 100);
        }
      }
    }
  }, [stockCodes, state.connected]);


  useEffect(() => {
    if (state.connected) {

      pingIntervalRef.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          ping();
          

          console.log("🔍 웹소켓 상태 체크:", {
            readyState: wsRef.current.readyState,
            connected: true,
            subscribedCodes: Array.from(subscribedCodesRef.current),
            stockCodes: stockCodes,
            timestamp: new Date().toISOString()
          });
        } else {
          console.warn("⚠️ 웹소켓 연결 끊어짐:", {
            readyState: wsRef.current?.readyState,
            connected: false,
            timestamp: new Date().toISOString()
          });
        }
      }, state.pingInterval);

      return () => {
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
      };
    }
  }, [state.connected, state.pingInterval, ping]);


  useEffect(() => {
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
    };
  }, []);


  const getStockData = useCallback(
    (stockCode: string) => {
      return state.stockData.get(stockCode);
    },
    [state.stockData]
  );

  const hasStockData = useCallback(
    (stockCode: string) => {
      return state.stockData.has(stockCode);
    },
    [state.stockData]
  );

  const getAllStockData = useCallback(() => {
    return Array.from(state.stockData.values());
  }, [state.stockData]);

  const getStockDataMap = useCallback(() => {
    return state.stockData;
  }, [state.stockData]);

  const reconnect = useCallback(() => {
    console.log("🔄 수동 재연결 시도...");
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  }, [disconnect, connect]);

  return {

    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
    stockData: state.stockData,
    lastUpdate: state.lastUpdate,
    lastDataReceived: state.lastDataReceived,
    isMarketOpen: state.isMarketOpen,
    subscribedCodes: [...subscribedCodesRef.current],


    connect,
    disconnect,
    subscribe,
    unsubscribe,
    ping,
    setMarketOpen,


    getStockData,
    hasStockData,
    getAllStockData,
    getStockDataMap,


    reconnect,
  };
}
