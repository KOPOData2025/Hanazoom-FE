"use client";

import { useEffect, useState } from "react";

interface LoadingAnimationProps {
  onComplete: () => void;
}

export function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "주식 데이터 수집 중...",
    "지역별 트렌드 분석 중...",
    "맛집 정보 준비 중...",
    "지도 그리는 중...",
    "완료! 🎉",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 100) {
          setTimeout(onComplete, 500);
          return 100;
        }
        return newProgress;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const stepIndex = Math.floor((progress / 100) * (steps.length - 1));
    setCurrentStep(stepIndex);
  }, [progress, steps.length]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 flex items-center justify-center z-50 transition-all duration-500">
      <div className="text-center space-y-8">
        <div className="relative w-80 h-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mx-auto">
          <div className="absolute inset-6">
            <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300 dark:bg-gray-600"></div>

            {[20, 40, 60, 80].map((x, i) => (
              <div
                key={i}
                className={`absolute w-3 h-3 bg-green-500 rounded-full transition-all duration-500 ${
                  progress > (i + 1) * 20
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-0"
                }`}
                style={{
                  left: `${x}%`,
                  top: `${60 - i * 10}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              >
                <div className="absolute -top-8 -left-4 text-xs text-green-600 dark:text-green-400 font-semibold">
                  {["📱", "💬", "🔍", "💾"][i]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-16">
          {["💰", "📈", "💎", "🚀", "📊"].map((emoji, i) => (
            <div
              key={i}
              className="absolute animate-bounce text-2xl opacity-60"
              style={{
                left: `${20 + i * 15}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: "2s",
              }}
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes drawLine {
          0% {
            stroke-dashoffset: 400;
          }
          50% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -400;
          }
        }
      `}</style>
    </div>
  );
}
