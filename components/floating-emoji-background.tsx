"use client";

import { useUserSettingsStore } from "@/lib/stores/userSettingsStore";

interface FloatingEmojiBackgroundProps {
  className?: string;
}

export function FloatingEmojiBackground({ className = "" }: FloatingEmojiBackgroundProps) {
  const { settings, isInitialized } = useUserSettingsStore();


  if (!isInitialized || !settings.emojiAnimationEnabled) {
    return null;
  }

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <div className="floating-symbol absolute top-20 left-10 text-green-500 dark:text-green-400 text-2xl animate-bounce">
        📈
      </div>
      <div className="floating-symbol absolute top-40 right-20 text-emerald-600 dark:text-emerald-400 text-xl animate-pulse">
        💰
      </div>
      <div className="floating-symbol absolute top-60 left-1/4 text-green-400 dark:text-green-300 text-lg animate-bounce delay-300">
        🚀
      </div>
      <div className="floating-symbol absolute bottom-40 right-10 text-emerald-500 dark:text-emerald-400 text-2xl animate-pulse delay-500">
        💎
      </div>
      <div className="floating-symbol absolute bottom-60 left-20 text-green-600 dark:text-green-400 text-xl animate-bounce delay-700">
        📊
      </div>
      <div className="floating-symbol absolute top-32 right-1/3 text-emerald-400 dark:text-emerald-300 text-lg animate-pulse delay-200">
        🎯
      </div>
    </div>
  );
}
