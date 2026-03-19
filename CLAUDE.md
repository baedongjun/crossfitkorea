# CrossFitKorea — 프로젝트 전체 가이드

> **이 파일은 AI 어시스턴트가 처음 대화를 시작할 때 반드시 먼저 읽어야 하는 컨텍스트 파일입니다.**
> 이미 구현된 내용을 재구현하거나, 구현된 API를 다시 만드는 비효율을 방지합니다.

---

## 1. 프로젝트 개요

한국 크로스핏 박스 검색 & 커뮤니티 플랫폼.
전국 박스를 지도/목록으로 찾고, WOD 기록, 대회 신청, 커뮤니티 활동을 제공.

---

## 2. 기술 스택

| 레이어 | 기술 |
|--------|------|
| **Backend** | Spring Boot 4.0.3, Java 21, Gradle |
| **ORM** | Spring Data JPA (Hibernate) |
| **DB** | PostgreSQL (prod), H2 (test) |
| **Cache** | Redis |
| **Search** | Elasticsearch (미연동, DB 쿼리로 대체 중) |
| **Auth** | JWT (JJWT 0.12.6), Bearer token |
| **Storage** | AWS S3 (S3UploadService) |
| **Payment** | 토스페이먼츠 |
| **Frontend** | Next.js 15, TypeScript, CSS Modules |
| **Data Fetching** | TanStack Query (React Query v5) |
| **HTTP Client** | axios (자동 토큰 갱신 인터셉터 포함) |
| **Maps** | 카카오맵 API |
| **Infra** | AWS EC2/RDS/CloudFront, Docker, GitHub Actions |

---

## 3. 프로젝트 구조

```
crossfitkorea/                        ← Spring Boot 루트
├── src/main/java/com/crossfitkorea/
│   ├── common/
│   │   ├── BaseEntity.java           ← createdAt/updatedAt (모든 엔티티 상속)
│   │   ├── ApiResponse.java          ← 공통 응답 래퍼 { success, message, data }
│   │   ├── exception/                ← BusinessException, GlobalExceptionHandler, ErrorCode
│   │   ├── service/S3UploadService.java
│   │   └── controller/UploadController.java
│   ├── config/
│   │   ├── SecurityConfig.java       ← JWT 필터, 공개/인증 경로 정의
│   │   ├── JpaConfig.java
│   │   ├── RedisConfig.java
│   │   ├── S3Config.java
│   │   └── DataInitializer.java      ← 개발용 초기 데이터
│   ├── security/
│   │   ├── JwtTokenProvider.java
│   │   └── JwtAuthenticationFilter.java
│   ├── domain/
│   │   ├── user/                     ← User, UserRole, AuthController, UserController
│   │   ├── box/                      ← Box, BoxService, BoxController, BoxFavorite, BoxMembership, StatsController
│   │   ├── coach/                    ← Coach, CoachService, CoachController
│   │   ├── schedule/                 ← Schedule, ScheduleService, ScheduleController
│   │   ├── review/                   ← Review, ReviewService, ReviewController
│   │   ├── wod/                      ← Wod, WodRecord, WodService, WodController, WodRecordController
│   │   ├── competition/              ← Competition, CompetitionRegistration, CompetitionService
│   │   ├── community/                ← Post, Comment, PostController
│   │   ├── notification/             ← Notification, NotificationService, NotificationController, NotificationSseService
│   │   ├── badge/                    ← BadgeType, Badge, BadgeService
│   │   ├── advertisement/            ← Advertisement, AdPosition, AdvertisementService, AdvertisementController
│   │   ├── follow/                   ← Follow, FollowRepository, FollowService, FollowController
│   │   └── payment/                  ← Payment, PaymentService, PaymentController
│   ├── common/service/EmailService.java  ← 이메일 발송 (비밀번호 재설정, 환영, 대회 신청)
│   └── admin/                        ← AdminDashboardController, AdminBoxController, AdminUserController, AdminPostController
│
└── frontend/                         ← Next.js 앱
    ├── app/                          ← App Router 페이지
    ├── components/
    │   ├── layout/Header.tsx, Footer.tsx (SSE 알림 연결)
    │   ├── box/BoxCard.tsx, BoxMap.tsx (마커 클러스터링), BoxDetailMap.tsx
    │   ├── common/FadeInObserver.tsx, AdBanner.tsx, ImageUpload.tsx
    │   └── providers/QueryProvider.tsx
    ├── lib/
    │   ├── api.ts                    ← 모든 API 함수 (axios 인스턴스 포함)
    │   ├── auth.ts                   ← saveAuth, clearAuth, getUser, setUser, isLoggedIn, isAdmin, isBoxOwner
    │   ├── upload.ts                 ← uploadViaPresignedUrl() S3 직접 업로드 유틸
    │   └── useNotificationSse.ts     ← SSE 실시간 알림 훅
    └── types/index.ts                ← 모든 TypeScript 타입 정의
```

---

## 4. 인증 & 권한

```
역할: ROLE_USER | ROLE_BOX_OWNER | ROLE_ADMIN

토큰: Header "Authorization: Bearer {accessToken}"
갱신: POST /api/v1/auth/refresh (refreshToken → 새 accessToken)
      → frontend axios 인터셉터에서 401 시 자동 처리 (lib/api.ts)

로컬스토리지: accessToken, refreshToken, user (JSON: {email, name, role, profileImageUrl?, phone?})
```

---

## 5. 전체 API 엔드포인트 (구현 완료)

### Auth
```
POST /api/v1/auth/signup
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/forgot-password
```

### User
```
GET    /api/v1/users/me                    ← 내 정보 (UserDto: id,email,name,phone,profileImageUrl,role)
PUT    /api/v1/users/me                    ← 정보 수정 (name, phone, profileImageUrl)
PUT    /api/v1/users/me/password           ← 비밀번호 변경 (currentPassword, newPassword)
DELETE /api/v1/users/me                    ← 회원 탈퇴 (soft delete)
GET    /api/v1/users/me/reviews?page=      ← 내가 쓴 후기 (Page<Review>)
GET    /api/v1/users/me/favorites?page=    ← 즐겨찾기 박스 (Page<BoxDto>)
GET    /api/v1/users/me/comments?page=     ← 내가 쓴 댓글
GET    /api/v1/users/me/box                ← 내 소속 박스 (BoxMembership | null)
GET    /api/v1/users/me/badges             ← 내 배지 목록 (List<Badge>)
GET    /api/v1/users/{id}/profile          ← 공개 프로필 [PUBLIC] (id,name,profileImageUrl,role)
```

### Follow
```
POST /api/v1/users/{id}/follow            ← 팔로우/언팔로우 토글 [AUTH] → { following, followerCount }
GET  /api/v1/users/{id}/follow            ← 팔로우 여부 [AUTH] → { following: boolean }
GET  /api/v1/users/{id}/followers         ← 팔로워 목록 [PUBLIC] → List<FollowDto>
GET  /api/v1/users/{id}/following         ← 팔로잉 목록 [PUBLIC] → List<FollowDto>
GET  /api/v1/users/{id}/follow/counts     ← 팔로워/팔로잉 수 [PUBLIC] → { followerCount, followingCount }
```

### Box
```
GET    /api/v1/boxes                       ← 검색 [PUBLIC] (city,district,keyword,page,sort,verified,premium,maxFee,minRating)
POST   /api/v1/boxes                       ← 박스 등록 [BOX_OWNER/ADMIN]
GET    /api/v1/boxes/my?page=              ← 내 박스 목록 [BOX_OWNER/ADMIN]
GET    /api/v1/boxes/premium               ← 프리미엄 박스 [PUBLIC]
GET    /api/v1/boxes/{id}                  ← 박스 상세 [PUBLIC]
PUT    /api/v1/boxes/{id}                  ← 박스 수정 [BOX_OWNER/ADMIN]
DELETE /api/v1/boxes/{id}                  ← 박스 삭제 [BOX_OWNER/ADMIN]
GET    /api/v1/boxes/{id}/coaches          ← 코치 목록 [PUBLIC]
POST   /api/v1/boxes/{id}/coaches          ← 코치 추가 [BOX_OWNER/ADMIN]
GET    /api/v1/boxes/{id}/schedules        ← 시간표 [PUBLIC]
POST   /api/v1/boxes/{id}/schedules        ← 시간표 추가 [BOX_OWNER/ADMIN]
GET    /api/v1/boxes/{id}/reviews?page=    ← 후기 목록 [PUBLIC]
POST   /api/v1/boxes/{id}/reviews          ← 후기 등록 [AUTH]
POST   /api/v1/boxes/{id}/favorite         ← 즐겨찾기 토글 [AUTH]
GET    /api/v1/boxes/{id}/favorite         ← 즐겨찾기 여부 [AUTH] → { favorited: boolean }
POST   /api/v1/boxes/{id}/join             ← 박스 가입 [AUTH]
DELETE /api/v1/boxes/{id}/join             ← 박스 탈퇴 [AUTH]
GET    /api/v1/boxes/{id}/membership       ← 가입 여부 [AUTH] → { member: boolean }
GET    /api/v1/boxes/{id}/members          ← 멤버 목록 [BOX_OWNER/ADMIN]
GET    /api/v1/boxes/{id}/members/count    ← 멤버 수 [PUBLIC] → { count: long }

PUT    /api/v1/coaches/{id}                ← 코치 수정 [BOX_OWNER/ADMIN]
DELETE /api/v1/coaches/{id}                ← 코치 삭제 [BOX_OWNER/ADMIN]
PUT    /api/v1/schedules/{id}              ← 시간표 수정 [BOX_OWNER/ADMIN]
DELETE /api/v1/schedules/{id}              ← 시간표 삭제 [BOX_OWNER/ADMIN]
PUT    /api/v1/reviews/{id}                ← 후기 수정 [AUTH]
DELETE /api/v1/reviews/{id}                ← 후기 삭제 [AUTH]
```

### WOD
```
GET  /api/v1/wod/today?boxId=              ← 오늘 WOD [PUBLIC] (boxId 없으면 공통 WOD, 없으면 null 반환)
GET  /api/v1/wod/history?page=&size=       ← WOD 히스토리 [PUBLIC] (Page<WodDto>)
POST /api/v1/wod?boxId=                    ← WOD 등록 [BOX_OWNER/ADMIN]

GET    /api/v1/wod/records?page=           ← 내 기록 [AUTH] (Page<WodRecord>)
POST   /api/v1/wod/records                 ← 기록 저장 [AUTH]
DELETE /api/v1/wod/records/{id}            ← 기록 삭제 [AUTH]
GET    /api/v1/wod/records/today           ← 오늘 기록 [AUTH]
GET    /api/v1/wod/records/recent?days=    ← 최근 기록 [AUTH]
GET    /api/v1/wod/records/leaderboard?date= ← 오늘 리더보드 [PUBLIC]
GET    /api/v1/wod/records/box-ranking?date= ← 박스 랭킹 [PUBLIC]
```

### Competition
```
GET    /api/v1/competitions?status=&city=&page=   ← 대회 목록 [PUBLIC]
GET    /api/v1/competitions/{id}                  ← 대회 상세 [PUBLIC]
GET    /api/v1/competitions/{id}/registration-status ← 신청 상태 [PUBLIC+AUTH]
POST   /api/v1/competitions/{id}/register         ← 참가 신청 [AUTH]
DELETE /api/v1/competitions/{id}/register         ← 신청 취소 [AUTH]
GET    /api/v1/competitions/my                    ← 내 신청 대회 목록 [AUTH]
```

### Community
```
GET    /api/v1/community/posts?category=&keyword=&page=&sort=  ← 목록 [PUBLIC]
POST   /api/v1/community/posts                    ← 글 작성 [AUTH]
GET    /api/v1/community/posts/mine?page=          ← 내 게시글 [AUTH]
GET    /api/v1/community/posts/hot                 ← 인기 글 TOP5 [PUBLIC]
GET    /api/v1/community/posts/{id}                ← 상세 (조회수 증가) [PUBLIC]
PUT    /api/v1/community/posts/{id}                ← 수정 [AUTH]
DELETE /api/v1/community/posts/{id}                ← 삭제 [AUTH]
POST   /api/v1/community/posts/{id}/like           ← 좋아요 토글 [AUTH]
POST   /api/v1/community/posts/{id}/report         ← 신고 [AUTH]
GET    /api/v1/community/posts/{id}/comments       ← 댓글 [PUBLIC]
POST   /api/v1/community/posts/{id}/comments       ← 댓글 작성 [AUTH] (content, parentId?)
PUT    /api/v1/community/comments/{id}             ← 댓글 수정 [AUTH]
DELETE /api/v1/community/comments/{id}             ← 댓글 삭제 [AUTH]
POST   /api/v1/community/comments/{id}/like        ← 댓글 좋아요 [AUTH]
```

### Notifications
```
GET   /api/v1/notifications         ← 전체 알림 [AUTH]
GET   /api/v1/notifications/count   ← 읽지 않은 수 [AUTH]
PATCH /api/v1/notifications/{id}/read    ← 읽음 처리 [AUTH]
PATCH /api/v1/notifications/read-all    ← 전체 읽음 [AUTH]
```

NotificationType: `COMMENT | REPLY | REVIEW | BADGE | MEMBERSHIP | COMPETITION | SYSTEM`

### Badges
```
GET /api/v1/users/me/badges        ← 내 배지 [AUTH]
GET /api/v1/badges/users/{userId}  ← 사용자 배지 [PUBLIC]
```
BadgeTier: `BRONZE | SILVER | GOLD | PLATINUM`

### Upload (S3)
```
POST /api/v1/upload/image          ← 이미지 1개 (multipart: file, folder)
POST /api/v1/upload/images         ← 이미지 여러 개 (multipart: files[], folder)
```

### Payment (토스페이먼츠)
```
POST /api/v1/payments/toss/initiate   ← 결제 시작 (competitionId, orderId, orderName)
POST /api/v1/payments/toss/confirm    ← 결제 승인 (paymentKey, orderId, amount)
```

### Stats (공개)
```
GET /api/v1/stats   ← { totalBoxes, totalUsers, totalPosts, totalCompetitions }
```

### Advertisement (광고)
```
GET    /api/v1/advertisements?position=          ← 활성 광고 목록 [PUBLIC] (position: BANNER|SIDEBAR|COMMUNITY|BOXES)
POST   /api/v1/admin/advertisements              ← 광고 등록 [ADMIN]
PUT    /api/v1/admin/advertisements/{id}         ← 광고 수정 [ADMIN]
PATCH  /api/v1/admin/advertisements/{id}/active?active= ← 활성화/비활성화 [ADMIN]
DELETE /api/v1/admin/advertisements/{id}         ← 광고 삭제 [ADMIN]
```
AdPosition: `BANNER | SIDEBAR | COMMUNITY | BOXES`

### Challenge (챌린지)
```
GET    /api/v1/challenges                    ← 활성 챌린지 목록 [PUBLIC+AUTH]
GET    /api/v1/challenges/{id}               ← 챌린지 상세 (참여현황, 리더보드) [PUBLIC+AUTH]
GET    /api/v1/challenges/my                 ← 내 참여 챌린지 [AUTH]
POST   /api/v1/challenges/{id}/join          ← 참가 [AUTH]
DELETE /api/v1/challenges/{id}/join          ← 참가 취소 [AUTH]
POST   /api/v1/challenges/{id}/verify        ← 오늘 인증 [AUTH] (content?, imageUrl?)
GET    /api/v1/challenges/{id}/leaderboard   ← 챌린지 랭킹 [PUBLIC]
POST   /api/v1/admin/challenges              ← 챌린지 등록 [ADMIN]
PUT    /api/v1/admin/challenges/{id}         ← 챌린지 수정 [ADMIN]
PATCH  /api/v1/admin/challenges/{id}/active?active= ← 활성화/비활성화 [ADMIN]
```

### Feed (활동 피드)
```
GET /api/v1/feed?page=&size=   ← 팔로우한 사람들의 활동 피드 [AUTH] (Page<FeedItemDto>)
```
FeedItemType: `WOD_RECORD | BADGE | COMPETITION | POST`

### Performance (개인 기록 트래킹)
```
GET    /api/v1/performance              ← 내 전체 기록 [AUTH]
GET    /api/v1/performance/prs          ← 종목별 최고 기록 맵 [AUTH]
GET    /api/v1/performance/{type}       ← 종목별 기록 [AUTH]
POST   /api/v1/performance              ← 기록 저장 [AUTH] (exerciseType, value, unit?, notes?, recordedAt?)
PUT    /api/v1/performance/{id}         ← 기록 수정 [AUTH] (value, notes?)
DELETE /api/v1/performance/{id}         ← 기록 삭제 [AUTH]
```
ExerciseType: `BACK_SQUAT | FRONT_SQUAT | DEADLIFT | CLEAN | SNATCH | CLEAN_AND_JERK | OVERHEAD_SQUAT | PRESS | PUSH_PRESS | PUSH_JERK | BENCH_PRESS | PULL_UP | MUSCLE_UP | BODYWEIGHT | BODY_FAT | HEIGHT | CUSTOM`

### Admin (ROLE_ADMIN 전용)
```
GET   /api/v1/admin/dashboard?months=            ← 통계 + 월별 신규 회원 (months 기본값 6, 3/6/12 선택)
GET   /api/v1/admin/boxes?page=                  ← 박스 목록
PATCH /api/v1/admin/boxes/{id}/verify?verified=  ← 인증 처리
PATCH /api/v1/admin/boxes/{id}/premium?premium=  ← 프리미엄 설정
POST  /api/v1/admin/competitions                 ← 대회 등록
PUT   /api/v1/admin/competitions/{id}            ← 대회 수정
PATCH /api/v1/admin/competitions/{id}/status?status= ← 상태 변경
POST  /api/v1/admin/wod                          ← 공통 WOD 등록
GET   /api/v1/admin/users?page=&keyword=         ← 회원 목록
PATCH /api/v1/admin/users/{id}/active?active=    ← 활성화/비활성화
PATCH /api/v1/admin/users/{id}/role?role=        ← 역할 변경
GET   /api/v1/admin/posts?page=                  ← 게시글 목록
DELETE /api/v1/admin/posts/{id}                  ← 게시글 삭제
DELETE /api/v1/admin/comments/{id}               ← 댓글 삭제
POST   /api/v1/admin/advertisements              ← (광고 섹션 참조)
POST   /api/v1/admin/challenges                  ← (챌린지 섹션 참조)
PUT    /api/v1/admin/challenges/{id}             ← (챌린지 섹션 참조)
PATCH  /api/v1/admin/challenges/{id}/active?active= ← (챌린지 섹션 참조)
```

---

## 6. 프론트엔드 페이지 목록 (구현 완료)

```
/                          ← 홈 (Hero, 퀵링크, 통계, WOD미리보기, 대회, 커뮤니티, 박스랭킹, 내박스)
/boxes                     ← 박스 검색 (목록/지도, 도시/키워드 필터, 즐겨찾기)
/boxes/create              ← 박스 등록 (이미지 업로드 포함) [BOX_OWNER/ADMIN]
/boxes/[id]                ← 박스 상세 (정보/코치/시간표/후기 탭, 가입/탈퇴, 즐겨찾기, 후기 인라인 수정, 코치 이미지 업로드)
/boxes/[id]/edit           ← 박스 수정 [BOX_OWNER/ADMIN]
/wod                       ← WOD (오늘WOD, 기록입력, 목록/캘린더, 리더보드, 박스랭킹, 히스토리링크)
/wod/records               ← 내 WOD 기록 (히트맵, 바차트, 목록/캘린더, 인라인 수정)
/wod/leaderboard           ← 날짜별 전체 리더보드
/wod/history               ← WOD 전체 히스토리 (페이지네이션)
/competitions              ← 대회 일정 (필터, 캘린더/목록 뷰)
/competitions/[id]         ← 대회 상세 (신청/취소, 결제, 구글캘린더 추가)
/community                 ← 커뮤니티 (카테고리 필터, 검색 디바운스 300ms, 인기글 사이드바, 무한 스크롤, 광고 배너)
/community/write           ← 글쓰기 (이미지 업로드)
/community/[id]            ← 게시글 상세 (댓글, 대댓글, 좋아요, 수정/삭제)
/community/[id]/edit       ← 게시글 수정
/login
/signup
/forgot-password
/my                        ← 마이페이지 (프로필, 활동통계, 내게시글, 댓글, 내박스, 배지)
/my/profile                ← 프로필 수정 (이름, 전화번호, 프로필 이미지)
/my/password               ← 비밀번호 변경
/my/box                    ← 오너 박스 관리 (WOD등록, 코치관리, 시간표관리, 멤버목록, 리뷰통계)
/my/reviews                ← 내가 쓴 후기 (수정/삭제)
/my/comments               ← 내가 쓴 댓글 (수정/삭제)
/my/favorites              ← 즐겨찾기 박스
/my/competitions           ← 신청한 대회 (취소 가능)
/my/performance            ← 개인 기록 트래킹 (종목별 PR, 꺾은선 그래프, CRUD)
/notifications             ← 알림 목록 (읽음처리, 전체읽음)
/users/[id]                ← 사용자 공개 프로필 (배지 표시, 팔로우/언팔로우, 팔로워/팔로잉 목록 탭)
/challenges                ← 챌린지 목록 (내 참여 챌린지, 전체 챌린지)
/challenges/[id]           ← 챌린지 상세 (참가/취소, 오늘 인증, 랭킹, 내 인증 기록)
/feed                      ← 활동 피드 (팔로우한 사람들의 WOD/배지/대회/게시글 활동, 무한스크롤)
/payment/success
/payment/fail
/advertise
/terms
/privacy
/admin                     ← 어드민 대시보드 (통계, 월별 신규회원 바차트 + 기간 필터 3/6/12개월)
/admin/boxes               ← 박스 인증/프리미엄 관리
/admin/users               ← 회원 관리 (역할변경, 비활성화)
/admin/posts               ← 게시글 관리 (삭제)
/admin/wod                 ← 공통 WOD 등록
/admin/competitions        ← 대회 등록/수정/상태변경
/admin/challenges          ← 챌린지 관리 (등록/수정/활성화토글)
/admin/advertisements      ← 광고 관리 (등록/수정/활성화토글/삭제)
```

---

## 7. 프론트엔드 주요 패턴

### API 호출 (lib/api.ts)
```typescript
// 모든 API 함수는 lib/api.ts에 정의됨
import { boxApi, wodApi, communityApi, competitionApi, membershipApi,
         badgeApi, wodRecordApi, leaderboardApi, notificationApi,
         userApi, authApi, uploadApi, statsApi, paymentApi, adminApi,
         advertisementApi, followApi, challengeApi, feedApi, performanceApi } from "@/lib/api";

// 자동 토큰 갱신: 401 시 refreshToken으로 재발급 → 원본 요청 재시도
// 갱신 실패 시 → /login 리다이렉트
```

### 인증 상태 (lib/auth.ts)
```typescript
import { isLoggedIn, getUser, saveAuth, clearAuth, setUser, isAdmin, isBoxOwner } from "@/lib/auth";
// getUser() → { email, name, role, profileImageUrl?, phone? } | null
// isLoggedIn() → localStorage accessToken 존재 여부
```

### CSS 규칙
- CSS Modules 사용 (`*.module.css`)
- 전역 클래스: `btn-primary`, `btn-secondary`, `badge-*`, `input-field` (globals.css)
- 반응형: `@media (max-width: 768px)`
- `--bg`, `--bg-card`, `--bg-card-2`, `--text`, `--muted`, `--red`, `--border` CSS 변수 사용

### 페이지 데이터 패턴
```typescript
// 페이지 보호
useEffect(() => {
  if (!isLoggedIn()) router.replace("/login");
}, [router]);

// React Query
const { data, isLoading } = useQuery({
  queryKey: ["posts", category, page],
  queryFn: async () => (await communityApi.getPosts(...)).data.data,
});

// Mutation
const mutation = useMutation({
  mutationFn: () => api.something(),
  onSuccess: () => { toast.success("..."); queryClient.invalidateQueries(...); },
  onError: () => toast.error("..."),
});
```

### 백엔드 응답 형식
```json
{ "success": true, "message": "...", "data": { ... } }
```
Page 응답: `{ content: T[], totalElements, totalPages, number, size, first, last }`

---

## 8. 디자인 시스템 (반드시 준수)

### 색상 변수
```css
--bg:        #0a0a0a    /* 메인 배경 */
--bg-card:   #1a1a1a    /* 카드 배경 */
--bg-card-2: #2a2a2a    /* 카드 보조 배경 */
--red:       #e8220a    /* 포인트 레드 */
--orange:    #ff6b1a    /* 포인트 오렌지 */
--text:      #f5f0e8    /* 텍스트 흰색 */
--muted:     #888888    /* 텍스트 흐림 */
--border:    rgba(255, 255, 255, 0.08)
```

### 폰트 (layout.tsx에 Google Fonts CDN으로 로드됨)
```
Bebas Neue    → 영문 타이틀, 숫자 강조
Black Han Sans → 한글 타이틀
Noto Sans KR  → 본문 전체
```

### 버튼 (globals.css에 정의)
```css
.btn-primary  { background: #e8220a; color: #f5f0e8; border: none; border-radius: 0; }
.btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,0.2); border-radius: 0; }
```

### 배지 (globals.css에 정의)
```
badge-approved, badge-pending, badge-rejected, badge-premium
badge-default, badge-upcoming, badge-open, badge-closed, badge-completed
badge-amrap, badge-fortime, badge-emom, badge-strength
```

### 금지 사항 (절대 위반 금지)
- ❌ Bootstrap, Tailwind, MUI, Ant Design 등 외부 CSS 프레임워크
- ❌ 흰 배경 (`background: white` 또는 `#fff`)
- ❌ 파란 계열 기본 버튼
- ❌ `border-radius` 있는 둥근 모서리 (모든 요소 각지게 — `border-radius: 0`)
- ❌ 기본 브라우저 스타일 그대로 사용

---

## 9. 주요 엔티티 관계

```
User (1) ──── (N) Box [owner]
User (1) ──── (1) BoxMembership [현재 소속 박스]
User (1) ──── (N) Review
User (1) ──── (N) BoxFavorite
User (1) ──── (N) Post
User (1) ──── (N) Comment
User (1) ──── (N) WodRecord
User (1) ──── (N) Badge
User (1) ──── (N) CompetitionRegistration
User (1) ──── (N) Notification
User (1) ──── (N) Payment

Box (1) ──── (N) Coach
Box (1) ──── (N) Schedule
Box (1) ──── (N) Wod
Box (1) ──── (N) BoxMembership
```

---

## 10. 자동 발행 알림 (NotificationService.createNotification)

| 이벤트 | 자동 알림 발행 위치 |
|--------|-------------------|
| 배지 획득 | `BadgeService.award()` |
| 박스 가입 | `BoxMembershipService.join()` |
| 박스 탈퇴 | `BoxMembershipService.leave()` |
| 댓글 달림 | `PostService.createComment()` |
| 대댓글 달림 | `PostService.createComment()` |
| 팔로우 | `FollowService.toggle()` |

알림 발행 시 `NotificationSseService.sendNotification()`으로 SSE 실시간 전송.
프론트엔드 `Header.tsx`에서 `useNotificationSse` 훅으로 수신 → `toast.info()` 표시.

---

## 11. 아직 구현되지 않은 것 (TODO)

### 백엔드
- [ ] Elasticsearch 실제 연동 (현재 DB LIKE 쿼리로 대체)

### 프론트엔드
- [ ] SNS 로그인 (OAuth2 — 카카오/구글)
- [ ] 앱 푸시 알림 (PWA)

### 인프라
- [ ] 토스페이먼츠 실제 결제 테스트 (현재 sandbox 미검증)

---

## 12. 로컬 개발 설정

```
백엔드: src/main/resources/application-local.properties
  → spring.jpa.hibernate.ddl-auto=create-drop
  → H2 또는 로컬 PostgreSQL

프론트엔드: frontend/.env.local
  NEXT_PUBLIC_API_URL=http://localhost:8080
  NEXT_PUBLIC_KAKAO_MAP_KEY=...
  NEXT_PUBLIC_TOSS_CLIENT_KEY=...

실행:
  백엔드: ./gradlew bootRun --args='--spring.profiles.active=local'
  프론트: cd frontend && npm run dev
```

---

## 13. AI 어시스턴트에게 — 작업 시작 전 체크리스트

새 기능 구현 전 반드시 확인:
1. **API 이미 있는지** → 5번 섹션 먼저 확인
2. **페이지 이미 있는지** → 6번 섹션 먼저 확인
3. **lib/api.ts에 함수 있는지** → 해당 apiObject 확인
4. **types/index.ts에 타입 있는지** → 타입 중복 생성 금지
5. **CSS는 CSS Modules** → Tailwind 클래스 사용 금지
6. **border-radius: 0** → 모든 요소 각지게
