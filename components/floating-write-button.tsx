"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FloatingWriteButtonProps {
  onClick: () => void;
  isLoggedIn: boolean;
}

export function FloatingWriteButton({ onClick, isLoggedIn }: FloatingWriteButtonProps) {
  if (!isLoggedIn) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button
        onClick={onClick}
        size="lg"
        className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
      >
        <span className="text-2xl">✍️</span>
      </Button>
      
