"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Users,
  Settings,
  MessageSquare,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { cn } from "@/lib/utils";
import {
  getCurrentClientId,
  generateSharedClientId,
} from "@/lib/utils/clientId";

interface VideoConsultationRoomProps {
  consultationId: string;
  clientName: string;
  clientRegion: string;
  pbName: string;
  clientId?: string; 
  onEndConsultation: () => void;
}

export default function VideoConsultationRoom({
  consultationId,
  clientName,
  clientRegion,
  pbName,
  clientId,
  onEndConsultation,
}: VideoConsultationRoomProps) {

  const actualClientId =
    clientId ||
    (typeof window !== "undefined"
      ? generateSharedClientId(consultationId, "client")
      : "client-temp");

  console.log("VideoConsultationRoom 렌더링:", {
    consultationId,
    clientName,
    clientRegion,
    pbName,
    clientId: actualClientId,
  });

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      sender: string;
      message: string;
      timestamp: Date;
    }>
  >([]);
  const [newMessage, setNewMessage] = useState("");
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  const {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    isConnecting,
    participants,
    connectionState,
    error,
    mediaMode,
    startConnection,
    endConnection,
    initiateCall,
    requestPermissions,
    checkDeviceStatus,
    setMediaMode,
  } = useWebRTC({
    consultationId,
    clientId: actualClientId,
    onConnectionStateChange: (state) => {
      console.log("연결 상태 변경:", state);
    },
    onRemoteStream: (stream) => {
      console.log("원격 스트림 수신:", stream);
    },
    onError: (error) => {
      console.error("WebRTC 오류:", error);
      if (error.includes("권한") || error.includes("접근")) {
        setShowPermissionGuide(true);
      }
    },
  });


  useEffect(() => {
    console.log("🎥 VideoConsultationRoom 마운트 - 연결 시작");
    startConnection();
  }, [startConnection]);


  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
        setIsVideoEnabled(!isVideoEnabled);
      }
    }
  };


  const toggleAudio = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
        setIsAudioEnabled(!isAudioEnabled);
      }
    }
  };


  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };


  const handleEndConsultation = () => {
    endConnection();
    onEndConsultation();
  };


  const handleSendMessage = () => {
    if (newMessage.trim() && isConnected) {

      const messageData = {
        userName: pbName,
        message: newMessage.trim(),
      };



      const newChatMessage = {
        id: Date.now().toString(),
        sender: pbName,
        message: newMessage.trim(),
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, newChatMessage]);
      setNewMessage("");
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  const getConnectionBadgeColor = (state: string) => {
    switch (state) {
      case "connected":
        return "bg-green-100 text-green-800 border-green-200";
      case "connecting":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "disconnected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };


  const getConnectionStateText = (state: string) => {
    switch (state) {
      case "connected":
        return "연결됨";
      case "connecting":
        return "연결 중";
      case "disconnected":
        return "연결 끊김";
      default:
        return state;
    }
  };

  return (
    <div className="h-full flex flex-col">
        <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {clientName}
        </div>

        <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 w-24 h-18 md:w-48 md:h-36 bg-gray-900 rounded-lg overflow-hidden border-2 border-green-500">
          {mediaMode === "text" ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-2xl mb-2">📝</div>
                <p className="text-xs">텍스트 모드</p>
              </div>
            </div>
          ) : (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 flex gap-1">
            {!isVideoEnabled && (
              <div className="bg-red-500 text-white p-0.5 md:p-1 rounded">
                <VideoOff className="w-2 h-2 md:w-3 md:h-3" />
              </div>
            )}
            {!isAudioEnabled && (
              <div className="bg-red-500 text-white p-0.5 md:p-1 rounded">
                <MicOff className="w-2 h-2 md:w-3 md:h-3" />
              </div>
            )}
          </div>
        </div>
      </div>

            {mediaMode !== "text" && (
              <button
                onClick={toggleVideo}
                className={`rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition-all duration-200 ${
                  isVideoEnabled
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                    : "bg-red-500 hover:bg-red-600 text-white shadow-lg"
                }`}
              >
                {isVideoEnabled ? (
                  <Video className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  <VideoOff className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </button>
            )}

            {mediaMode === "text" && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full border border-emerald-200 dark:border-emerald-700">
                <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  텍스트 채팅 모드
                </span>
              </div>
            )}

            <button
              onClick={handleEndConsultation}
              className="rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all duration-200"
            >
              <PhoneOff className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>

      {showPermissionGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              카메라/마이크 권한 설정
            </h3>
            <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p>화상 상담을 위해 카메라와 마이크 접근 권한이 필요합니다.</p>

              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <p className="text-green-800 dark:text-green-200 text-xs font-medium">
                  💡 대안: 장치가 없어도 상담 가능
                </p>
                <ul className="text-green-700 dark:text-green-300 text-xs mt-1 space-y-1">
                  <li>• 텍스트 채팅으로 상담 진행 가능</li>
                  <li>• 음성만으로도 상담 가능 (마이크만 있는 경우)</li>
                  <li>• 화면 공유 기능 활용 가능</li>
                </ul>
              </div>

              {error?.includes("찾을 수 없습니다") && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-xs font-medium">
                    ⚠️ 장치 연결 문제 감지
                  </p>
                  <ul className="text-red-700 dark:text-red-300 text-xs mt-1 space-y-1">
                    <li>• 카메라/마이크가 올바르게 연결되어 있는지 확인</li>
                    <li>• 장치 드라이버가 최신인지 확인</li>
                    <li>• 다른 애플리케이션에서 사용 중인지 확인</li>
                    <li>• USB 장치라면 다른 포트로 연결 시도</li>
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <p className="font-medium">권한 허용 방법:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>브라우저 주소창 왼쪽의 자물쇠 아이콘 클릭</li>
                  <li>"카메라"와 "마이크" 권한을 "허용"으로 변경</li>
                  <li>페이지를 새로고침하거나 다시 시도</li>
                </ol>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200 text-xs font-medium">
                  🔧 장치 문제 해결 방법:
                </p>
                <ul className="text-blue-700 dark:text-blue-300 text-xs mt-1 space-y-1">
                  <li>• Windows: 설정 → 개인정보 → 카메라/마이크</li>
                  <li>• 장치 관리자에서 카메라/마이크 상태 확인</li>
                  <li>• 브라우저를 완전히 종료 후 재시작</li>
                </ul>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200 text-xs">
                  💡 팁: 다른 애플리케이션에서 카메라/마이크를 사용 중이라면
                  종료 후 다시 시도해주세요.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={async () => {
                  const success = await requestPermissions();
                  if (success) {
                    setShowPermissionGuide(false);
                    await startConnection();
                  }
                }}
                className="flex-1"
              >
                권한 재요청
              </Button>
              <Button
                onClick={() => {
                  setShowPermissionGuide(false);

                  setMediaMode("text");
                  startConnection();
                }}
                variant="outline"
                className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                텍스트로 진행
              </Button>
              <Button
                onClick={async () => {
                  const status = await checkDeviceStatus();
                  alert(
                    `장치 상태:\n비디오: ${status.videoCount}개\n오디오: ${
                      status.audioCount
                    }개\n\n비디오 사용 가능: ${
                      status.hasVideo ? "예" : "아니오"
                    }\n오디오 사용 가능: ${status.hasAudio ? "예" : "아니오"}`
                  );
                }}
                variant="outline"
                className="flex-1"
              >
                장치 확인
              </Button>
              <Button
                onClick={() => {
                  setShowPermissionGuide(false);
                  window.location.reload();
                }}
                variant="outline"
                className="flex-1"
              >
                새로고침
              </Button>
              <Button
                onClick={() => setShowPermissionGuide(false)}
                variant="outline"
                className="flex-1"
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
