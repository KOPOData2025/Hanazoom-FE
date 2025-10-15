"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore, setLoginData } from "@/app/utils/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NavBar from "@/app/components/Navbar";
import { StockTicker } from "@/components/stock-ticker";
import api, { API_ENDPOINTS, type ApiResponse } from "@/app/config/api";
import Swal from "sweetalert2";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const redirect = useMemo(() => {
    const r = searchParams.get("redirect");
    return r ? decodeURIComponent(r) : "/";
  }, [searchParams]);

  const isSocialKakao = useMemo(() => {

    return !!user?.email?.includes("kakao");
  }, [user]);

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);


  const showErrorAlert = (message: string) => {

    const isDarkMode = document.documentElement.classList.contains("dark");

    Swal.fire({
      title: "앗!",
      text: message,
      icon: "error",
      confirmButtonText: "확인",
      confirmButtonColor: "#10b981",
      background: isDarkMode ? "#1f2937" : "#ffffff",
      color: isDarkMode ? "#f9fafb" : "#1f2937",
      customClass: {
        popup: isDarkMode ? "border border-gray-700" : "",
        title: isDarkMode ? "text-white" : "",
        htmlContainer: isDarkMode ? "text-gray-300" : "",
        confirmButton: isDarkMode ? "bg-green-600 hover:bg-green-700" : "",
      },
    });
  };

  useEffect(() => {

    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [user, router, redirect]);

  const beginKakaoStepUp = () => {
    const kakaoClientId =
      process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ||
      "f50a1c0f8638ca30ef8c170a6ff8412b";
    const redirectUri = encodeURIComponent(
      process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ||
        "http:
    );

    const state = encodeURIComponent(
      JSON.stringify({ stepUp: true, redirect })
    );
    const scope = "profile_nickname";

    const kakaoAuthUrl =
      `https:
      `&redirect_uri=${redirectUri}` +
      `&response_type=code&scope=${scope}` +
      `&state=${state}` +
      `&prompt=login&max_age=0`;

    window.location.href = kakaoAuthUrl;
  };

  const submitPassword = async () => {
    if (!user?.email) return;
    

    if (!password.trim()) {
      showErrorAlert("비밀번호를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post<
        ApiResponse<{
          id: string;
          name: string;
          email: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          accessToken: string;
          refreshToken: string;
        }>
      >(API_ENDPOINTS.login, { email: user.email, password });

      if (!response.data.success) {
        throw new Error(response.data.message || "검증에 실패했습니다.");
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


      try {
        sessionStorage.setItem("recentlyVerifiedAt", Date.now().toString());
      } catch {}


      router.replace(redirect);
    } catch (err) {

      showErrorAlert("비밀번호가 올바르지 않습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      <NavBar />
      <div className="fixed top-16 left-0 right-0 z-[60]">
        <StockTicker />
      </div>

      <main className="container mx-auto px-4 pt-36 max-w-md">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-green-200 dark:border-green-800 rounded-xl p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
            보안 검증
          </h1>
          <p className="text-green-700 dark:text-green-300 mb-6">
            개인정보가 포함된 페이지이므로 본인 확인을 한 번 더 진행합니다.
          </p>

          {isSocialKakao ? (
            <>
              <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                카카오 계정으로 재인증을 진행합니다.
              </p>
              <Button
                className="w-full h-12 text-lg bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-medium rounded-lg"
                onClick={beginKakaoStepUp}
              >
                카카오로 본인 확인
              </Button>
            </>
          ) : (
            <>
              <label className="text-sm font-medium text-green-700 dark:text-green-300 mb-2 block">
                비밀번호 확인
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="mb-4"
              />
              <Button
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                onClick={submitPassword}
                disabled={submitting || !password}
              >
                {submitting ? "확인 중..." : "검증하기"}
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
