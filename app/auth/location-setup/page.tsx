"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, setLoginData } from "@/app/utils/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Search, CheckCircle } from "lucide-react";
import NavBar from "@/app/components/Navbar";
import { MouseFollower } from "@/components/mouse-follower";
import { StockTicker } from "@/components/stock-ticker";
import api from "@/app/config/api";
import Swal from "sweetalert2";

interface LocationData {
  address: string;
  detailAddress: string;
  zonecode: string;
  latitude: number;
  longitude: number;
}

export default function LocationSetupPage() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const [locationData, setLocationData] = useState<LocationData>({
    address: "",
    detailAddress: "",
    zonecode: "",
    latitude: null,
    longitude: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  useEffect(() => {

    if (!accessToken || !user) {
      router.replace("/login");
      return;
    }


    if (
      user.address &&
      user.latitude &&
      user.longitude &&
      user.latitude !== 0 &&
      user.longitude !== 0
    ) {
      router.replace("/");
      return;
    }


    const checkApiLoaded = () => {
      if (
        typeof window !== "undefined" &&
        window.daum &&
        window.daum.Postcode
      ) {
        setIsApiLoaded(true);
      } else {

        setTimeout(checkApiLoaded, 1000);
      }
    };
    checkApiLoaded();
  }, [accessToken, user, router]);

  const handleAddressSearch = () => {

    if (typeof window !== "undefined" && window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function (data: any) {
          setLocationData((prev) => ({
            ...prev,
            address: data.address,
            zonecode: data.zonecode,

            latitude: null,
            longitude: null,
          }));
        },
      }).open();
    } else {
      Swal.fire({
        title: "주소 검색 준비 중",
        text: "주소 검색 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
        icon: "info",
        confirmButtonText: "확인",
        confirmButtonColor: "#10b981",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationData.address || !locationData.zonecode) {
      Swal.fire({
        title: "위치 정보 필요",
        text: "주소를 입력해주세요.",
        icon: "warning",
        confirmButtonText: "확인",
        confirmButtonColor: "#10b981",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const requestData = {
        address: locationData.address,
        detailAddress: locationData.detailAddress,
        zonecode: locationData.zonecode,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      };


      const response = await api.put("/members/location", requestData);

      if (response.data.success) {

        try {
          const userResponse = await api.get("/members/me");
          if (userResponse.data.success) {
            const latestUser = userResponse.data.data;


            await setLoginData(
              accessToken,
              user.refreshToken || "",
              latestUser
            );
          } else {

            const updatedUser = {
              ...user,
              address: locationData.address,
              detailAddress: locationData.detailAddress,
              zonecode: locationData.zonecode,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
            };
            await setLoginData(
              accessToken,
              user.refreshToken || "",
              updatedUser
            );
          }
        } catch (error) {

          const updatedUser = {
            ...user,
            address: locationData.address,
            detailAddress: locationData.detailAddress,
            zonecode: locationData.zonecode,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          };
          await setLoginData(accessToken, user.refreshToken || "", updatedUser);
        }

        await Swal.fire({
          title: "위치 설정 완료! 🎉",
          text: "이제 지역별 채팅방을 이용할 수 있습니다.",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });


        router.replace("/community");
      }
    } catch (error: any) {
      console.error("위치 정보 업데이트 실패:", error);
      Swal.fire({
        title: "위치 설정 실패 😢",
        text:
          error.response?.data?.message || "위치 정보를 저장할 수 없습니다.",
        icon: "error",
        confirmButtonText: "확인",
        confirmButtonColor: "#10b981",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    Swal.fire({
      title: "위치 설정 건너뛰기",
      text: "나중에 설정에서 위치를 변경할 수 있습니다. 계속하시겠습니까?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "계속하기",
      cancelButtonText: "취소",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
    }).then((result) => {
      if (result.isConfirmed) {

        router.replace("/community");
      }
    });
  };

  if (!accessToken || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      <MouseFollower />
      <NavBar />

      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      <main className="container mx-auto px-4 py-8 pt-36">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-400 rounded-full flex items-center justify-center shadow-lg mb-6">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-green-900 dark:text-green-100 mb-4">
              위치 정보 설정
            </h1>
            <p className="text-lg text-green-700 dark:text-green-300">
              {user.name}님, 지역별 채팅방을 이용하기 위해 위치 정보를
              설정해주세요!
            </p>
          </div>

          <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-green-200 dark:border-green-700">
            <CardHeader>
              <CardTitle className="text-xl text-green-800 dark:text-green-200">
                📍 위치 정보 입력
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-700 dark:text-green-300">
                    상세 주소
                  </label>
                  <Input
                    value={locationData.detailAddress}
                    onChange={(e) =>
                      setLocationData((prev) => ({
                        ...prev,
                        detailAddress: e.target.value,
                      }))
                    }
                    placeholder="상세 주소를 입력해주세요 (선택사항)"
                  />
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-green-700 dark:text-green-300">
                      <p className="font-medium mb-1">위치 정보 설정의 장점:</p>
                      <ul className="space-y-1">
                        <li>• 같은 지역 주민들과 실시간 채팅</li>
                        <li>• 지역별 투자 정보 공유</li>
                        <li>• 지역 특성에 맞는 주식 추천</li>
                      </ul>
                    </div>
                  </div>
                </div>

