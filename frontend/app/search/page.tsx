"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { boxApi, competitionApi, communityApi, userApi } from "@/lib/api";
import { Box, Competition, Post } from "@/types";
import dayjs from "dayjs";
import s from "./search.module.css";

const STATUS_BADGE: Record<string, string> = {
  UPCOMING: "badge-upcoming", OPEN: "badge-open", CLOSED: "badge-closed", COMPLETED: "badge-completed",
};
const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "예정", OPEN: "접수 중", CLOSED: "접수 마감", COMPLETED: "종료",
};

interface UserResult { id: number; name: string; profileImageUrl?: string; role: string; }
type TabType = "all" | "boxes" | "competitions" | "community" | "users";

function useDebounce(value: string, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  const cb = useCallback((v: string) => {
    const t = setTimeout(() => setDebounced(v), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useState(() => { return cb(value); });
  return debounced;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabType>("all");

  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleInput = (val: string) => {
    setQuery(val);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setDebouncedQuery(val), 400);
    setTimer(t);
  };

  const enabled = debouncedQuery.trim().length >= 2;

  const { data: boxData, isLoading: boxLoading } = useQuery({
    queryKey: ["search", "boxes", debouncedQuery],
    queryFn: async () => (await boxApi.search({ keyword: debouncedQuery, size: 5 })).data.data,
    enabled,
  });

  const { data: compData, isLoading: compLoading } = useQuery({
    queryKey: ["search", "competitions", debouncedQuery],
    queryFn: async () => (await competitionApi.getAll({ size: 5 })).data.data,
    enabled,
  });

  const { data: postData, isLoading: postLoading } = useQuery({
    queryKey: ["search", "community", debouncedQuery],
    queryFn: async () => (await communityApi.getPosts({ keyword: debouncedQuery, size: 5 })).data.data,
    enabled,
  });

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["search", "users", debouncedQuery],
    queryFn: async () => (await userApi.searchUsers(debouncedQuery)).data.data,
    enabled,
  });

  const boxes: Box[] = boxData?.content ?? [];
  const competitions: Competition[] = (compData?.content ?? []).filter((c: Competition) =>
    c.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    (c.location || "").toLowerCase().includes(debouncedQuery.toLowerCase())
  );
  const posts: Post[] = postData?.content ?? [];
  const users: UserResult[] = (userData?.content ?? []).slice(0, 5);

  const totalCount = boxes.length + competitions.length + posts.length + users.length;
  const isLoading = boxLoading || compLoading || postLoading || userLoading;

  const showBoxes = tab === "all" || tab === "boxes";
  const showComps = tab === "all" || tab === "competitions";
  const showPosts = tab === "all" || tab === "community";
  const showUsers = tab === "all" || tab === "users";

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.header}>
          <p className={s.tag}>SEARCH</p>
          <h1 className={s.title}>전체 검색</h1>
        </div>

        {/* Search input */}
        <div className={s.searchBox}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={s.searchIcon}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={s.searchInput}
            placeholder="박스, 대회, 게시글 검색..."
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            autoFocus
          />
          {query && (
            <button className={s.clearBtn} onClick={() => { setQuery(""); setDebouncedQuery(""); }}>✕</button>
          )}
        </div>

        {!enabled ? (
          <div className={s.hint}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ color: "var(--muted)", marginBottom: 16 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p>두 글자 이상 입력하여 검색하세요</p>
            <div className={s.hintLinks}>
              <Link href="/boxes" className={s.hintLink}>박스 찾기</Link>
              <Link href="/competitions" className={s.hintLink}>대회 일정</Link>
              <Link href="/community" className={s.hintLink}>커뮤니티</Link>
              <Link href="/users" className={s.hintLink}>회원 검색</Link>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className={s.tabs}>
              {([
                { key: "all", label: `전체 (${isLoading ? "..." : totalCount})` },
                { key: "boxes", label: `박스 (${isLoading ? "..." : boxes.length})` },
                { key: "competitions", label: `대회 (${isLoading ? "..." : competitions.length})` },
                { key: "community", label: `커뮤니티 (${isLoading ? "..." : posts.length})` },
              { key: "users", label: `회원 (${isLoading ? "..." : users.length})` },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  className={`${s.tab} ${tab === key ? s.tabActive : ""}`}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className={s.loading}>검색 중...</div>
            ) : totalCount === 0 ? (
              <div className={s.empty}>
                <p>"{debouncedQuery}"에 대한 검색 결과가 없습니다</p>
              </div>
            ) : (
              <div className={s.results}>

                {/* Boxes */}
                {showBoxes && boxes.length > 0 && (
                  <div className={s.section}>
                    <div className={s.sectionHeader}>
                      <p className={s.sectionTitle}>박스</p>
                      {tab === "all" && boxes.length >= 5 && (
                        <Link href={`/boxes?keyword=${encodeURIComponent(debouncedQuery)}`} className={s.sectionMore}>더 보기 →</Link>
                      )}
                    </div>
                    <div className={s.list}>
                      {boxes.map((box) => (
                        <Link key={box.id} href={`/boxes/${box.id}`} className={s.item}>
                          <div className={s.itemIcon}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                              <polyline points="9 22 9 12 15 12 15 22"/>
                            </svg>
                          </div>
                          <div className={s.itemBody}>
                            <p className={s.itemTitle}>{box.name}</p>
                            <p className={s.itemMeta}>{box.city} {box.district} · {box.address}</p>
                          </div>
                          {box.rating > 0 && <span className={s.itemRating}>★ {box.rating.toFixed(1)}</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competitions */}
                {showComps && competitions.length > 0 && (
                  <div className={s.section}>
                    <div className={s.sectionHeader}>
                      <p className={s.sectionTitle}>대회</p>
                      {tab === "all" && competitions.length >= 5 && (
                        <Link href="/competitions" className={s.sectionMore}>더 보기 →</Link>
                      )}
                    </div>
                    <div className={s.list}>
                      {competitions.map((comp) => (
                        <Link key={comp.id} href={`/competitions/${comp.id}`} className={s.item}>
                          <div className={s.itemIcon}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M8 21h8m-4-4v4M5 3h14l1 7H4L5 3zM4 10c0 4.418 3.582 8 8 8s8-3.582 8-8"/>
                            </svg>
                          </div>
                          <div className={s.itemBody}>
                            <p className={s.itemTitle}>{comp.name}</p>
                            <p className={s.itemMeta}>{dayjs(comp.startDate).format("YYYY.MM.DD")} · {comp.location || comp.city}</p>
                          </div>
                          <span className={`badge ${STATUS_BADGE[comp.status]}`} style={{ fontSize: 10, whiteSpace: "nowrap" }}>
                            {STATUS_LABELS[comp.status]}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users */}
                {showUsers && users.length > 0 && (
                  <div className={s.section}>
                    <div className={s.sectionHeader}>
                      <p className={s.sectionTitle}>회원</p>
                      {tab === "all" && users.length >= 5 && (
                        <Link href={`/users?keyword=${encodeURIComponent(debouncedQuery)}`} className={s.sectionMore}>더 보기 →</Link>
                      )}
                    </div>
                    <div className={s.list}>
                      {users.map((u) => (
                        <Link key={u.id} href={`/users/${u.id}`} className={s.item}>
                          <div className={s.itemIcon} style={{ fontSize: 20 }}>
                            {u.profileImageUrl ? (
                              <img src={u.profileImageUrl} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : "👤"}
                          </div>
                          <div className={s.itemBody}>
                            <p className={s.itemTitle}>{u.name}</p>
                            {u.role !== "ROLE_USER" && (
                              <p className={s.itemMeta}>{u.role === "ROLE_BOX_OWNER" ? "박스 오너" : "관리자"}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Community */}
                {showPosts && posts.length > 0 && (
                  <div className={s.section}>
                    <div className={s.sectionHeader}>
                      <p className={s.sectionTitle}>커뮤니티</p>
                      {tab === "all" && posts.length >= 5 && (
                        <Link href={`/community?keyword=${encodeURIComponent(debouncedQuery)}`} className={s.sectionMore}>더 보기 →</Link>
                      )}
                    </div>
                    <div className={s.list}>
                      {posts.map((post) => (
                        <Link key={post.id} href={`/community/${post.id}`} className={s.item}>
                          <div className={s.itemIcon}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                          </div>
                          <div className={s.itemBody}>
                            <p className={s.itemTitle}>{post.title}</p>
                            <p className={s.itemMeta}>{post.userName} · {dayjs(post.createdAt).format("MM.DD")}</p>
                          </div>
                          <div className={s.itemStats}>
                            <span>♥ {post.likeCount}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
