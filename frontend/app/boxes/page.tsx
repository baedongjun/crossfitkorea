"use client";

import { useState, Suspense, useEffect, useRef, useCallback } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { boxApi } from "@/lib/api";
import BoxCard from "@/components/box/BoxCard";
import BoxMap from "@/components/box/BoxMap";
import { Box, Page } from "@/types";
import s from "./boxes.module.css";

const CITIES = ["전체", "서울", "경기", "부산", "인천", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

function BoxesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [keyword, setKeyword] = useState(searchParams.get("q") || "");
  const [debouncedKeyword, setDebouncedKeyword] = useState(searchParams.get("q") || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "전체");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);

  // 최근 검색어
  const RECENT_KEY = "box_recent_searches";
  const getRecentSearches = (): string[] => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
  };
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  useEffect(() => { setRecentSearches(getRecentSearches()); }, []);
  const saveRecentSearch = (q: string) => {
    if (!q.trim()) return;
    const updated = [q, ...getRecentSearches().filter((s) => s !== q)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    setRecentSearches(updated);
  };
  const removeRecentSearch = (q: string) => {
    const updated = getRecentSearches().filter((s) => s !== q);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    setRecentSearches(updated);
  };
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verified") === "true");
  const [premiumOnly, setPremiumOnly] = useState(searchParams.get("premium") === "true");
  const [maxFee, setMaxFee] = useState(searchParams.get("maxFee") || "");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "createdAt,desc");

  // URL 동기화
  const syncUrl = (overrides: Record<string, string | undefined> = {}) => {
    const params = new URLSearchParams();
    const vals: Record<string, string | undefined> = {
      city: selectedCity !== "전체" ? selectedCity : undefined,
      q: debouncedKeyword || undefined,
      verified: verifiedOnly ? "true" : undefined,
      premium: premiumOnly ? "true" : undefined,
      maxFee: maxFee || undefined,
      minRating: minRating || undefined,
      sort: sortBy !== "createdAt,desc" ? sortBy : undefined,
      ...overrides,
    };
    Object.entries(vals).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    router.replace(`/boxes${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedKeyword(keyword);
      syncUrl({ q: keyword || undefined });
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const currentUser = typeof window !== "undefined" ? (() => { try { const u = localStorage.getItem("user"); return u ? JSON.parse(u) : null; } catch { return null; } })() : null;
  const isOwner = currentUser?.role === "ROLE_BOX_OWNER" || currentUser?.role === "ROLE_ADMIN";

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["boxes", "infinite", selectedCity, debouncedKeyword, verifiedOnly, premiumOnly, maxFee, minRating, sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await boxApi.search({
        city: selectedCity === "전체" ? undefined : selectedCity,
        keyword: debouncedKeyword || undefined,
        page: pageParam as number,
        size: 12,
        verified: verifiedOnly ? true : undefined,
        premium: premiumOnly ? true : undefined,
        maxFee: maxFee ? parseInt(maxFee) : undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        sort: sortBy,
      });
      return res.data.data as Page<Box>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return lastPage.number + 1;
    },
  });

  const allBoxes = data?.pages.flatMap((p) => p.content) ?? [];
  const totalElements = data?.pages[0]?.totalElements ?? 0;

  // IntersectionObserver for infinite scroll (list mode only)
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    if (viewMode !== "list") return;
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver, viewMode]);

  // 자동완성: 키워드가 2자 이상일 때 suggestions
  const { data: suggestData } = useQuery({
    queryKey: ["boxes", "suggest", keyword],
    queryFn: async () => {
      const res = await boxApi.search({ keyword, size: 5 });
      return (res.data.data as Page<Box>).content || [];
    },
    enabled: keyword.length >= 2,
  });

  const suggestions: Box[] = keyword.length >= 2 ? (suggestData || []) : [];

  // 외부 클릭 시 suggestions 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeFilterCount = [verifiedOnly, premiumOnly, !!maxFee, !!minRating].filter(Boolean).length;

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    syncUrl({ city: city !== "전체" ? city : undefined });
  };

  return (
    <div className={s.page}>
      {/* Search Bar */}
      <div className={s.searchBar}>
        <div className={s.searchTop}>
          <div className={s.searchInputWrap} ref={searchWrapRef} style={{ position: "relative" }}>
            <svg className={s.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="박스 이름, 주소로 검색"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              className={s.searchInput}
            />
            {showSuggestions && (suggestions.length > 0 || (!keyword && recentSearches.length > 0)) && (
              <div className={s.suggestions}>
                {!keyword && recentSearches.length > 0 && (
                  <>
                    <div className={s.suggestionLabel}>최근 검색어</div>
                    {recentSearches.map((q) => (
                      <button
                        key={q}
                        className={s.suggestionItem}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setKeyword(q);
                          setDebouncedKeyword(q);
                          setShowSuggestions(false);
                          syncUrl({ q });
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: "var(--muted)" }}>
                          <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.4"/>
                        </svg>
                        <span>{q}</span>
                        <span
                          style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)", padding: "0 4px" }}
                          onMouseDown={(e) => { e.stopPropagation(); removeRecentSearch(q); }}
                        >✕</span>
                      </button>
                    ))}
                  </>
                )}
                {suggestions.map((box) => (
                  <button
                    key={box.id}
                    className={s.suggestionItem}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setKeyword(box.name);
                      setDebouncedKeyword(box.name);
                      setShowSuggestions(false);
                      saveRecentSearch(box.name);
                      syncUrl({ q: box.name });
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: "var(--muted)" }}>
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
                    </svg>
                    <span>{box.name}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto" }}>{box.city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={s.filterBtn}
            style={{ position: "relative" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            필터
            {activeFilterCount > 0 && (
              <span className={s.filterBadge}>{activeFilterCount}</span>
            )}
          </button>

          <div className={s.viewToggle}>
            <button
              onClick={() => setViewMode("list")}
              className={`${s.viewBtn} ${viewMode === "list" ? s.viewBtnActive : ""}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              목록
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`${s.viewBtn} ${viewMode === "map" ? s.viewBtnActive : ""}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
              </svg>
              지도
            </button>
          </div>
        </div>

        {showFilters && (
          <div className={s.filterPanel}>
            <div className={s.filterRow}>
              <label className={s.filterCheck}>
                <input type="checkbox" checked={verifiedOnly} onChange={(e) => { setVerifiedOnly(e.target.checked); }} />
                <span>인증 박스만</span>
              </label>
              <label className={s.filterCheck}>
                <input type="checkbox" checked={premiumOnly} onChange={(e) => { setPremiumOnly(e.target.checked); }} />
                <span>프리미엄만</span>
              </label>
            </div>
            <div className={s.filterRow}>
              <div className={s.filterField}>
                <span className={s.filterLabel}>최대 월 회비</span>
                <input
                  type="number"
                  className={s.filterInput}
                  placeholder="예: 150000"
                  value={maxFee}
                  onChange={(e) => { setMaxFee(e.target.value); }}
                />
              </div>
              <div className={s.filterField}>
                <span className={s.filterLabel}>최소 평점</span>
                <select
                  className={s.filterSelect}
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="3">3.0+</option>
                  <option value="3.5">3.5+</option>
                  <option value="4">4.0+</option>
                  <option value="4.5">4.5+</option>
                </select>
              </div>
              {activeFilterCount > 0 && (
                <button
                  className={s.filterReset}
                  onClick={() => { setVerifiedOnly(false); setPremiumOnly(false); setMaxFee(""); setMinRating(""); }}
                >
                  초기화
                </button>
              )}
            </div>
          </div>
        )}

        <div className={s.cityPills}>
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => handleCityChange(city)}
              className={`${s.pill} ${selectedCity === city ? s.pillActive : ""}`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* 박스 등록 유도 배너 */}
      {!isOwner && (
        <div className={s.ownerBanner}>
          <span className={s.ownerBannerText}>박스를 운영 중이신가요?</span>
          <Link href="/boxes/create" className={s.ownerBannerLink}>무료로 등록하기 →</Link>
        </div>
      )}

      {/* Content */}
      <div className={s.content}>
        {viewMode === "map" ? (
          <BoxMap boxes={allBoxes} />
        ) : (
          <>
            <div className={s.contentHeader}>
              <p className={s.resultCount}>
                총 <span>{totalElements}</span>개 박스
              </p>
              <select
                className={s.sortSelect}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="createdAt,desc">최신순</option>
                <option value="rating,desc">별점 높은순</option>
                <option value="reviewCount,desc">후기 많은순</option>
                <option value="monthlyFee,asc">회비 낮은순</option>
                <option value="monthlyFee,desc">회비 높은순</option>
              </select>
            </div>

            {isLoading ? (
              <div className={s.grid}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={s.skeleton} />
                ))}
              </div>
            ) : allBoxes.length === 0 ? (
              <div className={s.emptyWrap}>
                <div className={s.empty}>
                  <div className={s.emptyIcon}>🏋️</div>
                  <p className={s.emptyText}>검색 결과가 없습니다</p>
                  <p className={s.emptySubText}>다른 검색어나 지역을 시도해보세요</p>
                </div>
                <div className={s.registerBanner}>
                  <p className={s.registerBannerTitle}>이 지역에 박스를 운영 중이신가요?</p>
                  <p className={s.registerBannerDesc}>CrossFit Korea에 무료로 등록하고 더 많은 회원과 연결하세요.</p>
                  <Link href="/boxes/create" className="btn-primary" style={{ display: "inline-block", marginTop: 16 }}>무료 등록하기</Link>
                </div>
              </div>
            ) : (
              <div className={s.grid}>
                {allBoxes.map((box) => (
                  <BoxCard key={box.id} box={box} />
                ))}
              </div>
            )}

            {/* Infinite scroll sentinel */}
            <div ref={observerRef} className={s.infiniteSentinel}>
              {isFetchingNextPage && <span className={s.loadingText}>로딩 중...</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BoxesPage() {
  return (
    <Suspense>
      <BoxesContent />
    </Suspense>
  );
}
