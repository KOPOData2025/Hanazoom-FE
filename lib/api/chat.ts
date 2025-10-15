import { getAccessToken } from "@/app/utils/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http:

export interface RegionChatMessage {
  id: string;
  regionId: number;
  memberId: string;
  memberName: string;
  content: string;
  messageType: string;
  createdAt: string;
  images?: string[];
  imageCount?: number;
  portfolioStocks?: any[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export async function getRegionMessages(
  regionId: number,
  page: number = 0,
  size: number = 50
): Promise<RegionChatMessage[]> {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.warn("인증 토큰이 없습니다.");
      return [];
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/chat/region/${regionId}/messages?page=${page}&size=${size}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error("채팅 메시지 조회 실패:", response.statusText);
      return [];
    }

    const result: ApiResponse<RegionChatMessage[]> = await response.json();

    if (result.success && result.data) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.error("채팅 메시지 조회 중 오류 발생:", error);
    return [];
  }
}

export async function getRecentMessages(
  regionId: number,
  limit: number = 50
): Promise<RegionChatMessage[]> {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.warn("인증 토큰이 없습니다.");
      return [];
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/chat/region/${regionId}/recent?limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error("최근 채팅 메시지 조회 실패:", response.statusText);
      return [];
    }

    const result: ApiResponse<RegionChatMessage[]> = await response.json();

    if (result.success && result.data) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.error("최근 채팅 메시지 조회 중 오류 발생:", error);
    return [];
  }
}

export async function getMessageCount(regionId: number): Promise<number> {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.warn("인증 토큰이 없습니다.");
      return 0;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/chat/region/${regionId}/count`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error("메시지 개수 조회 실패:", response.statusText);
      return 0;
    }

    const result: ApiResponse<number> = await response.json();

    if (result.success && result.data !== undefined) {
      return result.data;
    }

    return 0;
  } catch (error) {
    console.error("메시지 개수 조회 중 오류 발생:", error);
    return 0;
  }
}

