"use client";

import { useEffect, useState, useRef } from "react";
import { getMyInfo, updateMyLocation } from "@/lib/api/members";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/app/utils/auth";
import NavBar from "@/app/components/Navbar";
import { MouseFollower } from "@/components/mouse-follower";
import { StockTicker } from "@/components/stock-ticker";
import { FloatingEmojiBackground } from "@/components/floating-emoji-background";
import {
  User,
  MapPin,
  Settings,
  Shield,
  Link as LinkIcon,
  Search,
} from "lucide-react";
import { Map, useKakaoLoader } from "react-kakao-maps-sdk";
import Script from "next/script";
import { useRouter } from "next/navigation";



export default function MyPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    detailAddress: "",
    zonecode: "",
    latitude: "",
    longitude: "",
  });


  useEffect(() => {
    try {
      const ts = sessionStorage.getItem("recentlyVerifiedAt");
      const valid = ts && Date.now() - Number(ts) < 10 * 60 * 1000;
      if (!valid) {
        const redirect = encodeURIComponent("/mypage");
        router.replace(`/auth/verify?redirect=${redirect}`);
        return;
      }
    } catch (error) {

      const redirect = encodeURIComponent("/mypage");
      router.replace(`/auth/verify?redirect=${redirect}`);
      return;
    }
  }, [router]);


  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);


  const [currentMarker, setCurrentMarker] = useState<any>(null);


  const mapRef = useRef<any>(null);


  const [isMapLoaded, setIsMapLoaded] = useState(false);


  const [actualCoordinates, setActualCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);


  const [mapLoading] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY!,
    libraries: ["services"],
  });


  useEffect(() => {
    if (actualCoordinates && !mapLoading) {
      setIsMapLoaded(true);
    }
  }, [actualCoordinates, mapLoading]);


  const handleAddressSearch = () => {
    if (!isMapLoaded) {
      alert("지도가 아직 로드되지 않았습니다. 잠시 기다려주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data: any) {
        setForm((prev) => ({
          ...prev,
          address: data.address,
          zonecode: data.zonecode,
        }));


        if (window.kakao && window.kakao.maps && !mapLoading) {
          const geocoder = new window.kakao.maps.services.Geocoder();
          geocoder.addressSearch(
            data.address,
            function (result: any, status: any) {
              if (status === window.kakao.maps.services.Status.OK) {

                const newLat = parseFloat(result[0].y);
                const newLng = parseFloat(result[0].x);

                setForm((prev) => ({
                  ...prev,
                  latitude: newLat.toString(),
                  longitude: newLng.toString(),
                }));


                const newCoords = {
                  lat: newLat,
                  lng: newLng,
                };
                setMapCenter(newCoords);
                setActualCoordinates(newCoords);


                if (currentMarker) {
                  currentMarker.setMap(null);
                }


                const markerPosition = new window.kakao.maps.LatLng(
                  parseFloat(result[0].y),
                  parseFloat(result[0].x)
                );

                const newMarker = new window.kakao.maps.Marker({
                  position: markerPosition,
                });


                if (window.kakao && window.kakao.maps && mapRef.current) {

                  newMarker.setMap(mapRef.current);


                  mapRef.current.panTo(markerPosition);
                }

                setCurrentMarker(newMarker);
              }
            }
          );
        }
      },
      onclose: function (state: any) {

      },
    }).open();
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const me = await getMyInfo();

        const userForm = {
          name: me.name ?? "",
          email: me.email ?? "",
          phone: me.phone ?? "",
          address: me.address ?? "",
          detailAddress: me.detailAddress ?? "",
          zonecode: me.zonecode ?? "",
          latitude: me.latitude?.toString() ?? "",
          longitude: me.longitude?.toString() ?? "",
        };
        setForm(userForm);
        console.log("🎯 사용자 정보 로드됨:", userForm);


        if (userForm.latitude && userForm.longitude) {
          const coords = {
            lat: parseFloat(userForm.latitude),
            lng: parseFloat(userForm.longitude),
          };
          setMapCenter(coords);
          setActualCoordinates(coords);
        }
      } catch (e: any) {
        setError(e?.message ?? "정보를 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSaveLocation = async () => {
    setError(null);
    try {

      const lat = form.latitude ? parseFloat(form.latitude) : null;
      const lng = form.longitude ? parseFloat(form.longitude) : null;

      await updateMyLocation({
        address: form.address || undefined,
        detailAddress: form.detailAddress || undefined,
        zonecode: form.zonecode || undefined,
        latitude: lat,
        longitude: lng,
      });


      const me = await getMyInfo();


      const updatedForm = {
        name: me.name ?? "",
        email: me.email ?? "",
        phone: me.phone ?? "",
        address: me.address ?? "",
        detailAddress: me.detailAddress ?? "",
        zonecode: me.zonecode ?? "",
        latitude: me.latitude?.toString() ?? "",
        longitude: me.longitude?.toString() ?? "",
      };
      setForm(updatedForm);

      if (me.latitude && me.longitude) {
        const coords = {
          lat: me.latitude,
          lng: me.longitude,
        };
        setMapCenter(coords);
        setActualCoordinates(coords);
      }

      alert("위치 정보가 저장되었습니다.");
    } catch (e: any) {
      setError(e?.message ?? "저장에 실패했습니다.");
    }
  };


  const isVerified = (() => {
    try {
      const ts = sessionStorage.getItem("recentlyVerifiedAt");
      return ts && Date.now() - Number(ts) < 10 * 60 * 1000;
    } catch {
      return false;
    }
  })();

  if (loading || !isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
        <NavBar />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-green-700 dark:text-green-300">
              {!isVerified ? "보안 검증 중..." : "정보를 불러오는 중..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 overflow-hidden relative transition-colors duration-500">
      <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      <NavBar />

      <main className="container mx-auto px-4 py-8 pt-36">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-xl">
            <CardHeader className="border-b border-green-100 dark:border-green-800">
              <CardTitle className="flex items-center gap-3 text-green-800 dark:text-green-200">
                <User className="w-5 h-5" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-700 dark:text-green-300">
                    이메일
                  </label>
                  <Input
                    name="email"
                    value={form.email}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800 border-green-200 dark:border-green-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-700 dark:text-green-300">
                    이름
                  </label>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800 border-green-200 dark:border-green-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-green-700 dark:text-green-300">
                    전화번호
                  </label>
                  <Input
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800 border-green-200 dark:border-green-700"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700 dark:text-green-300">
                      우편번호
                    </label>
                    <div className="flex gap-2">
                      <Input
                        name="zonecode"
                        value={form.zonecode}
                        readOnly
                        placeholder="우편번호를 검색하세요"
                        className="border-green-200 dark:border-green-700 bg-gray-50 dark:bg-gray-800"
                      />
                      <Button
                        onClick={handleAddressSearch}
                        disabled={!isMapLoaded}
                        className={`px-4 ${
                          isMapLoaded
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-gray-400 cursor-not-allowed text-gray-200"
                        }`}
                        title={isMapLoaded ? "주소 검색" : "지도 로딩 중..."}
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700 dark:text-green-300">
                      주소
                    </label>
                    <Input
                      name="address"
                      value={form.address}
                      readOnly
                      placeholder="주소를 검색하세요"
                      className="border-green-200 dark:border-green-700 bg-gray-50 dark:bg-gray-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700 dark:text-green-300">
                      상세 주소
                    </label>
                    <Input
                      name="detailAddress"
                      value={form.detailAddress}
                      onChange={onChange}
                      placeholder="상세 주소를 입력하세요"
                      className="border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400"
                    />
                  </div>

                  <Button
                    onClick={onSaveLocation}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    위치 정보 저장
                  </Button>
                </div>

          <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-green-200 dark:border-green-800 shadow-xl">
            <CardHeader className="border-b border-green-100 dark:border-green-800">
              <CardTitle className="flex items-center gap-3 text-green-800 dark:text-green-200">
                <LinkIcon className="w-5 h-5" />
                {user?.email?.includes("kakao")
                  ? "연동된 계정"
                  : "소셜 계정 연동"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {user?.email?.includes("kakao") ? (

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-full border border-yellow-200 dark:border-yellow-800">
                      <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                        카카오 계정으로 로그인됨
                      </span>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-green-600 dark:text-green-300 mb-6 max-w-md mx-auto">
                    카카오 계정과 연동되어 있어 별도의 계정 관리가 필요하지
                    않습니다
                  </p>
                  <div className="space-y-3 text-sm text-green-600 dark:text-green-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>자동 로그인 지원</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>프로필 정보 자동 동기화</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>보안 인증 완료</span>
                    </div>
                  </div>
                </div>
              ) : (

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <p className="text-green-600 dark:text-green-300 mb-6 max-w-md mx-auto">
                    소셜 계정을 연동하면 더 편리하게 서비스를 이용할 수 있습니다
                  </p>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => {

                        console.log("카카오 연동 시도");
                      }}
                    >
                      <svg
                        className="w-5 h-5 mr-2"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 3C6.48 3 2 6.48 2 11c0 2.5 1.2 4.75 3.07 6.17L3.5 21l3.5-1.5c1.5.5 3.17.75 5 .75 5.52 0 10-3.48 10-8s-4.48-8-10-8z" />
                      </svg>
                      카카오 계정 연동하기
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      연동 시 기존 계정 정보는 유지됩니다
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Script src="
    </div>
  );
}
