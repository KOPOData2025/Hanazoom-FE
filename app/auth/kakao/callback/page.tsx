"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore, setLoginData } from "@/app/utils/auth";
import api from "@/app/config/api";
import { API_ENDPOINTS } from "@/app/config/api";
import Swal from "sweetalert2";

export default function KakaoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(true);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {

    const stateRaw = searchParams.get("state");
    let desiredRedirect: string | null = null;
    let isStepUp = false;
    try {
      if (stateRaw) {
        const parsed = JSON.parse(decodeURIComponent(stateRaw));
        isStepUp = !!parsed?.stepUp;
        desiredRedirect = parsed?.redirect || null;
      }
    } catch {}

    if (accessToken && !isStepUp) {
      router.replace("/");
      return;
    }

    const handleKakaoCallback = async () => {

      if (hasProcessed) {
        return;
      }

      try {
        setHasProcessed(true);
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
          throw new Error("카카오 로그인에 실패했습니다.");
        }

        if (!code) {
          throw new Error("인증 코드를 받지 못했습니다.");
        }


        const response = await api.post(API_ENDPOINTS.kakaoLogin, {
          code,
          redirectUri: "http:
        });

        if (!response.data.success) {
          throw new Error(
            response.data.message || "카카오 로그인에 실패했습니다."
          );
        }

        const { data } = response.data;


        await setLoginData(data.accessToken, data.refreshToken, {
          id: data.id,
          name: data.name,
          email: data.email,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
        });


        if (isStepUp) {
          try {
            sessionStorage.setItem("recentlyVerifiedAt", Date.now().toString());
          } catch {}
        }




        if (isStepUp && desiredRedirect) {
          router.replace(desiredRedirect);
          return;
        }


        if (!data.address || !data.latitude || !data.longitude) {
          router.replace("/auth/location-setup");
        } else {
          router.replace("/");
        }
      } catch (error: any) {
        console.error("카카오 로그인 에러:", error);

        await Swal.fire({
          title: "로그인 실패 😢",
          text: error.message || "카카오 로그인에 실패했습니다.",
          icon: "error",
          confirmButtonText: "로그인 페이지로 돌아가기",
          confirmButtonColor: "#10b981",
        });


        router.replace("/login");
      } finally {
        setIsProcessing(false);
      }
    };

    handleKakaoCallback();
  }, [searchParams, accessToken, router, hasProcessed]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-green-600 dark:text-green-400 text-lg">
            카카오 로그인 처리 중...
          </p>
          <p className="text-green-500 dark:text-green-300 text-sm mt-2">
            잠시만 기다려주세요
          </p>
        </div>
      </div>
    );
  }

  return null;
}
