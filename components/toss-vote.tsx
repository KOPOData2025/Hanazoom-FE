"use client";

import { useState, useEffect } from "react";
import { Heart, MessageSquare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { VoteOption } from "@/lib/api/community";

interface TossVoteProps {
  postId: number;
  voteQuestion: string;
  voteOptions: VoteOption[];
  totalVotes: number;
  userVote?: string;
  onVote: (optionId: string) => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
}

export function TossVote({
  postId,
  voteQuestion,
  voteOptions,
  totalVotes,
  userVote,
  onVote,
  onLike,
  onComment,
  onShare,
  isLiked,
  likeCount,
  commentCount,
}: TossVoteProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(
    userVote || null
  );
  const [hasVoted, setHasVoted] = useState(!!userVote);

  useEffect(() => {
    setSelectedOption(userVote || null);
    setHasVoted(!!userVote);
  }, [userVote]);

  const handleVote = (optionId: string) => {
    if (hasVoted) return;

    setSelectedOption(optionId);
    setHasVoted(true);
    onVote(optionId);
  };

  const getOptionStyle = (optionId: string) => {
    if (!hasVoted) {
      return "bg-gray-800 hover:bg-gray-700 border-gray-600 hover:border-gray-500";
    }

    if (selectedOption === optionId) {
      return "bg-blue-600 border-blue-500 text-white";
    }

    return "bg-gray-800 border-gray-600 opacity-60";
  };

  const getPercentage = (option: VoteOption) => {
    if (totalVotes === 0) return 0;
    return Math.round((option.voteCount / totalVotes) * 100);
  };

  return (
    <Card className="bg-gray-900 border-gray-700 text-white">
      <CardContent className="p-6">
        <div className="space-y-3 mb-6">
          {voteOptions.map((option) => (
            <div key={option.id} className="relative">
              <button
                onClick={() => handleVote(option.id)}
                disabled={hasVoted}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all duration-200 text-left",
                  "disabled:cursor-not-allowed",
                  getOptionStyle(option.id)
                )}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{option.text}</span>
                  {hasVoted && (
                    <span className="text-sm font-semibold">
                      {getPercentage(option)}%
                    </span>
                  )}
                </div>

        <div className="text-center mb-6">
          <p className="text-gray-300 text-sm">{totalVotes}명이 참여했어요</p>
        </div>

