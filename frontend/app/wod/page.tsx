"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { wodApi, wodRecordApi, leaderboardApi } from "@/lib/api";
import { Wod, WodRecord, BoxRanking } from "@/types";
import { isLoggedIn } from "@/lib/auth";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import s from "./wod.module.css";

dayjs.locale("ko");

const WOD_TYPE_LABELS: Record<string, string> = {
  AMRAP: "AMRAP",
  FOR_TIME: "FOR TIME",
  EMOM: "EMOM",
  TABATA: "TABATA",
  STRENGTH: "STRENGTH",
  SKILL: "SKILL",
  REST_DAY: "REST DAY",
  CUSTOM: "WOD",
};

const WOD_TYPE_BADGE: Record<string, string> = {
  AMRAP: "badge-amrap",
  FOR_TIME: "badge-fortime",
  EMOM: "badge-emom",
  STRENGTH: "badge-strength",
  SKILL: "badge-strength",
  TABATA: "badge-amrap",
  REST_DAY: "badge-default",
  CUSTOM: "badge-default",
};

const WOD_TYPE_DOT: Record<string, string> = {
  AMRAP: "#e8220a",
  FOR_TIME: "#ff6b1a",
  EMOM: "#3b82f6",
  STRENGTH: "#eab308",
  SKILL: "#eab308",
  TABATA: "#e8220a",
  REST_DAY: "#888",
  CUSTOM: "#888",
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export default function WodPage() {
  const today = dayjs().format("YYYY년 MM월 DD일 dddd");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(dayjs().startOf("month"));
  const [selectedWod, setSelectedWod] = useState<Wod | null>(null);
  const [recordScore, setRecordScore] = useState("");
  const [recordNotes, setRecordNotes] = useState("");
  const [recordRx, setRecordRx] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: todayWod, isLoading } = useQuery({
    queryKey: ["wod", "today"],
    queryFn: async () => {
      const res = await wodApi.getToday();
      return res.data.data as Wod;
    },
  });

  const { data: historyData } = useQuery({
    queryKey: ["wod", "history", 0, 90],
    queryFn: async () => {
      const res = await wodApi.getHistory(0, 90);
      return res.data.data;
    },
  });

  const { data: todayRecord } = useQuery({
    queryKey: ["wod", "record", "today"],
    queryFn: async () => (await wodRecordApi.getTodayRecord()).data.data as WodRecord | null,
    enabled: isLoggedIn(),
  });

  const todayDate = dayjs().format("YYYY-MM-DD");
  const { data: leaderboard } = useQuery({
    queryKey: ["wod", "leaderboard", todayDate],
    queryFn: async () => (await leaderboardApi.getLeaderboard(todayDate)).data.data as WodRecord[],
    enabled: !!todayWod,
  });

  const { data: boxRanking } = useQuery({
    queryKey: ["wod", "boxRanking", todayDate],
    queryFn: async () => (await leaderboardApi.getBoxRanking(todayDate)).data.data as BoxRanking[],
    enabled: !!todayWod,
  });

  const recordMutation = useMutation({
    mutationFn: () => wodRecordApi.saveRecord({
      score: recordScore || undefined,
      notes: recordNotes || undefined,
      rx: recordRx,
    }),
    onSuccess: () => {
      toast.success("기록이 저장되었습니다.");
      setShowRecordForm(false);
      queryClient.invalidateQueries({ queryKey: ["wod", "record"] });
    },
    onError: () => toast.error("기록 저장에 실패했습니다."),
  });

  const deleteRecordMutation = useMutation({
    mutationFn: (id: number) => wodRecordApi.deleteRecord(id),
    onSuccess: () => {
      toast.success("기록이 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["wod", "record"] });
    },
  });

  // Build date -> wod map
  const wodByDate: Record<string, Wod> = {};
  historyData?.content?.forEach((wod: Wod) => {
    wodByDate[wod.wodDate] = wod;
  });

  // Calendar cells
  const startPad = calMonth.startOf("month").day();
  const daysInMonth = calMonth.daysInMonth();
  const calendarCells: Array<{ date: dayjs.Dayjs | null; wod?: Wod }> = [];
  for (let i = 0; i < startPad; i++) calendarCells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = calMonth.date(d);
    calendarCells.push({ date, wod: wodByDate[date.format("YYYY-MM-DD")] });
  }
  while (calendarCells.length % 7 !== 0) calendarCells.push({ date: null });

  return (
    <div className={s.page}>
      {/* Hero */}
      <div className={s.hero}>
        <div className={s.heroInner}>
          <div className={s.heroEyebrow}>
            <svg className={s.fireIcon} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5 0.67z"/>
            </svg>
            <span className={s.heroTag}>Workout of the Day</span>
          </div>
          <h1 className={s.heroTitle}>오늘의 WOD</h1>
          <p className={s.heroDate}>{today}</p>
          <Link href="/wod/timer" className={s.timerLink}>⏱ WOD 타이머 →</Link>
        </div>
      </div>

      {/* Content */}
      <div className={s.content}>
        {isLoading ? (
          <div className={s.wodSkeleton} />
        ) : todayWod ? (
          <div className={s.wodCard}>
            <div className={s.wodCardHeader}>
              <div>
                <span className={`badge ${WOD_TYPE_BADGE[todayWod.type] || "badge-default"}`}>
                  {WOD_TYPE_LABELS[todayWod.type] || todayWod.type}
                </span>
                <h2 className={s.wodTitle}>{todayWod.title}</h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {todayWod.scoreType && (
                  <div className={s.scoreBox}>
                    <p className={s.scoreLabel}>SCORE</p>
                    <p className={s.scoreValue}>{todayWod.scoreType}</p>
                  </div>
                )}
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    className={s.shareBtn}
                    onClick={() => {
                      navigator.share({
                        title: `오늘의 WOD: ${todayWod.title}`,
                        text: todayWod.content,
                        url: window.location.href,
                      }).catch(() => {});
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    공유
                  </button>
                )}
              </div>
            </div>
            <div className={s.wodBody}>
              <div className={s.wodContent}>{todayWod.content}</div>
              {todayWod.imageUrl && (
                <div style={{ position: "relative", width: "100%", height: 280, marginTop: 16 }}>
                  <Image src={todayWod.imageUrl} alt="WOD" fill style={{ objectFit: "cover" }} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={s.wodEmpty}>
            <div className={s.wodEmptyIcon}>🔥</div>
            <p className={s.wodEmptyText}>오늘의 WOD가 아직 등록되지 않았습니다</p>
          </div>
        )}

        {/* 내 기록 */}
        {isLoggedIn() && todayWod && (
          <div className={s.myRecord}>
            <div className={s.myRecordHeader}>
              <p className={s.myRecordTitle}>내 오늘 기록</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Link href="/wod/records" className={s.recordsLink}>
                  전체 기록 →
                </Link>
                {!todayRecord && !showRecordForm && (
                  <button
                    className="btn-primary"
                    style={{ padding: "8px 18px", fontSize: 13 }}
                    onClick={() => setShowRecordForm(true)}
                  >
                    기록 입력
                  </button>
                )}
              </div>
            </div>

            {todayRecord && !showRecordForm ? (
              <div className={s.recordDisplay}>
                <div className={s.recordRow}>
                  {todayRecord.score && (
                    <div className={s.recordItem}>
                      <span className={s.recordLabel}>점수</span>
                      <span className={s.recordValue}>{todayRecord.score}</span>
                    </div>
                  )}
                  <div className={s.recordItem}>
                    <span className={s.recordLabel}>RX</span>
                    <span className={s.recordValue} style={{ color: todayRecord.rx ? "var(--red)" : "var(--muted)" }}>
                      {todayRecord.rx ? "RX" : "Scaled"}
                    </span>
                  </div>
                </div>
                {todayRecord.notes && (
                  <p className={s.recordNotes}>{todayRecord.notes}</p>
                )}
                <div className={s.recordActions}>
                  <button
                    className="btn-secondary"
                    style={{ padding: "6px 14px", fontSize: 12 }}
                    onClick={() => {
                      setRecordScore(todayRecord.score || "");
                      setRecordNotes(todayRecord.notes || "");
                      setRecordRx(todayRecord.rx);
                      setShowRecordForm(true);
                    }}
                  >
                    수정
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ padding: "6px 14px", fontSize: 12, color: "var(--red)", borderColor: "rgba(232,34,10,0.3)" }}
                    onClick={() => { if (confirm("기록을 삭제할까요?")) deleteRecordMutation.mutate(todayRecord.id); }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ) : showRecordForm ? (
              <div className={s.recordForm}>
                <div className={s.recordFormRow}>
                  <div className={s.recordFormField}>
                    <label className={s.recordFormLabel}>점수 / 시간</label>
                    <input
                      className="input-field"
                      placeholder="예: 5:30, 150 reps, 100 kg"
                      value={recordScore}
                      onChange={(e) => setRecordScore(e.target.value)}
                    />
                  </div>
                  <div className={s.recordFormField} style={{ minWidth: 80 }}>
                    <label className={s.recordFormLabel}>RX 여부</label>
                    <label className={s.rxToggle}>
                      <input
                        type="checkbox"
                        checked={recordRx}
                        onChange={(e) => setRecordRx(e.target.checked)}
                      />
                      <span className={s.rxToggleLabel}>{recordRx ? "RX" : "Scaled"}</span>
                    </label>
                  </div>
                </div>
                <div className={s.recordFormField}>
                  <label className={s.recordFormLabel}>메모 (선택)</label>
                  <textarea
                    className={s.recordTextarea}
                    placeholder="오늘 컨디션, 특이사항 등 자유롭게 기록"
                    value={recordNotes}
                    onChange={(e) => setRecordNotes(e.target.value)}
                  />
                </div>
                <div className={s.recordFormActions}>
                  <button
                    className="btn-secondary"
                    style={{ padding: "8px 16px", fontSize: 13 }}
                    onClick={() => setShowRecordForm(false)}
                  >
                    취소
                  </button>
                  <button
                    className="btn-primary"
                    style={{ padding: "8px 20px", fontSize: 13 }}
                    disabled={recordMutation.isPending}
                    onClick={() => recordMutation.mutate()}
                  >
                    {recordMutation.isPending ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* 오늘의 리더보드 */}
        {todayWod && leaderboard && leaderboard.length > 0 && (
          <div className={s.leaderboard}>
            <p className={s.leaderboardTitle}>오늘의 리더보드</p>
            <div className={s.leaderboardList}>
              {leaderboard.slice(0, 10).map((rec, idx) => (
                <div key={rec.id} className={`${s.leaderboardItem} ${idx === 0 ? s.leaderboardFirst : ""}`}>
                  <span className={s.leaderboardRank}>{idx + 1}</span>
                  <span className={s.leaderboardName}>{rec.userName}</span>
                  {rec.rx && <span className={s.leaderboardRx}>RX</span>}
                  <span className={s.leaderboardScore}>{rec.score || "—"}</span>
                </div>
              ))}
            </div>
            <Link href="/wod/leaderboard" className={s.leaderboardMore}>
              전체 리더보드 보기 →
            </Link>
          </div>
        )}

        {/* 박스 랭킹 */}
        {todayWod && boxRanking && boxRanking.length > 0 && (
          <div className={s.leaderboard}>
            <p className={s.leaderboardTitle}>박스 랭킹</p>
            <p className={s.boxRankingDesc}>오늘 WOD에 참여한 박스별 현황</p>
            <div className={s.leaderboardList}>
              {boxRanking.map((box, idx) => (
                <div key={box.boxId} className={`${s.leaderboardItem} ${idx === 0 ? s.leaderboardFirst : ""}`}>
                  <span className={s.leaderboardRank}>{idx + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className={s.leaderboardName}>{box.boxName}</span>
                    <span className={s.boxCity}>{box.boxCity}</span>
                  </div>
                  <div className={s.boxRankStats}>
                    <span className={s.boxRankStatItem}>
                      <span className={s.boxRankStatLabel}>참여</span>
                      <span className={s.boxRankStatValue}>{box.participantCount}명</span>
                    </span>
                    <span className={s.boxRankStatItem}>
                      <span className={s.boxRankStatLabel}>RX</span>
                      <span className={s.boxRankStatValue} style={{ color: "var(--red)" }}>{box.rxCount}명</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className={s.viewToggle}>
          <p className={s.historyTitle}>WOD 기록</p>
          <Link href="/wod/history" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none", marginRight: "auto", marginLeft: 16, alignSelf: "center", flexShrink: 0 }}>
            전체 히스토리 →
          </Link>
          <div className={s.viewBtns}>
            <button
              className={`${s.viewBtn} ${viewMode === "list" ? s.viewBtnActive : ""}`}
              onClick={() => setViewMode("list")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              목록
            </button>
            <button
              className={`${s.viewBtn} ${viewMode === "calendar" ? s.viewBtnActive : ""}`}
              onClick={() => { setViewMode("calendar"); setSelectedWod(null); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="0" ry="0"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              달력
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className={s.historyList}>
            {historyData?.content?.map((wod: Wod) => (
              <div key={wod.id} className={s.historyItem}>
                <div className={s.historyDate}>
                  <p className={s.historyDateMd}>{dayjs(wod.wodDate).format("DD")}</p>
                  <p className={s.historyDateDay}>{dayjs(wod.wodDate).format("ddd")}</p>
                </div>
                <div className={s.historyBody}>
                  <span className={`badge ${WOD_TYPE_BADGE[wod.type] || "badge-default"}`}>
                    {WOD_TYPE_LABELS[wod.type] || wod.type}
                  </span>
                  <p className={s.historyName}>{wod.title}</p>
                  <p className={s.historySnippet}>{wod.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={s.calendar}>
            {/* Month Navigation */}
            <div className={s.calNav}>
              <button className={s.calNavBtn} onClick={() => { setCalMonth(calMonth.subtract(1, "month")); setSelectedWod(null); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <span className={s.calMonthLabel}>{calMonth.format("YYYY년 MM월")}</span>
              <button className={s.calNavBtn} onClick={() => { setCalMonth(calMonth.add(1, "month")); setSelectedWod(null); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>

            {/* Weekday Headers */}
            <div className={s.calGrid}>
              {WEEKDAYS.map((d) => (
                <div key={d} className={s.calWeekday}>{d}</div>
              ))}

              {/* Day Cells */}
              {calendarCells.map((cell, i) => {
                const isToday = cell.date?.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");
                const isSelected = selectedWod && cell.date?.format("YYYY-MM-DD") === selectedWod.wodDate;
                return (
                  <div
                    key={i}
                    className={`${s.calCell} ${!cell.date ? s.calCellEmpty : ""} ${isToday ? s.calCellToday : ""} ${cell.wod ? s.calCellHasWod : ""} ${isSelected ? s.calCellSelected : ""}`}
                    onClick={() => cell.wod && setSelectedWod(isSelected ? null : cell.wod)}
                  >
                    {cell.date && (
                      <>
                        <span className={s.calDay}>{cell.date.date()}</span>
                        {cell.wod && (
                          <span
                            className={s.calDot}
                            style={{ background: WOD_TYPE_DOT[cell.wod.type] || "#888" }}
                          />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Day WOD */}
            {selectedWod && (
              <div className={s.calWodDetail}>
                <div className={s.calWodDetailHeader}>
                  <div>
                    <span className={`badge ${WOD_TYPE_BADGE[selectedWod.type] || "badge-default"}`}>
                      {WOD_TYPE_LABELS[selectedWod.type] || selectedWod.type}
                    </span>
                    <p className={s.calWodDate}>{dayjs(selectedWod.wodDate).format("YYYY년 MM월 DD일 ddd")}</p>
                    <p className={s.calWodTitle}>{selectedWod.title}</p>
                  </div>
                  <button className={s.calCloseBtn} onClick={() => setSelectedWod(null)}>✕</button>
                </div>
                <div className={s.wodContent}>{selectedWod.content}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
