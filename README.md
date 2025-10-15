# HanaZoom Frontend

Next.js 15.2.4 기반으로 구축된 우리 동네 주식 맛집 지도 서비스 / WTS 플랫폼 / 디지털 PB 상담 서비스의 웹 클라이언트입니다.

## 🛠 기술 스택

- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Zustand 5.0.6
- **Charts**: Recharts 2.15.0, Lightweight Charts 5.0.8
- **Maps**: Kakao Maps SDK
- **Real-time**: WebSocket (STOMP)
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion 12.23.5
- **Icons**: Lucide React

## 📋 사전 요구사항

### 필수 소프트웨어
- **Node.js 18** 이상
- **npm** 또는 **pnpm** (권장)
- **백엔드 서버** (포트: 8080)

### 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수들을 설정하세요:

```bash
# 백엔드 API URL
NEXT_PUBLIC_API_URL=http://localhost:8080

# 카카오 지도 API 키 (필수)
NEXT_PUBLIC_KAKAO_MAP_KEY=your_kakao_map_api_key

# 개발 환경 설정
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
# FE 디렉토리로 이동
cd FE

# 의존성 설치 (npm 사용)
npm install

# 또는 pnpm 사용 (권장)
pnpm install
```

### 2. 개발 서버 실행

```bash
# 개발 서버 시작
npm run dev

# 또는 pnpm 사용
pnpm dev

# 클린 빌드 후 실행 (캐시 문제 시)
npm run dev:clean
```

### 3. 브라우저에서 확인

개발 서버가 정상적으로 시작되면 다음 URL에서 확인할 수 있습니다:

- **메인 페이지**: `http://localhost:3000`
- **지도 페이지**: `http://localhost:3000/map`
- **포트폴리오**: `http://localhost:3000/portfolio`
- **커뮤니티**: `http://localhost:3000/community`

## 🔧 개발 환경 설정

### IDE 설정 (VS Code 권장)

1. **필수 확장 프로그램 설치**:
   - TypeScript and JavaScript Language Features
   - Tailwind CSS IntelliSense
   - ES7+ React/Redux/React-Native snippets
   - Auto Rename Tag
   - Bracket Pair Colorizer

2. **VS Code 설정** (`.vscode/settings.json`):
   ```json
   {
     "typescript.preferences.importModuleSpecifier": "relative",
     "tailwindCSS.includeLanguages": {
       "typescript": "javascript",
       "typescriptreact": "javascript"
     },
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode"
   }
   ```

### 개발용 스크립트

```bash
# 개발 서버 시작
npm run dev

# 클린 빌드 후 개발 서버 시작
npm run dev:clean

# 개발 서버 재시작 (프로세스 종료 후)
npm run dev:restart

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm run start

# 린트 검사
npm run lint
```

## 📁 프로젝트 구조

```
FE/
├── app/                    # Next.js App Router 페이지
│   ├── components/        # 페이지별 컴포넌트
│   ├── api/              # API 라우트
│   ├── auth/             # 인증 관련 페이지
│   ├── community/        # 커뮤니티 페이지
│   ├── map/              # 지도 페이지
│   ├── portfolio/        # 포트폴리오 페이지
│   ├── stocks/           # 주식 상세 페이지
│   ├── pb/               # PB 상담 페이지
│   ├── mypage/           # 마이페이지
│   ├── globals.css       # 전역 스타일
│   ├── layout.tsx        # 루트 레이아웃
│   └── page.tsx          # 메인 페이지
├── components/           # 재사용 가능한 컴포넌트
│   ├── ui/              # shadcn/ui 컴포넌트
│   ├── charts/          # 차트 컴포넌트
│   ├── chat/            # 채팅 컴포넌트
│   ├── portfolio/       # 포트폴리오 컴포넌트
│   ├── pb/              # PB 관련 컴포넌트
│   └── wts/             # WTS 관련 컴포넌트
├── hooks/               # 커스텀 훅
├── lib/                 # 유틸리티 및 설정
│   ├── api/            # API 클라이언트
│   ├── stores/         # Zustand 스토어
│   └── utils.ts        # 유틸리티 함수
├── types/              # TypeScript 타입 정의
├── public/             # 정적 파일
└── styles/             # 스타일 파일
```

### 🔄 데이터 플로우

1. **사용자 인터랙션**
   - React 컴포넌트 → Zustand 스토어 → API 호출
   - 실시간 데이터: WebSocket → Zustand → UI 업데이트

2. **상태 관리**
   - **Zustand**: 전역 상태 관리 (사용자 정보, 설정)
   - **React State**: 컴포넌트별 로컬 상태
   - **React Query**: 서버 상태 캐싱 (설정된 경우)

3. **API 통신**
   - **Axios**: HTTP 클라이언트
   - **WebSocket**: 실시간 주식 데이터
   - **Next.js API Routes**: 백엔드 프록시

### 🎨 UI/UX 아키텍처

- **Design System**: shadcn/ui + Tailwind CSS
- **반응형 디자인**: Mobile-first 접근법
- **다크 모드**: next-themes 기반 테마 시스템
- **애니메이션**: Framer Motion + CSS Transitions
- **접근성**: Radix UI 기반 접근성 준수

### 📱 주요 기능 모듈

- **지도 서비스**: Kakao Maps SDK + 커스텀 마커
- **주식 차트**: Lightweight Charts + Recharts
- **실시간 데이터**: WebSocket + STOMP
- **채팅 시스템**: WebSocket 기반 실시간 채팅
- **포트폴리오**: 차트 기반 포트폴리오 관리
- **PB 상담**: WebRTC 기반 화상 상담

## 🔑 주요 페이지 및 기능

### 🏠 메인 페이지 (`/`)
- **랜딩 페이지**: 서비스 소개 및 주요 기능
- **주식 티커**: 실시간 주식 가격 스트리밍
- **애니메이션**: 로딩 애니메이션 및 스크롤 효과

### 🗺 지도 페이지 (`/map`)
- **인터랙티브 지도**: Kakao Maps 기반 지역별 주식 인기도
- **실시간 데이터**: WebSocket으로 주식 데이터 업데이트
- **마커 시스템**: 지역별 인기도에 따른 시각적 표현

### 📊 포트폴리오 (`/portfolio`)
- **포트폴리오 대시보드**: 보유 종목 및 수익률
- **차트 시각화**: Recharts 기반 수익률 차트
- **주문 관리**: 실시간 주문 내역 및 상태

### 💬 커뮤니티 (`/community`)
- **게시판**: 주식 관련 토론 및 정보 공유
- **실시간 채팅**: WebSocket 기반 실시간 대화
- **종목별 토론**: 특정 종목에 대한 집중 토론

### 📈 주식 상세 (`/stocks/[code]`)
- **실시간 차트**: Lightweight Charts 기반 캔들스틱 차트
- **호가창**: 실시간 매수/매도 호가 정보
- **주문 시스템**: WTS 기반 주식 주문

### 👨‍💼 PB 상담 (`/pb`)
- **상담사 목록**: PB 상담사 프로필 및 전문 분야
- **화상 상담**: WebRTC 기반 실시간 화상 통화
- **상담 예약**: 일정 관리 및 예약 시스템

## 📦 빌드 및 배포

### 개발 빌드

```bash
# 개발용 빌드
npm run build

# 빌드 결과 확인
npm run start
```

### 프로덕션 빌드

```bash
# 프로덕션 빌드
NODE_ENV=production npm run build

# 프로덕션 서버 시작
NODE_ENV=production npm run start
```

### Docker 배포

```bash
# Docker 이미지 빌드
docker build -t hanazoom-frontend .

# Docker 컨테이너 실행
docker run -p 3000:3000 hanazoom-frontend
```

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary**: Hana Blue (#1E3A8A)
- **Secondary**: Hana Light Blue (#3B82F6)
- **Accent**: Hana Gold (#F59E0B)
- **Success**: Green (#10B981)
- **Error**: Red (#EF4444)

### 컴포넌트 라이브러리
- **shadcn/ui**: 기본 UI 컴포넌트
- **Radix UI**: 접근성 기반 프리미티브
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크
