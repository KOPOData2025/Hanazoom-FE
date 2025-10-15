"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/utils/auth";
import { useUserSettingsStore } from "@/lib/stores/userSettingsStore";
import { 
  getUserSettings, 
  updateUserSettings, 
  updateTheme, 
  updateCustomCursor, 
  updateEmojiAnimation 
} from "@/lib/api/userSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Palette, 
  MousePointer, 
  Sparkles, 
  Bell, 
  Map, 
  Layout,
  Save,
  RotateCcw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import NavBar from "@/app/components/Navbar";
import { MouseFollower } from "@/components/mouse-follower";
import { StockTicker } from "@/components/stock-ticker";
import Swal from 'sweetalert2';

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { 
    settings, 
    isLoading, 
    error, 
    isInitialized,
    loadSettings,
    updateSettings,
    updateTheme: updateThemeStore,
    updateCustomCursor: updateCustomCursorStore,
    updateEmojiAnimation: updateEmojiAnimationStore,
    resetToDefaults,
    setLoading,
    setError,
    setInitialized
  } = useUserSettingsStore();

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);


  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);


  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user || isInitialized) return;
      
      try {
        setLoading(true);
        setError(null);
        const userSettings = await getUserSettings();
        loadSettings(userSettings);
        console.log('✅ 사용자 설정 로드 완료:', userSettings);
      } catch (error: any) {
        console.error('❌ 사용자 설정 로드 실패:', error);
        setError(error.message);
        toast.error('설정을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadUserSettings();
  }, [user, isInitialized, loadSettings, setLoading, setError]);


  const handleThemeChange = async (theme: 'LIGHT' | 'DARK' | 'SYSTEM') => {
    updateThemeStore(theme);
    setHasUnsavedChanges(true);
  };


  const handleCustomCursorChange = async (enabled: boolean) => {
    updateCustomCursorStore(enabled);
    setHasUnsavedChanges(true);
  };


  const handleEmojiAnimationChange = async (enabled: boolean) => {
    updateEmojiAnimationStore(enabled);
    setHasUnsavedChanges(true);
  };


  const handleResetToDefaults = () => {
    resetToDefaults();
    setHasUnsavedChanges(true);
  };


  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      

      await updateUserSettings(settings);
      
      setHasUnsavedChanges(false);
      toast.success('설정이 저장되었습니다.');
      console.log('✅ 설정 저장 완료:', settings);
    } catch (error: any) {
      console.error('❌ 설정 저장 실패:', error);
      setError(error.message);
      toast.error('설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };


  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?';
        return '저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?';
      }
    };

    const handleRouteChange = async () => {
      if (hasUnsavedChanges) {
        const result = await Swal.fire({
          title: '저장하지 않은 변경사항이 있습니다',
          text: '변경사항이 저장되지 않았습니다. 정말 나가시겠습니까?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: '나가기',
          cancelButtonText: '취소',
          confirmButtonColor: '#ef4444',
          cancelButtonColor: '#6b7280'
        });

        if (result.isConfirmed) {
          return true;
        } else {
          return false;
        }
      }
      return true;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
        <div className="fixed top-0 left-0 right-0 z-[100]">
          <NavBar />
        </div>
        <div className="fixed top-16 left-0 right-0 z-[60]">
          <StockTicker />
        </div>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">설정을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950">
      <div className="absolute inset-0 pointer-events-none opacity-10 dark:opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
      </div>

      <div className="fixed top-0 left-0 right-0 z-[100]">
        <NavBar />
      </div>

      <main className="relative z-10 pt-36 pb-8 px-4 max-w-4xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-green-500" />
                테마 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="theme-select">테마 선택</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    앱의 색상 테마를 선택하세요
                  </p>
                </div>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value: 'LIGHT' | 'DARK' | 'SYSTEM') => handleThemeChange(value)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LIGHT">라이트</SelectItem>
                    <SelectItem value="DARK">다크</SelectItem>
                    <SelectItem value="SYSTEM">시스템</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className="text-xs">
                현재: {settings.theme === 'LIGHT' ? '라이트' : settings.theme === 'DARK' ? '다크' : '시스템 (자동)'}
              </Badge>
            </CardContent>
          </Card>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="custom-cursor" className="flex items-center gap-2">
                    <MousePointer className="h-4 w-4" />
                    커스텀 마우스 커서
                  </Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    주식 관련 커스텀 마우스 커서를 사용합니다
                  </p>
                </div>
                <Switch
                  id="custom-cursor"
                  checked={settings.customCursorEnabled}
                  onCheckedChange={handleCustomCursorChange}
                  disabled={isSaving}
                />
              </div>

              <Separator />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-green-500" />
                알림 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="push-notifications">푸시 알림</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    중요한 주식 정보나 업데이트에 대한 알림을 받습니다
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.pushNotificationsEnabled}
                  onCheckedChange={(enabled) => updateSettings({ pushNotificationsEnabled: enabled })}
                  disabled={isSaving}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleResetToDefaults}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isSaving}
                >
                  <RotateCcw className="h-4 w-4" />
                  기본값으로 초기화
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex items-center gap-2"
                  disabled={isSaving || !hasUnsavedChanges}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? '저장 중...' : hasUnsavedChanges ? '완료' : '저장됨'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
