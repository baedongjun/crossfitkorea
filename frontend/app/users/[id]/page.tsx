"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, badgeApi, followApi } from "@/lib/api";
import { Badge, FollowUser } from "@/types";
import { isLoggedIn, getUser } from "@/lib/auth";
import dayjs from "dayjs";
import s from "./profile.module.css";

const ROLE_LABEL: Record<string, string> = {
  ROLE_USER: "회원",
  ROLE_BOX_OWNER: "박스 오너",
  ROLE_ADMIN: "관리자",
};

const TIER_COLOR: Record<string, string> = {
  BRONZE: "#cd7f32",
  SILVER: "#c0c0c0",
  GOLD: "#eab308",
  PLATINUM: "#0ea5e9",
};

type TabType = "badges" | "followers" | "following";

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const queryClient = useQueryClient();
  const currentUser = getUser();
  const isMe = currentUser && String((currentUser as { id?: number }).id) === id;
  const loggedIn = isLoggedIn();
  const [activeTab, setActiveTab] = useState<TabType>("badges");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user", userId, "profile"],
    queryFn: async () => (await userApi.getPublicProfile(userId)).data.data,
  });

  const { data: badges } = useQuery({
    queryKey: ["badges", "user", userId],
    queryFn: async () => (await badgeApi.getUserBadges(userId)).data.data as Badge[],
  });

  const { data: followCounts } = useQuery({
    queryKey: ["follow", "counts", userId],
    queryFn: async () =>
      (await followApi.getCounts(userId)).data.data as { followerCount: number; followingCount: number },
  });

  const { data: followStatus } = useQuery({
    queryKey: ["follow", "status", userId],
    queryFn: async () => (await followApi.isFollowing(userId)).data.data as { following: boolean },
    enabled: loggedIn && !isMe,
  });

  const { data: followers } = useQuery({
    queryKey: ["follow", "followers", userId],
    queryFn: async () => (await followApi.getFollowers(userId)).data.data as FollowUser[],
    enabled: activeTab === "followers",
  });

  const { data: following } = useQuery({
    queryKey: ["follow", "following", userId],
    queryFn: async () => (await followApi.getFollowing(userId)).data.data as FollowUser[],
    enabled: activeTab === "following",
  });

  const toggleFollowMutation = useMutation({
    mutationFn: () => followApi.toggle(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow", "status", userId] });
      queryClient.invalidateQueries({ queryKey: ["follow", "counts", userId] });
      queryClient.invalidateQueries({ queryKey: ["follow", "followers", userId] });
    },
  });

  const toggleFollowUserMutation = useMutation({
    mutationFn: (targetId: number) => followApi.toggle(targetId),
    onSuccess: (_, targetId) => {
      queryClient.invalidateQueries({ queryKey: ["follow", "followers", userId] });
      queryClient.invalidateQueries({ queryKey: ["follow", "following", userId] });
      queryClient.invalidateQueries({ queryKey: ["follow", "status", targetId] });
    },
  });

  if (isLoading) {
    return (
      <div className={s.page}>
        <div className={s.inner}>
          <div className={s.skeleton} style={{ height: 200 }} />
        </div>
      </div>
    );
  }
  if (!profile) return null;

  const platinumBadges = badges?.filter((b) => b.tier === "PLATINUM") ?? [];
  const goldBadges = badges?.filter((b) => b.tier === "GOLD") ?? [];
  const silverBadges = badges?.filter((b) => b.tier === "SILVER") ?? [];
  const bronzeBadges = badges?.filter((b) => b.tier === "BRONZE") ?? [];

  const isFollowing = followStatus?.following ?? false;

  return (
    <div className={s.page}>
      <div className={s.inner}>
        {/* Profile Header */}
        <div className={s.profileCard}>
          <div className={s.avatarWrap}>
            {profile.profileImageUrl ? (
              <Image src={profile.profileImageUrl} alt={profile.name} width={80} height={80} className={s.avatar} style={{ objectFit: "cover" }} />
            ) : (
              <div className={s.avatarFallback}>{profile.name?.[0] || "?"}</div>
            )}
          </div>
          <div className={s.profileInfo}>
            <h1 className={s.name}>{profile.name}</h1>
            <span className={`badge badge-default`}>
              {ROLE_LABEL[profile.role] || profile.role}
            </span>
            {/* 팔로워/팔로잉 수 */}
            <div className={s.followCounts}>
              <button
                className={activeTab === "followers" ? s.followCountActive : s.followCount}
                onClick={() => setActiveTab("followers")}
              >
                <span className={s.followNum}>{followCounts?.followerCount ?? 0}</span>
                <span className={s.followLabel}>팔로워</span>
              </button>
              <div className={s.followDivider} />
              <button
                className={activeTab === "following" ? s.followCountActive : s.followCount}
                onClick={() => setActiveTab("following")}
              >
                <span className={s.followNum}>{followCounts?.followingCount ?? 0}</span>
                <span className={s.followLabel}>팔로잉</span>
              </button>
            </div>
          </div>
          <div className={s.profileRight}>
            {badges && badges.length > 0 && (
              <div className={s.badgeSummary}>
                {platinumBadges.length > 0 && (
                  <div className={s.tierCount} style={{ color: TIER_COLOR.PLATINUM }}>
                    <span>💠</span> {platinumBadges.length}
                  </div>
                )}
                {goldBadges.length > 0 && (
                  <div className={s.tierCount} style={{ color: TIER_COLOR.GOLD }}>
                    <span>🥇</span> {goldBadges.length}
                  </div>
                )}
                {silverBadges.length > 0 && (
                  <div className={s.tierCount} style={{ color: TIER_COLOR.SILVER }}>
                    <span>🥈</span> {silverBadges.length}
                  </div>
                )}
                {bronzeBadges.length > 0 && (
                  <div className={s.tierCount} style={{ color: TIER_COLOR.BRONZE }}>
                    <span>🥉</span> {bronzeBadges.length}
                  </div>
                )}
              </div>
            )}
            {/* 팔로우 버튼 */}
            {loggedIn && !isMe && (
              <button
                className={isFollowing ? s.unfollowBtn : s.followBtn}
                onClick={() => toggleFollowMutation.mutate()}
                disabled={toggleFollowMutation.isPending}
              >
                {toggleFollowMutation.isPending
                  ? "..."
                  : isFollowing
                  ? "언팔로우"
                  : "팔로우"}
              </button>
            )}
          </div>
        </div>

        {/* 탭 */}
        <div className={s.tabs}>
          <button
            className={activeTab === "badges" ? s.tabActive : s.tab}
            onClick={() => setActiveTab("badges")}
          >
            배지 {badges?.length ?? 0}
          </button>
          <button
            className={activeTab === "followers" ? s.tabActive : s.tab}
            onClick={() => setActiveTab("followers")}
          >
            팔로워 {followCounts?.followerCount ?? 0}
          </button>
          <button
            className={activeTab === "following" ? s.tabActive : s.tab}
            onClick={() => setActiveTab("following")}
          >
            팔로잉 {followCounts?.followingCount ?? 0}
          </button>
        </div>

        {/* 배지 탭 */}
        {activeTab === "badges" && (
          <>
            {badges && badges.length > 0 ? (
              <div className={s.section}>
                <p className={s.sectionTitle}>획득한 배지 <span>{badges.length}개</span></p>
                <div className={s.badgeGrid}>
                  {badges.map((badge: Badge) => (
                    <div
                      key={badge.id}
                      className={s.badgeItem}
                      style={{ borderColor: `${TIER_COLOR[badge.tier]}40` }}
                    >
                      <div className={s.badgeIcon}>
                        {badge.tier === "PLATINUM" ? "💠" :
                         badge.tier === "GOLD" ? "🥇" :
                         badge.tier === "SILVER" ? "🥈" : "🥉"}
                      </div>
                      <p className={s.badgeName}>{badge.name}</p>
                      <p className={s.badgeDesc}>{badge.description}</p>
                      <p className={s.badgeTier} style={{ color: TIER_COLOR[badge.tier] }}>
                        {badge.tier}
                      </p>
                      <p className={s.badgeDate}>{dayjs(badge.awardedAt).format("YYYY.MM.DD")}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={s.empty}>
                <div className={s.emptyIcon}>🏅</div>
                <p>아직 획득한 배지가 없습니다</p>
              </div>
            )}
          </>
        )}

        {/* 팔로워 탭 */}
        {activeTab === "followers" && (
          <div className={s.section}>
            <p className={s.sectionTitle}>팔로워 <span>{followCounts?.followerCount ?? 0}명</span></p>
            {followers && followers.length > 0 ? (
              <div className={s.followList}>
                {followers.map((user: FollowUser) => (
                  <div key={user.id} className={s.followItem}>
                    <Link href={`/users/${user.id}`} className={s.followItemLink}>
                      <div className={s.followAvatar}>
                        {user.profileImageUrl ? (
                          <Image src={user.profileImageUrl} alt={user.name} width={40} height={40} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                        ) : (
                          <span>{user.name?.[0] || "?"}</span>
                        )}
                      </div>
                      <div className={s.followItemInfo}>
                        <p className={s.followItemName}>{user.name}</p>
                        <p className={s.followItemRole}>{ROLE_LABEL[user.role] || user.role}</p>
                      </div>
                    </Link>
                    {loggedIn && String((currentUser as { id?: number })?.id) !== String(user.id) && (
                      <button
                        className={user.following ? s.unfollowBtnSm : s.followBtnSm}
                        onClick={() => toggleFollowUserMutation.mutate(user.id)}
                        disabled={toggleFollowUserMutation.isPending}
                      >
                        {user.following ? "언팔로우" : "팔로우"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={s.empty}>
                <div className={s.emptyIcon}>👥</div>
                <p>팔로워가 없습니다</p>
              </div>
            )}
          </div>
        )}

        {/* 팔로잉 탭 */}
        {activeTab === "following" && (
          <div className={s.section}>
            <p className={s.sectionTitle}>팔로잉 <span>{followCounts?.followingCount ?? 0}명</span></p>
            {following && following.length > 0 ? (
              <div className={s.followList}>
                {following.map((user: FollowUser) => (
                  <div key={user.id} className={s.followItem}>
                    <Link href={`/users/${user.id}`} className={s.followItemLink}>
                      <div className={s.followAvatar}>
                        {user.profileImageUrl ? (
                          <Image src={user.profileImageUrl} alt={user.name} width={40} height={40} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                        ) : (
                          <span>{user.name?.[0] || "?"}</span>
                        )}
                      </div>
                      <div className={s.followItemInfo}>
                        <p className={s.followItemName}>{user.name}</p>
                        <p className={s.followItemRole}>{ROLE_LABEL[user.role] || user.role}</p>
                      </div>
                    </Link>
                    {loggedIn && String((currentUser as { id?: number })?.id) !== String(user.id) && (
                      <button
                        className={user.following ? s.unfollowBtnSm : s.followBtnSm}
                        onClick={() => toggleFollowUserMutation.mutate(user.id)}
                        disabled={toggleFollowUserMutation.isPending}
                      >
                        {user.following ? "언팔로우" : "팔로우"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={s.empty}>
                <div className={s.emptyIcon}>👥</div>
                <p>팔로잉하는 사람이 없습니다</p>
              </div>
            )}
          </div>
        )}

        <div className={s.backRow}>
          <Link href="/boxes" className={s.backLink}>← 박스 찾기로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
