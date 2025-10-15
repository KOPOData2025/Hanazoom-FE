import axios from "axios";
import { getAccessToken, refreshAccessToken } from "@/app/utils/auth";

const api = axios.create({
  baseURL: "http:
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.request.use(
  (config) => {
    const url: string = (config.url as string) || "";
    const isAuthFree =
      url.includes("/members/login") ||
      url.includes("/members/signup") ||
      url.includes("/members/kakao-login") ||
      url.includes("/members/refresh") ||
      url.includes("/members/refresh-token");

    const token = getAccessToken();
    if (token && !isAuthFree) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


let isRefreshing = false;

let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];


const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};


api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;


    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {

      const requestUrl: string = (originalRequest?.url as string) || "";
      if (
        requestUrl.includes("/members/login") ||
        requestUrl.includes("/members/refresh") ||
        requestUrl.includes("/members/refresh-token")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {

        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            originalRequest.headers.Authorization = `Bearer ${getAccessToken()}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await refreshAccessToken();
        processQueue();
        originalRequest.headers.Authorization = `Bearer ${getAccessToken()}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;


export const API_ENDPOINTS = {

  login: "/members/login",
  signup: "/members/signup",
  logout: "/members/logout",
  refreshToken: "/members/refresh-token",
  kakaoLogin: "/members/kakao-login",


  regions: "/regions",


  stockTicker: "/stocks/ticker",
  stockSearch: "/stocks/search",
  stockRealtime: "/stocks/realtime",
  stockOrderbook: "/stocks/orderbook",


  watchlist: "/watchlist",
  watchlistCheck: "/watchlist/check",


  health: "/health",
} as const;


export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
