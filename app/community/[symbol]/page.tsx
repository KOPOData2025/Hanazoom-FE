"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  LogIn,
  Activity,
  BarChart3,
  Users,
  Clock,
  Star,
  Zap,
  Target,
  Award,
  Plus,
  Minus,
} from "lucide-react";
import NavBar from "@/app/components/Navbar";
import { OpinionForm } from "@/components/opinion-form";
import { StockInfoBar } from "@/components/stock-info-bar";
import { InstagramFeedItem } from "@/components/instagram-feed-item";
import { FloatingWriteButton } from "@/components/floating-write-button";
import { WritePostModal } from "@/components/write-post-modal";

import { getStock } from "@/lib/api/stock";
import {
  getPosts,
  createPost,
  likePost,
  unlikePost,
  voteOnPost,
  getPostVoteResults,
  getComments,
  createComment,
  likeComment,
  unlikeComment,
  deleteComment,
  updateComment,
  createReply,
  updatePost,
  deletePost,
} from "@/lib/api/community";
import { useAuthStore } from "@/app/utils/auth";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { Stock } from "@/lib/api/stock";
import type {
  Post,
  PostSentiment,
  VoteOption,
  Comment,
} from "@/lib/api/community";
import { toast } from "sonner";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";
import type { StockPriceData } from "@/lib/api/stock";
import { clearPWACache, hardRefresh } from "@/utils/clear-cache";
import { getBrandColorByStock } from "@/utils/color-utils";

export default function StockDiscussionPage() {
  const { symbol } = useParams();
  const router = useRouter();
  const { accessToken, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("all");
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const [stock, setStock] = useState<Stock | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);


  const [comments, setComments] = useState<Map<number, Comment[]>>(new Map());
  const [commentLoading, setCommentLoading] = useState<Set<number>>(new Set());
  const [showComments, setShowComments] = useState<Set<number>>(new Set());
  const [showDevTools, setShowDevTools] = useState(false);


  const [realtimeData, setRealtimeData] = useState<StockPriceData | null>(null);


  const { page, isLoadingMore, loadMore, reset, setLoadingMore } =
    useInfiniteScroll({
      hasMore,
      isLoading,
    });


  useEffect(() => {
    setIsClient(true);
  }, []);


  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHydrated(true);
      console.log("🔄 하이드레이션 완료, accessToken:", accessToken);
    }, 100); 

    return () => clearTimeout(timer);
  }, [accessToken]);


  const {
    connected: wsConnected,
    connecting: wsConnecting,
    error: wsError,
    stockData: wsStockData,
    lastUpdate,
    getStockDataMap,
  } = useStockWebSocket({
    stockCodes: symbol ? [symbol as string] : [],
    onStockUpdate: (data: StockPriceData) => {
      console.log("📊 실시간 데이터 수신:", data);
      setRealtimeData(data);
    },
    autoReconnect: true,
    reconnectInterval: 3000,
  });


  useEffect(() => {
    const fetchInitialData = async () => {
      if (!symbol) return;

      try {
        setIsLoading(true);
        setError(null);
        reset();


        const [stockResponse, postsResponse] = await Promise.all([
          getStock(symbol as string),
          getPosts(symbol as string, 0, 10),
        ]);
        
        console.log("📥 첫 페이지 API 응답 데이터:", postsResponse);
        console.log("🔍 로그인 상태:", !!accessToken);

        setStock(stockResponse);

        const validPosts =
          postsResponse.content?.filter((post) => post && post.id) || [];


        const postsWithVotes = validPosts.map((post) => ({
          ...post,
          isLiked: (post as any).liked === true, 
          likeCount: post.likeCount || 0,
        }));

        console.log("📝 최종 설정할 게시글 데이터:", postsWithVotes.map(post => ({
          id: post.id,
          isLiked: post.isLiked,
          likeCount: post.likeCount,
          author: post.author.name
        })));

        setPosts(postsWithVotes);
        setHasMore(postsResponse.content?.length === 10);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [symbol, accessToken, reset]);


  useEffect(() => {
    if (isClient && accessToken && posts.length > 0) {
      console.log("🔄 로그인 상태 변경으로 인한 좋아요 상태 재확인");

      const refreshPosts = async () => {
        try {
          const postsResponse = await getPosts(symbol as string, 0, 10);
          const validPosts = postsResponse.content?.filter((post) => post && post.id) || [];
          const postsWithVotes = validPosts.map((post) => ({
            ...post,
            isLiked: (post as any).liked === true, 
            likeCount: post.likeCount || 0,
          }));
          setPosts(postsWithVotes);
        } catch (error) {
          console.error("Failed to refresh posts:", error);
        }
      };
      refreshPosts();
    }
  }, [accessToken, isClient, symbol]);


  useEffect(() => {
    const loadMorePosts = async () => {
      if (!symbol || page === 0 || isLoadingMore) return;

      try {
        setLoadingMore(true);
        const postsResponse = await getPosts(symbol as string, page, 10);
        const newPosts =
          postsResponse.content?.filter((post) => post && post.id) || [];

        if (newPosts.length === 0) {
          setHasMore(false);
          return;
        }


        const postsWithVotes = newPosts.map((post) => ({
          ...post,
          isLiked: (post as any).liked === true, 
          likeCount: post.likeCount || 0,
        }));

        setPosts((prev) => [...prev, ...postsWithVotes]);
        setHasMore(newPosts.length === 10);
      } catch (error) {
        console.error("Failed to load more posts:", error);
        toast.error("추가 게시글을 불러오는데 실패했습니다.");
      } finally {
        setLoadingMore(false);
      }
    };

    loadMorePosts();
  }, [page, symbol, accessToken, isLoadingMore, setLoadingMore]);


  const fetchedVoteResultsRef = useRef<Set<number>>(new Set());
  const inFlightVoteResultsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!isClient || !accessToken) return;
    if (!posts || posts.length === 0) return;

    const candidates = posts.filter(
      (p) =>
        p && p.id && (p.hasVote || p.postType === "POLL") &&
        (
          (!!p.userVote && (!p.voteOptions || p.voteOptions.length === 0)) ||
          (!p.userVote) 
        )
    );

    const targets = candidates.filter(
      (p) => !fetchedVoteResultsRef.current.has(p.id) && !inFlightVoteResultsRef.current.has(p.id)
    );

    if (targets.length === 0) return;

    (async () => {
      try {
        targets.forEach((p) => inFlightVoteResultsRef.current.add(p.id));
        const results = await Promise.all(
          targets.map(async (p) => {
            try {
              const data = await getPostVoteResults(p.id);
              return { id: p.id, data };
            } catch (e) {
              console.error("Failed to fetch vote results for post:", p.id, e);
              return null;
            }
          })
        );

        const valid = results.filter(Boolean) as { id: number; data: any }[];
        if (valid.length > 0) {
          setPosts((prev) =>
            prev.map((post) => {
              const found = valid.find((v) => v.id === post.id);
              if (!found) return post;
              return {
                ...post,
                voteOptions: found.data.voteOptions,
                userVote: found.data.userVote,
              };
            })
          );
        }
      } finally {
        targets.forEach((p) => {
          inFlightVoteResultsRef.current.delete(p.id);
          fetchedVoteResultsRef.current.add(p.id);
        });
      }
    })();
  }, [isClient, accessToken, posts]);

  const handleCreatePost = async (data: {
    content: string;
    sentiment: PostSentiment;
    postType?: "TEXT" | "POLL";
    hasVote?: boolean;
    voteOptions?: string[];
    voteQuestion?: string;
    imageUrl?: string;
  }) => {

    if (!isClient || !accessToken) {
      toast.error("게시글을 작성하려면 로그인이 필요합니다.");
      const redirectUrl = `/login?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      window.location.href = redirectUrl;
      return;
    }

    try {
      console.log("게시글 작성 시작:", { symbol, data });
      console.log("이미지 URL 확인:", { imageUrl: data.imageUrl, hasImage: !!data.imageUrl });
      console.log("전송할 데이터 상세:", {
        content: data.content,
        sentiment: data.sentiment,
        postType: data.postType,
        hasVote: data.hasVote,
        voteQuestion: data.voteQuestion,
        voteOptions: data.voteOptions,
        imageUrl: data.imageUrl,
      });
      const response = await createPost(symbol as string, data);
      console.log("게시글 작성 응답:", response);

      if (response && response.id) {

        let postWithVotes = response;
        console.log("응답 분석:", {
          hasVote: response.hasVote,
          postType: response.postType,
          accessToken: !!accessToken,
          shouldFetchVotes:
            (response.hasVote || response.postType === "POLL") && !!accessToken,
        });


        if (response.hasVote || response.postType === "POLL") {
          console.log("백엔드 응답의 투표 데이터 사용:", {
            hasVote: response.hasVote,
            voteQuestion: response.voteQuestion,
            voteOptions: response.voteOptions,
            userVote: response.userVote,
          });
          postWithVotes = response; 
        } else {
          console.log("투표가 없는 일반 게시글:", {
            hasVote: response.hasVote,
            postType: response.postType,
          });
          postWithVotes = response;
        }

        console.log("게시글 추가:", postWithVotes);
        setPosts([postWithVotes, ...posts]);
      } else {
        console.warn("응답이 유효하지 않음:", response);
      }
      setShowWriteModal(false);
    } catch (error: any) {
      console.error("Failed to create post:", error);

      if (error.response?.status === 403) {
        toast.error("권한이 없습니다. 다시 로그인해주세요.");
        const redirectUrl = `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;
        window.location.href = redirectUrl;
      } else {
        toast.error("게시글 작성에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  const handleLikePost = async (postId: number) => {
    if (!isClient || !accessToken) {
      toast.error("좋아요를 누르려면 로그인이 필요합니다.");
      const redirectUrl = `/login?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      window.location.href = redirectUrl;
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    console.log("❤️ 좋아요 처리 시작 - 게시글 ID:", postId, "현재 상태:", post.isLiked, "좋아요 수:", post.likeCount);


    const previousState = {
      isLiked: post.isLiked,
      likeCount: post.likeCount
    };


    if (post.isLiked) {
      console.log("👎 좋아요 취소 시도 - UI 먼저 업데이트");
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? { ...p, isLiked: false, likeCount: Math.max(0, p.likeCount - 1) }
            : p
        )
      );
    } else {
      console.log("👍 좋아요 시도 - UI 먼저 업데이트");
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? { ...p, isLiked: true, likeCount: p.likeCount + 1 }
            : p
        )
      );
    }

    try {
      if (post.isLiked) {
        console.log("👎 좋아요 취소 API 호출");
        await unlikePost(postId);
        console.log("✅ 좋아요 취소 완료");
      } else {
        console.log("👍 좋아요 API 호출");
        await likePost(postId);
        console.log("✅ 좋아요 완료");
      }
    } catch (error: any) {
      console.error("❌ Failed to like/unlike post:", error);


      console.log("🔄 에러 발생으로 인한 UI 상태 복원");
      setPosts(
        posts.map((p) =>
          p.id === postId
            ? { ...p, isLiked: previousState.isLiked, likeCount: previousState.likeCount }
            : p
        )
      );

      if (error.response?.status === 403) {
        toast.error("권한이 없습니다. 다시 로그인해주세요.");
        router.push("/login");
      } else if (error.response?.status === 400) {

        console.log("⚠️ 중복 좋아요/취소 시도로 인한 400 에러");
        

        if (post.isLiked) {

          console.log("🔄 서버에서 이미 좋아요 취소된 상태로 확인됨");
        } else {

          console.log("🔄 서버에서 이미 좋아요된 상태로 확인됨");
        }
        

        console.log("✅ 서버 상태와 동기화 완료");
      } else {

        toast.error("좋아요 처리에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  const handleShare = async (postId: number) => {
    try {
      await navigator.share({
        title: `${stock?.name} 관련 게시글`,
        text: posts.find((p) => p.id === postId)?.content,
        url: window.location.href,
      });
    } catch (error) {
      console.error("Failed to share:", error);

      const post = posts.find((p) => p.id === postId);
      if (post) {
        const shareText = `${stock?.name} 관련 게시글\n\n${post.content}\n\n${window.location.href}`;
        await navigator.clipboard.writeText(shareText);
        alert("게시글 링크가 클립보드에 복사되었습니다.");
      }
    }
  };

  const handleVote = async (postId: number, optionId: string) => {
    if (!isClient || !accessToken) {
      toast.error("투표하려면 로그인이 필요합니다.");
      const redirectUrl = `/login?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      window.location.href = redirectUrl;
      return;
    }

    try {
      await voteOnPost(postId, optionId);

      try {
        const voteResults = await getPostVoteResults(postId);
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  voteOptions: voteResults.voteOptions,
                  userVote: voteResults.userVote,
                }
              : post
          )
        );
      } catch (error) {
        console.error("Failed to fetch vote results:", error);
      }
      toast.success("투표가 완료되었습니다! 되돌릴 수 없습니다.");
    } catch (error: any) {
      console.error("Failed to vote:", error);

      const status = error?.response?.status;
      if (status === 403) {
        toast.error("권한이 없습니다. 다시 로그인해주세요.");
        const redirectUrl = `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;
        window.location.href = redirectUrl;
      } else if (status === 400 || status === 409) {

        toast.info("이미 투표한 항목이 있습니다. 결과를 갱신합니다.");
        try {
          const voteResults = await getPostVoteResults(postId);
          setPosts((prev) =>
            prev.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    voteOptions: voteResults.voteOptions,
                    userVote: voteResults.userVote,
                  }
                : post
            )
          );
        } catch (syncError) {
          console.error("Failed to sync vote results after already-voted error:", syncError);
        }
      } else {
        toast.error("투표 처리에 실패했습니다.");
      }
    }
  };



  const handleToggleComments = async (postId: number) => {
    if (!isClient || !accessToken) {
      toast.error("댓글을 보려면 로그인이 필요합니다.");
      const redirectUrl = `/login?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      window.location.href = redirectUrl;
      return;
    }

    const isCurrentlyShowing = showComments.has(postId);
    
    if (isCurrentlyShowing) {

      setShowComments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {

      setShowComments((prev) => new Set(prev).add(postId));
      

      if (!comments.has(postId)) {
        setCommentLoading((prev) => new Set(prev).add(postId));
        try {
          const response = await getComments(postId, 0, 20);

          const commentsWithLiked = (response.content || []).map((comment: any) => ({
            ...comment,
            isLiked: comment.liked === true, 
          }));
          setComments((prev) =>
            new Map(prev).set(
              postId,
              commentsWithLiked as unknown as Comment[]
            )
          );
        } catch (error) {
          console.error("Failed to load comments:", error);
          toast.error("댓글을 불러오는데 실패했습니다.");
        } finally {
          setCommentLoading((prev) => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
        }
      }
    }
  };


  const handleCreateComment = async (postId: number, content: string) => {
    if (!isClient || !accessToken) {
      toast.error("댓글을 작성하려면 로그인이 필요합니다.");
      const redirectUrl = `/login?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      window.location.href = redirectUrl;
      return;
    }

    try {
      const newComment = await createComment(postId, { content });


      setComments((prev) => {
        const newMap = new Map(prev);
        const existingComments = newMap.get(postId) || [];
        const commentWithLiked = {
          ...newComment,
          isLiked: (newComment as any).liked === true, 
        };
        newMap.set(postId, [commentWithLiked, ...existingComments]);
        return newMap;
      });


      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, commentCount: post.commentCount + 1 }
            : post
        )
      );

      toast.success("댓글이 작성되었습니다.");
    } catch (error: any) {
      console.error("Failed to create comment:", error);

      if (error.response?.status === 403) {
        toast.error("권한이 없습니다. 다시 로그인해주세요.");
        const redirectUrl = `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;
        window.location.href = redirectUrl;
      } else {
        toast.error("댓글 작성에 실패했습니다.");
      }
    }
  };

  const handleLikeComment = async (commentId: number, postId: number) => {
    if (!isClient || !accessToken) {
      toast.error("좋아요를 누르려면 로그인이 필요합니다.");
      const redirectUrl = `/login?redirect=${encodeURIComponent(
        window.location.pathname
      )}`;
      window.location.href = redirectUrl;
      return;
    }

    try {
      const postComments = comments.get(postId) || [];
      const comment = postComments.find((c) => c.id === commentId);

      if (!comment) return;

      if (comment.isLiked) {
        await unlikeComment(commentId);
        setComments((prev) => {
          const newMap = new Map(prev);
          const updatedComments = postComments.map((c) =>
            c.id === commentId
              ? { ...c, isLiked: false, likeCount: c.likeCount - 1 }
              : c
          );
          newMap.set(postId, updatedComments);
          return newMap;
        });
      } else {
        await likeComment(commentId);
        setComments((prev) => {
          const newMap = new Map(prev);
          const updatedComments = postComments.map((c) =>
            c.id === commentId
              ? { ...c, isLiked: true, likeCount: c.likeCount + 1 }
              : c
          );
          newMap.set(postId, updatedComments);
          return newMap;
        });
      }
    } catch (error: any) {
      console.error("Failed to like/unlike comment:", error);

      if (error.response?.status === 403) {
        toast.error("권한이 없습니다. 다시 로그인해주세요.");
        const redirectUrl = `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;
        window.location.href = redirectUrl;
      } else {
        toast.error("좋아요 처리에 실패했습니다.");
      }
    }
  };

  const handleDeleteComment = async (commentId: number, postId: number) => {
    if (!isClient || !accessToken) {
      toast.error("댓글을 삭제하려면 로그인이 필요합니다.");
      return;
    }

    if (!confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      await deleteComment(commentId);


      setComments((prev) => {
        const newMap = new Map(prev);
        const updatedComments = (newMap.get(postId) || []).filter(
          (c) => c.id !== commentId
        );
        newMap.set(postId, updatedComments);
        return newMap;
      });


      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, commentCount: Math.max(0, post.commentCount - 1) }
            : post
        )
      );

      toast.success("댓글이 삭제되었습니다.");
    } catch (error: any) {
      console.error("Failed to delete comment:", error);

      if (error.response?.status === 403) {
        toast.error("권한이 없습니다. 다시 로그인해주세요.");
        const redirectUrl = `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;
        window.location.href = redirectUrl;
      } else {
        toast.error("댓글 삭제에 실패했습니다.");
      }
    }
  };


  const handleEditPost = async (postId: number, data: {
    content: string;
    imageUrl?: string;
    sentiment?: PostSentiment;
  }) => {
    if (!isClient || !accessToken) {
      toast.error("게시글을 수정하려면 로그인이 필요합니다.");
      return;
    }

    try {
      const updatedPost = await updatePost(postId, data);
      

      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, ...updatedPost, isLiked: (updatedPost as any).liked === true }
            : post
        )
      );

      toast.success("게시글이 수정되었습니다");
    } catch (error) {
      console.error("Failed to update post:", error);
      toast.error("게시글 수정에 실패했습니다");
      throw error;
    }
  };


  const handleDeletePost = async (postId: number) => {
    if (!isClient || !accessToken) {
      toast.error("게시글을 삭제하려면 로그인이 필요합니다.");
      return;
    }

    try {
      await deletePost(postId);
      

      setPosts((prev) => prev.filter((post) => post.id !== postId));

      toast.success("게시글이 삭제되었습니다");
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("게시글 삭제에 실패했습니다");
    }
  };

  const filteredPosts =
    posts?.filter((post) => {
      if (!post || !post.id) return false;

      if (activeTab === "all") return true;


      switch (activeTab) {
        case "bullish":
          return post.sentiment === "BULLISH";
        case "bearish":
          return post.sentiment === "BEARISH";
        case "neutral":
          return post.sentiment === "NEUTRAL";
        default:
          return false;
      }
    }) || [];

  if (!isClient || !isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="container mx-auto px-4 py-8 pt-40">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative mb-8">
              <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
              <div
                className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-400 rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              ></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {!isClient ? "로딩 중..." : "인증 정보 확인 중..."}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              {!isClient ? "페이지를 준비하고 있습니다" : "사용자 정보를 확인하고 있습니다"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="container mx-auto px-4 py-8 pt-40">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative mb-8">
              <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
              <div
                className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-400 rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              ></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              데이터를 불러오는 중...
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              주식 정보와 피드를 가져오고 있습니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="container mx-auto px-4 py-8 pt-40">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Card className="max-w-md mx-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-red-200 dark:border-red-700 shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  오류가 발생했습니다
                </h3>
                <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  다시 시도
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />

        <div className="sticky top-32 z-40 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="container mx-auto px-4 py-3">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-auto"
            >
              <TabsList className="minimal-tabs bg-gray-100 dark:bg-gray-800">
                <TabsTrigger
                  value="all"
                  className="minimal-tab-trigger font-['Pretendard'] text-gray-600 dark:text-gray-300 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-600 data-[state=active]:shadow-lg"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  전체
                </TabsTrigger>
                <TabsTrigger
                  value="bullish"
                  className="minimal-tab-trigger font-['Pretendard'] text-red-600 dark:text-red-400 data-[state=active]:bg-red-100 dark:data-[state=active]:bg-red-900/50 data-[state=active]:text-red-800 dark:data-[state=active]:text-red-200 data-[state=active]:border-red-200 dark:data-[state=active]:border-red-700 data-[state=active]:shadow-lg"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  매수
                </TabsTrigger>
                <TabsTrigger
                  value="bearish"
                  className="minimal-tab-trigger font-['Pretendard'] text-blue-600 dark:text-blue-400 data-[state=active]:bg-blue-100 dark:data-[state=active]:bg-blue-900/50 data-[state=active]:text-blue-800 dark:data-[state=active]:text-blue-200 data-[state=active]:border-blue-200 dark:data-[state=active]:border-blue-700 data-[state=active]:shadow-lg"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  매도
                </TabsTrigger>
                <TabsTrigger
                  value="neutral"
                  className="minimal-tab-trigger font-['Pretendard'] text-gray-500 dark:text-gray-400 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-700 dark:data-[state=active]:text-gray-200 data-[state=active]:border-gray-200 dark:data-[state=active]:border-gray-600 data-[state=active]:shadow-lg"
                >
                  <Minus className="w-4 h-4 mr-2" />
                  중립
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

          {isLoadingMore && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
          )}

      <FloatingWriteButton
        onClick={() => setShowWriteModal(true)}
        isLoggedIn={isClient && !!accessToken}
      />

      {showWriteModal && isClient && accessToken && (
        <WritePostModal
          isOpen={showWriteModal}
          onClose={() => setShowWriteModal(false)}
          onSubmit={handleCreatePost}
        />
      )}

    </div>
  );
}
