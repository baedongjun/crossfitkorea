"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, communityApi, uploadApi, boxApi, membershipApi, badgeApi, followApi } from "@/lib/api";
import { clearAuth } from "@/lib/auth";
import { Review, Box, BoxMembership, Badge } from "@/types";
import { isLoggedIn, getUser } from "@/lib/auth";
import { Post } from "@/types";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import s from "./my.module.css";

const ROLE_LABEL: Record<string, string> = {
  ROLE_USER: "일반 회원",
  ROLE_BOX_OWNER: "박스 오너",
  ROLE_ADMIN: "관리자",
};

const CATEGORY_BADGE: Record<string, string> = {
  FREE: "badge-default", QNA: "badge-upcoming", RECORD: "badge-open", MARKET: "badge-amrap",
};
const CATEGORY_LABEL: Record<string, string> = {
  FREE: "자유", QNA: "Q&A", RECORD: "기록", MARKET: "장터",
};

export default function MyPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const localUser = getUser();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    }
  }, [router]);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await userApi.getMe()).data.data,
    enabled: isLoggedIn(),
  });

  const { data: myPosts } = useQuery({
    queryKey: ["posts", "mine"],
    queryFn: async () => (await communityApi.getMyPosts()).data.data,
    enabled: isLoggedIn(),
  });

  const { data: myReviews } = useQuery({
    queryKey: ["reviews", "mine"],
    queryFn: async () => (await userApi.getMyReviews()).data.data,
    enabled: isLoggedIn(),
  });

  const { data: myFavorites } = useQuery({
    queryKey: ["favorites", "mine"],
    queryFn: async () => (await userApi.getMyFavorites()).data.data,
    enabled: isLoggedIn(),
  });

  const { data: myComments } = useQuery({
    queryKey: ["comments", "mine"],
    queryFn: async () => (await userApi.getMyComments()).data.data,
    enabled: isLoggedIn(),
  });

  const { data: myBox } = useQuery({
    queryKey: ["membership", "myBox"],
    queryFn: async () => (await membershipApi.getMyBox()).data.data as BoxMembership | null,
    enabled: isLoggedIn(),
  });

  const { data: myBadges } = useQuery({
    queryKey: ["badges", "mine"],
    queryFn: async () => (await badgeApi.getMyBadges()).data.data as Badge[],
    enabled: isLoggedIn(),
  });

  const { data: followCounts } = useQuery({
    queryKey: ["follow", "counts", me?.id],
    queryFn: async () =>
      (await followApi.getCounts(me.id as number)).data.data as { followerCount: number; followingCount: number },
    enabled: isLoggedIn() && !!me?.id,
  });

  useEffect(() => {
    if (me) {
      setName(me.name || "");
      setPhone(me.phone || "");
    }
  }, [me]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const res = await uploadApi.uploadImage(file, "profile");
      const profileImageUrl = res.data.data as string;
      await userApi.updateMe({ name: me?.name || name, phone: me?.phone || phone, profileImageUrl });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("프로필 사진이 변경되었습니다.");
    } catch {
      toast.error("업로드에 실패했습니다.");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const deleteAccountMutation = useMutation({
    mutationFn: () => userApi.deleteMyAccount(),
    onSuccess: () => {
      clearAuth();
      router.replace("/");
      toast.success("회원 탈퇴가 완료되었습니다.");
    },
    onError: () => toast.error("탈퇴 처리 중 오류가 발생했습니다."),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: number) => boxApi.deleteReview(reviewId),
    onSuccess: () => {
      toast.success("후기가 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["reviews", "mine"] });
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const updateMutation = useMutation({
    mutationFn: () => userApi.updateMe({ name, phone }),
    onSuccess: () => {
      toast.success("정보가 수정되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  if (!isLoggedIn()) return null;

  const user = me || localUser;

  return (
    <div className={s.page}>
      {/* Hero */}
      <div className={s.hero}>
        <div className={s.heroInner}>
          <div
            className={s.avatar}
            style={{ cursor: "pointer", position: "relative" }}
            onClick={() => avatarInputRef.current?.click()}
            title="클릭하여 프로필 사진 변경"
          >
            {me?.profileImageUrl
              ? <Image src={me.profileImageUrl} alt="" fill style={{ objectFit: "cover" }} />
              : (user?.name?.[0] || "U")
            }
            {avatarUploading && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>
                업로드 중
              </div>
            )}
            <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
          </div>
          <div className={s.heroInfo}>
            <p className={s.heroName}>{user?.name || "—"}</p>
            <p className={s.heroEmail}>{user?.email || ""}</p>
            <div className={s.heroBadge}>
              <span className="badge badge-default">
                {ROLE_LABEL[user?.role || "ROLE_USER"] || user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={s.content}>
        {/* 정보 수정 */}
        <div className={s.formCard}>
          <p className={s.cardTitle}>내 정보 수정</p>
          <div className={s.form}>
            <div className={s.field}>
              <label className={s.label}>이메일</label>
              <p className={s.staticValue}>{me?.email || localUser?.email}</p>
            </div>
            <div className={s.field}>
              <label className={s.label}>이름</label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>전화번호</label>
              <input
                type="tel"
                className="input-field"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <button
              className={`btn-primary ${s.submitBtn}`}
              disabled={updateMutation.isPending || !name.trim()}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>

        {/* 빠른 링크 */}
        <div className={s.linksCard}>
          <p className={s.cardTitle}>바로가기</p>
          <div className={s.linksList}>
            <Link href="/my/profile" className={s.linkItem}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              프로필 수정
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: "auto" }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
            <Link href="/my/password" className={s.linkItem}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="0" ry="0"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              비밀번호 변경
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: "auto" }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
            <Link href="/my/competitions" className={s.linkItem}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="8 6 2 12 8 18"/><path d="M2 12h20"/><polyline points="16 6 22 12 16 18"/>
              </svg>
              신청한 대회
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: "auto" }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
            <Link href="/my/performance" className={s.linkItem}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              퍼포먼스 기록
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: "auto" }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
            {(user?.role === "ROLE_BOX_OWNER" || user?.role === "ROLE_ADMIN") && (
              <Link href="/my/box" className={s.linkItem}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                내 박스 관리
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: "auto" }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>
            )}
            <button
              className={s.withdrawBtn}
              onClick={() => {
                if (window.confirm("정말 탈퇴하시겠습니까?\n탈퇴 시 모든 데이터가 비활성화됩니다.")) {
                  deleteAccountMutation.mutate();
                }
              }}
              disabled={deleteAccountMutation.isPending}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              회원 탈퇴
            </button>
          </div>
        </div>

        {/* 활동 통계 */}
        <div>
          <div className={s.statsCard}>
            <p className={s.statsHeader}>내 활동</p>
            <div className={s.statsGrid}>
              <div className={s.statItem}>
                <p className={s.statNum}>{myPosts?.totalElements || 0}</p>
                <p className={s.statLabel}>작성 게시글</p>
              </div>
              <div className={s.statItem}>
                <p className={s.statNum}>{myReviews?.totalElements || 0}</p>
                <p className={s.statLabel}>작성 후기</p>
              </div>
              <div className={s.statItem}>
                <p className={s.statNum}>{myFavorites?.totalElements || 0}</p>
                <p className={s.statLabel}>즐겨찾기</p>
              </div>
              <div className={s.statItem}>
                <p className={s.statNum}>{myComments?.totalElements || 0}</p>
                <p className={s.statLabel}>작성 댓글</p>
              </div>
              <div className={s.statItem}>
                <p className={s.statNum}>{followCounts?.followerCount ?? 0}</p>
                <p className={s.statLabel}>팔로워</p>
              </div>
              <div className={s.statItem}>
                <p className={s.statNum}>{followCounts?.followingCount ?? 0}</p>
                <p className={s.statLabel}>팔로잉</p>
              </div>
            </div>
          </div>
        </div>

        {/* 내 게시글 */}
        <div className={s.postsCard}>
          <p className={s.postsHeader}>내가 쓴 게시글</p>
          {myPosts?.content?.length > 0 ? (
            <div className={s.postList}>
              {myPosts.content.slice(0, 10).map((post: Post) => (
                <Link key={post.id} href={`/community/${post.id}`} className={s.postItem}>
                  <span className={`badge ${CATEGORY_BADGE[post.category] || "badge-default"}`}>
                    {CATEGORY_LABEL[post.category]}
                  </span>
                  <span className={s.postTitle}>{post.title}</span>
                  <span className={s.postDate}>{dayjs(post.createdAt).format("MM.DD")}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className={s.empty}>아직 작성한 게시글이 없습니다</div>
          )}
        </div>

        {/* 내 댓글 */}
        <div className={s.postsCard}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p className={s.postsHeader} style={{ margin: 0 }}>내가 쓴 댓글</p>
            <Link href="/my/comments" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>전체 보기 →</Link>
          </div>
          {myComments?.content?.length > 0 ? (
            <div className={s.postList}>
              {myComments.content.slice(0, 10).map((comment: { id: number; content: string; postId: number; postTitle: string; createdAt: string }) => (
                <Link key={comment.id} href={`/community/${comment.postId}`} className={s.postItem}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: "var(--muted)" }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span className={s.postTitle} style={{ fontSize: 12, color: "var(--muted)" }}>
                    {comment.postTitle}
                  </span>
                  <span className={s.postTitle} style={{ marginLeft: 0, flex: "unset", maxWidth: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 1, minWidth: 0 }}>
                    {comment.content}
                  </span>
                  <span className={s.postDate}>{dayjs(comment.createdAt).format("MM.DD")}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className={s.empty}>아직 작성한 댓글이 없습니다</div>
          )}
        </div>

        {/* 내 후기 */}
        <div className={s.postsCard}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p className={s.postsHeader} style={{ margin: 0 }}>내가 쓴 후기</p>
            <Link href="/my/reviews" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>전체 보기 →</Link>
          </div>
          {myReviews?.content?.length > 0 ? (
            <div className={s.postList}>
              {myReviews.content.slice(0, 10).map((review: Review) => (
                <div key={review.id} className={s.postItem} style={{ textDecoration: "none" }}>
                  <Link href={`/boxes/${review.boxId}`} style={{ display: "contents", textDecoration: "none", color: "inherit" }}>
                    <span className={s.reviewStars}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                    <span className={s.postTitle}>{review.content}</span>
                    <span className={s.postDate}>{dayjs(review.createdAt).format("MM.DD")}</span>
                  </Link>
                  <button
                    className={s.deleteReviewBtn}
                    onClick={() => { if (confirm("후기를 삭제하시겠습니까?")) deleteReviewMutation.mutate(review.id); }}
                    disabled={deleteReviewMutation.isPending}
                    title="삭제"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={s.empty}>아직 작성한 후기가 없습니다</div>
          )}
        </div>

        {/* 내 박스 */}
        {myBox && (
          <div className={s.postsCard}>
            <p className={s.postsHeader}>내 박스</p>
            <Link href={`/boxes/${myBox.boxId}`} className={s.myBoxCard}>
              <div className={s.myBoxInfo}>
                <p className={s.myBoxName}>{myBox.boxName}</p>
                <p className={s.myBoxMeta}>{myBox.boxCity} {myBox.boxDistrict} · {myBox.boxAddress}</p>
                <div className={s.myBoxStats}>
                  <span className={s.myBoxStatItem}>
                    <span className={s.myBoxStatLabel}>멤버 수</span>
                    <span className={s.myBoxStatValue}>{myBox.memberCount}명</span>
                  </span>
                  <span className={s.myBoxStatItem}>
                    <span className={s.myBoxStatLabel}>가입 후</span>
                    <span className={s.myBoxStatValue}>{myBox.daysInBox}일</span>
                  </span>
                  <span className={s.myBoxStatItem}>
                    <span className={s.myBoxStatLabel}>가입일</span>
                    <span className={s.myBoxStatValue}>{dayjs(myBox.joinedAt).format("YYYY.MM.DD")}</span>
                  </span>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: "var(--muted)" }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          </div>
        )}

        {/* 배지 */}
        {myBadges && myBadges.length > 0 && (
          <div className={s.postsCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p className={s.postsHeader} style={{ margin: 0 }}>획득한 배지</p>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{myBadges.length}개</span>
            </div>
            <div className={s.badgeGrid}>
              {myBadges.map((badge: Badge) => (
                <div key={badge.id} className={`${s.badgeItem} ${s[`badgeTier${badge.tier}`]}`}>
                  <div className={s.badgeIcon}>{
                    badge.tier === "PLATINUM" ? "💠" :
                    badge.tier === "GOLD" ? "🥇" :
                    badge.tier === "SILVER" ? "🥈" : "🥉"
                  }</div>
                  <p className={s.badgeName}>{badge.name}</p>
                  <p className={s.badgeDesc}>{badge.description}</p>
                  <p className={s.badgeDate}>{dayjs(badge.awardedAt).format("YYYY.MM.DD")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 즐겨찾기 */}
        <div className={s.postsCard}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p className={s.postsHeader} style={{ margin: 0 }}>즐겨찾기 박스</p>
            <Link href="/my/favorites" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>전체 보기 →</Link>
          </div>
          {myFavorites?.content?.length > 0 ? (
            <div className={s.favoriteGrid}>
              {myFavorites.content.slice(0, 6).map((box: Box) => (
                <Link key={box.id} href={`/boxes/${box.id}`} className={s.favoriteItem}>
                  <div className={s.favoriteImg} style={{ position: "relative" }}>
                    {box.imageUrls?.[0]
                      ? <Image src={box.imageUrls[0]} alt={box.name} fill style={{ objectFit: "cover" }} />
                      : <div className={s.favoritePlaceholder}>CF</div>
                    }
                  </div>
                  <div className={s.favoriteInfo}>
                    <p className={s.favoriteName}>{box.name}</p>
                    <p className={s.favoriteMeta}>{box.city} {box.district} · ★ {Number(box.rating || 0).toFixed(1)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={s.empty}>즐겨찾기한 박스가 없습니다</div>
          )}
        </div>
      </div>
    </div>
  );
}
