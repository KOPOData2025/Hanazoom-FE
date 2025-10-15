"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CameraTestPage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);


  const getDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      setDevices(deviceList);
      console.log('사용 가능한 장치:', deviceList);
    } catch (err) {
      console.error('장치 목록 가져오기 실패:', err);
    }
  };


  const startCamera = async () => {
    try {
      setError(null);
      console.log('🎥 카메라 스트림 시작 중...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false 
      });
      
      console.log('✅ 카메라 스트림 성공:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
      
    } catch (err) {
      console.error('❌ 카메라 스트림 실패:', err);
      let errorMessage = '카메라 접근에 실패했습니다.';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = '카메라 접근이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = '카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = '카메라에 접근할 수 없습니다. 다른 애플리케이션에서 사용 중일 수 있습니다.';
        }
      }
      
      setError(errorMessage);
    }
  };


  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    console.log('🛑 카메라 스트림 중지');
  };


  useEffect(() => {
    getDevices();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-900">
              📹 카메라 테스트
            </CardTitle>
            <p className="text-gray-600">
              화상상담에서 사용할 카메라가 정상적으로 작동하는지 확인해보세요.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            
              <div className="absolute top-4 left-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isStreaming 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  {isStreaming ? '🟢 카메라 켜짐' : '🔴 카메라 꺼짐'}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-red-800">오류 발생</span>
                </div>
                <p className="text-red-700">{error}</p>
                <div className="mt-3 text-sm text-red-600">
                  <p className="font-medium">해결 방법:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>브라우저 주소창 왼쪽의 자물쇠 아이콘 클릭</li>
                    <li>"카메라" 권한을 "허용"으로 변경</li>
                    <li>페이지를 새로고침 후 다시 시도</li>
                    <li>다른 애플리케이션에서 카메라를 사용 중인지 확인</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-blue-900">사용법</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>"카메라 시작" 버튼을 클릭합니다</li>
                <li>브라우저에서 카메라 권한 요청이 나타나면 "허용"을 클릭합니다</li>
                <li>카메라 영상이 화면에 표시되면 정상 작동입니다</li>
                <li>권한이 거부되면 브라우저 설정에서 수동으로 허용해주세요</li>
              </ol>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}


