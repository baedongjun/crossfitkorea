import axios from "axios";
import { ApiResponse, AuthResponse } from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: JWT 토큰 자동 첨부
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: 401 시 refresh token으로 자동 재발급
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== "undefined"
    ) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/auth/refresh`,
          { refreshToken }
        );
        const { accessToken, refreshToken: newRefresh, email, name, role } = res.data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefresh);
        localStorage.setItem("user", JSON.stringify({ email, name, role }));
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  signup: (data: { email: string; password: string; name: string; phone?: string }) =>
    api.post<ApiResponse<AuthResponse>>("/api/v1/auth/signup", data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>("/api/v1/auth/login", data),

  refresh: (refreshToken: string) =>
    api.post("/api/v1/auth/refresh", { refreshToken }),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<string>>("/api/v1/auth/forgot-password", { email }),
};

// Upload API
export const uploadApi = {
  uploadImage: (file: File, folder = "general") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    return api.post<ApiResponse<string>>("/api/v1/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadImages: (files: File[], folder = "general") => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("folder", folder);
    return api.post<ApiResponse<string[]>>("/api/v1/upload/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getPresignedUrl: (filename: string, folder = "general", contentType = "image/jpeg") =>
    api.get<ApiResponse<{ presignedUrl: string; key: string; publicUrl: string }>>("/api/v1/upload/presigned", {
      params: { filename, folder, contentType },
    }),
};

// Box API
export const boxApi = {
  search: (params: { city?: string; district?: string; keyword?: string; page?: number; size?: number; verified?: boolean; premium?: boolean; maxFee?: number; minRating?: number; sort?: string }) =>
    api.get("/api/v1/boxes", { params }),

  getOne: (id: number) =>
    api.get(`/api/v1/boxes/${id}`),

  getPremium: () =>
    api.get("/api/v1/boxes/premium"),

  getMy: (page = 0) =>
    api.get("/api/v1/boxes/my", { params: { page } }),

  create: (data: object) =>
    api.post("/api/v1/boxes", data),

  update: (id: number, data: object) =>
    api.put(`/api/v1/boxes/${id}`, data),

  delete: (id: number) =>
    api.delete(`/api/v1/boxes/${id}`),

  getCoaches: (boxId: number) =>
    api.get(`/api/v1/boxes/${boxId}/coaches`),

  getSchedules: (boxId: number) =>
    api.get(`/api/v1/boxes/${boxId}/schedules`),

  getReviews: (boxId: number, page = 0) =>
    api.get(`/api/v1/boxes/${boxId}/reviews`, { params: { page } }),

  createReview: (boxId: number, data: { rating: number; content: string }) =>
    api.post(`/api/v1/boxes/${boxId}/reviews`, data),

  addCoach: (boxId: number, data: { name: string; bio?: string; experienceYears?: number; certifications?: string[]; imageUrl?: string }) =>
    api.post(`/api/v1/boxes/${boxId}/coaches`, data),

  updateCoach: (coachId: number, data: { name: string; bio?: string; imageUrl?: string; experienceYears?: number; certifications?: string[] }) =>
    api.put(`/api/v1/coaches/${coachId}`, data),

  deleteCoach: (coachId: number) =>
    api.delete(`/api/v1/coaches/${coachId}`),

  addSchedule: (boxId: number, data: { dayOfWeek: string; startTime: string; endTime: string; className: string; maxCapacity?: number }) =>
    api.post(`/api/v1/boxes/${boxId}/schedules`, data),

  updateSchedule: (scheduleId: number, data: { dayOfWeek: string; startTime: string; endTime: string; className?: string; maxCapacity?: number; coachId?: number }) =>
    api.put(`/api/v1/schedules/${scheduleId}`, data),

  deleteSchedule: (scheduleId: number) =>
    api.delete(`/api/v1/schedules/${scheduleId}`),

  updateReview: (reviewId: number, data: { rating: number; content: string }) =>
    api.put(`/api/v1/reviews/${reviewId}`, data),

  deleteReview: (reviewId: number) =>
    api.delete(`/api/v1/reviews/${reviewId}`),

  toggleFavorite: (boxId: number) =>
    api.post(`/api/v1/boxes/${boxId}/favorite`),

  checkFavorite: (boxId: number) =>
    api.get(`/api/v1/boxes/${boxId}/favorite`),

  getNotices: (boxId: number, page = 0) =>
    api.get(`/api/v1/boxes/${boxId}/notices`, { params: { page } }),

  createNotice: (boxId: number, data: { title: string; content: string; pinned?: boolean }) =>
    api.post(`/api/v1/boxes/${boxId}/notices`, data),

  updateNotice: (boxId: number, noticeId: number, data: { title: string; content: string; pinned?: boolean }) =>
    api.put(`/api/v1/boxes/${boxId}/notices/${noticeId}`, data),

  deleteNotice: (boxId: number, noticeId: number) =>
    api.delete(`/api/v1/boxes/${boxId}/notices/${noticeId}`),
};

// WOD API
export const wodApi = {
  getToday: (boxId?: number) =>
    api.get("/api/v1/wod/today", { params: boxId ? { boxId } : {} }),

  getHistory: (page = 0, size = 20) =>
    api.get("/api/v1/wod/history", { params: { page, size } }),

  createBoxWod: (boxId: number, data: object) =>
    api.post(`/api/v1/wod`, data, { params: { boxId } }),

  getRange: (boxId: number, start: string, end: string) =>
    api.get("/api/v1/wod/range", { params: { boxId, start, end } }),
};

// Competition API
export const competitionApi = {
  getAll: (params?: { status?: string; city?: string; page?: number; size?: number }) =>
    api.get("/api/v1/competitions", { params }),

  getOne: (id: number) =>
    api.get(`/api/v1/competitions/${id}`),

  getRegistrationStatus: (id: number) =>
    api.get(`/api/v1/competitions/${id}/registration-status`),

  register: (id: number) =>
    api.post(`/api/v1/competitions/${id}/register`),

  cancelRegistration: (id: number) =>
    api.delete(`/api/v1/competitions/${id}/register`),

  getMyRegistrations: () =>
    api.get("/api/v1/competitions/my"),
};

// Notification API
export const notificationApi = {
  getAll: () =>
    api.get("/api/v1/notifications"),

  getUnreadCount: () =>
    api.get("/api/v1/notifications/count"),

  markAsRead: (id: number) =>
    api.patch(`/api/v1/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch("/api/v1/notifications/read-all"),
};

// Community API
export const communityApi = {
  getHotPosts: () =>
    api.get("/api/v1/community/posts/hot"),

  getPosts: (params?: { category?: string; keyword?: string; page?: number; sort?: string; size?: number }) =>
    api.get("/api/v1/community/posts", { params }),

  getMyPosts: (page = 0) =>
    api.get("/api/v1/community/posts/mine", { params: { page } }),

  getPost: (id: number) =>
    api.get(`/api/v1/community/posts/${id}`),

  createPost: (data: { title: string; content: string; category: string; imageUrls?: string[] }) =>
    api.post("/api/v1/community/posts", data),

  updatePost: (id: number, data: object) =>
    api.put(`/api/v1/community/posts/${id}`, data),

  deletePost: (id: number) =>
    api.delete(`/api/v1/community/posts/${id}`),

  likePost: (id: number) =>
    api.post(`/api/v1/community/posts/${id}/like`),

  getComments: (postId: number) =>
    api.get(`/api/v1/community/posts/${postId}/comments`),

  createComment: (postId: number, content: string, parentId?: number) =>
    api.post(`/api/v1/community/posts/${postId}/comments`, { content, parentId }),

  updateComment: (commentId: number, content: string) =>
    api.put(`/api/v1/community/comments/${commentId}`, { content }),

  deleteComment: (commentId: number) =>
    api.delete(`/api/v1/community/comments/${commentId}`),

  reportPost: (id: number) =>
    api.post(`/api/v1/community/posts/${id}/report`),

  likeComment: (commentId: number) =>
    api.post(`/api/v1/community/comments/${commentId}/like`),
};

// Leaderboard API
export const leaderboardApi = {
  getLeaderboard: (date: string) =>
    api.get("/api/v1/wod/records/leaderboard", { params: { date } }),

  getBoxRanking: (date: string) =>
    api.get("/api/v1/wod/records/box-ranking", { params: { date } }),
};

// Membership API
export const membershipApi = {
  join: (boxId: number) =>
    api.post(`/api/v1/boxes/${boxId}/join`),

  leave: (boxId: number) =>
    api.delete(`/api/v1/boxes/${boxId}/join`),

  checkMembership: (boxId: number) =>
    api.get(`/api/v1/boxes/${boxId}/membership`),

  getMemberCount: (boxId: number) =>
    api.get(`/api/v1/boxes/${boxId}/members/count`),

  getBoxMembers: (boxId: number) =>
    api.get(`/api/v1/boxes/${boxId}/members`),

  getMyBox: () =>
    api.get("/api/v1/users/me/box"),
};

// Badge API
export const badgeApi = {
  getMyBadges: () =>
    api.get("/api/v1/users/me/badges"),

  getUserBadges: (userId: number) =>
    api.get(`/api/v1/badges/users/${userId}`),
};

// WOD Record API
export const wodRecordApi = {
  getMyRecords: (page = 0) =>
    api.get("/api/v1/wod/records", { params: { page } }),

  getRecentRecords: (days = 30) =>
    api.get("/api/v1/wod/records/recent", { params: { days } }),

  getTodayRecord: () =>
    api.get("/api/v1/wod/records/today"),

  saveRecord: (data: { wodDate?: string; score?: string; notes?: string; rx?: boolean }) =>
    api.post("/api/v1/wod/records", data),

  deleteRecord: (id: number) =>
    api.delete(`/api/v1/wod/records/${id}`),
};

// User API
export const userApi = {
  getMe: () =>
    api.get("/api/v1/users/me"),

  updateMe: (data: { name: string; phone?: string; profileImageUrl?: string }) =>
    api.put("/api/v1/users/me", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/api/v1/users/me/password", data),

  getMyReviews: (page = 0) =>
    api.get("/api/v1/users/me/reviews", { params: { page } }),

  getMyFavorites: (page = 0) =>
    api.get("/api/v1/users/me/favorites", { params: { page } }),

  getMyComments: (page = 0) =>
    api.get("/api/v1/users/me/comments", { params: { page } }),

  deleteMyAccount: () =>
    api.delete("/api/v1/users/me"),

  getPublicProfile: (id: number) =>
    api.get(`/api/v1/users/${id}/profile`),
};

// Stats API
export const statsApi = {
  getPublicStats: () =>
    api.get<ApiResponse<{ totalBoxes: number; totalUsers: number; totalPosts: number; totalCompetitions: number }>>("/api/v1/stats"),
};

// Payment API
export const paymentApi = {
  initiate: (data: { competitionId: number; orderId: string; orderName: string }) =>
    api.post("/api/v1/payments/toss/initiate", data),

  confirm: (data: { paymentKey: string; orderId: string; amount: number }) =>
    api.post("/api/v1/payments/toss/confirm", data),
};

// Admin API
export const adminApi = {
  getDashboard: (months = 6) =>
    api.get("/api/v1/admin/dashboard", { params: { months } }),

  getBoxes: (page = 0) =>
    api.get("/api/v1/admin/boxes", { params: { page } }),

  verifyBox: (id: number, verified: boolean) =>
    api.patch(`/api/v1/admin/boxes/${id}/verify`, null, { params: { verified } }),

  setPremium: (id: number, premium: boolean) =>
    api.patch(`/api/v1/admin/boxes/${id}/premium`, null, { params: { premium } }),

  createCompetition: (data: object) =>
    api.post("/api/v1/admin/competitions", data),

  updateCompetitionStatus: (id: number, status: string) =>
    api.patch(`/api/v1/admin/competitions/${id}/status`, null, { params: { status } }),

  createCommonWod: (data: object) =>
    api.post("/api/v1/admin/wod", data),

  getUsers: (page = 0, keyword?: string) =>
    api.get("/api/v1/admin/users", { params: { page, keyword } }),

  toggleUserActive: (id: number, active: boolean) =>
    api.patch(`/api/v1/admin/users/${id}/active`, null, { params: { active } }),

  updateUserRole: (id: number, role: string) =>
    api.patch(`/api/v1/admin/users/${id}/role`, null, { params: { role } }),

  getPosts: (page = 0) =>
    api.get("/api/v1/admin/posts", { params: { page } }),

  deletePost: (id: number) =>
    api.delete(`/api/v1/admin/posts/${id}`),

  togglePinPost: (id: number) =>
    api.patch(`/api/v1/admin/posts/${id}/pin`),

  deleteComment: (id: number) =>
    api.delete(`/api/v1/admin/comments/${id}`),

  getReviews: (page = 0, minRating?: number) =>
    api.get("/api/v1/admin/reviews", { params: { page, minRating } }),

  deleteReview: (id: number) =>
    api.delete(`/api/v1/admin/reviews/${id}`),

  getBadges: (page = 0) =>
    api.get("/api/v1/admin/badges", { params: { page } }),

  getBadgeTypes: () =>
    api.get("/api/v1/admin/badges/types"),

  awardBadge: (userId: number, badgeType: string) =>
    api.post("/api/v1/admin/badges/award", { userId, badgeType }),

  revokeBadge: (id: number) =>
    api.delete(`/api/v1/admin/badges/${id}`),

  updateWod: (id: number, data: object) =>
    api.put(`/api/v1/admin/wod/${id}`, data),

  deleteWod: (id: number) =>
    api.delete(`/api/v1/admin/wod/${id}`),

  deleteCompetition: (id: number) =>
    api.delete(`/api/v1/admin/competitions/${id}`),

  updateCompetition: (id: number, data: object) =>
    api.put(`/api/v1/admin/competitions/${id}`, data),

  getReportedPosts: (page = 0) =>
    api.get("/api/v1/admin/posts/reported", { params: { page } }),

  clearReports: (id: number) =>
    api.patch(`/api/v1/admin/posts/${id}/clear-reports`),
};

// Challenge API
export const challengeApi = {
  getAll: () => api.get("/api/v1/challenges"),
  getOne: (id: number) => api.get(`/api/v1/challenges/${id}`),
  getMy: () => api.get("/api/v1/challenges/my"),
  join: (id: number) => api.post(`/api/v1/challenges/${id}/join`),
  leave: (id: number) => api.delete(`/api/v1/challenges/${id}/join`),
  verify: (id: number, data: { content?: string; imageUrl?: string }) =>
    api.post(`/api/v1/challenges/${id}/verify`, data),
  getLeaderboard: (id: number) => api.get(`/api/v1/challenges/${id}/leaderboard`),
  // Admin
  create: (data: object) => api.post("/api/v1/admin/challenges", data),
  update: (id: number, data: object) => api.put(`/api/v1/admin/challenges/${id}`, data),
  toggleActive: (id: number, active: boolean) =>
    api.patch(`/api/v1/admin/challenges/${id}/active`, null, { params: { active } }),
};

// Follow API
export const followApi = {
  toggle: (userId: number) =>
    api.post(`/api/v1/users/${userId}/follow`),

  isFollowing: (userId: number) =>
    api.get(`/api/v1/users/${userId}/follow`),

  getFollowers: (userId: number) =>
    api.get(`/api/v1/users/${userId}/followers`),

  getFollowing: (userId: number) =>
    api.get(`/api/v1/users/${userId}/following`),

  getCounts: (userId: number) =>
    api.get(`/api/v1/users/${userId}/follow/counts`),
};

// Feed API
export const feedApi = {
  getFeed: (page = 0) =>
    api.get("/api/v1/feed", { params: { page, size: 20 } }),
};

// Performance API
export const performanceApi = {
  getAll: () => api.get("/api/v1/performance"),
  getByType: (type: string) => api.get(`/api/v1/performance/${type}`),
  getPRs: () => api.get("/api/v1/performance/prs"),
  save: (data: { exerciseType: string; value: number; unit?: string; notes?: string; recordedAt?: string }) =>
    api.post("/api/v1/performance", data),
  update: (id: number, data: { value: number; notes?: string }) =>
    api.put(`/api/v1/performance/${id}`, data),
  delete: (id: number) => api.delete(`/api/v1/performance/${id}`),
};

// Advertisement API
export const advertisementApi = {
  getAds: (position?: string) =>
    api.get("/api/v1/advertisements", { params: position ? { position } : {} }),

  // Admin
  createAd: (data: object) =>
    api.post("/api/v1/admin/advertisements", data),

  updateAd: (id: number, data: object) =>
    api.put(`/api/v1/admin/advertisements/${id}`, data),

  toggleActive: (id: number, active: boolean) =>
    api.patch(`/api/v1/admin/advertisements/${id}/active`, null, { params: { active } }),

  deleteAd: (id: number) =>
    api.delete(`/api/v1/admin/advertisements/${id}`),
};

// Bookmark API
export const bookmarkApi = {
  toggle: (postId: number) =>
    api.post(`/api/v1/community/posts/${postId}/bookmark`),
  getStatus: (postId: number) =>
    api.get(`/api/v1/community/posts/${postId}/bookmark`),
  getMyBookmarks: (page = 0) =>
    api.get("/api/v1/community/posts/bookmarks", { params: { page, size: 20 } }),
};

// Announcement API
export const announcementApi = {
  getByBox: (boxId: number) =>
    api.get(`/api/v1/boxes/${boxId}/announcements`),
  create: (boxId: number, data: { title: string; content: string; pinned?: boolean }) =>
    api.post(`/api/v1/boxes/${boxId}/announcements`, data),
  delete: (boxId: number, announcementId: number) =>
    api.delete(`/api/v1/boxes/${boxId}/announcements/${announcementId}`),
};

// Competition Results API
export const competitionResultApi = {
  getResults: (competitionId: number) =>
    api.get(`/api/v1/competitions/${competitionId}/results`),
  saveResults: (competitionId: number, results: Array<{ userId?: number; userName: string; rank: number; score?: string; notes?: string }>) =>
    api.post(`/api/v1/competitions/${competitionId}/results`, results),
};

// Check-in API
export const checkInApi = {
  checkIn: (boxId: number) =>
    api.post(`/api/v1/boxes/${boxId}/checkin`),

  getMyCheckIns: (page = 0) =>
    api.get("/api/v1/users/me/checkins", { params: { page, size: 20 } }),

  getBoxCheckIns: (boxId: number, page = 0) =>
    api.get(`/api/v1/boxes/${boxId}/checkins`, { params: { page, size: 30 } }),
};

// Goal API
export const goalApi = {
  getAll: () => api.get("/api/v1/goals"),
  create: (data: { exerciseType: string; targetValue: number; unit?: string; targetDate?: string; notes?: string }) =>
    api.post("/api/v1/goals", data),
  update: (id: number, data: { targetValue?: number; currentValue?: number; notes?: string }) =>
    api.put(`/api/v1/goals/${id}`, data),
  delete: (id: number) => api.delete(`/api/v1/goals/${id}`),
  achieve: (id: number) => api.patch(`/api/v1/goals/${id}/achieve`),
};
