"use client";

import { useParams } from "next/navigation";
import { usePbRoomWebRTC } from "@/hooks/usePbRoomWebRTC";
import { useEffect, useRef } from "react";

export default function PbVideoConsultationRoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
    isConnected,
    connectionState,
    isVideoEnabled,
    isAudioEnabled,
    localStream,
    connectWebSocket,
    disconnect,
    toggleVideo,
    toggleAudio,
  } = usePbRoomWebRTC({
    roomId,
    onError: (error) => {
      console.error("WebRTC 오류:", error);
      alert("화상상담 연결에 문제가 발생했습니다.");
    },
    onRemoteStream: (stream) => {
      console.log("원격 스트림 수신:", stream);
    },
  });

  useEffect(() => {
    if (roomId) {
      connectWebSocket();
    }

    return () => {
      disconnect();
    };
  }, [roomId, connectWebSocket, disconnect]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-200px)]">
          <div className="bg-gray-800 rounded-lg overflow-hidden relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded">
              <span className="text-sm">나 (PB)</span>
            </div>
          </div>
        </div>
      </div>

