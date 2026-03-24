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
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div className={s.avatar}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} />
      ) : (
        initial
      )}
    </div>
  );
}

function FeedCard({ item, onClick }: { item: FeedItem; onClick: () => void }) {
  const icon = TYPE_ICON[item.type] ?? "📌";
  const label = TYPE_LABEL[item.type] ?? item.type;

  return (
    <div className={s.card} onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick()}>
      <AvatarBox name={item.actorName} imageUrl={item.actorProfileImageUrl} />
      <div className={s.cardBody}>
        <div className={s.cardTop}>
          <span className={s.typeIcon}>{icon}</span>
          <Link
            href={`/users/${item.actorId}`}
            className={s.actorName}
            onClick={(e) => e.stopPropagation()}
          >
            {item.actorName}
          </Link>
          <span className={s.typeBadge}>{label}</span>
        </div>
        <p className={s.cardTitle}>{item.title}</p>
        {item.description && <p className={s.cardDesc}>{item.description}</p>}
        <div className={s.cardMeta}>
          <span className={s.cardTime}>{dayjs(item.createdAt).fromNow()}</span>
        </div>
      </div>
      {item.imageUrl && (
        <img src={item.imageUrl} alt="" className={s.cardImage} />
      )}
    </div>
  );
}

interface SuggestedUser { id: number; name: string; profileImageUrl?: string; role: string; }

function SuggestedUsers() {
  const qc = useQueryClient();
  const currentUser = typeof window !== "undefined" ? getUser() : null;
  const [followingMap, setFollowingMap] = useState<Record<number, boolean>>({});

  const { data } = useQuery({
    queryKey: ["suggestedUsers"],
    queryFn: async () => (await userApi.searchUsers("")).data.data,
  });

  const followMutation = useMutation({
    mutationFn: (userId: number) => followApi.toggle(userId),
    onSuccess: (res, userId) => {
      const isFollowing = res.data.data?.following ?? false;
      setFollowingMap(prev => ({ ...prev, [userId]: isFollowing }));
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const users: SuggestedUser[] = (data?.content ?? [])
    .filter((u: SuggestedUser) => u.name !== currentUser?.name)
    .slice(0, 6);

  if (users.length === 0) return null;

  return (
    <div className={s.suggestedWrap}>
      <p className={s.suggestedTitle}>추천 선수</p>
      <div className={s.suggestedList}>
        {users.map((u) => (
          <div key={u.id} className={s.suggestedItem}>
            <Link href={`/users/${u.id}`} className={s.suggestedLink}>
              <div className={s.suggestedAvatar}>
                {u.profileImageUrl ? (
                  <img src={u.profileImageUrl} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : u.name.charAt(0).toUpperCase()}
              </div>
              <span className={s.suggestedName}>{u.name}</span>
            </Link>
            <button
              className={followingMap[u.id] ? s.unfollowBtn : s.followBtn}
              onClick={() => followMutation.mutate(u.id)}
              disabled={followMutation.isPending}
            >
              {followingMap[u.id] ? "팔로잉" : "팔로우"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
    }
  }, [router]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await feedApi.getFeed(pageParam as number);
      return res.data.data as PageData;
    },
    getNextPageParam: (lastPage: PageData) =>
      lastPage.last ? undefined : lastPage.number + 1,
    initialPageParam: 0,
  });

  // IntersectionObserver for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
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

  const allItems = data?.pages.flatMap((p) => p.content) ?? [];
  const isEmpty = !isLoading && allItems.length === 0;

  const handleCardClick = (link?: string) => {
    if (link) router.push(link);
  };

  return (
    <main className={s.container}>
      <div className={s.header}>
        <h1 className={s.title}>활동 피드</h1>
        <p className={s.subtitle}>팔로우한 선수들의 최근 활동</p>
      </div>

      {isLoading && (
        <div className={s.skeleton}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {isEmpty && (
        <div className={s.empty}>
          <div className={s.emptyIcon}>🏋️</div>
          <h2 className={s.emptyTitle}>아직 팔로우한 사람이 없습니다</h2>
          <p className={s.emptyDesc}>
            다른 선수들을 팔로우하면<br />
            그들의 WOD 기록, 배지, 대회 신청 활동을 여기서 볼 수 있습니다.
          </p>
          <SuggestedUsers />
          <Link href="/search" className={s.emptyLink}>
            선수 검색하기
          </Link>
        </div>
      )}

      {!isLoading && allItems.length > 0 && (
        <div className={s.feedList}>
          {allItems.map((item, idx) => (
            <FeedCard
              key={`${item.type}-${item.actorId}-${item.createdAt}-${idx}`}
              item={item}
              onClick={() => handleCardClick(item.link)}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className={s.loadMore}>
        {isFetchingNextPage && (
          <>
            <div className={s.loadingSpinner} />
            <span>불러오는 중...</span>
          </>
        )}
        {!hasNextPage && allItems.length > 0 && (
          <span>모든 활동을 불러왔습니다</span>
        )}
      </div>
    </main>
  );
}
