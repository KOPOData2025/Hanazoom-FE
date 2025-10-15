import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { syncUserSettings } from "@/lib/api/userSettings";
import { useUserSettingsStore } from "@/lib/stores/userSettingsStore";

interface User {
  id: string;
  name: string;
  email: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
}

interface AuthActions {
  setAuth: (data: { accessToken: string; user: User }) => void;
  updateAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
  getCurrentUserId: () => string | null;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      setAuth: ({ accessToken, user }) => set({ accessToken, user }),
      updateAccessToken: (accessToken) => set({ accessToken }),
      clearAuth: () => {
        set({ accessToken: null, user: null });

        useUserSettingsStore.getState().resetToDefaults();
        console.log("✅ 인증 정보 및 사용자 설정 초기화 완료");
      },
      getCurrentUserId: () => {
        const state = get();
        if (state.user?.id) {
          return state.user.id;
        }


        if (state.accessToken) {
          try {
            const payload = JSON.parse(atob(state.accessToken.split(".")[1]));
            return payload.sub || payload.userId || payload.id || null;
          } catch (error) {
            console.error("JWT 토큰 파싱 실패:", error);
            return null;
          }
        }

        return null;
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),

      onRehydrateStorage: () => (state) => {
        try {
          const token = state?.accessToken;
          if (!token) return;

          const isExpired = (() => {
            try {
              const payload = JSON.parse(atob(token.split(".")[1]));
              const expMs = (payload?.exp ?? 0) * 1000;
              return Date.now() >= expMs;
            } catch {
              return true;
            }
          })();

          if (!isExpired) return;


          fetch("/api/auth/refresh-token", { credentials: "include" })
            .then(async (res) => {
              if (!res.ok) throw new Error("refresh failed");
              const data = await res.json();
              useAuthStore.getState().updateAccessToken(data.accessToken);
            })
            .catch(() => {
              useAuthStore.getState().clearAuth();
            });
        } catch {

          useAuthStore.getState().clearAuth();
        }
      },
    }
  )
);

export const setLoginData = async (
  accessToken: string,
  refreshToken: string,
  user: Omit<User, "latitude" | "longitude"> & {
    latitude?: string | number | null;
    longitude?: string | number | null;
  }
) => {
  console.log("🔄 setLoginData 시작:", {
    accessToken: accessToken?.substring(0, 20) + "...",
    refreshToken: refreshToken?.substring(0, 20) + "...",
  });


  const processedUser: User = {
    ...user,
    latitude: user.latitude ? Number(user.latitude) : null,
    longitude: user.longitude ? Number(user.longitude) : null,
  };


  useAuthStore.getState().setAuth({ accessToken, user: processedUser });
  console.log("✅ Zustand store에 인증 정보 저장 완료");


  try {
    console.log("🔄 사용자 설정 동기화 시작");
    const userSettings = await syncUserSettings();
    useUserSettingsStore.getState().loadSettings(userSettings);
    console.log("✅ 사용자 설정 동기화 완료:", userSettings);
  } catch (error) {
    console.error("❌ 사용자 설정 동기화 실패:", error);

    console.log("ℹ️ 기본 설정으로 계속 진행");
  }


  try {
    console.log("🔄 refreshToken 쿠키 저장 시도");
    const response = await fetch("/api/auth/set-refresh-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      credentials: "include", 
    });

    if (!response.ok) {
      throw new Error(`쿠키 저장 실패: ${response.status}`);
    }

    console.log("✅ refreshToken 쿠키 저장 완료");
  } catch (error) {
    console.error("❌ Failed to set refresh token:", error);
    throw error; 
  }
};

export const getAccessToken = () => {
  return useAuthStore.getState().accessToken;
};

export const refreshAccessToken = async () => {
  try {
    const response = await fetch("/api/auth/refresh-token", {
      credentials: "include", 
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Token refresh failed:", errorData);
      throw new Error(errorData.error || "Failed to refresh token");
    }

    const data = await response.json();

    if (!data.accessToken) {
      throw new Error("No access token received");
    }

    useAuthStore.getState().updateAccessToken(data.accessToken);
    return data.accessToken;
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    useAuthStore.getState().clearAuth();


    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw error;
  }
};

export const logout = async () => {
  try {

    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });
  } catch (error) {
    console.error("Failed to logout:", error);
  } finally {

    useAuthStore.getState().clearAuth();

    await fetch("/api/auth/remove-refresh-token", {
      method: "POST",
      credentials: "include",
    });

    
    localStorage.removeItem("keepLoggedIn");

  }
};

export const isLoggedIn = () => {
  return !!useAuthStore.getState().accessToken;
};

export const shouldKeepLoggedIn = () => {
  return localStorage.getItem("keepLoggedIn") === "true";
};

export const getSavedLoginEmail = () => {
  return localStorage.getItem("loginEmail");
};

export const clearLoginPreferences = () => {
  localStorage.removeItem("keepLoggedIn");

};
