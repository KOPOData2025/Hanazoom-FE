"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Heart,
  MessageCircle,
  Reply,
  MoreVertical,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { Comment } from "@/lib/api/community";
import {
  getComments,
  getReplies,
  createComment,
  createReply,
  likeComment,
  unlikeComment,
} from "@/lib/api/community";

interface CommentSectionProps {
  postId: number;
  className?: string;
}

interface CommentItemProps {
  comment: Comment;
  onLike: (commentId: number) => void;
  onReply: (parentCommentId: number, content: string) => void;
  currentUserId?: string;
}

function CommentItem({
  comment,
  onLike,
  onReply,
  currentUserId,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replies, setReplies] = useState<Comment[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await onReply(comment.id, replyContent);
      setReplyContent("");
      setShowReplyForm(false);

      if (showReplies) {
        loadReplies();
      }
    } catch (error) {
      console.error("Failed to create reply:", error);
    }
  };

  const loadReplies = async () => {
    if (comment.depth > 0) return; 

    setIsLoadingReplies(true);
    try {
      const repliesData = await getReplies(comment.id);
      setReplies(repliesData);
    } catch (error) {
      console.error("Failed to load replies:", error);
    } finally {
      setIsLoadingReplies(false);
    }
  };

  const toggleReplies = () => {
    if (!showReplies && replies.length === 0) {
      loadReplies();
    }
    setShowReplies(!showReplies);
  };

  const isOwner = currentUserId === comment.author.id;

  return (
    <div
      className={`${
        comment.depth > 0 ? "ml-8 border-l-2 border-gray-200 pl-4" : ""
      }`}
    >
      <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
            {comment.content}
          </p>

          {showReplyForm && (
            <form onSubmit={handleSubmitReply} className="mt-4 space-y-3">
              <Textarea
                placeholder="답글을 작성해주세요..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReplyForm(false)}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyContent.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4 mr-1" />
                  답글 달기
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea
              placeholder="댓글을 작성해주세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {comments.length}개의 댓글
              </p>
              <Button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {isSubmitting ? "작성 중..." : "댓글 작성"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

