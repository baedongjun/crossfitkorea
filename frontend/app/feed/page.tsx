"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isLoggedIn, getUser } from "@/lib/auth";
import { feedApi, userApi, followApi } from "@/lib/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import { toast } from "react-toastify";
import s from "./feed.module.css";

dayjs.extend(relativeTime);
dayjs.locale("ko");

interface FeedItem {
  type: string;
  actorId: number;
  actorName: string;
  actorProfileImageUrl?: string;
  title: string;
  description?: string;
  link?: string;
  imageUrl?: string;
  createdAt: string;
}

interface PageData {
  content: FeedItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  last: boolean;
}

const TYPE_ICON: Record<string, string> = {
  WOD_RECORD: "🏋️",
  BADGE: "🏅",
  COMPETITION: "🏆",
  POST: "📝",
};

const TYPE_LABEL: Record<string, string> = {
  WOD_RECORD: "WOD",
  BADGE: "배지",
  COMPETITION: "대회",
  POST: "게시글",
};

function SkeletonCard() {
  return (
    <div className={s.skeletonCard}>
      <div className={s.skeletonAvatar} />
      <div style={{ flex: 1 }}>
        <div className={s.skeletonLine} style={{ height: 14, width: "60%" }} />
        <div className={s.skeletonLine} style={{ height: 12, width: "40%" }} />
      </div>
    </div>
  );
}

function AvatarBox({ name, imageUrl }: { name: string; imageUrl?: string }) {
  return (
    <div className={s.avatar}>
      {imageUrl ? <img src={imageUrl} alt={name} /> : name?.charAt(0).toUpperCase() ?? "?"}
    </div>
  );
}

function FeedCard({ item, onClick }: { item: FeedItem; onClick: () => void }) {
  return (
    <div className={s.card} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick()}>
      <AvatarBox name={item.actorName} imageUrl={item.actorProfileImageUrl} />
      <div className={s.cardBody}>
        <div className={s.cardTop}>
          <span className={s.typeIcon}>{TYPE_ICON[item.type] ?? "📌"}</span>
          <Link href={`/users/${item.actorId}`} className={s.actorName} onClick={(e) => e.stopPropagation()}>
            {item.actorName}
          </Link>
          <span className={s.typeBadge}>{TYPE_LABEL[item.type] ?? item.type}</span>
        </div>
        <p className={s.cardTitle}>{item.title}</p>
        {item.description && <p className={s.cardDesc}>{item.description}</p>}
        <div className={s.cardMeta}>
          <span className={s.cardTime}>{dayjs(item.createdAt).fromNow()}</span>
        </div>
      </div>
      {item.imageUrl && <img src={item.imageUrl} alt="" className={s.cardImage} />}
    </div>
  );
}

interface SuggestedUser { id: number; name: string; profileImageUrl?: string; role: string; }

function SuggestedUsersSidebar() {
  const qc = useQueryClient();
  const currentUser = typeof window !== "undefined" ? getUser() : null;
  const [followingMap, setFollowingMap] = useState<Record<number, boolean>>({});
  const [pendingMap, setPendingMap] = useState<Record<number, boolean>>({});

  const { data } = useQuery({
    queryKey: ["suggestedUsers"],
    queryFn: async () => (await userApi.searchUsers("")).data.data,
  });

  const followMutation = useMutation({
    mutationFn: (userId: number) => {
      setPendingMap(prev => ({ ...prev, [userId]: true }));
      return followApi.toggle(userId);
    },
    onSuccess: (res, userId) => {
      setFollowingMap(prev => ({ ...prev, [userId]: res.data.data?.following ?? false }));
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: () => toast.error("팔로우 처리에 실패했습니다."),
    onSettled: (_d, _e, userId) => setPendingMap(prev => ({ ...prev, [userId]: false })),
  });

  const users: SuggestedUser[] = (data?.content ?? [])
    .filter((u: SuggestedUser) => u.name !== currentUser?.name)
    .slice(0, 6);

  if (users.length === 0) return null;

  return (
    <div className={s.sidebarCard}>
      <p className={s.sidebarCardTitle}>추천 선수</p>
      <div className={s.suggestedList}>
        {users.map((u) => (
          <div key={u.id} className={s.suggestedItem}>
            <Link href={`/users/${u.id}`} className={s.suggestedLink}>
              <div className={s.suggestedAvatar}>
                {u.profileImageUrl
                  ? <img src={u.profileImageUrl} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : u.name.charAt(0).toUpperCase()}
              </div>
              <span className={s.suggestedName}>{u.name}</span>
            </Link>
            <button
              className={followingMap[u.id] ? s.unfollowBtn : s.followBtn}
              onClick={() => followMutation.mutate(u.id)}
              disabled={!!pendingMap[u.id]}
            >
              {pendingMap[u.id] ? "..." : followingMap[u.id] ? "팔로잉" : "팔로우"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const FILTER_TYPES = ["전체", "WOD_RECORD", "BADGE", "COMPETITION", "POST"] as const;
type FilterType = typeof FILTER_TYPES[number];

export default function FeedPage() {
  const router = useRouter();
  const observerRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("전체");
  const currentUser = typeof window !== "undefined" ? getUser() : null;
  const loggedIn = isLoggedIn();

  useEffect(() => {
    if (!loggedIn) router.replace("/login");
  }, [router, loggedIn]);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await feedApi.getFeed(pageParam as number);
      return res.data.data as PageData;
    },
    getNextPageParam: (lastPage: PageData) => lastPage.last ? undefined : lastPage.number + 1,
    initialPageParam: 0,
    enabled: loggedIn,
  });

  const { data: myCounts } = useQuery({
    queryKey: ["follow", "counts", "me"],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      const res = await followApi.getCounts(currentUser.id);
      return res.data.data as { followerCount: number; followingCount: number };
    },
    enabled: !!currentUser?.id,
  });

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const element = observerRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const allItems = (data?.pages.flatMap((p) => p.content) ?? []).filter(
    (item) => activeFilter === "전체" || item.type === activeFilter
  );
  const isEmpty = !isLoading && allItems.length === 0;

  return (
    <div className={s.page}>
      {/* Hero */}
      <div className={s.hero}>
        <div className={s.heroInner}>
          <div className={s.heroLeft}>
            <div className={s.heroEyebrow}>
              <svg className={s.heroIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span className={s.heroTag}>Activity Feed</span>
            </div>
            <h1 className={s.heroTitle}>활동 피드</h1>
            <p className={s.heroSub}>팔로우한 선수들의 WOD 기록, 배지, 대회, 게시글 활동</p>
          </div>
          {myCounts && (
            <div className={s.heroStats}>
              <div className={s.heroStat}>
                <span className={s.heroStatNum}>{myCounts.followingCount}</span>
                <span className={s.heroStatLabel}>팔로잉</span>
              </div>
              <div className={s.heroStat}>
                <span className={s.heroStatNum}>{myCounts.followerCount}</span>
                <span className={s.heroStatLabel}>팔로워</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={s.content}>
        <div className={s.layout}>
          {/* ── Feed Column ── */}
          <div className={s.feedCol}>
            <div className={s.filterBar}>
              {FILTER_TYPES.map((f) => (
                <button
                  key={f}
                  className={`${s.filterBtn} ${activeFilter === f ? s.filterBtnActive : ""}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f === "전체" ? "전체" : `${TYPE_ICON[f]} ${TYPE_LABEL[f]}`}
                </button>
              ))}
            </div>

            {isLoading && (
              <div className={s.skeleton}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {isEmpty && (
              <div className={s.empty}>
                <div className={s.emptyIcon}>🏋️</div>
                {myCounts && myCounts.followingCount > 0 ? (
                  <>
                    <h2 className={s.emptyTitle}>아직 활동이 없습니다</h2>
                    <p className={s.emptyDesc}>
                      팔로우한 선수들의 WOD 기록, 배지, 대회 신청,<br />
                      게시글 활동이 생기면 여기에 표시됩니다.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className={s.emptyTitle}>아직 팔로우한 사람이 없습니다</h2>
                    <p className={s.emptyDesc}>
                      다른 선수들을 팔로우하면<br />
                      그들의 활동을 여기서 볼 수 있습니다.
                    </p>
                  </>
                )}
                <Link href="/search" className={s.emptyLink}>선수 검색하기</Link>
              </div>
            )}

            {!isLoading && allItems.length > 0 && (
              <div className={s.feedList}>
                {allItems.map((item, idx) => (
                  <FeedCard
                    key={`${item.type}-${item.actorId}-${item.createdAt}-${idx}`}
                    item={item}
                    onClick={() => { if (item.link) router.push(item.link); }}
                  />
                ))}
              </div>
            )}

            <div ref={observerRef} className={s.loadMore}>
              {isFetchingNextPage && (
                <>
                  <div className={s.loadingSpinner} />
                  <span>불러오는 중...</span>
                </>
              )}
              {!hasNextPage && allItems.length > 0 && <span>모든 활동을 불러왔습니다</span>}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className={s.sidebar}>
            <SuggestedUsersSidebar />
            <div className={s.sidebarCard}>
              <Link href="/search" className={s.sidebarLink}>선수 검색하기 →</Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
