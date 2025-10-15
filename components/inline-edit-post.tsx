"use client";

import { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, TrendingUp, TrendingDown, X, Check, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImageToLocal } from "@/lib/api/upload";
import { toast } from "sonner";
import type { Post, PostSentiment } from "@/lib/api/community";

interface InlineEditPostProps {
  post: Post;
  onSave: (
    postId: number,
    data: {
      content: string;
      imageUrl?: string;
      sentiment?: PostSentiment;
    }
  ) => Promise<void>;
  onCancel: () => void;
}

const sentimentOptions = [
  { value: "BULLISH", label: "매수", icon: TrendingUp, color: "bg-red-500 hover:bg-red-600 text-white" },
  { value: "BEARISH", label: "매도", icon: TrendingDown, color: "bg-blue-500 hover:bg-blue-600 text-white" },
  { value: "NEUTRAL", label: "중립", icon: null, color: "bg-gray-500 hover:bg-gray-600 text-white" },
] as const;

export function InlineEditPost({ post, onSave, onCancel }: InlineEditPostProps) {
  const [content, setContent] = useState(post.content || "");
  const [imageUrl, setImageUrl] = useState(post.imageUrl || "");
  const [sentiment, setSentiment] = useState<PostSentiment>(post.sentiment || "NEUTRAL");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(post.imageUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent(post.content || "");
    setImageUrl(post.imageUrl || "");
    setSentiment(post.sentiment || "NEUTRAL");
    setImagePreview(post.imageUrl || "");
  }, [post]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;


    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드할 수 있습니다.');
      return;
    }


    if (file.size > 500 * 1024) {
      toast.error('파일 크기는 500KB를 초과할 수 없습니다.');
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);

    try {

      const imageUrl = await uploadImageToLocal(file);
      setImageUrl(imageUrl);
      setImagePreview(imageUrl);
      toast.success('이미지가 업로드되었습니다.');
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      toast.error('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImageUrl("");
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("내용을 입력해주세요");
      return;
    }

    console.log("인라인 편집 - 저장 데이터:", {
      postId: post.id,
      content: content.trim(),
      imageUrl: imageUrl.trim() || undefined,
      sentiment,
    });

    setIsLoading(true);
    try {
      await onSave(post.id, {
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
        sentiment,
      });
    } catch (error) {
      console.error("Failed to update post:", error);
      toast.error("게시글 수정에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="content" className="text-sm font-medium text-gray-900 dark:text-white">
          내용 *
        </Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="게시글 내용을 입력하세요..."
          className="min-h-[100px] resize-none text-sm"
        />
      </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <Label htmlFor="imageUrl" className="text-xs text-gray-600 dark:text-gray-400">
              또는 이미지 URL 직접 입력
            </Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="이미지 URL을 입력하세요"
              className="h-8 text-sm mt-1"
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">수정 중...</span>
        </div>
      )}
    </div>
  );
}
