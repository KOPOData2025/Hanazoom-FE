import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";


export interface UserSettings {
  id?: string;
  memberId?: string;
  

  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  customCursorEnabled: boolean;
  emojiAnimationEnabled: boolean;
  

  pushNotificationsEnabled: boolean;
  

  defaultMapZoom: number;
  mapStyle: 'STANDARD' | 'SATELLITE' | 'HYBRID';
  
  

  uiDensity: 'COMPACT' | 'NORMAL' | 'COMFORTABLE';
  
  createdAt?: string;
  updatedAt?: string;
}


const defaultSettings: UserSettings = {
  theme: 'SYSTEM',
  customCursorEnabled: true,
  emojiAnimationEnabled: true,
  pushNotificationsEnabled: true,
  defaultMapZoom: 8,
  mapStyle: 'STANDARD',
  uiDensity: 'NORMAL',
};


export interface UpdateUserSettingsRequest {
  theme?: 'LIGHT' | 'DARK' | 'SYSTEM';
  customCursorEnabled?: boolean;
  emojiAnimationEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
  defaultMapZoom?: number;
  mapStyle?: 'STANDARD' | 'SATELLITE' | 'HYBRID';
  uiDensity?: 'COMPACT' | 'NORMAL' | 'COMFORTABLE';
}


interface UserSettingsState {
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}


interface UserSettingsActions {

  loadSettings: (settings: UserSettings) => void;
  

  updateSettings: (updates: UpdateUserSettingsRequest) => void;
  

  updateTheme: (theme: 'LIGHT' | 'DARK' | 'SYSTEM') => void;
  updateCustomCursor: (enabled: boolean) => void;
  updateEmojiAnimation: (enabled: boolean) => void;
  updatePushNotifications: (enabled: boolean) => void;
  updateMapSettings: (zoom?: number, style?: 'STANDARD' | 'SATELLITE' | 'HYBRID') => void;
  updateUiDensity: (density: 'COMPACT' | 'NORMAL' | 'COMFORTABLE') => void;
  

  resetToDefaults: () => void;
  

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (initialized: boolean) => void;
}


type UserSettingsStore = UserSettingsState & UserSettingsActions;


export const useUserSettingsStore = create<UserSettingsStore>()(
  persist(
    (set, get) => ({

      settings: defaultSettings,
      isLoading: false,
      error: null,
      isInitialized: false,


      loadSettings: (settings: UserSettings) => {
        console.log('🔄 사용자 설정 로드:', settings);
        set({ 
          settings: { ...defaultSettings, ...settings },
          isInitialized: true,
          error: null 
        });
      },


      updateSettings: (updates: UpdateUserSettingsRequest) => {
        console.log('🔄 사용자 설정 업데이트:', updates);
        set((state) => ({
          settings: { ...state.settings, ...updates },
          error: null
        }));
      },


      updateTheme: (theme) => {
        console.log('🎨 테마 설정 업데이트:', theme);
        set((state) => ({
          settings: { ...state.settings, theme },
          error: null
        }));
      },

      updateCustomCursor: (enabled) => {
        console.log('🖱️ 커스텀 커서 설정 업데이트:', enabled);
        set((state) => ({
          settings: { ...state.settings, customCursorEnabled: enabled },
          error: null
        }));
      },

      updateEmojiAnimation: (enabled) => {
        console.log('✨ 이모지 애니메이션 설정 업데이트:', enabled);
        set((state) => ({
          settings: { ...state.settings, emojiAnimationEnabled: enabled },
          error: null
        }));
      },

      updatePushNotifications: (enabled) => {
        console.log('🔔 푸시 알림 설정 업데이트:', enabled);
        set((state) => ({
          settings: { ...state.settings, pushNotificationsEnabled: enabled },
          error: null
        }));
      },

      updateMapSettings: (zoom, style) => {
        console.log('🗺️ 지도 설정 업데이트:', { zoom, style });
        set((state) => ({
          settings: {
            ...state.settings,
            ...(zoom !== undefined && { defaultMapZoom: zoom }),
            ...(style !== undefined && { mapStyle: style })
          },
          error: null
        }));
      },


      updateUiDensity: (density) => {
        console.log('📱 UI 밀도 설정 업데이트:', density);
        set((state) => ({
          settings: { ...state.settings, uiDensity: density },
          error: null
        }));
      },


      resetToDefaults: () => {
        console.log('🔄 설정을 기본값으로 초기화');
        set({
          settings: defaultSettings,
          error: null
        });
      },


      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),
    }),
    {
      name: 'user-settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        isInitialized: state.isInitialized,
      }),

      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('✅ 사용자 설정 스토어 하이드레이션 완료');
          state.setInitialized(true);
        }
      },
    }
  )
);


export const getUserSettings = () => useUserSettingsStore.getState().settings;
export const updateUserSettings = (updates: UpdateUserSettingsRequest) => 
  useUserSettingsStore.getState().updateSettings(updates);


export const getTheme = () => useUserSettingsStore.getState().settings.theme;
export const getCustomCursorEnabled = () => useUserSettingsStore.getState().settings.customCursorEnabled;
export const getEmojiAnimationEnabled = () => useUserSettingsStore.getState().settings.emojiAnimationEnabled;
export const getPushNotificationsEnabled = () => useUserSettingsStore.getState().settings.pushNotificationsEnabled;
export const getMapSettings = () => ({
  zoom: useUserSettingsStore.getState().settings.defaultMapZoom,
  style: useUserSettingsStore.getState().settings.mapStyle
});
export const getUiDensity = () => useUserSettingsStore.getState().settings.uiDensity;
