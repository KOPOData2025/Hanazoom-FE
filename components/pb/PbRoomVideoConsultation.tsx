"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, VideoOff, Mic, MicOff, Phone, Monitor } from "lucide-react";
import { usePbRoomWebRTC } from "@/hooks/usePbRoomWebRTC";
import { useAuthStore } from "@/app/utils/auth";

interface PbRoomVideoConsultationProps {
  roomId: string;
  pbName: string;
  clientId?: string;
  userType?: string;
  isPb?: boolean;
  isGuest?: boolean;
  onEndConsultation: () => void;
  onParticipantJoined?: (participant: {
    id: string;
    name: string;
    role: string;
    joinedAt: string;
  }) => void;
  onParticipantLeft?: (participantId: string) => void;
}

export default function PbRoomVideoConsultation({
  roomId,
  pbName,
  clientId,
  userType = "pb",
  isPb = true,
  isGuest = false,
  onEndConsultation,
  onParticipantJoined,
  onParticipantLeft,
}: PbRoomVideoConsultationProps) {

  const { accessToken } = useAuthStore();


  const currentToken = useAuthStore.getState().accessToken;
  console.log(
    "🔑 PbRoomVideoConsultation accessToken:",
    currentToken ? "있음" : "없음"
  );


  const {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    connectionState,
    isVideoEnabled,
    isAudioEnabled,
    localStream,
    mediaMode,
    connectWebSocket,
    disconnect,
    toggleVideo,
    toggleAudio,
  } = usePbRoomWebRTC({
    roomId: roomId,
    accessToken: currentToken,
    userType: userType, 
    onError: (error) => {
      console.error("WebRTC 에러:", error);
    },
    onRemoteStream: (stream) => {
      console.log("원격 스트림 수신:", stream);
    },
    onParticipantJoined: onParticipantJoined,
    onParticipantLeft: onParticipantLeft,
  });


  useEffect(() => {
    if (roomId && currentToken) {
      connectWebSocket();
    }
  }, [roomId, currentToken]); 


  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []); 

  return (
    <div className="h-full flex flex-col">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

              <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-black/50 text-white px-1 py-0.5 md:px-2 md:py-1 rounded text-xs">
                {isPb ? pbName : "나"}
              </div>
            </div>
          </>
        )}

      <div className="absolute bottom-2 md:bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-full p-2 md:p-4 shadow-xl border border-emerald-200/30 dark:border-emerald-700/30">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={toggleAudio}
              className={`rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center transition-all duration-200 ${
                isAudioEnabled
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                  : "bg-red-500 hover:bg-red-600 text-white shadow-lg"
              }`}
            >
              {isAudioEnabled ? (
                <Mic className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <MicOff className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>

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

            <button
              onClick={() => {
                if (typeof window === "undefined" || !document) return;
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                } else {
                  document.exitFullscreen();
                }
              }}
              className="rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white shadow-lg transition-all duration-200"
            >
              <Monitor className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            <button
              onClick={() => {
                disconnect();
                onEndConsultation();
              }}
              className="rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all duration-200"
            >
              <Phone className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
