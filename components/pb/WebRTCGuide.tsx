"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Mic, 
  Phone, 
  MessageSquare,
  Users,
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

export default function WebRTCGuide() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
          🎥 WebRTC 화상 상담 가이드
        </h1>
        <p className="text-green-700 dark:text-green-300">
          실시간 화상 상담 기능 사용법을 안내합니다
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-lg text-green-900 dark:text-green-100 flex items-center gap-2">
              <Users className="w-5 h-5" />
              사용 방법
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge className="bg-blue-100 text-blue-800">1</Badge>
              <span className="text-sm">PB가 "화상상담시작" 버튼 클릭</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-blue-100 text-blue-800">2</Badge>
              <span className="text-sm">카메라/마이크 권한 허용</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-blue-100 text-blue-800">3</Badge>
              <span className="text-sm">고객이 상담 링크로 접속</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-blue-100 text-blue-800">4</Badge>
              <span className="text-sm">자동으로 WebRTC 연결 시작</span>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="bg-blue-100 text-blue-800">5</Badge>
              <span className="text-sm">화상 상담 진행</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              주의사항
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
              <span className="text-sm">HTTPS 환경에서만 작동합니다</span>
            </div>
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
              <span className="text-sm">카메라/마이크 권한이 필요합니다</span>
            </div>
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
              <span className="text-sm">방화벽 설정을 확인해주세요</span>
            </div>
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
              <span className="text-sm">최신 브라우저를 사용해주세요</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-lg text-green-900 dark:text-green-100">
            🧪 테스트 방법
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">1. 로컬 테스트</h4>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <code className="text-sm text-gray-800 dark:text-gray-200">
                # 백엔드 서버 실행 (IntelliJ)<br/>
                # 프론트엔드 서버 실행<br/>
                npm run dev
              </code>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">2. 두 개의 브라우저 탭 열기</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>첫 번째 탭: PB 관리자 페이지 (/pb-admin)</li>
              <li>두 번째 탭: 고객 상담 페이지 (같은 상담 ID로 접속)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">3. 화상 상담 테스트</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>PB가 "화상상담시작" 버튼 클릭</li>
              <li>카메라/마이크 권한 허용</li>
              <li>고객이 상담에 참여</li>
              <li>양쪽에서 서로의 화면과 음성이 보이는지 확인</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


