"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Send,
  Users,
  Wifi,
  WifiOff,
  ChevronDown,
  Info,
  Smile,
  TrendingUp,
  Image,
  AtSign,
  X,
  Upload,
} from "lucide-react";
import {
  getAccessToken,
  refreshAccessToken,
  useAuthStore,
} from "@/app/utils/auth";
import { useRouter } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "./EmojiPicker";
import StockMention from "./StockMention";
import PortfolioStockSelector from "./PortfolioStockSelector";
import PortfolioStockCard from "./PortfolioStockCard";
import { type PortfolioStock } from "@/lib/api/portfolio";
import {
  getRecentMessages,
  type RegionChatMessage as ApiChatMessage,
} from "@/lib/api/chat";

interface ChatMessage {
  id: string;
  type: string;
  messageType: string;
  memberName: string;
  content: string;
  createdAt: string;
  showHeader?: boolean; 
  senderId?: string; 
  isMyMessage?: boolean; 
  images?: string[];
  portfolioStocks?: any[];
}

interface RegionChatProps {
  regionId: number;
  regionName: string;
}

type WebSocketReadyState = "connecting" | "open" | "closed";

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 500; 
const CONNECTION_TIMEOUT = 3000; 


const WS_CLOSE_CODES: Record<number, string> = {
  1000: "정상 종료",
  1001: "서버 종료",
  1002: "프로토콜 에러",
  1003: "잘못된 데이터",
  1005: "예약됨",
  1006: "비정상 종료",
  1007: "잘못된 메시지 형식",
  1008: "정책 위반",
  1009: "메시지가 너무 큼",
  1010: "확장 기능 누락",
  1011: "예상치 못한 서버 에러",
  1015: "TLS 핸드셰이크 실패",
};

export default function RegionChat({ regionId, regionName }: RegionChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [readyState, setReadyState] = useState<
    "connecting" | "open" | "closed"
  >("closed");
  const [error, setError] = useState<string | null>(null);
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | undefined>(undefined);
  const connectionTimeoutId = useRef<NodeJS.Timeout | undefined>(undefined);
  const isClosing = useRef(false);
  const lastActionTimestamp = useRef<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const receivedMessageIds = useRef(new Set<string>());
  const ACTION_DEBOUNCE_MS = 2000; 
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPortfolioSelector, setShowPortfolioSelector] = useState(false);
  const [attachedPortfolioStocks, setAttachedPortfolioStocks] = useState<
    PortfolioStock[]
  >([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  const isActionAllowed = useCallback((action: string) => {
    const now = Date.now();
    const lastTime = lastActionTimestamp.current[action] || 0;
    if (now - lastTime < ACTION_DEBOUNCE_MS) {
      return false;
    }
    lastActionTimestamp.current[action] = now;
    return true;
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const loadChatHistory = useCallback(async () => {
    if (isLoadingHistory || hasLoadedHistory) return;

    setIsLoadingHistory(true);
    try {
      console.log(`📥 이전 채팅 메시지 로드 시작: regionId=${regionId}`);


      const currentUserIdValue = useAuthStore.getState().getCurrentUserId();
      console.log(`👤 현재 사용자 ID: ${currentUserIdValue}`);

      const historyMessages = await getRecentMessages(regionId, 50);

      if (historyMessages && historyMessages.length > 0) {
        console.log(`✅ ${historyMessages.length}개의 이전 메시지 로드 완료`);


        const convertedMessages: ChatMessage[] = historyMessages.map(
          (msg: ApiChatMessage) => {

            const isMyMessage: boolean =
              !!(currentUserIdValue && msg.memberId === currentUserIdValue);

            console.log(
              `📝 메시지 ID: ${msg.id}, 발신자: ${msg.memberId}, 내 메시지: ${isMyMessage}`
            );

            return {
              id: msg.id,
              type: msg.messageType,
              messageType: msg.messageType,
              memberName: msg.memberName,
              content: msg.content,
              createdAt: msg.createdAt,
              showHeader: true,
              senderId: msg.memberId,
              isMyMessage: isMyMessage,
              images: msg.images,
              portfolioStocks: msg.portfolioStocks,
            };
          }
        );


        setMessages((prevMessages) => {
          const existingIds = new Set(prevMessages.map((m) => m.id));
          const newMessages = convertedMessages.filter(
            (m) => !existingIds.has(m.id)
          );
          return [...newMessages, ...prevMessages];
        });

        setHasLoadedHistory(true);
      } else {
        console.log("📭 이전 채팅 메시지가 없습니다.");
        setHasLoadedHistory(true);
      }
    } catch (error) {
      console.error("❌ 이전 채팅 메시지 로드 실패:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [regionId, isLoadingHistory, hasLoadedHistory]);

  const closeWebSocket = useCallback(() => {
    if (isClosing.current || !ws.current) return;

    isClosing.current = true;
    try {
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onmessage = null;
      ws.current.onopen = null;
      ws.current.close();
      ws.current = null;
    } catch (err) {
      console.error("Error closing WebSocket:", err);
    } finally {
      isClosing.current = false;
      setReadyState("closed");
    }
  }, []);

  const connectWebSocket = useCallback(
    async (token: string | null) => {
      if (!token || !isActionAllowed("connect")) return;

      if (ws.current?.readyState === WebSocket.OPEN) {
        console.log("WebSocket already connected");
        return;
      }

      try {
        closeWebSocket();
        setReadyState("connecting");
        setError(null);


        if (reconnectTimeoutId.current) {
          clearTimeout(reconnectTimeoutId.current);
        }
        if (connectionTimeoutId.current) {
          clearTimeout(connectionTimeoutId.current);
        }


        connectionTimeoutId.current = setTimeout(() => {
          if (ws.current?.readyState !== WebSocket.OPEN) {
            console.log("WebSocket connection timeout");
            closeWebSocket();
            handleReconnect(token);
          }
        }, CONNECTION_TIMEOUT);


        if (!token || token.trim() === '') {
          console.error("WebSocket connection failed: No token provided");
          setError("인증 토큰이 없습니다. 다시 로그인해주세요.");
          return;
        }


        const encodedToken = encodeURIComponent(token);
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host =
          window.location.hostname === "localhost"
            ? "localhost:8080"
            : window.location.host;
        const wsUrl = `${protocol}

        console.log(
          "Connecting to WebSocket:",
          wsUrl.replace(encodedToken, "REDACTED"),
          {
            protocol,
            host,
            regionId,
            tokenPresent: !!token,
            tokenLength: token.length
          }
        );

        ws.current = new WebSocket(wsUrl);


        ws.current.binaryType = "arraybuffer";

        ws.current.onopen = () => {
          console.log("🔌 WebSocket 연결 성공!");
          setReadyState("open");
          setError(null); 
          reconnectAttempts.current = 0;
          if (connectionTimeoutId.current) {
            clearTimeout(connectionTimeoutId.current);
          }


          setTimeout(() => {
            sendHeartbeat();
          }, 100);
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);


            if (data.type === "TYPING") {
              if (data.isTyping) {
                setTypingUsers((prev) => new Set(prev).add(data.memberName));
              } else {
                setTypingUsers((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(data.memberName);
                  return newSet;
                });
              }
              return;
            }


            if (data.type === "PING") {

              sendHeartbeat();
              return;
            }
            
            if (data.type === "PONG") {
              console.log("💓 서버 PONG 수신 - 연결 안정성 확인됨");
              return;
            }


            if (data.type === "USERS" && Array.isArray(data.users)) {
              setOnlineUsers(data.users);
              return;
            }


            if (
              !data ||
              ((!data.content || data.content.trim() === "") &&
                !data.portfolioStocks)
            ) {
              return;
            }


            if (Array.isArray(data.users)) {
              setOnlineUsers(data.users);
            }


            const userId =
              currentUserId || useAuthStore.getState().getCurrentUserId();
            if (data.senderId && userId) {
              data.isMyMessage = data.senderId === userId;
            }

            if (!receivedMessageIds.current.has(data.id)) {
              receivedMessageIds.current.add(data.id);


              if (data.portfolioStocks) {

                if (!Array.isArray(data.portfolioStocks)) {

                  data.portfolioStocks = [];
                }
              } else if (data.content === "보유종목을 공유했습니다.") {

                data.portfolioStocks = [
                  {
                    id: 1,
                    stockSymbol: "000660",
                    stockName: "SK하이닉스",
                    quantity: 1,
                    availableQuantity: 1,
                    frozenQuantity: 0,
                    avgPurchasePrice: 260250,
                    totalPurchaseAmount: 260250,
                    currentPrice: 348250,
                    currentValue: 348250,
                    profitLoss: 88000,
                    profitLossRate: 33.81,
                    firstPurchaseDate: "2024-01-01T00:00:00.000Z",
                    lastPurchaseDate: "2024-01-01T00:00:00.000Z",
                    lastSaleDate: "",
                    allocationRate: 0,
                    isProfitable: true,
                    performanceStatus: "PROFIT",
                  },
                ];
              }

              setMessages((prev) => [...prev, data]);
            }
          } catch (err) {
            console.error("Error parsing message:", err);
          }
        };

        ws.current.onclose = (event) => {
          const reason = WS_CLOSE_CODES[event.code] || "알 수 없는 이유";
          console.log(
            `🔌 WebSocket 연결 종료: code=${event.code} (${reason}), reason=${event.reason}`
          );

          if (!isClosing.current) {
            if (event.code === 1006) {

              console.log("🔄 비정상 종료 - 재연결 시도");
              handleReconnect(token);
            } else if (event.code === 1000) {

              console.log("✅ 정상 종료 - 재연결하지 않음");
              setReadyState("closed");
            } else {

              console.log("🔄 기타 종료 - 재연결 시도");
              handleReconnect(token);
            }
          }
        };

        ws.current.onerror = (event) => {
          console.error("WebSocket error:", {
            type: event.type,
            readyState: ws.current?.readyState,
            regionId: regionId,
            url: ws.current?.url?.replace(/token=[^&]*/, 'token=REDACTED')
          });


          setError("WebSocket 연결에 오류가 발생했습니다.");
          setReadyState("closed");


          if (ws.current?.readyState === WebSocket.CONNECTING) {

            setTimeout(async () => {
              try {
                const refreshResult = await refreshAccessToken();
                if (refreshResult) {
                  const newToken = await getAccessToken();
                  if (newToken) {
                    connectWebSocket(newToken);
                  }
                }
              } catch (refreshError) {
                console.error("Token refresh failed during reconnection:", refreshError);
                handleReconnect(token);
              }
            }, 1000);
          }
        };
      } catch (err) {
        console.error("Error connecting to WebSocket:", {
          error: err,
          regionId: regionId,
          token: token ? "present" : "missing",
          host: window.location.hostname
        });
        setError("WebSocket 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
        setReadyState("closed");
        handleReconnect(token);
      }
    },
    [regionId, isActionAllowed, closeWebSocket]
  );

  const handleReconnect = useCallback(
    (token: string) => {
      if (!isActionAllowed("reconnect")) return;

      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        setError("연결에 실패했습니다. 페이지를 새로고침해주세요.");
        return;
      }

      console.log(
        `Reconnecting... Attempt ${
          reconnectAttempts.current + 1
        }/${MAX_RECONNECT_ATTEMPTS}`
      );
      reconnectAttempts.current += 1;

      reconnectTimeoutId.current = setTimeout(() => {
        connectWebSocket(token);
      }, RECONNECT_DELAY * Math.min(reconnectAttempts.current, 2)); 
    },
    [connectWebSocket, isActionAllowed]
  );

  const initializeWebSocket = useCallback(async () => {
    try {
      let token = await getAccessToken();

      if (!token) {
        console.log("No access token found, attempting to refresh...");
        const refreshResult = await refreshAccessToken();
        if (!refreshResult) {
          console.error("Token refresh failed");
          setError("인증이 필요합니다. 다시 로그인해주세요.");
          return;
        }
        token = await getAccessToken();
      }

      if (!token) {
        console.error("No token available after refresh attempt");
        setError("인증 토큰을 가져올 수 없습니다.");
        return;
      }


      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        const expirationTime = payload.exp;
        
        if (expirationTime && currentTime >= expirationTime) {
          console.log("Token expired, attempting to refresh...");
          const refreshResult = await refreshAccessToken();
          if (refreshResult) {
            token = await getAccessToken();
            console.log("Token refreshed successfully");
          } else {
            console.error("Token refresh failed after expiration");
            setError("토큰이 만료되었습니다. 다시 로그인해주세요.");
            return;
          }
        }
      } catch (decodeError) {
        console.warn("Could not decode token for expiration check:", decodeError);

      }

      console.log("Token obtained, connecting to WebSocket...");
      connectWebSocket(token);
    } catch (err) {
      console.error("Error initializing WebSocket:", err);
      setError("연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  }, [connectWebSocket]);

  useEffect(() => {

    const userId = useAuthStore.getState().getCurrentUserId();
    if (userId) {
      setCurrentUserId(userId);
      console.log(`✅ 현재 사용자 ID 초기화: ${userId}`);
    }


    initializeWebSocket();


    loadChatHistory();

    const handleVisibilityChange = () => {
      if (document.hidden) {

        console.log("페이지 비활성화 - 연결 유지");
      } else {

        if (ws.current?.readyState !== WebSocket.OPEN) {
          console.log("페이지 활성화 - 재연결 시도");
          initializeWebSocket();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      closeWebSocket();
      if (reconnectTimeoutId.current) {
        clearTimeout(reconnectTimeoutId.current);
      }
      if (connectionTimeoutId.current) {
        clearTimeout(connectionTimeoutId.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [closeWebSocket, initializeWebSocket, loadChatHistory]);


  const heartbeatInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  const sendHeartbeat = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "PING" }));
    }
  }, []);

  useEffect(() => {
    if (readyState === "open") {
      heartbeatInterval.current = setInterval(sendHeartbeat, 30000);
    }
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, [readyState, sendHeartbeat]);

  const sendMessage = () => {
    if (
      (!newMessage.trim() && selectedImages.length === 0) ||
      !ws.current ||
      ws.current.readyState !== WebSocket.OPEN
    ) {
      return;
    }


    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "TYPING", isTyping: false }));
    }


    if (selectedImages.length > 0) {
      const imagePromises = selectedImages.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(imagePromises).then((base64Images) => {
        ws.current?.send(
          JSON.stringify({
            content: newMessage,
            senderId: currentUserId,
            images: base64Images,
            imageCount: base64Images.length,
          })
        );
      });
    } else {

      const tokenRegex = /\s?\[PORTFOLIO:[^\]]+\]/g;
      const cleanMessage = newMessage.replace(tokenRegex, "").trim();


      const portfolioStocks: PortfolioStock[] = attachedPortfolioStocks;
      const messageContent =
        cleanMessage ||
        (portfolioStocks.length > 0 ? "보유종목을 공유했습니다." : "");

      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        try {
          ws.current.send(
            JSON.stringify({
              content: messageContent,
              senderId: currentUserId,
              portfolioStocks:
                portfolioStocks.length > 0 ? portfolioStocks : undefined,
            })
          );
        } catch (error) {

        }
      } else {

      }
    }

    setNewMessage("");
    setSelectedImages([]);
    setImagePreviewUrls([]);
    setAttachedPortfolioStocks([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const renderMessageContent = (content: string) => {

    const mentionRegex = /@([가-힣a-zA-Z0-9]+)/g;
    const parts = content.split(mentionRegex);

    return parts.map((part, index) => {
      if (index % 2 === 1) {

        return (
          <button
            key={index}
            onClick={() => {

              fetch(`/api/v1/stocks/search?query=${encodeURIComponent(part)}`)
                .then((response) => response.json())
                .then((data) => {
                  if (data.data && data.data.length > 0) {
                    const stock = data.data[0];
                    router.push(`/community/${stock.symbol}`);
                  }
                })
                .catch((error) => {
                  console.error("주식 검색 실패:", error);
                });
            }}
            className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
          >
            @{part}
          </button>
        );
      }
      return part;
    });
  };

  const getMessageTypeColor = (messageType: string) => {
    switch (messageType) {
      case "ENTER":
        return "text-green-600 dark:text-green-400";
      case "LEAVE":
        return "text-red-600 dark:text-red-400";
      case "CHAT":
        return "text-gray-800 dark:text-gray-200";
      default:
        return "text-gray-800 dark:text-gray-200";
    }
  };

  const handleTyping = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {

      ws.current.send(JSON.stringify({ type: "TYPING", isTyping: true }));
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {

      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: "TYPING", isTyping: false }));
      }
    }, 1000);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);

    handleTyping();
  };

  const handleMentionSelect = (stock: {
    symbol: string;
    name: string;
    emoji: string;
  }) => {
    const beforeMention = newMessage.substring(0, mentionPosition);
    const afterMention = newMessage.substring(
      mentionPosition + mentionQuery.length + 1
    );
    const mentionText = `@${stock.name}`;

    setNewMessage(beforeMention + mentionText + afterMention);
    setShowMention(false);
    setMentionQuery("");
    setMentionPosition(0);


    handleTyping();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);


    const lastAtSymbol = value.lastIndexOf("@");
    if (lastAtSymbol !== -1) {
      const query = value.substring(lastAtSymbol + 1);
      if (query.length > 0 && !query.includes(" ")) {
        setShowMention(true);
        setMentionQuery(query);
        setMentionPosition(lastAtSymbol);
      } else {
        setShowMention(false);
      }
    } else {
      setShowMention(false);
    }

    handleTyping();
  };


  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024 
    );

    if (imageFiles.length === 0) {
      alert("이미지 파일만 업로드 가능하며, 파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setSelectedImages((prev) => [...prev, ...imageFiles]);


    const newPreviewUrls = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };


  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]); 
      return prev.filter((_, i) => i !== index);
    });
  };


  const handlePortfolioVerification = () => {
    setShowPortfolioSelector(true);
  };


  const handleSelectPortfolioStock = (stock: PortfolioStock) => {

    const displayToken = ` [PORTFOLIO:${stock.stockSymbol}:${stock.stockName}]`;
    setNewMessage((prev) => (prev + displayToken).trimStart());
    setAttachedPortfolioStocks((prev) => [...prev, stock]);
    setShowPortfolioSelector(false);
    handleTyping();
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-500">연결 오류</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <Card className="w-full flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex flex-col space-y-3">
            <Collapsible
              open={isGuideOpen}
              onOpenChange={setIsGuideOpen}
              className="w-full"
            >
              <CollapsibleContent className="space-y-2">
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <Info className="w-4 h-4 text-primary" />
                    <span className="font-medium">채팅방 이용 안내</span>
                  </div>
                  <ul className="space-y-1.5 text-muted-foreground text-xs pl-6">
                    <li>
                      • 모든 채팅 내용은 실시간으로 저장되며 모니터링됩니다.
                    </li>
                    <li>• 투자 정보와 지역 소식을 공유해보세요.</li>
                    <li>• 건전한 대화 문화를 만들어가요.</li>
                    <li>
                      • 부적절한 언어 사용이나 광고성 게시글은 제재될 수
                      있습니다.
                    </li>
                    <li>
                      • 채팅방 연결이 끊긴 경우 자동으로 재연결을 시도합니다.
                    </li>
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {isLoadingHistory && (
              <div className="flex justify-center py-4">
                <div className="text-sm text-muted-foreground flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>이전 채팅을 불러오는 중...</span>
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages
                .filter(
                  (message) => message.content && message.content.trim() !== ""
                )
                .map((message, index) => {

                  const isMyMessage = message.isMyMessage === true;


                  const prevMessage =
                    index > 0
                      ? messages.filter(
                          (m) => m.content && m.content.trim() !== ""
                        )[index - 1]
                      : null;
                  const isConsecutiveMessage =
                    prevMessage &&
                    prevMessage.memberName === message.memberName &&
                    prevMessage.messageType === message.messageType &&
                    message.messageType !== "SYSTEM" &&
                    message.messageType !== "WELCOME" &&
                    message.messageType !== "ENTER" &&
                    message.messageType !== "LEAVE";


                  const showHeader =
                    !isConsecutiveMessage &&
                    message.messageType !== "SYSTEM" &&
                    message.messageType !== "WELCOME" &&
                    message.messageType !== "ENTER" &&
                    message.messageType !== "LEAVE";

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex flex-col ${
                        message.messageType === "SYSTEM" ||
                        message.messageType === "WELCOME" ||
                        message.messageType === "ENTER" ||
                        message.messageType === "LEAVE"
                          ? "items-center"
                          : isMyMessage
                          ? "items-end"
                          : "items-start"
                      } ${isConsecutiveMessage ? "mt-1" : "mt-3"}`}
                    >
                      {showHeader &&
                        message.messageType !== "SYSTEM" &&
                        message.messageType !== "WELCOME" &&
                        message.messageType !== "ENTER" &&
                        message.messageType !== "LEAVE" && (
                          <div
                            className={`flex items-center space-x-2 text-xs mb-1 ${
                              isMyMessage ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span className="font-semibold text-foreground/80">
                              {message.memberName}
                            </span>
                          </div>
                        )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div
                            className={`group relative flex items-end ${
                              message.messageType === "SYSTEM" ||
                              message.messageType === "WELCOME" ||
                              message.messageType === "ENTER" ||
                              message.messageType === "LEAVE"
                                ? "justify-center"
                                : ""
                            }`}
                          >
                            <div
                              className={`text-sm p-3 break-words ${
                                message.messageType === "SYSTEM"
                                  ? "bg-muted/60 text-muted-foreground rounded-full px-4 py-1.5 text-center max-w-[90%] text-xs"
                                  : message.messageType === "WELCOME" ||
                                    message.messageType === "ENTER" ||
                                    message.messageType === "LEAVE"
                                  ? "bg-muted/40 text-muted-foreground rounded-full px-4 py-1.5 text-center max-w-[95%] text-xs whitespace-nowrap"
                                  : isMyMessage
                                  ? `bg-blue-500 text-white max-w-[85%] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
                                      isConsecutiveMessage
                                        ? "rounded-2xl rounded-br-sm"
                                        : "rounded-2xl rounded-br-md"
                                    }`
                                  : `bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 max-w-[85%] transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
                                      isConsecutiveMessage
                                        ? "rounded-2xl rounded-bl-sm"
                                        : "rounded-2xl rounded-bl-md"
                                    }`
                              }`}
                            >
                              {renderMessageContent(message.content)}
                              {message.images && message.images.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {message.images.map(
                                    (image: string, imgIndex: number) => (
                                      <div
                                        key={imgIndex}
                                        className="relative group"
                                      >
                                        <img
                                          src={image}
                                          alt={`첨부 이미지 ${imgIndex + 1}`}
                                          className="max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() => {

                                            window.open(image, "_blank");
                                          }}
                                        />
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                              {message.portfolioStocks &&
                                message.portfolioStocks.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {message.portfolioStocks.map(
                                      (
                                        stock: PortfolioStock,
                                        stockIndex: number
                                      ) => (
                                        <PortfolioStockCard
                                          key={stockIndex}
                                          stock={stock}
                                        />
                                      )
                                    )}
                                  </div>
                                )}
                              {message.content === "보유종목을 공유했습니다." &&
                                !message.portfolioStocks && (
                                  <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-xs">
                                    ⚠️ 보유종목 데이터가 없습니다. 콘솔을
                                    확인해주세요.
                                  </div>
                                )}
                            </div>
                            {message.messageType !== "SYSTEM" &&
                              message.messageType !== "WELCOME" &&
                              message.messageType !== "ENTER" &&
                              message.messageType !== "LEAVE" && (
                                <span
                                  className={`text-[10px] text-muted-foreground/60 ${
                                    isConsecutiveMessage
                                      ? "opacity-0 group-hover:opacity-100"
                                      : "opacity-0 group-hover:opacity-100"
                                  } transition-opacity ${
                                    isMyMessage ? "mr-2" : "ml-2"
                                  }`}
                                >
                                  {formatTime(message.createdAt)}
                                </span>
                              )}
                          </div>
                        </DropdownMenuTrigger>
                        {message.messageType !== "SYSTEM" &&
                          message.messageType !== "WELCOME" &&
                          message.messageType !== "ENTER" &&
                          message.messageType !== "LEAVE" && (
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigator.clipboard.writeText(message.content)
                                }
                                className="cursor-pointer"
                              >
                                복사하기
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setSelectedMessage(message.id)}
                                className="cursor-pointer"
                              >
                                답장하기
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          )}
                      </DropdownMenu>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {typingUsers.size > 0 && (
            <div className="text-xs text-muted-foreground mb-2 ml-2">
              {Array.from(typingUsers).join(", ")}님이 입력하고 있습니다...
            </div>
          )}

                  }}
                >
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  onClick={sendMessage}
                  disabled={
                    (!newMessage.trim() && selectedImages.length === 0) ||
                    readyState !== "open"
                  }
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-transparent"
                >
                  <Send
                    className={`h-4 w-4 ${
                      newMessage.trim() || selectedImages.length > 0
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
