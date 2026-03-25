export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface Box {
  id: number;
  name: string;
  address: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  phone: string;
  website: string;
  instagram: string;
  youtube: string;
  description: string;
  monthlyFee: number;
  openTime: string;
  closeTime: string;
  imageUrls: string[];
  rating: number;
  reviewCount: number;
  verified: boolean;
  premium: boolean;
  active: boolean;
  ownerName: string;
}

export interface Coach {
  id: number;
  boxId: number;
  name: string;
  bio: string;
  imageUrl: string;
  certifications: string[];
  experienceYears: number;
}

export interface Schedule {
  id: number;
  boxId: number;
  dayOfWeek: string;
  dayOfWeekKorean: string;
  startTime: string;
  endTime: string;
  className: string;
  maxCapacity: number;
  coachName: string | null;
}

export interface Review {
  id: number;
  boxId: number;
  boxName: string | null;
  rating: number;
  content: string;
  userName: string;
  userProfileImageUrl: string | null;
  createdAt: string;
}

export type WodType = "AMRAP" | "FOR_TIME" | "EMOM" | "TABATA" | "STRENGTH" | "SKILL" | "REST_DAY" | "CUSTOM";

export interface Wod {
  id: number;
  boxId: number | null;
  boxName: string;
  wodDate: string;
  title: string;
  type: WodType;
  content: string;
  scoreType: string;
  imageUrl: string | null;
}

export type CompetitionLevel = "BEGINNER" | "SCALED" | "INTERMEDIATE" | "RX" | "ELITE" | "ALL";
export type CompetitionStatus = "UPCOMING" | "OPEN" | "CLOSED" | "COMPLETED";

export interface Competition {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string | null;
  location: string;
  city: string;
  registrationDeadline: string | null;
  registrationUrl: string | null;
  imageUrl: string | null;
  organizer: string;
  level: CompetitionLevel;
  status: CompetitionStatus;
  maxParticipants: number | null;
  entryFee: number | null;
  currentParticipants?: number;
}

export type PostCategory = "FREE" | "QNA" | "RECORD" | "MARKET";

export interface Post {
  id: number;
  title: string;
  content: string;
  category: PostCategory;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  imageUrls: string[];
  videoUrl?: string;
  userId?: number;
  userName: string;
  userProfileImageUrl: string | null;
  createdAt: string;
  pinned?: boolean;
  reportCount?: number;
}

export interface Comment {
  id: number;
  postId: number;
  parentId: number | null;
  content: string;
  userId?: number;
  userName: string;
  userProfileImageUrl: string | null;
  createdAt: string;
  replies: Comment[];
  likeCount?: number;
}

export interface User {
  id?: number;
  email: string;
  name: string;
  role: "ROLE_USER" | "ROLE_BOX_OWNER" | "ROLE_ADMIN";
  profileImageUrl?: string;
  phone?: string;
}

export interface AuthResponse {
  id: number;
  accessToken: string;
  refreshToken: string;
  email: string;
  name: string;
  role: string;
}

export interface WodRecord {
  id: number;
  userId?: number;
  wodDate: string;
  score: string | null;
  notes: string | null;
  rx: boolean;
  videoUrl?: string;
  userName: string;
  boxName: string | null;
  wodTitle?: string;
}

export interface BoxMembership {
  id: number;
  boxId: number;
  boxName: string;
  boxCity: string;
  boxDistrict: string;
  boxAddress: string;
  joinedAt: string;
  memberCount: number;
  daysInBox: number;
}

export type BadgeTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export interface Badge {
  id: number;
  type: string;
  name: string;
  description: string;
  tier: BadgeTier;
  awardedAt: string;
}

export interface FollowUser {
  id: number;
  name: string;
  profileImageUrl: string | null;
  role: string;
  following: boolean;
}

export interface BoxRanking {
  boxId: number;
  boxName: string;
  boxCity: string;
  participantCount: number;
  rxCount: number;
  topScores: string[];
}

export interface BoxAnnouncement {
  id: number;
  boxId: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
}

export interface BoxNotice {
  id: number;
  boxId: number;
  title: string;
  content: string;
  pinned: boolean;
  authorName: string;
  createdAt: string;
}

export interface CompetitionResult {
  id: number;
  competitionId: number;
  userId?: number;
  userName: string;
  rank: number;
  score?: string;
  notes?: string;
  createdAt: string;
}

export interface UserGoal {
  id: number;
  exerciseType: string;
  targetValue: number;
  currentValue?: number;
  unit?: string;
  targetDate?: string;
  achieved: boolean;
  notes?: string;
  createdAt: string;
}
