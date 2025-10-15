"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuthStore } from "@/app/utils/auth";

interface WebRTCConfig {
  consultationId: string;
  clientId?: string; 
  onConnectionStateChange?: (state: string) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
}

interface Participant {
  userId: string;
  role: string;
  sessionId: string;
}

export function useWebRTC({
  consultationId,
  clientId = "default",
  onConnectionStateChange,
  onRemoteStream,
  onError,
}: WebRTCConfig) {
  const { accessToken } = useAuthStore();


  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const stompClientRef = useRef<Client | null>(null);


  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connectionState, setConnectionState] =
    useState<string>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [mediaMode, setMediaMode] = useState<"video" | "audio" | "text">(
    "video"
  );


  console.log("🔍 useWebRTC 초기화:", {
    consultationId,
    clientId,
    hasAccessToken: !!accessToken,
    accessTokenPreview: accessToken
      ? accessToken.substring(0, 20) + "..."
      : "null",
    authStoreState: useAuthStore.getState(),
  });


  const rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };


  const startLocalStream = useCallback(async () => {
    try {

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      const audioDevices = devices.filter(
        (device) => device.kind === "audioinput"
      );

      console.log("사용 가능한 비디오 장치:", videoDevices.length);
      console.log("사용 가능한 오디오 장치:", audioDevices.length);


      if (videoDevices.length === 0 && audioDevices.length === 0) {
        console.warn("⚠️ 미디어 장치를 찾을 수 없습니다. 텍스트 채팅 모드로 진행합니다.");
        console.warn("다음 사항을 확인해주세요:");
        console.warn("1. 카메라/마이크가 연결되어 있는지 확인");
        console.warn("2. 브라우저에서 미디어 장치 접근 권한이 허용되어 있는지 확인");
        console.warn("3. 다른 애플리케이션에서 카메라/마이크를 사용 중인지 확인");
        console.warn("4. Windows 설정에서 앱이 카메라/마이크에 액세스하도록 허용되어 있는지 확인");
        

        setMediaMode("text");
        return null;
      }


      let stream: MediaStream | null = null;


      try {
        console.log("🎥 카메라/마이크 권한 요청 중... (고품질)");
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        console.log("✅ 비디오 + 오디오 스트림 성공 (고품질)");
      } catch (err) {
        console.log("고품질 스트림 실패, 기본 설정으로 시도...");


        try {
          console.log("🎥 카메라/마이크 권한 요청 중... (기본 설정)");
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          console.log("✅ 비디오 + 오디오 스트림 성공 (기본)");
        } catch (err2) {
          console.log("비디오 + 오디오 실패, 오디오만 시도...");


          try {
            console.log("🎤 마이크 권한 요청 중... (오디오만)");
            stream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true,
            });
            console.log("✅ 오디오만 스트림 성공");
          } catch (audioErr) {
            console.log("❌ 오디오도 실패, 비디오만 시도...");


            try {
              console.log("📹 카메라 권한 요청 중... (비디오만)");
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
              console.log("✅ 비디오만 스트림 성공");
            } catch (videoErr) {
              console.log("❌ 모든 미디어 스트림 실패 - 텍스트 채팅 모드로 진행");
              console.log("장치가 없거나 권한이 거부되었습니다. 텍스트 채팅으로 상담을 진행할 수 있습니다.");

              setMediaMode("text");
              return null;
            }
          }
        }
      }

      if (stream) {
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }


        const hasVideo = stream.getVideoTracks().length > 0;
        const hasAudio = stream.getAudioTracks().length > 0;

        if (hasVideo) {
          setMediaMode("video");
        } else if (hasAudio) {
          setMediaMode("audio");
        } else {
          setMediaMode("text");
        }

        return stream;
      } else {

        console.log("미디어 장치 없음 - 텍스트 채팅 모드로 진행");
        setMediaMode("text");
        return null;
      }
    } catch (err) {
      console.error("미디어 스트림 접근 오류:", err);

      let errorMsg = "카메라/마이크를 사용할 수 없습니다. 텍스트 채팅으로 진행합니다.";

      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMsg = "카메라/마이크 접근이 거부되었습니다. 텍스트 채팅으로 진행합니다.";
        } else if (err.name === "NotFoundError") {
          errorMsg = "카메라/마이크를 찾을 수 없습니다. 텍스트 채팅으로 진행합니다.";
        } else if (err.name === "NotReadableError") {
          errorMsg = "카메라/마이크가 다른 애플리케이션에서 사용 중입니다. 텍스트 채팅으로 진행합니다.";
        } else if (err.name === "OverconstrainedError") {
          errorMsg = "카메라/마이크 설정을 지원하지 않습니다. 텍스트 채팅으로 진행합니다.";
        } else {
          errorMsg = "미디어 장치를 사용할 수 없습니다. 텍스트 채팅으로 진행합니다.";
        }
      }


      console.warn("⚠️", errorMsg);
      setMediaMode("text");
      return null;
    }
  }, [onError]);


  const createPeerConnection = useCallback(() => {
    const peerConnection = new RTCPeerConnection(rtcConfiguration);


    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }


    peerConnection.ontrack = (event) => {
      console.log("원격 스트림 수신:", event);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        onRemoteStream?.(event.streams[0]);
      }
    };


    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("ICE candidate 생성:", event.candidate);

        if (stompClientRef.current?.connected) {
          sendIceCandidate(event.candidate);
        } else {
          console.log("WebSocket 미연결 - ICE candidate 전송 건너뜀");
        }
      }
    };


    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;
      setConnectionState(state);
      onConnectionStateChange?.(state);
      console.log("WebRTC 연결 상태:", state);
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, [onRemoteStream, onConnectionStateChange]);


  const connectWebSocket = useCallback(async () => {
    console.log("🔌 WebSocket 연결 시도:", {
      clientId,
      hasAccessToken: !!accessToken,
      accessTokenPreview: accessToken
        ? accessToken.substring(0, 20) + "..."
        : "null",
    });

    let currentToken = accessToken;


    if (!currentToken) {
      console.log("🔄 토큰이 없어서 새로 가져오기 시도...");
      try {

        const authState = useAuthStore.getState();
        currentToken = authState.accessToken;

        if (!currentToken) {
          console.log("❌ Zustand store에도 토큰이 없음");
          const errorMsg = "인증 토큰이 없습니다. 로그인이 필요합니다.";
          setError(errorMsg);
          onError?.(errorMsg);
          return;
        }
      } catch (error) {
        console.error("❌ 토큰 가져오기 실패:", error);
        const errorMsg = "인증 토큰을 가져올 수 없습니다.";
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }
    }


    console.log("🧪 백엔드 서버 연결 테스트 중...");
    try {
      const healthResponse = await fetch(`http:
        method: "GET",
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (healthResponse.ok) {
        console.log("✅ 백엔드 서버 연결 성공:", healthResponse.status);
      } else {
        console.warn("⚠️ 백엔드 서버 응답 이상:", healthResponse.status);
      }
    } catch (error) {
      console.error("❌ 백엔드 서버 연결 실패:", error);
      const errorMsg =
        "백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.";
      setError(errorMsg);
      onError?.(errorMsg);
      setIsConnecting(false);
      return;
    }


    const socketUrl = `http:
    console.log("🔗 WebSocket URL:", socketUrl);
    console.log("🔑 토큰 정보:", {
      hasToken: !!currentToken,
      tokenLength: currentToken?.length,
      tokenPreview: currentToken
        ? currentToken.substring(0, 50) + "..."
        : "null",
      clientId,
      clientIdLength: clientId?.length,
    });

    const socket = new SockJS(socketUrl);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
        token: currentToken, 
        CLIENT_ID: clientId, 
      },
      debug: (str) => {
        console.log("STOMP Debug:", str);
      },
      onConnect: (frame) => {
        console.log("✅ WebSocket 연결 성공:", frame);
        setIsConnected(true);
        setError(null);
        setConnectionState("connected");


        stompClient.publish({
          destination: `/app/consultation/${consultationId}/join`,
          body: JSON.stringify({
            consultationId,
            clientId,
            userId: "current-user", 
          }),
        });


        subscribeToEvents(stompClient);
      },
      onStompError: (frame) => {
        console.error("❌ STOMP 오류:", frame);
        console.error("STOMP 오류 상세:", {
          command: frame.command,
          headers: frame.headers,
          body: frame.body,
        });
        const errorMsg = `WebSocket 연결 오류: ${
          frame.headers.message || "STOMP 프로토콜 오류가 발생했습니다."
        }`;
        setError(errorMsg);
        onError?.(errorMsg);
        setIsConnecting(false);
      },
      onWebSocketError: (error) => {
        console.error("❌ WebSocket 오류:", error);
        console.error("WebSocket 오류 상세:", {
          type: error.type,
          target: error.target,
          currentTarget: error.currentTarget,
        });
        const errorMsg =
          "WebSocket 연결에 실패했습니다. 네트워크 연결을 확인해주세요.";
        setError(errorMsg);
        onError?.(errorMsg);
        setIsConnecting(false);
      },
    });

    stompClientRef.current = stompClient;
    stompClient.activate();
  }, [accessToken, consultationId, clientId, onError]);


  const subscribeToEvents = useCallback(
    (client: Client) => {

      client.subscribe(
        `/user/consultation/queue/consultation/joined`,
        (message) => {
          const response = JSON.parse(message.body);
          console.log("상담 참여 응답:", response);

          if (response.success) {
            setParticipants(Object.values(response.participants || {}));
          } else {
            const errorMsg = response.error || "상담 참여에 실패했습니다.";
            setError(errorMsg);
            onError?.(errorMsg);
          }
        }
      );


      client.subscribe(
        `/topic/consultation/${consultationId}/participant-joined`,
        (message) => {
          const event = JSON.parse(message.body);
          console.log("새 참여자:", event);

        }
      );


      client.subscribe(
        `/topic/consultation/${consultationId}/participant-left`,
        (message) => {
          const event = JSON.parse(message.body);
          console.log("참여자 나감:", event);
        }
      );


      client.subscribe(
        `/topic/consultation/${consultationId}/offer`,
        (message) => {
          const event = JSON.parse(message.body);
          console.log("Offer 수신:", event);
          handleOffer(event.offer);
        }
      );


      client.subscribe(
        `/topic/consultation/${consultationId}/answer`,
        (message) => {
          const event = JSON.parse(message.body);
          console.log("Answer 수신:", event);
          handleAnswer(event.answer);
        }
      );


      client.subscribe(
        `/topic/consultation/${consultationId}/ice-candidate`,
        (message) => {
          const event = JSON.parse(message.body);
          console.log("ICE Candidate 수신:", event);
          handleIceCandidate(event.candidate);
        }
      );
    },
    [consultationId, onError]
  );


  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) {
        createPeerConnection();
      }

      try {
        await peerConnectionRef.current!.setRemoteDescription(
          new RTCSessionDescription(offer)
        );
        const answer = await peerConnectionRef.current!.createAnswer();
        await peerConnectionRef.current!.setLocalDescription(answer);

        sendAnswer(answer);
      } catch (err) {
        console.error("Offer 처리 실패:", err);
        const errorMsg = "연결 설정에 실패했습니다.";
        setError(errorMsg);
        onError?.(errorMsg);
      }
    },
    [createPeerConnection, onError]
  );


  const handleAnswer = useCallback(
    async (answer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) {
        console.error("PeerConnection이 없습니다.");
        return;
      }

      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      } catch (err) {
        console.error("Answer 처리 실패:", err);
        const errorMsg = "연결 설정에 실패했습니다.";
        setError(errorMsg);
        onError?.(errorMsg);
      }
    },
    [onError]
  );


  const handleIceCandidate = useCallback(
    async (candidate: RTCIceCandidateInit) => {
      if (!peerConnectionRef.current) {
        console.error("PeerConnection이 없습니다.");
        return;
      }

      try {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (err) {
        console.error("ICE Candidate 처리 실패:", err);
      }
    },
    []
  );


  const sendOffer = useCallback(
    (offer: RTCSessionDescriptionInit) => {
      if (!stompClientRef.current?.connected) {
        console.log("WebSocket 미연결 - Offer 전송 건너뜀");
        return;
      }

      stompClientRef.current.publish({
        destination: `/app/consultation/${consultationId}/offer`,
        body: JSON.stringify({
          toUserId: "all", 
          offer,
        }),
      });
    },
    [consultationId]
  );


  const sendAnswer = useCallback(
    (answer: RTCSessionDescriptionInit) => {
      if (!stompClientRef.current?.connected) {
        console.log("WebSocket 미연결 - Answer 전송 건너뜀");
        return;
      }

      stompClientRef.current.publish({
        destination: `/app/consultation/${consultationId}/answer`,
        body: JSON.stringify({
          toUserId: "all",
          answer,
        }),
      });
    },
    [consultationId]
  );


  const sendIceCandidate = useCallback(
    (candidate: RTCIceCandidate) => {
      if (!stompClientRef.current?.connected) {
        console.log("WebSocket 미연결 - ICE Candidate 전송 건너뜀");
        return;
      }

      stompClientRef.current.publish({
        destination: `/app/consultation/${consultationId}/ice-candidate`,
        body: JSON.stringify({
          toUserId: "all",
          candidate,
        }),
      });
    },
    [consultationId]
  );


  const checkDeviceStatus = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      const audioDevices = devices.filter(
        (device) => device.kind === "audioinput"
      );

      console.log("=== 장치 상태 확인 ===");
      console.log(
        "비디오 장치:",
        videoDevices.map((d) => ({ id: d.deviceId, label: d.label }))
      );
      console.log(
        "오디오 장치:",
        audioDevices.map((d) => ({ id: d.deviceId, label: d.label }))
      );

      return {
        videoCount: videoDevices.length,
        audioCount: audioDevices.length,
        hasVideo: videoDevices.length > 0,
        hasAudio: audioDevices.length > 0,
      };
    } catch (err) {
      console.error("장치 상태 확인 실패:", err);
      return {
        videoCount: 0,
        audioCount: 0,
        hasVideo: false,
        hasAudio: false,
      };
    }
  }, []);


  const requestPermissions = useCallback(async () => {
    try {
      setError(null);
      console.log("미디어 장치 권한 재요청...");


      const deviceStatus = await checkDeviceStatus();
      console.log("장치 상태:", deviceStatus);

      if (!deviceStatus.hasVideo && !deviceStatus.hasAudio) {
        throw new Error(
          "카메라와 마이크가 모두 연결되지 않았습니다. 장치를 확인해주세요."
        );
      }


      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }


      await startLocalStream();
      return true;
    } catch (err) {
      console.error("권한 재요청 실패:", err);
      setError(err instanceof Error ? err.message : "권한 요청에 실패했습니다");
      return false;
    }
  }, [startLocalStream, checkDeviceStatus]);


  const startConnection = useCallback(async () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      console.log("🔄 연결 시작 중...");


      console.log("📹 미디어 스트림 요청 중...");
      const stream = await startLocalStream();

      if (stream) {
        console.log("✅ 미디어 스트림 성공:", {
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length,
        });
      } else {
        console.log("📝 텍스트 채팅 모드로 진행");
      }


      console.log("🔌 WebSocket 연결 중...");
      try {
        await connectWebSocket();


        setTimeout(() => {
          if (stompClientRef.current?.connected) {
            setIsConnected(true);
            setConnectionState("connected");
            console.log("✅ WebSocket 연결 성공 - 온라인 모드");
          } else {

            console.log("⚠️ WebSocket 연결 실패 - 오프라인 모드로 진행");
            console.log("🔍 연결 상태 확인:", {
              stompClient: !!stompClientRef.current,
              connected: stompClientRef.current?.connected,
              clientId,
            });
            setIsConnected(true);
            setConnectionState("offline");
            setError("오프라인 모드: 백엔드 서버 연결 없이 테스트 중입니다.");
          }
          setIsConnecting(false);
        }, 3000); 
      } catch (wsError) {
        console.log("⚠️ WebSocket 연결 실패 - 오프라인 모드로 진행");
        console.error("WebSocket 연결 오류 상세:", wsError);
        setIsConnected(true);
        setConnectionState("offline");
        setError("오프라인 모드: 백엔드 서버 연결 없이 테스트 중입니다.");
        setIsConnecting(false);
      }
    } catch (err) {
      console.error("❌ 연결 시작 실패:", err);
      setError(err instanceof Error ? err.message : "연결 시작에 실패했습니다");
      setIsConnecting(false);
    }
  }, [
    isConnecting,
    isConnected,
    startLocalStream,
    connectWebSocket,
    mediaMode,
  ]);


  const endConnection = useCallback(() => {

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }


    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }


    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: `/app/consultation/${consultationId}/leave`,
        body: JSON.stringify({}),
      });
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setConnectionState("disconnected");
    setParticipants([]);
    setError(null);
  }, [consultationId]);


  const initiateCall = useCallback(async () => {
    if (!peerConnectionRef.current) {
      createPeerConnection();
    }

    try {
      const offer = await peerConnectionRef.current!.createOffer();
      await peerConnectionRef.current!.setLocalDescription(offer);


      if (stompClientRef.current?.connected) {
        sendOffer(offer);
      } else {
        console.log("WebSocket 미연결 - Offer 전송 건너뜀 (오프라인 모드)");
      }
    } catch (err) {
      console.error("통화 시작 실패:", err);
      const errorMsg = "통화 시작에 실패했습니다.";
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [createPeerConnection, sendOffer, onError]);


  useEffect(() => {
    if (consultationId) {
      console.log("🔄 consultationId 변경됨:", consultationId);
      setConnectionState("disconnected");
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, [consultationId]);


  useEffect(() => {
    return () => {
      endConnection();
    };
  }, [endConnection]);


  if (!consultationId) {
    return {
      localVideoRef,
      remoteVideoRef,
      isConnected: false,
      isAudioEnabled: false,
      isVideoEnabled: false,
      toggleAudio: () => {},
      toggleVideo: () => {},
      startCall: () => {},
      endCall: () => {},
      connectionStatus: "disconnected",
      setConnectionState: () => {},
    };
  }

  return {

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
    setConnectionState,
  };
}
