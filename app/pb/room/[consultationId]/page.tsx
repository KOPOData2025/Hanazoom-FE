"use client";

import { useSearchParams, useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import VideoConsultation from "@/components/pb/VideoConsultation";
import PbRoomVideoConsultation from "@/components/pb/PbRoomVideoConsultation";
import Navbar from "@/app/components/Navbar";
import { useAuthStore } from "@/app/utils/auth";
import { Button } from "@/components/ui/button";
import { Copy, Check, Users, Settings, X, MessageSquare, PieChart } from "lucide-react";
import { getMyInfo } from "@/lib/api/members";
import { Client } from "@stomp/stompjs";
import ClientPortfolioView from "@/components/pb/ClientPortfolioView";

export default function ConsultationRoomPage() {
  const params = useParams<{ consultationId: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const { accessToken, getCurrentUserId } = useAuthStore();

  const originalConsultationId = params.consultationId;
  const clientName = sp.get("clientName") || "고객";
  const clientRegion = sp.get("clientRegion") || "지역 정보 없음";
  const pbNameFromUrl = sp.get("pbName") || "PB";
  const roomType = sp.get("type"); 
  const clientId = sp.get("clientId"); 
  const userType = sp.get("userType"); 


  const consultationId = originalConsultationId;


  const isPbRoom = roomType === "pb-room";


  const isPb = userType === "pb" || !userType; 
  const isGuest = userType === "guest";


  const [showManagementPanel, setShowManagementPanel] = useState(false);
  const [participants, setParticipants] = useState<
    Array<{ id: string; name: string; role: string; joinedAt: string }>
  >([]);
  const [inviteUrl, setInviteUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isRoomOwner, setIsRoomOwner] = useState(false);
  const [actualPbName, setActualPbName] = useState(pbNameFromUrl);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showPortfolioView, setShowPortfolioView] = useState(false);
  const [actualClientId, setActualClientId] = useState<string | null>(null);


  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      message: string;
      senderId: string;
      senderName: string;
      userType: string;
      timestamp: number;
    }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatConnected, setIsChatConnected] = useState(false);
  const [chatStompClient, setChatStompClient] = useState<Client | null>(null);


  useEffect(() => {
    const fetchUserInfo = async () => {
      if (isPb && accessToken) {
        try {
          const userInfo = await getMyInfo();
          setActualPbName(userInfo.name);
          console.log("✅ PB 사용자 정보 가져오기 성공:", userInfo.name);
        } catch (error) {
          console.error("❌ PB 사용자 정보 가져오기 실패:", error);
          setActualPbName(pbNameFromUrl); 
        }
      }
    };

    fetchUserInfo();
  }, [isPb, accessToken, pbNameFromUrl]);


  useEffect(() => {
    if (isPbRoom && consultationId) {
      const baseUrl = window.location.origin;
      const inviteUrl = `${baseUrl}/pb/room/${consultationId}?type=pb-room&pbName=${encodeURIComponent(
        actualPbName
      )}&userType=guest`;
      setInviteUrl(inviteUrl);
    }
  }, [isPbRoom, consultationId, actualPbName]);


  useEffect(() => {
    if (consultationId && accessToken && showChatPanel) {
      connectChatWebSocket();
    }

    return () => {
      if (chatStompClient) {
        chatStompClient.deactivate();
      }
    };
  }, [consultationId, accessToken, showChatPanel]);


  const connectChatWebSocket = () => {
    try {

      const currentToken = useAuthStore.getState().accessToken;

      console.log("🔌 채팅 WebSocket 연결 시도:", {
        consultationId,
        hasToken: !!currentToken,
        tokenPreview: currentToken
          ? currentToken.substring(0, 20) + "..."
          : "없음",
        brokerURL: "ws:
      });

      const client = new Client({
        brokerURL: "ws:
        connectHeaders: {
          Authorization: `Bearer ${currentToken}`,
        },
        debug: (str) => {
          console.log("🔍 채팅 STOMP Debug:", str);
        },
        reconnectDelay: 0,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: (frame) => {
          console.log("✅ 채팅 WebSocket 연결 성공:", {
            frame,
            consultationId,
            subscriptionTopic: `/topic/pb-room/${consultationId}/chat`,
            sessionId: frame.headers["session-id"],
            server: frame.headers["server"],
          });
          setIsChatConnected(true);


          const subscription = client.subscribe(
            `/topic/pb-room/${consultationId}/chat`,
            (message) => {
              console.log("📥 채팅 메시지 수신 - Raw:", message);
              const data = JSON.parse(message.body);
              console.log("📥 채팅 메시지 수신 - Parsed:", data);


              const newMessage = {
                id: data.messageId || data.id || Date.now().toString(),
                message: data.message || data.content, 
                senderId: data.senderId || "other",
                senderName: data.senderName || "사용자",
                userType: data.userType || "guest",
                timestamp: data.timestamp || Date.now(), 
              };

              console.log("📝 수신된 메시지를 상태에 추가:", newMessage);
              setChatMessages((prev) => {

                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) {
                  console.log("⚠️ 중복된 메시지 감지, 추가하지 않음:", newMessage.id);
                  return prev;
                }
                const updated = [...prev, newMessage];
                console.log("📊 메시지 상태 업데이트:", {
                  before: prev.length,
                  after: updated.length,
                });
                return updated;
              });
            }
          );

          console.log("📡 채팅 구독 완료:", subscription);
        },
        onStompError: (frame) => {
          console.error("❌ 채팅 STOMP 오류:", frame);
          setIsChatConnected(false);
        },
        onWebSocketError: (error) => {
          console.error("❌ 채팅 WebSocket 오류:", error);
          setIsChatConnected(false);
        },
      });

      client.activate();
      setChatStompClient(client);
    } catch (error) {
      console.error("❌ 채팅 WebSocket 연결 실패:", error);
      setIsChatConnected(false);
    }
  };


  const sendChatMessage = () => {
    if (!chatInput.trim()) return;

    const messageText = chatInput.trim();
    const senderName = actualPbName || (isPb ? "PB" : "고객");
    const messageUserType = isPb ? "pb" : "guest";

    console.log("📤 채팅 메시지 전송 시도:", {
      messageText,
      senderName,
      messageUserType,
      isChatConnected,
      chatStompClient: !!chatStompClient,
      currentMessagesCount: chatMessages.length,
    });


    const newMessage = {
      id: Date.now().toString(),
      message: messageText,
      senderId: "me",
      senderName: senderName,
      userType: messageUserType,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => {

      const exists = prev.some(msg => msg.id === newMessage.id);
      if (exists) {
        console.log("⚠️ 중복된 로컬 메시지 감지, 추가하지 않음:", newMessage.id);
        return prev;
      }
      const updated = [...prev, newMessage];
      console.log("📝 로컬 메시지 상태 업데이트:", {
        before: prev.length,
        after: updated.length,
        newMessage,
      });
      return updated;
    });
    setChatInput("");


    if (chatStompClient && isChatConnected) {
      const messageData = {
        message: messageText, 
        senderName: senderName,
        userType: messageUserType,
        timestamp: new Date().toISOString(),
      };

      console.log("🌐 WebSocket으로 메시지 전송:", {
        messageData,
        destination: `/app/chat/${consultationId}/send`,
        clientConnected: chatStompClient.connected,
      });

      chatStompClient.publish({
        destination: `/app/chat/${consultationId}/send`,
        body: JSON.stringify(messageData),
      });

      console.log("✅ 메시지 전송 완료");


      chatStompClient.publish({
        destination: "/app/test",
        body: JSON.stringify({ test: "hello" }),
      });
      console.log("🧪 테스트 메시지도 전송");
    } else {
      console.log("⚠️ WebSocket 연결되지 않음 - 로컬에만 저장됨");
    }
  };


  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };


  useEffect(() => {
    if (isPb && accessToken) {


      setIsRoomOwner(userType === "pb");
    }
  }, [isPb, accessToken, userType]);


  const handleGuestJoin = useCallback(async () => {
    try {
      console.log("🎯 고객 입장 처리 시작:", consultationId);


      const currentToken = useAuthStore.getState().accessToken;
      console.log("🔑 Access Token:", currentToken ? "있음" : "없음");
      console.log("🔍 API 호출 정보:", {
        url: `/api/pb-rooms/${consultationId}/join`,
        consultationId,
        method: "POST"
      });

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };


      if (currentToken) {
        headers.Authorization = `Bearer ${currentToken}`;
      }

      console.log("📡 요청 헤더:", headers);
      console.log("📡 요청 본문:", {
        consultationId: consultationId,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(`/api/pb-rooms/${consultationId}/join`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          consultationId: consultationId,
          timestamp: new Date().toISOString()
        })
      });

      console.log("📡 응답 상태:", response.status, response.statusText);
      console.log("📡 응답 헤더:", Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        try {
          const data = await response.json();
          if (data.success) {
            console.log("✅ 고객 입장 성공:", data);
          } else {
            console.error("❌ 고객 입장 실패:", data.error);
          }
        } catch (jsonError) {
          console.log("✅ 고객 입장 성공 (JSON 파싱 없음)");
        }
      } else {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status,
            statusText: response.statusText
          };
        }
        
        console.error("❌ 고객 입장 API 오류:", {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
          url: `/api/pb-rooms/${consultationId}/join`,
          method: "POST",
          consultationId: consultationId,
          hasToken: !!currentToken
        });
        

        if (response.status === 401) {
          console.error("🔐 인증 실패 - 로그인이 필요합니다");
          alert("로그인이 필요합니다. 다시 로그인해주세요.");
        } else if (response.status === 404) {
          console.error("🔍 방을 찾을 수 없습니다");
          alert("존재하지 않는 방입니다.");
        } else if (response.status === 403) {
          console.error("🚫 접근 권한이 없습니다 - 백엔드 보안 설정 확인 필요");
      <Navbar />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChatPanel(!showChatPanel)}
              className={`relative w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 backdrop-blur-sm rounded-full md:rounded-lg transition-all duration-200 flex items-center justify-center group ${
                showChatPanel
                  ? "bg-white/30 text-white"
                  : "bg-white/20 hover:bg-white/30 text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4 md:mr-2 group-hover:scale-110 transition-transform duration-200" />
              <span className="hidden md:inline font-medium">채팅</span>
            </button>

        <div className="md:hidden px-4 pb-2">
          <div className="flex items-center space-x-4 text-xs text-white/90">
            <span className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
              <Users className="w-3 h-3" />
              <span>{participants.length}명 참여</span>
            </span>
            <span className="flex items-center space-x-1 bg-white/10 px-2 py-1 rounded-full backdrop-blur-sm">
              <div className="w-2 h-2 bg-white/90 rounded-full"></div>
              <span>연결됨</span>
            </span>
          </div>
        </div>
      </div>

          <div
            className={`flex-1 transition-all duration-300 ${
              showChatPanel ? "mr-0 md:mr-80" : ""
            } ${isRoomOwner && showManagementPanel ? "mr-0 md:mr-80" : ""}`}
          >
            {isPbRoom ? (
              <PbRoomVideoConsultation
                roomId={consultationId}
                pbName={actualPbName}
                clientId={clientId || undefined}
                userType={userType || "pb"}
                isPb={isPb}
                isGuest={isGuest}
                onEndConsultation={() => router.push(isPb ? "/pb-admin" : "/")}
                onParticipantJoined={(participant) => {
                  console.log("👤 참여자 입장:", participant);
                  

                  if (participant.role === "GUEST") {
                    console.log("🎯 고객 입장 감지 - clientId 업데이트:", participant.id);
                    setActualClientId(participant.id);
                  }
                  
                  setParticipants((prev) => {

                    const exists = prev.some(p => p.id === participant.id);
                    if (exists) {
                      console.log("⚠️ 중복된 참여자 감지, 추가하지 않음:", participant.id);
                      return prev;
                    }
                    return [...prev, participant];
                  });
                }}
                onParticipantLeft={(participantId) => {
                  console.log("👤 참여자 퇴장:", participantId);


                  if (participantId === getCurrentUserId()) {
                    console.log("🚫 본인이 강제 퇴장되었습니다.");
                    alert("강제 퇴장되었습니다.");
                    router.push("/");
                    return;
                  }


                  setParticipants((prev) =>
                    prev.filter((p) => p.id !== participantId)
                  );
                }}
              />
            ) : (
              <VideoConsultation
                consultationId={consultationId}
                clientName={clientName}
                clientRegion={clientRegion}
                pbName={actualPbName}
                clientId={clientId || undefined}
                onEndConsultation={() => router.push("/pb-admin")}
              />
            )}
          </div>

              <div className="mb-4 md:mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    채팅
                  </h2>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isChatConnected
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {isChatConnected ? "연결됨" : "연결 안됨"}
                  </div>
                </div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  실시간 메시지 공유
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="메시지를 입력하세요..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  disabled={!isChatConnected}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!isChatConnected || !chatInput.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 text-sm font-medium whitespace-nowrap"
                >
                  전송
                </button>
              </div>
            </div>
          </div>

                <div className="mb-4 md:mb-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    방 관리
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    고객 초대 및 참여자 관리
                  </p>
                </div>

                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">
                    참여자 ({participants.length}명)
                  </h3>
                  <div className="space-y-2 max-h-48 md:max-h-64 overflow-y-auto">
                    {participants.map((participant, index) => (
                      <div
                        key={`${participant.id}-${index}`}
                        className="flex items-center justify-between p-2 md:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-2 md:space-x-3">
                          <div
                            className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              participant.role === "PB"
                                ? "bg-green-500 text-white"
                                : "bg-blue-500 text-white"
                            }`}
                          >
                            {participant.role === "PB" ? "PB" : "G"}
                          </div>
                          <div>
                            <p className="text-sm md:text-base font-medium text-gray-900 dark:text-white">
                              {participant.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {participant.role} • {participant.joinedAt}
                            </p>
                          </div>
                        </div>
                        {participant.role !== "PB" && (
                          <Button
                            onClick={() =>
                              handleKickParticipant(participant.id)
                            }
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900 transition-colors p-1 md:p-2"
                            title="강제 퇴장"
                          >
                            <X className="w-3 h-3 md:w-4 md:h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

      <ClientPortfolioView
        clientId={actualClientId || clientId || ""}
        clientName={clientName}
        isVisible={showPortfolioView}
        onClose={() => setShowPortfolioView(false)}
      />
    </div>
  );
}






