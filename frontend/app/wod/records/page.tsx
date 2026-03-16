"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { wodRecordApi, wodApi } from "@/lib/api";
import { WodRecord, Wod } from "@/types";
import { isLoggedIn } from "@/lib/auth";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import s from "./records.module.css";

dayjs.extend(relativeTime);
dayjs.locale("ko");

export default function WodRecordsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  const { data, isLoading } = useQuery({
    queryKey: ["wod-records", page],
    queryFn: async () => (await wodRecordApi.getMyRecords(page)).data.data,
    enabled: isLoggedIn(),
  });

  const { data: wodHistory } = useQuery({
    queryKey: ["wod", "history", 0, 90],
    queryFn: async () => (await wodApi.getHistory(0, 90)).data.data,
  });
  const wodByDate: Record<string, Wod> = {};
  (wodHistory?.content || []).forEach((w: Wod) => { wodByDate[w.wodDate] = w; });

  // 히트맵: 최근 16주(112일)
  const { data: recentRecords } = useQuery({
    queryKey: ["wod-records-recent"],
    queryFn: async () => (await wodRecordApi.getRecentRecords(112)).data.data as WodRecord[],
    enabled: isLoggedIn(),
  });
  const recordDateSet = new Set<string>((recentRecords || []).map((r) => r.wodDate));

  // 히트맵 셀 생성 (일요일 기준 16주)
  const heatmapEnd = dayjs().endOf("week");
  const heatmapStart = heatmapEnd.subtract(15, "week").startOf("week");
  const heatmapWeeks: Array<Array<dayjs.Dayjs | null>> = [];
  let cur = heatmapStart;
  while (cur.isBefore(heatmapEnd) || cur.isSame(heatmapEnd, "day")) {
    const week: Array<dayjs.Dayjs | null> = [];
    for (let d = 0; d < 7; d++) {
      const cell = cur.add(d, "day");
      week.push(cell.isAfter(dayjs()) ? null : cell);
    }
    heatmapWeeks.push(week);
    cur = cur.add(1, "week");
  }

  const deleteMutation = useMutation({
    mutationFn: (id: number) => wodRecordApi.deleteRecord(id),
    onSuccess: () => {
      toast.success("기록이 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["wod-records"] });
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const records: WodRecord[] = data?.content || [];
  const totalPages = data?.totalPages || 1;
  const totalElements = data?.totalElements || 0;

  // 통계: 이번 달 기록 수, RX 비율 (전체 페이지 기준 현재 로드된 데이터)
  const thisMonth = dayjs().format("YYYY-MM");
  const thisMonthRecords = records.filter((r) => r.wodDate?.startsWith(thisMonth));
  const rxCount = records.filter((r) => r.rx).length;
  const rxRatio = records.length > 0 ? Math.round((rxCount / records.length) * 100) : 0;

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.header}>
          <div>
            <Link href="/wod" className={s.back}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              오늘의 WOD
            </Link>
            <h1 className={s.title}>내 WOD 기록</h1>
            <p className={s.sub}>총 {totalElements}개의 기록</p>
          </div>
          <Link href="/wod" className="btn-primary" style={{ padding: "12px 24px", fontSize: 14 }}>
            + 오늘 기록 입력
          </Link>
        </div>

        {/* 출석 히트맵 */}
        {recentRecords && recentRecords.length > 0 && (
          <div className={s.heatmap}>
            <p className={s.heatmapTitle}>출석 현황 (최근 16주)</p>
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "flex", gap: 3, minWidth: "fit-content" }}>
                {heatmapWeeks.map((week, wi) => (
                  <div key={wi} className={s.heatmapWeek}>
                    {week.map((day, di) => {
                      if (!day) return <div key={di} className={s.heatmapCell} style={{ opacity: 0 }} />;
                      const dateStr = day.format("YYYY-MM-DD");
                      const hasRecord = recordDateSet.has(dateStr);
                      const isToday = dateStr === dayjs().format("YYYY-MM-DD");
                      return (
                        <div
                          key={di}
                          className={`${s.heatmapCell} ${hasRecord ? s.heatmapCellL3 : ""}`}
                          style={isToday ? { outline: "1px solid rgba(255,255,255,0.4)" } : {}}
                          title={`${day.format("MM/DD")}${hasRecord ? " ✓" : ""}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className={s.heatmapLegend}>
              <span>적음</span>
              <div className={s.heatmapLegendBox} />
              <div className={s.heatmapLegendBox} style={{ background: "rgba(232,34,10,0.25)", borderColor: "rgba(232,34,10,0.3)" }} />
              <div className={s.heatmapLegendBox} style={{ background: "rgba(232,34,10,0.5)", borderColor: "rgba(232,34,10,0.5)" }} />
              <div className={s.heatmapLegendBox} style={{ background: "rgba(232,34,10,0.8)", borderColor: "rgba(232,34,10,0.7)" }} />
              <span>많음</span>
            </div>
          </div>
        )}

        {/* 통계 */}
        {!isLoading && totalElements > 0 && (
          <div className={s.stats}>
            <div className={s.statItem}>
              <p className={s.statNum}>{totalElements}</p>
              <p className={s.statLabel}>총 기록</p>
            </div>
            <div className={s.statItem}>
              <p className={s.statNum}>{thisMonthRecords.length}</p>
              <p className={s.statLabel}>이번 달</p>
            </div>
            <div className={s.statItem}>
              <p className={s.statNum}>{rxRatio}<span style={{ fontSize: 14 }}>%</span></p>
              <p className={s.statLabel}>RX 비율</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className={s.list}>
            {[...Array(8)].map((_, i) => <div key={i} className={s.skeleton} />)}
          </div>
        ) : records.length === 0 ? (
          <div className={s.empty}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--muted)" }}>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <p>아직 기록이 없습니다</p>
            <Link href="/wod" className="btn-primary" style={{ padding: "12px 24px", fontSize: 14, marginTop: 8 }}>
              첫 기록 남기기
            </Link>
          </div>
        ) : (
          <>
            <div className={s.list}>
              {records.map((rec) => (
                <div key={rec.id} className={s.item}>
                  <div className={s.itemDate}>
                    <p className={s.itemMonth}>{dayjs(rec.wodDate).format("MMM")}</p>
                    <p className={s.itemDay}>{dayjs(rec.wodDate).format("DD")}</p>
                    <p className={s.itemDow}>{dayjs(rec.wodDate).format("ddd")}</p>
                  </div>
                  <div className={s.itemBody}>
                    {wodByDate[rec.wodDate] && (
                      <p className={s.itemWodTitle}>{wodByDate[rec.wodDate].title}</p>
                    )}
                    <div className={s.itemTop}>
                      {rec.rx && <span className={s.rxBadge}>RX</span>}
                      {rec.score && <span className={s.scoreText}>{rec.score}</span>}
                    </div>
                    {rec.notes && <p className={s.itemNotes}>{rec.notes}</p>}
                  </div>
                  <button
                    className={s.deleteBtn}
                    onClick={() => { if (window.confirm("이 기록을 삭제하시겠습니까?")) deleteMutation.mutate(rec.id); }}
                    disabled={deleteMutation.isPending}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className={s.pagination}>
                <button className={s.pageBtn} disabled={page === 0} onClick={() => setPage((p) => p - 1)}>이전</button>
                <span className={s.pageInfo}>{page + 1} / {totalPages}</span>
                <button className={s.pageBtn} disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>다음</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
