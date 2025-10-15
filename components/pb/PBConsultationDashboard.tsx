"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/app/utils/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConsultationCalendar from "./ConsultationCalendar";
import PbAvailabilityManager from "./PbAvailabilityManager";
import {
  Users,
  Calendar,
  MessageSquare,
  Video,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  TrendingUp,
  MapPin,
  BarChart3,
  Settings,
} from "lucide-react";

interface PBConsultationDashboardProps {
  pbId: string;
  onStartConsultation?: (consultation: any) => void;
}

interface Consultation {
  id: string;
  clientName: string;
  clientRegion: string;
  scheduledTime: string;
  status:
    | "pending"
    | "scheduled"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "rejected";
  type: "video" | "phone" | "chat";
  duration: number;
  rating?: number;
  notes?: string;
}

interface Client {
  id: string;
  name: string;
  region: string;
  totalAssets: number;
  riskLevel: string;
  lastConsultation: string;
  nextScheduled: string;
  portfolioScore: number;
}

interface RegionStats {
  regionName: string;
  clientCount: number;
  totalConsultations: number;
  completedConsultations: number;
  averageRating: number;
}

export default function PBConsultationDashboard({
  pbId,
  onStartConsultation,
}: PBConsultationDashboardProps) {
  const { accessToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [consultationFilter, setConsultationFilter] = useState<
    "all" | "pending" | "active"
  >("all");

  useEffect(() => {

    loadDashboardData();
  }, [pbId]);


  const handleConsultationApproval = async (
    consultationId: string,
    approved: boolean,
    pbMessage: string
  ) => {
    try {
      const response = await fetch(
        `/api/consultations/${consultationId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            approved,
            pbMessage,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(`상담이 ${approved ? "승인" : "거절"}되었습니다.`);

          await loadDashboardData();
        } else {
          console.error("상담 처리 실패:", data.message);
          alert("상담 처리에 실패했습니다: " + data.message);
        }
      } else {
        console.error("상담 처리 API 호출 실패:", response.status);
        try {
          const errorData = await response.json();
          console.error("에러 상세:", errorData);
          alert(
            "상담 처리에 실패했습니다: " +
              (errorData.message || "알 수 없는 오류")
          );
        } catch {
          alert("상담 처리에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("상담 처리 중 오류:", error);
      alert("상담 처리 중 오류가 발생했습니다.");
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {

      const response = await fetch("/api/consultations/pb-dashboard", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const dashboardData = data.data;


        const allConsultations = [
          ...dashboardData.todayConsultations.map((c: any) => ({
            id: c.id,
            clientName: c.clientName,
            clientRegion: c.clientName, 
            scheduledTime: c.scheduledAt,
            status: mapStatusToFrontend(c.status),
            type: mapTypeToFrontend(c.consultationType),
            duration: c.durationMinutes,
            rating: undefined,
            notes: c.clientMessage,
          })),
          ...dashboardData.pendingConsultations.map((c: any) => ({
            id: c.id,
            clientName: c.clientName,
            clientRegion: c.clientName,
            scheduledTime: c.scheduledAt,
            status: mapStatusToFrontend(c.status),
            type: mapTypeToFrontend(c.consultationType),
            duration: c.durationMinutes,
            rating: undefined,
            notes: c.clientMessage,
          })),
          ...dashboardData.recentConsultations.map((c: any) => ({
            id: c.id,
            clientName: c.clientName,
            clientRegion: c.clientName,
            scheduledTime: c.scheduledAt,
            status: mapStatusToFrontend(c.status),
            type: mapTypeToFrontend(c.consultationType),
            duration: c.durationMinutes,
            rating: undefined,
            notes: c.clientMessage,
          })),
        ];


        const consultationsData: Consultation[] = allConsultations.filter(
          (consultation, index, self) =>
            index === self.findIndex((c) => c.id === consultation.id)
        );


        const clientsResponse = await fetch("/api/consultations/pb-clients", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });

        let clientsData: Client[] = [];
        if (clientsResponse.ok) {
          const clientsResult = await clientsResponse.json();
          if (clientsResult.success) {
            clientsData = clientsResult.data.map((client: any) => ({
              id: client.id,
              name: client.name,
              region: client.region,
              totalAssets: client.totalAssets || 0,
              riskLevel: client.riskLevel || "보통",
              lastConsultation: client.lastConsultation
                ? new Date(client.lastConsultation).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
              nextScheduled: client.nextScheduled
                ? new Date(client.nextScheduled).toISOString().split("T")[0]
                : "",
              portfolioScore: client.portfolioScore || 75,
            }));
          }
        } else {
          console.error("고객 데이터 조회 실패:", clientsResponse.status);
        }

        setConsultations(consultationsData);
        setClients(clientsData);


        try {
          const regionStatsResponse = await fetch(
            "/api/consultations/pb-region-stats",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (regionStatsResponse.ok) {
            const regionStatsData = await regionStatsResponse.json();
            if (regionStatsData.success) {
              setRegionStats(regionStatsData.data);
            } else {
              console.error(
                "지역별 고객 현황 로드 실패:",
                regionStatsData.message
              );
              setRegionStats([]);
            }
          } else {
            console.error(
              "지역별 고객 현황 API 호출 실패:",
              regionStatsResponse.status
            );
            setRegionStats([]);
          }
        } catch (regionError) {
          console.error("지역별 고객 현황 로드 에러:", regionError);
          setRegionStats([]);
        }
      } else {
        console.error("대시보드 데이터 로드 실패:", data.message);

        setConsultations([]);
        setClients([]);
        setRegionStats([]);
      }
    } catch (error) {
      console.error("대시보드 데이터 로드 실패:", error);

      setConsultations([]);
      setClients([]);
      setRegionStats([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarConsultations = async (
    startDate?: string,
    endDate?: string
  ) => {
    try {
      let url = "/api/consultations/pb-calendar";
      const params = new URLSearchParams();

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {

        const calendarConsultations: Consultation[] = data.data
          .map((consultation: any) => ({
            id: consultation.id,
            clientName: consultation.clientName,
            clientRegion: consultation.clientRegion || "정보 없음",
            scheduledTime: consultation.scheduledAt,
            type: mapTypeToFrontend(consultation.consultationType),
            duration: consultation.durationMinutes,
            status: mapStatusToFrontend(consultation.status),
            rating: consultation.clientRating,
            notes: consultation.clientMessage,
          }))

          .filter(
            (consultation: Consultation) =>
              consultation.status !== "cancelled" &&
              consultation.status !== "rejected"
          );


        setConsultations(calendarConsultations);
      } else {
        console.error("캘린더 상담 데이터 로드 실패:", data.message);
      }
    } catch (error) {
      console.error("캘린더 상담 데이터 로드 실패:", error);
    }
  };


  const mapStatusToFrontend = (
    backendStatus: string
  ):
    | "pending"
    | "scheduled"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "rejected" => {
    switch (backendStatus) {
      case "PENDING":
        return "pending";
      case "APPROVED":
        return "scheduled";
      case "IN_PROGRESS":
        return "in-progress";
      case "COMPLETED":
        return "completed";
      case "CANCELLED":
        return "cancelled";
      case "REJECTED":
        return "rejected";
      default:
        return "pending";
    }
  };


  const mapTypeToFrontend = (
    backendType: string
  ): "video" | "phone" | "chat" => {
    switch (backendType) {
      case "PORTFOLIO_ANALYSIS":
      case "STOCK_CONSULTATION":
      case "PRODUCT_CONSULTATION":
        return "video";
      case "GENERAL_CONSULTATION":
        return "phone";
      case "INSURANCE_CONSULTATION":
      case "TAX_CONSULTATION":
        return "chat";
      default:
        return "video";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
      case "scheduled":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900/20";
      case "in-progress":
        return "text-green-600 bg-green-100 dark:bg-green-900/20";
      case "completed":
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
      case "cancelled":
        return "text-red-600 bg-red-100 dark:bg-red-900/20";
      case "rejected":
        return "text-red-600 bg-red-100 dark:bg-red-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "승인 대기";
      case "scheduled":
        return "예정";
      case "in-progress":
        return "진행중";
      case "completed":
        return "완료";
      case "cancelled":
        return "취소";
      case "rejected":
        return "거절됨";
      default:
        return "알 수 없음";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
      case "chat":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };


  const filteredConsultations = consultations.filter((consultation) => {
    switch (consultationFilter) {
      case "pending":
        return consultation.status === "pending";
      case "active":
        return ["scheduled", "in-progress"].includes(consultation.status);
      case "all":
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-green-700 dark:text-green-300 text-lg">
            PB 대시보드 로딩 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 space-y-4 relative z-10">
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-green-900 dark:text-green-100">
            PB 상담 대시보드
          </h1>
          <p className="text-green-700 dark:text-green-300 mt-2 text-lg">
            고객 상담 및 포트폴리오 관리
          </p>
        </div>
        <div className="flex gap-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-green-600 dark:text-green-400 text-sm font-medium uppercase tracking-wide">
                  오늘 예정 상담
                </p>
                <p className="text-4xl font-black text-green-900 dark:text-green-100 leading-none">
                  {consultations.filter((c) => c.status === "scheduled").length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">건</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
                <Calendar className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium uppercase tracking-wide">
                  총 고객 수
                </p>
                <p className="text-4xl font-black text-green-900 dark:text-green-100 leading-none">
                  {clients.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">명</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <Users className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium uppercase tracking-wide">
                  평균 만족도
                </p>
                <p className="text-4xl font-black text-green-900 dark:text-green-100 leading-none">
                  {consultations.filter((c) => c.rating).length > 0
                    ? (
                        consultations
                          .filter((c) => c.rating)
                          .reduce((sum, c) => sum + (c.rating || 0), 0) /
                        consultations.filter((c) => c.rating).length
                      ).toFixed(1)
                    : "0.0"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  / 5.0
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-full">
                <Star className="h-10 w-10 text-yellow-600 dark:text-yellow-400 fill-current" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium uppercase tracking-wide">
                  관리 자산 총액
                </p>
                <p className="text-4xl font-black text-green-900 dark:text-green-100 leading-none">
                  {(
                    clients.reduce(
                      (sum, client) => sum + client.totalAssets,
                      0
                    ) / 100000000
                  ).toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">억원</p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
                <TrendingUp className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-green-900 dark:text-green-100 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  오늘의 상담 일정
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {consultations.filter((c) => {

                    const today = new Date();
                    const consultationDate = new Date(c.scheduledTime);
                    return (
                      c.status === "scheduled" &&
                      consultationDate.toDateString() === today.toDateString()
                    );
                  }).length > 0 ? (
                    consultations
                      .filter((c) => {
                        const today = new Date();
                        const consultationDate = new Date(c.scheduledTime);
                        return (
                          c.status === "scheduled" &&
                          consultationDate.toDateString() ===
                            today.toDateString()
                        );
                      })
                      .map((consultation) => (
                        <div
                          key={consultation.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getTypeIcon(consultation.type)}
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {consultation.clientName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {consultation.clientRegion} •{" "}
                                {consultation.duration}분
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {consultation.scheduledTime
                                .split("T")[1]
                                ?.substring(0, 5) || "00:00"}
                            </div>
                            <Badge
                              className={getStatusColor(consultation.status)}
                            >
                              {getStatusText(consultation.status)}
                            </Badge>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">오늘 예정된 상담이 없습니다.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

                        {consultation.status === "pending" && (
                          <div className="flex gap-2 ml-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                              onClick={() => {
                                const pbMessage =
                                  prompt("승인 메시지를 입력하세요:");
                                if (pbMessage && pbMessage.trim()) {
                                  handleConsultationApproval(
                                    consultation.id,
                                    true,
                                    pbMessage.trim()
                                  );
                                }
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                              onClick={() => {
                                const pbMessage =
                                  prompt("거절 사유를 입력하세요:");
                                if (pbMessage && pbMessage.trim()) {
                                  handleConsultationApproval(
                                    consultation.id,
                                    false,
                                    pbMessage.trim()
                                  );
                                }
                              }}
                            >
                              <AlertCircle className="w-4 h-4 mr-1" />
                              거절
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg text-green-900 dark:text-green-100">
                고객 목록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      아직 상담 기록이 있는 고객이 없습니다.
                    </p>
                  </div>
                ) : (
                  clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400 font-semibold text-lg">
                            {client.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {client.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {client.region} • {client.riskLevel} 위험도
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            마지막 상담:{" "}
                            {new Date(
                              client.lastConsultation
                            ).toLocaleDateString("ko-KR")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {(client.totalAssets / 100000000).toFixed(1)}억원
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          포트폴리오 점수: {client.portfolioScore}점
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          다음 상담:{" "}
                          {client.nextScheduled
                            ? new Date(client.nextScheduled).toLocaleDateString(
                                "ko-KR"
                              )
                            : "예정 없음"}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-green-900 dark:text-green-100">
                  상담 통계
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      이번 달 상담 수
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {
                        consultations.filter((c) => c.status === "completed")
                          .length
                      }
                      건
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      평균 상담 시간
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {consultations.length > 0
                        ? (
                            consultations.reduce(
                              (sum, c) => sum + c.duration,
                              0
                            ) / consultations.length
                          ).toFixed(0)
                        : 0}
                      분
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      고객 만족도
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {consultations.filter((c) => c.rating).length > 0
                        ? (
                            consultations
                              .filter((c) => c.rating)
                              .reduce((sum, c) => sum + (c.rating || 0), 0) /
                            consultations.filter((c) => c.rating).length
                          ).toFixed(1)
                        : "0.0"}
                      /5.0
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-green-900 dark:text-green-100">
                  고객 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      총 관리 자산
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {(
                        clients.reduce(
                          (sum, client) => sum + client.totalAssets,
                          0
                        ) / 100000000
                      ).toFixed(1)}
                      억원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      평균 포트폴리오 점수
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {clients.length > 0
                        ? (
                            clients.reduce(
                              (sum, client) => sum + client.portfolioScore,
                              0
                            ) / clients.length
                          ).toFixed(0)
                        : 0}
                      점
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      고위험 고객
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {clients.filter((c) => c.riskLevel === "높음").length}명
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
