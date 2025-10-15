"use client";

import { useState } from "react";
import { Heart, MessageSquare, Share2, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TossVote } from "./toss-vote";
import { cn } from "@/lib/utils";
import type { Post, VoteOption } from "@/lib/api/community";

interface TossPostCardProps {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onVote: (optionId: string) => void;
}

export function TossPostCard({
  post,
  onLike,
  onComment,
  onShare,
  onVote,
}: TossPostCardProps) {
  const [showVote, setShowVote] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "방금 전";
    if (diffInHours < 24) return `${diffInHours}시간 전`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}주 전`;

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}개월 전`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "bullish":
        return "text-green-400";
      case "bearish":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getSentimentText = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "bullish":
        return "매수";
      case "bearish":
        return "매도";
      default:
        return "중립";
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-700 text-white mb-4">
      <CardContent className="p-6">
        <div className="mb-4">
          <p className="text-white text-base leading-relaxed">{post.content}</p>

        {post.hasVote && post.voteOptions && post.voteOptions.length > 0 && (
          <div className="mb-4">
            <TossVote
              postId={post.id}
              voteQuestion={post.voteQuestion || "이 종목이 오를까요?"}
              voteOptions={post.voteOptions}
              totalVotes={post.voteOptions.reduce(
                (sum, opt) => sum + opt.voteCount,
                0
              )}
              userVote={post.userVote}
              onVote={onVote}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              isLiked={post.isLiked}
              likeCount={post.likeCount}
              commentCount={post.commentCount}
            />
          </div>
        )}

