"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useUserSettingsStore } from "@/lib/stores/userSettingsStore";

interface StockTrail {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

export function MouseFollower() {
  const { settings, isInitialized } = useUserSettingsStore();
  const [trail, setTrail] = useState<StockTrail[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [lastMoveTime, setLastMoveTime] = useState(0);
  const [isOverClickable, setIsOverClickable] = useState(false);
  const idCounter = useRef(0);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const hideCursor = useCallback(() => {
    document.body.style.cursor = "none";
    document.body.classList.add("custom-cursor-enabled");
  }, []);


  const showCursor = useCallback(() => {
    document.body.style.cursor = "auto";
    document.body.classList.remove("custom-cursor-enabled");
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = Date.now();


    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }


    rafIdRef.current = requestAnimationFrame(() => {
      setLastMoveTime(now);
      setIsMoving(true);

      const newTrail: StockTrail = {
        id: idCounter.current++,
        x: e.clientX,
        y: e.clientY,
        timestamp: now,
      };

      setTrail((prev) => [...prev.slice(-8), newTrail]);
    });


    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${e.clientX - 8}px, ${
        e.clientY - 8
      }px)`;
    }

    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current);
    }
    moveTimeoutRef.current = setTimeout(() => {
      setIsMoving(false);
    }, 150);
  }, []);


  const handleMouseOver = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;


      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.contentEditable === "true")
      ) {
        document.body.style.cursor = "auto";
        setIsOverClickable(false);
      } else {
        document.body.style.cursor = "none";


        const isClickable =
          target &&
          (target.tagName === "BUTTON" ||
            target.tagName === "A" ||
            target.getAttribute("role") === "button" ||
            target.classList.contains("cursor-pointer") ||
            target.onclick !== null ||
            target.getAttribute("onclick") !== null);

        setIsOverClickable(isClickable);
      }
    },
    []
  );

  useEffect(() => {

    if (settings.customCursorEnabled) {
      hideCursor();
    } else {
      showCursor();
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      if (moveTimeoutRef.current) {
        clearTimeout(moveTimeoutRef.current);
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      showCursor();
      document.body.classList.remove("custom-cursor-enabled");
    };
  }, [handleMouseMove, handleMouseOver, hideCursor, showCursor, settings.customCursorEnabled]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTrail((previousTrail) => {

        if (previousTrail.length === 0) {
          return previousTrail;
        }

        const filtered = previousTrail.filter(
          (point) => now - point.timestamp < 800
        );


        if (filtered.length === previousTrail.length) {
          return previousTrail;
        }
        return filtered;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);


  const debugCursor =
    process.env.NEXT_PUBLIC_DEBUG_CURSOR === 'true' ||
    (typeof window !== 'undefined' && (window as any).__DEBUG_CURSOR === true);

  if (debugCursor) {
    console.debug('🖱️ MouseFollower 상태:', {
      isInitialized,
      customCursorEnabled: settings.customCursorEnabled,
      settings: settings
    });
  }


  if (!isInitialized || !settings.customCursorEnabled) {
    if (debugCursor) {
      console.debug('🖱️ MouseFollower 비활성화:', { isInitialized, customCursorEnabled: settings.customCursorEnabled });
    }
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2147483647 }}>
      {trail.map((point, index) => {
        const age = Date.now() - point.timestamp;
        const opacity = Math.max(0, 1 - age / 800);
        const scale = 0.3 + opacity * 0.4;

        return (
          <div
            key={point.id}
            className="absolute w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full transition-all duration-100"
            style={{
              left: point.x - 4,
              top: point.y - 4,
              opacity: opacity * 0.6,
              transform: `scale(${scale})`,
              boxShadow: `0 0 ${scale * 8}px rgba(34, 197, 94, ${
                opacity * 0.5
              })`,
            }}
          />
        );
      })}

          <>
            <div
              className={`absolute top-1/2 left-1/2 w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                isMoving ? "scale-110" : "scale-90"
              }`}
            />
          </>
        </div>
      </div>

        body.custom-cursor-enabled * {
          cursor: none !important;
        }

        body.custom-cursor-enabled button,
        body.custom-cursor-enabled [role="button"],
        body.custom-cursor-enabled a,
        body.custom-cursor-enabled .cursor-pointer,
        body.custom-cursor-enabled [onclick] {
          cursor: none !important;
        }

        .resize {
          cursor: nw-resize !important;
        }

        body:not(.custom-cursor-enabled) * {
          cursor: auto !important;
        }

        body:not(.custom-cursor-enabled) button,
        body:not(.custom-cursor-enabled) [role="button"],
        body:not(.custom-cursor-enabled) a,
        body:not(.custom-cursor-enabled) .cursor-pointer {
          cursor: pointer !important;
        }

        body:not(.custom-cursor-enabled) input,
        body:not(.custom-cursor-enabled) textarea,
        body:not(.custom-cursor-enabled) select {
          cursor: text !important;
        }

        body:not(.custom-cursor-enabled) [class*="pointer-events-none"],
        body:not(.custom-cursor-enabled) .pointer-events-none {
          cursor: auto !important;
        }

        body:not(.custom-cursor-enabled) * {
          cursor: auto !important;
        }

        body:not(.custom-cursor-enabled) input,
        body:not(.custom-cursor-enabled) textarea,
        body:not(.custom-cursor-enabled) select,
        body:not(.custom-cursor-enabled) [contenteditable="true"] {
          cursor: text !important;
        }

        body:not(.custom-cursor-enabled) * {
          cursor: auto !important;
        }

        body:not(.custom-cursor-enabled) input,
        body:not(.custom-cursor-enabled) textarea,
        body:not(.custom-cursor-enabled) select,
        body:not(.custom-cursor-enabled) [contenteditable="true"] {
          cursor: text !important;
        }

