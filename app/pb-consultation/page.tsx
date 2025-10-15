"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  MapPin,
  Star,
  Users,
  Calendar as CalendarIcon,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { ko as koDayPicker } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Navbar from "@/app/components/Navbar";
import { MouseFollower } from "@/components/mouse-follower";
import { FloatingEmojiBackground } from "@/components/floating-emoji-background";
import { useAuthStore } from "@/app/utils/auth";

interface ConsultationType {
  type: string;
  displayName: string;
  defaultFee: number;
  defaultDurationMinutes: number;
  description: string;
}

interface PbInfo {
  id: string;
  name: string;
  region: string;
  rating: number;
  totalConsultations: number;
  specialties: string[];
  experience: number;
}

export default function PBConsultationPage() {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedPb, setSelectedPb] = useState<string>("");
  const [clientMessage, setClientMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const [consultationTypes, setConsultationTypes] = useState<
    ConsultationType[]
  >([]);
  const [pbList, setPbList] = useState<PbInfo[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingPbList, setIsLoadingPbList] = useState(false);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);


  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
  ];

  useEffect(() => {

    fetchConsultationTypes();

    fetchPbList();
  }, []);

  useEffect(() => {
    if (selectedDate && selectedPb && selectedType) {

      fetchAvailableTimes();
    }
  }, [selectedDate, selectedPb, selectedType]);

  const fetchConsultationTypes = async () => {
    try {
      const response = await fetch("/api/consultations/types", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) {
        setConsultationTypes(data.data);
      }
    } catch (error) {
      console.error("상담 유형 로드 실패:", error);
    }
  };

  const fetchPbList = async () => {
    setIsLoadingPbList(true);
    try {
      const response = await fetch("/api/pb/list", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) {

        const pbList: PbInfo[] = data.data.content.map((pb: any) => ({
          id: pb.id,
          name: pb.name,
          region: pb.region || pb.regionName,
          rating: pb.rating || 0,
          totalConsultations: pb.totalConsultations || 0,
          specialties: pb.specialties || [],
          experience: pb.experienceYears || 0,
        }));
        setPbList(pbList);
      } else {
        console.error("PB 목록 로드 실패:", data.message);
        setError("PB 목록을 불러오는데 실패했습니다.");
        setPbList([]);
      }
    } catch (error) {
      console.error("PB 목록 로드 실패:", error);
      setError("PB 목록을 불러오는데 실패했습니다.");
      setPbList([]);
    } finally {
      setIsLoadingPbList(false);
    }
  };

  const fetchAvailableTimes = async () => {
    if (!selectedDate || !selectedPb) {
      setAvailableTimes([]);
      return;
    }

    setIsLoadingTimes(true);
    try {

      const dateStr = selectedDate.toISOString().split("T")[0];
      const selectedTypeData = consultationTypes.find(
        (type) => type.type === selectedType
      );
      const durationMinutes = selectedTypeData?.defaultDurationMinutes || 60;

      const response = await fetch(
        `/api/consultations/time-slots?pbId=${selectedPb}&date=${dateStr}&durationMinutes=${durationMinutes}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();

      if (data.success) {

        const availableTimesList = Object.entries(data.data)
          .filter(([time, isAvailable]) => isAvailable === true)
          .map(([time, isAvailable]) => time)
          .filter((time) => timeSlots.includes(time)) 
          .sort();

        setAvailableTimes(availableTimesList);
      } else {
        console.error("가능한 시간 조회 실패:", data.message);
        setAvailableTimes([]); 
      }
    } catch (error) {
      console.error("가능한 시간 조회 실패:", error);
      setAvailableTimes([]); 
    } finally {
      setIsLoadingTimes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !selectedDate ||
      !selectedTime ||
      !selectedType ||
      !selectedPb ||
      !clientMessage.trim()
    ) {
      setError("모든 필수 항목을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedTypeData = consultationTypes.find(
        (type) => type.type === selectedType
      );
      const scheduledAt = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(":").map(Number);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const requestData = {
        pbId: selectedPb,
        consultationType: selectedType,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: selectedTypeData?.defaultDurationMinutes || 60,
        fee: selectedTypeData?.defaultFee || 50000,
        clientMessage: clientMessage.trim(),
      };

      if (!accessToken) {
        setError("로그인이 필요합니다. 다시 로그인해주세요.");
        return;
      }

      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          "상담 예약이 성공적으로 요청되었습니다. PB의 승인을 기다려주세요."
        );


      } else {
        setError(data.message || "상담 예약 요청에 실패했습니다.");
      }
    } catch (error) {
      console.error("상담 예약 요청 실패:", error);
      setError("상담 예약 요청 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTypeData = consultationTypes.find(
    (type) => type.type === selectedType
  );
  const selectedPbData = pbList.find((pb) => pb.id === selectedPb);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 overflow-hidden relative transition-colors duration-500">
      <FloatingEmojiBackground />

      <MouseFollower />

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              PB 상담 예약
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              전문 PB와 함께하는 맞춤형 투자 상담을 예약하세요
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <Label
                        htmlFor="consultation-type"
                        className="text-sm font-medium"
                      >
                        상담 유형 <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={selectedType}
                        onValueChange={setSelectedType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="상담 유형을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {consultationTypes.map((type) => (
                            <SelectItem key={type.type} value={type.type}>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {type.displayName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {type.defaultDurationMinutes}분 •{" "}
                                  {type.defaultFee.toLocaleString()}원
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedTypeData && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedTypeData.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        예약 날짜 <span className="text-red-500">*</span>
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate
                              ? format(selectedDate, "PPP", { locale: ko })
                              : "날짜를 선택하세요"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => {

                              if (date < new Date()) return true;

                              const dayOfWeek = date.getDay();
                              return dayOfWeek === 0 || dayOfWeek === 6;
                            }}
                            initialFocus
                            locale={ko}
                            className="rounded-md border"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="client-message"
                        className="text-sm font-medium"
                      >
                        상담 요청 내용 <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="client-message"
                        placeholder="상담하고 싶은 내용을 자세히 작성해주세요..."
                        value={clientMessage}
                        onChange={(e) => setClientMessage(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSubmitting ? "예약 요청 중..." : "상담 예약 요청"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

              {selectedPbData && (
                <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-green-200 dark:border-green-800">
                  <CardHeader>
                    <CardTitle className="text-green-700 dark:text-green-400">
                      선택된 PB
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedPbData.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedPbData.region}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {selectedPbData.rating}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ({selectedPbData.totalConsultations}건 상담)
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">전문 분야</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedPbData.specialties.map((specialty, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>{selectedPbData.experience}년 경력</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="backdrop-blur-sm bg-blue-50/80 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-blue-700 dark:text-blue-400 text-sm">
                    안내사항
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-blue-600 dark:text-blue-300 space-y-2">
                  <p>• 상담 예약 후 PB의 승인을 받아야 상담이 확정됩니다.</p>
                  <p>• 상담 1시간 전까지 취소 가능합니다.</p>
                  <p>• 상담 수수료는 상담 완료 후 결제됩니다.</p>
                  <p>• 화상 상담 링크는 상담 시작 전에 안내드립니다.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
