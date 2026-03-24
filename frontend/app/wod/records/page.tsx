"use client";

import { useState, useEffect, useRef } from "react";
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

const SHARE_URL = "https://crossfitkorea.com/wod/records";

function buildShareText(rec: WodRecord): string {
  const datePart = dayjs(rec.wodDate).format("YYYY-MM-DD");
  const scorePart = rec.score ? `기록: ${rec.score}` : "";
  const notesPart = rec.notes ? ` - ${rec.notes}` : "";
  return `[CrossFit Korea] ${datePart} WOD ${scorePart}${notesPart} #크로스핏 #CrossFitKorea`;
}

function ShareDropdown({ rec, onClose }: { rec: WodRecord; onClose: () => void }) {
  const text = buildShareText(rec);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n${SHARE_URL}`);
      toast.success("링크가 복사되었습니다.");
    } catch {
      toast.error("복사에 실패했습니다.");
    }
    onClose();
  };

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SHARE_URL)}`,
      "_blank",
      "noopener,noreferrer"
    );
    onClose();
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "CrossFit Korea WOD 기록", text, url: SHARE_URL });
      } catch {
        // user cancelled — do nothing
      }
    }
    onClose();
  };

  return (
    <div className={s.shareDropdown}>
      <button className={s.shareOption} onClick={handleCopy}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        링크 복사
      </button>
      <button className={s.shareOption} onClick={handleTwitter}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        트위터 공유
      </button>
      {typeof navigator !== "undefined" && "share" in navigator && (
        <button className={s.shareOption} onClick={handleWebShare}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          더 보내기
        </button>
      )}
    </div>
  );
}

function ShareButton({ rec }: { rec: WodRecord }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className={s.shareWrap} ref={wrapRef}>
      <button
        className={s.shareBtn}
        onClick={() => setOpen((v) => !v)}
        title="공유"
        aria-label="공유"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </button>
      {open && <ShareDropdown rec={rec} onClose={() => setOpen(false)} />}
    </div>
  );
}

dayjs.extend(relativeTime);
dayjs.locale("ko");

export default function WodRecordsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(dayjs().startOf("month"));

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

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ score: "", notes: "", rx: false });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => wodRecordApi.deleteRecord(id),
    onSuccess: () => {
      toast.success("기록이 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["wod-records"] });
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const editMutation = useMutation({
    mutationFn: ({ wodDate, score, notes, rx }: { wodDate: string; score: string; notes: string; rx: boolean }) =>
      wodRecordApi.saveRecord({ wodDate, score: score || undefined, notes: notes || undefined, rx }),
    onSuccess: () => {
      toast.success("기록이 수정되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["wod-records"] });
      queryClient.invalidateQueries({ queryKey: ["wod-records-recent"] });
      setEditingId(null);
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const records: WodRecord[] = data?.content || [];
  const totalPages = data?.totalPages || 1;
  const totalElements = data?.totalElements || 0;

  const exportCsv = () => {
    const rows = recentRecords ?? records;
    if (!rows.length) { toast.info("내보낼 기록이 없습니다."); return; }
    const header = ["날짜", "WOD 제목", "기록", "RX", "메모"];
    const lines = [
      header.join(","),
      ...rows.map((r) => [
        r.wodDate,
        `"${(r.wodTitle || "").replace(/"/g, '""')}"`,
        `"${(r.score || "").replace(/"/g, '""')}"`,
        r.rx ? "Y" : "N",
        `"${(r.notes || "").replace(/"/g, '""')}"`,
      ].join(",")),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wod_records_${dayjs().format("YYYYMMDD")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV 파일이 다운로드됩니다.");
  };

  // 통계: 이번 달 기록 수, RX 비율 (전체 페이지 기준 현재 로드된 데이터)
  const thisMonth = dayjs().format("YYYY-MM");
  const thisMonthRecords = records.filter((r) => r.wodDate?.startsWith(thisMonth));
  const rxCount = records.filter((r) => r.rx).length;
  const rxRatio = records.length > 0 ? Math.round((rxCount / records.length) * 100) : 0;

  // 월별 기록 수 차트 데이터 (최근 6개월, recentRecords 기반)
  const monthlyChart = (() => {
    const months: { label: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = dayjs().subtract(i, "month");
      const key = m.format("YYYY-MM");
      const count = (recentRecords || []).filter((r) => r.wodDate?.startsWith(key)).length;
      months.push({ label: m.format("M월"), count });
    }
    return months;
  })();
  const maxMonthlyCount = Math.max(...monthlyChart.map((m) => m.count), 1);

  // 연속 기록 스트릭 계산 (recentRecords 기반)
  const streak = (() => {
    if (!recentRecords || recentRecords.length === 0) return 0;
    const dateSet = new Set((recentRecords as WodRecord[]).map((r) => r.wodDate));
    let count = 0;
    let d = dayjs();
    while (dateSet.has(d.format("YYYY-MM-DD"))) {
      count++;
      d = d.subtract(1, "day");
    }
    return count;
  })();

  // 캘린더: 이번 달 기록 맵
  const calRecordMap: Record<string, WodRecord> = {};
  (recentRecords || []).forEach((r) => { calRecordMap[r.wodDate] = r; });
  const calDays = (() => {
    const start = calMonth.startOf("month");
    const end = calMonth.endOf("month");
    const startDow = start.day(); // 0=일
    const days: (dayjs.Dayjs | null)[] = Array(startDow).fill(null);
    for (let d = 0; d < end.date(); d++) days.push(start.add(d, "day"));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  })();

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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className={s.viewToggle}>
              <button className={`${s.viewBtn} ${viewMode === "list" ? s.viewBtnActive : ""}`} onClick={() => setViewMode("list")}>목록</button>
              <button className={`${s.viewBtn} ${viewMode === "calendar" ? s.viewBtnActive : ""}`} onClick={() => setViewMode("calendar")}>캘린더</button>
            </div>
            <button className="btn-secondary" style={{ padding: "12px 16px", fontSize: 13 }} onClick={exportCsv} title="CSV 내보내기">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              CSV
            </button>
            <Link href="/wod" className="btn-primary" style={{ padding: "12px 24px", fontSize: 14 }}>
              + 오늘 기록 입력
            </Link>
          </div>
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
            <div className={s.statItem}>
              <p className={s.statNum}>{streak}<span style={{ fontSize: 14 }}>일</span></p>
              <p className={s.statLabel}>연속 출석</p>
            </div>
          </div>
        )}

        {/* 월별 기록 차트 */}
        {recentRecords && recentRecords.length > 0 && (
          <div className={s.chartCard}>
            <p className={s.heatmapTitle}>월별 기록 현황 (최근 6개월)</p>
            <div className={s.barChart}>
              {monthlyChart.map((m) => (
                <div key={m.label} className={s.barItem}>
                  <div className={s.barWrap}>
                    <div
                      className={s.bar}
                      style={{ height: `${Math.max((m.count / maxMonthlyCount) * 100, m.count > 0 ? 8 : 0)}%` }}
                    >
                      {m.count > 0 && <span className={s.barValue}>{m.count}</span>}
                    </div>
                  </div>
                  <p className={s.barLabel}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 캘린더 뷰 */}
        {viewMode === "calendar" && (
          <div className={s.calendar}>
            <div className={s.calNav}>
              <button className={s.calNavBtn} onClick={() => setCalMonth(m => m.subtract(1, "month"))}>‹</button>
              <span className={s.calMonthLabel}>{calMonth.format("YYYY년 M월")}</span>
              <button className={s.calNavBtn} onClick={() => setCalMonth(m => m.add(1, "month"))}>›</button>
            </div>
            <div className={s.calGrid}>
              {["일","월","화","수","목","금","토"].map(d => (
                <div key={d} className={s.calDayHeader}>{d}</div>
              ))}
              {calDays.map((day, i) => {
                if (!day) return <div key={i} className={s.calCell} />;
                const dateStr = day.format("YYYY-MM-DD");
                const rec = calRecordMap[dateStr];
                const isToday = dateStr === dayjs().format("YYYY-MM-DD");
                return (
                  <div key={i} className={`${s.calCell} ${rec ? s.calCellHasRecord : ""} ${isToday ? s.calCellToday : ""}`}>
                    <span className={s.calDate}>{day.date()}</span>
                    {rec && (
                      <div className={s.calRecordDot}>
                        {rec.rx && <span className={s.calRx}>RX</span>}
                        {rec.score && <span className={s.calScore}>{rec.score}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === "list" && isLoading ? (
          <div className={s.list}>
            {[...Array(8)].map((_, i) => <div key={i} className={s.skeleton} />)}
          </div>
        ) : viewMode === "list" && records.length === 0 ? (
          <div className={s.empty}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--muted)" }}>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <p>아직 기록이 없습니다</p>
            <Link href="/wod" className="btn-primary" style={{ padding: "12px 24px", fontSize: 14, marginTop: 8 }}>
              첫 기록 남기기
            </Link>
          </div>
        ) : viewMode === "list" ? (
          <>
            <div className={s.list}>
              {records.map((rec) => (
                <div key={rec.id} className={s.item}>
                  <div className={s.itemDate}>
                    <p className={s.itemMonth}>{dayjs(rec.wodDate).format("MMM")}</p>
                    <p className={s.itemDay}>{dayjs(rec.wodDate).format("DD")}</p>
                    <p className={s.itemDow}>{dayjs(rec.wodDate).format("ddd")}</p>
                  </div>
                  {editingId === rec.id ? (
                    <div className={s.editForm}>
                      <label className={s.editRxLabel}>
                        <input type="checkbox" checked={editForm.rx} onChange={(e) => setEditForm(f => ({ ...f, rx: e.target.checked }))} />
                        RX
                      </label>
                      <input
                        className={s.editInput}
                        placeholder="점수 (ex: 12:34 / 150 reps)"
                        value={editForm.score}
                        onChange={(e) => setEditForm(f => ({ ...f, score: e.target.value }))}
                      />
                      <input
                        className={s.editInput}
                        placeholder="메모"
                        value={editForm.notes}
                        onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))}
                      />
                      <div className={s.editActions}>
                        <button
                          className={s.editSaveBtn}
                          disabled={editMutation.isPending}
                          onClick={() => editMutation.mutate({ wodDate: rec.wodDate, ...editForm })}
                        >저장</button>
                        <button className={s.editCancelBtn} onClick={() => setEditingId(null)}>취소</button>
                      </div>
                    </div>
                  ) : (
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
                  )}
                  <div className={s.itemActions}>
                    <ShareButton rec={rec} />
                    <button
                      className={s.editBtn}
                      onClick={() => { setEditingId(rec.id); setEditForm({ score: rec.score || "", notes: rec.notes || "", rx: rec.rx || false }); }}
                      title="수정"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      className={s.deleteBtn}
                      onClick={() => {
                        const dateStr = dayjs(rec.wodDate).format("YYYY년 MM월 DD일");
                        const scoreStr = rec.score ? ` (${rec.score})` : "";
                        if (window.confirm(`${dateStr}${scoreStr} WOD 기록을 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`)) {
                          deleteMutation.mutate(rec.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
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
        ) : null}
      </div>
    </div>
  );
}
