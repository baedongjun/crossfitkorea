"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { checkInApi } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import s from "./attendance.module.css";

dayjs.locale("ko");

interface CheckIn {
  id: number;
  boxId: number;
  boxName: string;
  checkedInAt: string;
}

export default function MyAttendancePage() {
  const router = useRouter();
  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["my-checkins"],
      queryFn: async ({ pageParam = 0 }) =>
        (await checkInApi.getMyCheckIns(pageParam as number)).data.data,
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        if (lastPage.last) return undefined;
        return lastPage.number + 1;
      },
    });

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const allCheckIns: CheckIn[] = data?.pages.flatMap((p) => p.content as CheckIn[]) ?? [];
  const totalElements = data?.pages[0]?.totalElements ?? 0;

  // Group by month
  const grouped: Record<string, CheckIn[]> = {};
  allCheckIns.forEach((c) => {
    const key = dayjs(c.checkedInAt).format("YYYY년 MM월");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

  // Streak calculation
  const today = dayjs().startOf("day");
  let streak = 0;
  const daySet = new Set(allCheckIns.map((c) => dayjs(c.checkedInAt).format("YYYY-MM-DD")));
  for (let i = 0; i < 365; i++) {
    const d = today.subtract(i, "day").format("YYYY-MM-DD");
    if (daySet.has(d)) streak++;
    else if (i > 0) break;
  }

  const thisMonthCount = allCheckIns.filter((c) =>
    dayjs(c.checkedInAt).isSame(dayjs(), "month")
  ).length;

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <Link href="/my" className={s.back}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          마이페이지
        </Link>

        <div className={s.header}>
          <p className={s.tag}>ATTENDANCE</p>
          <h1 className={s.title}>출석 기록</h1>
          <p className={s.sub}>총 {totalElements.toLocaleString()}회 출석</p>
        </div>

        {/* Stats */}
        <div className={s.statsRow}>
          <div className={s.statCard}>
            <span className={s.statNum}>{totalElements}</span>
            <span className={s.statLabel}>누적 출석</span>
          </div>
          <div className={s.statCard}>
            <span className={s.statNum}>{thisMonthCount}</span>
            <span className={s.statLabel}>이번 달</span>
          </div>
          <div className={s.statCard}>
            <span className={s.statNum} style={{ color: streak > 0 ? "var(--red)" : undefined }}>{streak}</span>
            <span className={s.statLabel}>연속 출석</span>
          </div>
        </div>

        {isLoading ? (
          <div className={s.list}>
            {[...Array(5)].map((_, i) => <div key={i} className={s.skeleton} />)}
          </div>
        ) : allCheckIns.length === 0 ? (
          <div className={s.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--muted)", marginBottom: 16 }}>
              <rect x="3" y="4" width="18" height="18" rx="0" ry="0"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p>아직 출석 기록이 없습니다</p>
            <Link href="/boxes" className={s.emptyLink}>박스 찾기 →</Link>
          </div>
        ) : (
          Object.entries(grouped).map(([month, items]) => (
            <div key={month} className={s.monthGroup}>
              <div className={s.monthLabel}>
                {month} <span className={s.monthCount}>{items.length}회</span>
              </div>
              <div className={s.list}>
                {items.map((c) => (
                  <Link key={c.id} href={`/boxes/${c.boxId}`} className={s.item}>
                    <div className={s.itemIcon}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    <div className={s.itemBody}>
                      <p className={s.itemBox}>{c.boxName}</p>
                      <p className={s.itemTime}>
                        {dayjs(c.checkedInAt).format("MM월 DD일 (ddd) HH:mm")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}

        <div ref={observerRef} style={{ height: 1 }}>
          {isFetchingNextPage && <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13 }}>로딩 중...</p>}
        </div>
      </div>
    </div>
  );
}
