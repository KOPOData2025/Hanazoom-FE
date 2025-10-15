"use client";

import { MapPin, Menu, X } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface EnhancedHeaderProps {
  scrolled: boolean;
}

export function EnhancedHeader({ scrolled }: EnhancedHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);


  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-gray-900/90 shadow-md backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className={`font-medium transition-colors duration-300 ${
              scrolled
                ? "text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
                : "text-green-800 dark:text-green-200 hover:text-green-950 dark:hover:text-white"
            }`}
          >
            홈
          </Link>
          <Link
            href="/community"
            className={`font-medium transition-colors duration-300 ${
              scrolled
                ? "text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
                : "text-green-800 dark:text-green-200 hover:text-green-950 dark:hover:text-white"
            }`}
          >
            커뮤니티
          </Link>
          <Link
            href="#features"
            className={`font-medium transition-colors duration-300 ${
              scrolled
                ? "text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
                : "text-green-800 dark:text-green-200 hover:text-green-950 dark:hover:text-white"
            }`}
          >
            기능
          </Link>
          <div className="h-5 w-px bg-green-300 dark:bg-green-700"></div>
          <Link href="/login">
            <Button
              variant="ghost"
              className={`transition-colors duration-300 ${
                scrolled
                  ? "text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900"
                  : "text-green-800 dark:text-green-200 hover:bg-green-200/50 dark:hover:bg-green-800/50"
              }`}
            >
              로그인
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow transition-all duration-300">
              회원가입
            </Button>
          </Link>
          <ThemeToggle />
        </nav>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg">
          <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link
              href="/"
              className="font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition-colors duration-300 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              홈
            </Link>
            <Link
              href="/community"
              className="font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition-colors duration-300 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              커뮤니티
            </Link>
            <Link
              href="#features"
              className="font-medium text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition-colors duration-300 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              기능
            </Link>
            <div className="h-px w-full bg-green-200 dark:bg-green-800 my-2"></div>
            <div className="flex space-x-4">
              <Link href="/login" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  로그인
                </Button>
              </Link>
              <Link href="/signup" className="flex-1">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  회원가입
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
