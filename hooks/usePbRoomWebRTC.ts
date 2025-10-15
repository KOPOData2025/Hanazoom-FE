import { useState, useRef, useCallback, useEffect } from "react";
import { Client } from "@stomp/stompjs";
import { useAuthStore } from "@/app/utils/auth";


interface ExtendedRTCPeerConnection extends RTCPeerConnection {
  pendingIceCandidates?: RTCIceCandidateInit[];
}

interface UsePbRoomWebRTCProps {
  roomId: string;
  accessToken: string | null;
  userType?: string; 
  onError?: (error: Error) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onParticipantJoined?: (participant: {
    id: string;
    name: string;
    role: string;
    joinedAt: string;
  }) => void;
  onParticipantLeft?: (participantId: string) => void;
}

export const usePbRoomWebRTC = ({
  roomId,
  accessToken,
  userType = "pb", 
  onError,
  onRemoteStream,
  onParticipantJoined,
  onParticipantLeft,
}: UsePbRoomWebRTCProps) => {
  const { getCurrentUserId } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<
    RTCPeerConnectionState | "offline"
  >("disconnected");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [mediaMode, setMediaMode] = useState<"video" | "audio" | "text">("video");

  const peerConnectionRef = useRef<ExtendedRTCPeerConnection | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);


  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };


  const connectWebSocket = useCallback(async () => {

    if (stompClientRef.current?.connected) {
      console.log("⚠️ 이미 WebSocket에 연결되어 있습니다.");
      return;
    }


    if (connectionState === "connecting") {
      console.log("⚠️ 이미 WebSocket 연결 중입니다.");
      return;
    }


    if (!accessToken) {
      console.warn("⚠️ 토큰이 없어서 WebSocket 연결을 건너뜁니다.");
      setConnectionState("offline");
      return;
    }

    console.log(
      "🔑 usePbRoomWebRTC accessToken:",
      accessToken ? "있음" : "없음"
    );

    setConnectionState("connecting");

    try {
      console.log("🔌 WebSocket 연결 시도...");


      try {
        const healthCheck = await fetch("http:
        if (healthCheck.ok) {
          console.log("✅ 백엔드 서버 연결 성공:", healthCheck.status);
        } else {
          console.warn("⚠️ 백엔드 서버 연결 실패:", healthCheck.status);
          setConnectionState("offline");
          return;
        }
      } catch (healthError) {
        console.warn("⚠️ 백엔드 서버 연결 실패:", healthError);
        setConnectionState("offline");
        return;
      }

      console.log("🔗 WebSocket URL:", "ws:
      console.log("🔑 토큰 상태:", accessToken ? "있음" : "없음");
      console.log("🔍 토큰 값:", accessToken);
      console.log("🔍 토큰 타입:", typeof accessToken);

      const client = new Client({
        brokerURL: "ws:
        connectHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
        debug: (str) => {
          console.log("STOMP Debug:", str);
        },
        reconnectDelay: 0, 
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log("✅ WebSocket 연결 성공");
          setIsConnected(true);
          setConnectionState("connected");


          client.subscribe(`/topic/pb-room/${roomId}/webrtc`, (message) => {
            const data = JSON.parse(message.body);
            console.log("📥 WebRTC 메시지 수신:", data);

            switch (data.type) {
              case "offer":
                handleOffer(data.offer);
                break;
              case "answer":
                handleAnswer(data.answer);
                break;
              case "ice-candidate":
                handleIceCandidate(data.candidate);
                break;
              case "user-joined":
                handleUserJoined(data);
                break;
              case "user-kicked":
                handleUserKicked(data);
                break;
            }
          });


          if (!peerConnectionRef.current) {
            setTimeout(() => {
              console.log("🔄 WebRTC 연결 자동 시작...");
              initiateCall();
            }, 1000);
          }
        },
        onStompError: (frame) => {
          console.error("❌ STOMP 오류:", frame);
          console.warn("⚠️ STOMP 연결 실패, 오프라인 모드로 전환");
          setConnectionState("offline");
          setIsConnected(false);

          initiateCall();
        },
        onWebSocketError: (error) => {
          console.error("❌ WebSocket 오류:", error);
          console.warn("⚠️ WebSocket 연결 실패, 오프라인 모드로 전환");
          setConnectionState("offline");
          setIsConnected(false);

          initiateCall();
        },
        onDisconnect: () => {
          console.warn("⚠️ WebSocket 연결 끊김, 오프라인 모드로 전환");
          setConnectionState("offline");
          setIsConnected(false);

          setTimeout(() => {
            initiateCall();
          }, 1000);
        },
      });






      if (stompClientRef.current?.connected) {
        stompClientRef.current.deactivate();
      }

      stompClientRef.current = client;
      client.activate();
    } catch (error) {
      console.warn("⚠️ WebSocket 연결 실패, 오프라인 모드로 전환");
      setConnectionState("offline");
      setIsConnected(false);

      setTimeout(() => {
        initiateCall();
      }, 1000);
    }
  }, [roomId, onError]); 


  const initiateCall = useCallback(async () => {

    if (peerConnectionRef.current) {
      console.log("⚠️ 이미 WebRTC 연결이 있습니다.");
      return;
    }

    try {
      console.log("🔄 WebRTC 연결 시작...");


      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      const audioDevices = devices.filter((device) => device.kind === "audioinput");

      console.log("사용 가능한 비디오 장치:", videoDevices.length);
      console.log("사용 가능한 오디오 장치:", audioDevices.length);


      if (videoDevices.length === 0 && audioDevices.length === 0) {
        console.warn("⚠️ 미디어 장치를 찾을 수 없습니다. 텍스트 채팅 모드로 진행합니다.");
        setMediaMode("text");
        return;
      }


      let stream: MediaStream | null = null;

      try {

        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: true,
        });
        console.log("✅ 비디오 + 오디오 스트림 성공");
        setMediaMode("video");
      } catch (err) {
        console.log("비디오 + 오디오 실패, 오디오만 시도...");
        try {

          stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          console.log("✅ 오디오만 스트림 성공");
          setMediaMode("audio");
        } catch (audioErr) {
          console.log("오디오도 실패, 비디오만 시도...");
          try {

            stream = await navigator.mediaDevices.getUserMedia({
              video: { width: 1280, height: 720 },
              audio: false,
            });
            console.log("✅ 비디오만 스트림 성공");
            setMediaMode("video");
          } catch (videoErr) {
            console.log("❌ 모든 미디어 스트림 실패 - 텍스트 채팅 모드로 진행");
            setMediaMode("text");
            return;
          }
        }
      }

      if (stream) {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } else {
        console.log("미디어 장치 없음 - 텍스트 채팅 모드로 진행");
        setMediaMode("text");
        return;
      }


      if (connectionState === "offline") {
        console.log("📹 오프라인 모드 - 로컬 비디오만 표시");
        return;
      }


      peerConnectionRef.current = new RTCPeerConnection(
        rtcConfig
      ) as ExtendedRTCPeerConnection;


      stream.getTracks().forEach((track) => {
        peerConnectionRef.current?.addTrack(track, stream);
      });


      peerConnectionRef.current.ontrack = (event) => {
        console.log("📹 원격 스트림 수신:", event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          onRemoteStream?.(event.streams[0]);
        }
      };


      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && stompClientRef.current?.connected) {
          sendIceCandidate(event.candidate);
        }
      };


      peerConnectionRef.current.onconnectionstatechange = () => {
        const state =
          peerConnectionRef.current?.connectionState || "disconnected";
        setConnectionState(state);
        console.log("🔗 WebRTC 연결 상태:", state);

        if (state === "connected") {
          console.log("✅ WebRTC 연결 성공! 비디오 스트림이 활성화되었습니다.");
        }
      };


      if (userType === "pb") {
        console.log("🎯 PB 역할 - Offer 생성 및 전송");
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);

        console.log("📤 Offer 전송:", offer);
        sendOffer(offer);
      } else {
        console.log("🎯 고객 역할 - Answer 대기 중");


        if (stompClientRef.current?.connected) {
          const currentUserId = getCurrentUserId?.();
          console.log("📤 고객 입장 알림 전송:", {
            userType: "guest",
            userId: currentUserId || "unknown-guest"
          });
          stompClientRef.current.publish({
            destination: `/app/webrtc/webrtc/${roomId}/user-joined`,
            body: JSON.stringify({
              userType: "guest",
              userId: currentUserId || "unknown-guest",
            }),
          });
        }
      }
    } catch (error) {
      console.error("❌ WebRTC 연결 실패:", error);
      console.log("장치가 없거나 권한이 거부되었습니다. 텍스트 채팅으로 상담을 진행할 수 있습니다.");
      setMediaMode("text");

    }
  }, [onError, userType]); 


  const sendOffer = useCallback(
    (offer: RTCSessionDescriptionInit) => {
      if (!stompClientRef.current?.connected) return;

      stompClientRef.current.publish({
        destination: `/app/webrtc/webrtc/${roomId}/offer`,
        body: JSON.stringify({ offer }),
      });
    },
    [roomId]
  );




  const sendIceCandidate = useCallback(
    (candidate: RTCIceCandidate) => {
      if (!stompClientRef.current?.connected) return;

      stompClientRef.current.publish({
        destination: `/app/webrtc/webrtc/${roomId}/ice-candidate`,
        body: JSON.stringify({ candidate }),
      });
    },
    [roomId]
  );


  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) return;

      try {
        console.log("📥 Offer 수신:", offer);


        if (userType === "guest") {
          console.log("🎯 고객 역할 - Answer 생성 및 전송");
          await peerConnectionRef.current.setRemoteDescription(offer);


          if (peerConnectionRef.current.pendingIceCandidates) {
            console.log("📥 큐에 저장된 ICE Candidate들 처리 중...");
            for (const candidate of peerConnectionRef.current
              .pendingIceCandidates) {
              try {
                await peerConnectionRef.current.addIceCandidate(candidate);
                console.log("✅ 큐의 ICE Candidate 추가 완료");
              } catch (error) {
                console.error("❌ 큐의 ICE Candidate 추가 실패:", error);
              }
            }
            peerConnectionRef.current.pendingIceCandidates = [];
          }

          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);

          console.log("📤 Answer 전송:", answer);

          if (stompClientRef.current?.connected) {
            stompClientRef.current.publish({
              destination: `/app/webrtc/webrtc/${roomId}/answer`,
              body: JSON.stringify({ answer }),
            });
          }
        } else {
          console.log(
            "🎯 PB 역할 - Offer 수신 무시 (PB는 Offer를 보내는 역할)"
          );
        }
      } catch (error) {
        console.error("❌ Offer 처리 실패:", error);
        onError?.(error as Error);
      }
    },
    [onError, roomId, userType] 
  );


  const handleAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) return;

      try {
        console.log("📥 Answer 수신:", answer);


        if (userType === "pb") {
          console.log("🎯 PB 역할 - Answer 처리");
          await peerConnectionRef.current.setRemoteDescription(answer);


          if (peerConnectionRef.current.pendingIceCandidates) {
            console.log("📥 큐에 저장된 ICE Candidate들 처리 중...");
            for (const candidate of peerConnectionRef.current
              .pendingIceCandidates) {
              try {
                await peerConnectionRef.current.addIceCandidate(candidate);
                console.log("✅ 큐의 ICE Candidate 추가 완료");
              } catch (error) {
                console.error("❌ 큐의 ICE Candidate 추가 실패:", error);
              }
            }
            peerConnectionRef.current.pendingIceCandidates = [];
          }
        } else {
          console.log(
            "🎯 고객 역할 - Answer 수신 무시 (고객은 Answer를 보내는 역할)"
          );
        }
      } catch (error) {
        console.error("❌ Answer 처리 실패:", error);
        onError?.(error as Error);
      }
    },
    [onError, userType] 
  );


  const handleIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      if (!peerConnectionRef.current) return;

      try {
        console.log("📥 ICE Candidate 수신:", candidate);


        if (!peerConnectionRef.current.remoteDescription) {
          console.log(
            "⚠️ remoteDescription이 없어서 ICE Candidate를 큐에 저장"
          );

          if (!peerConnectionRef.current.pendingIceCandidates) {
            peerConnectionRef.current.pendingIceCandidates = [];
          }
          peerConnectionRef.current.pendingIceCandidates.push(candidate);
          return;
        }

        await peerConnectionRef.current.addIceCandidate(candidate);
        console.log("✅ ICE Candidate 추가 완료");
      } catch (error) {
        console.error("❌ ICE Candidate 처리 실패:", error);
        onError?.(error as Error);
      }
    },
    [onError]
  );


  const handleUserJoined = useCallback(
    (data: { userType: string; userId: string }) => {
      console.log("👤 사용자 입장:", data);


      onParticipantJoined?.({
        id: data.userId,
        name: data.userType === "guest" ? "고객" : "PB",
        role: data.userType === "guest" ? "GUEST" : "PB",
        joinedAt: new Date().toLocaleTimeString(),
      });


      if (userType === "pb" && data.userType === "guest") {
        console.log("🔄 고객 입장 감지 - WebRTC 재연결 시도");


        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }


        setTimeout(() => {
          initiateCall();
        }, 1000);
      }
    },
    [userType, initiateCall, onParticipantJoined]
  );


  const handleUserKicked = useCallback(
    (data: { participantId: string; kickedBy: string }) => {
      console.log("👤 사용자 강제 퇴장:", data);


      onParticipantLeft?.(data.participantId);


      if (data.participantId === getCurrentUserId?.()) {
        console.log("🚫 본인이 강제 퇴장되었습니다. 연결을 종료합니다.");


        if (stompClientRef.current?.connected) {
          stompClientRef.current.deactivate();
        }


        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }


        setIsConnected(false);
        setConnectionState("disconnected");
      }
    },
    [onParticipantLeft, getCurrentUserId]
  );


  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);


  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);


  const disconnect = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }

    setLocalStream((prevStream) => {
      if (prevStream) {
        prevStream.getTracks().forEach((track) => track.stop());
      }
      return null;
    });
    setIsConnected(false);
    setConnectionState("disconnected");
  }, []); 


  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []); 

  return {
    isConnected,
    connectionState,
    isVideoEnabled,
    isAudioEnabled,
    localStream,
    localVideoRef,
    remoteVideoRef,
    mediaMode,
    connectWebSocket,
    disconnect,
    toggleVideo,
    toggleAudio,
  };
};
