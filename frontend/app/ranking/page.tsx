"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { rankingApi } from "@/lib/api";
import { NamedWod, NamedWodCategory, NamedWodDetail, RankingEntry } from "@/types";
import s from "./ranking.module.css";

const CATEGORY_LABEL: Record<NamedWodCategory, string> = {
  GIRLS: "Girls WODs",
  HEROES: "Hero WODs",
  BENCHMARK: "Benchmark",
  CUSTOM: "Custom",
};

const CATEGORY_ORDER: NamedWodCategory[] = ["GIRLS", "HEROES", "BENCHMARK", "CUSTOM"];
const RANK_MEDAL = ["🥇", "🥈", "🥉"];

const SCORE_TYPE_LABEL: Record<string, string> = {
  TIME: "⏱ TIME",
  REPS: "🔢 REPS",
  WEIGHT: "🏋️ WEIGHT",
  ROUNDS: "🔄 ROUNDS",
};

export default function RankingPage() {
  const [view, setView] = useState<"overview" | "list">("overview");
  const [selectedWodId, setSelectedWodId] = useState<number | null>(null);

  // WOD 목록
  const { data: wods = [], isLoading: wodsLoading } = useQuery<NamedWod[]>({
    queryKey: ["ranking", "wods"],
    queryFn: async () => (await rankingApi.getWods()).data.data,
  });

  // 첫 번째 WOD 자동 선택
  useEffect(() => {
    if (wods.length > 0 && selectedWodId === null) {
      setSelectedWodId(wods[0].id);
    }
  }, [wods, selectedWodId]);

  // 선택된 WOD 상세 (리더보드)
  const { data: detail, isLoading: detailLoading } = useQuery<NamedWodDetail>({
    queryKey: ["ranking", "detail", selectedWodId],
    queryFn: async () => (await rankingApi.getWodDetail(selectedWodId!)).data.data,
    enabled: !!selectedWodId && view === "overview",
    staleTime: 1000 * 60 * 2,
  });

  const grouped = CATEGORY_ORDER.reduce<Record<NamedWodCategory, NamedWod[]>>(
    (acc, cat) => { acc[cat] = wods.filter((w) => w.category === cat); return acc; },
    { GIRLS: [], HEROES: [], BENCHMARK: [], CUSTOM: [] }
  );

  const selectedWod = wods.find((w) => w.id === selectedWodId) ?? null;
  const leaderboard: RankingEntry[] = (detail?.leaderboard ?? []).slice(0, 100);

  return (
    <div className={s.page}>
      {/* Hero */}
      <div className={s.hero}>
        <p className={s.heroTag}>CROSSFIT KOREA</p>
        <h1 className={s.heroTitle}>NAMED WOD RANKING</h1>
        <p className={s.heroDesc}>
          YouTube 영상으로 기록을 제출하고 박스 오너의 인증을 받아 랭킹에 이름을 올리세요.
        </p>
        <div className={s.heroJudgeNote}>
          ⚖ 어느 박스의 오너든 공개 저지로서 기록을 인증할 수 있습니다
        </div>
      </div>

      {/* 탭 */}
      <div className={s.viewTabs}>
        <button
          className={`${s.viewTab} ${view === "overview" ? s.viewTabActive : ""}`}
          onClick={() => setView("overview")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
          </svg>
          종합 랭킹
        </button>
        <button
          className={`${s.viewTab} ${view === "list" ? s.viewTabActive : ""}`}
          onClick={() => setView("list")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          WOD 목록 / 기록 제출
        </button>
      </div>

      {/* ── 종합 랭킹 뷰 ── */}
      {view === "overview" && (
        <>
          {/* 모바일 WOD 선택 */}
          {wods.length > 0 && (
            <div className={s.wodMobileSelect}>
              <p className={s.wodMobileSelectLabel}>WOD 선택</p>
              <select
                className={s.wodMobileSelectEl}
                value={selectedWodId ?? ""}
                onChange={(e) => setSelectedWodId(Number(e.target.value))}
              >
                {CATEGORY_ORDER.map((cat) =>
                  grouped[cat].length > 0 ? (
                    <optgroup key={cat} label={CATEGORY_LABEL[cat]}>
                      {grouped[cat].map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </optgroup>
                  ) : null
                )}
              </select>
            </div>
          )}

          <div className={s.rankingWrap}>
            {/* 왼쪽: WOD 목록 사이드바 */}
            <div className={s.wodSidebar}>
              {wodsLoading ? (
                <div style={{ padding: 20, color: "var(--muted)", fontSize: 13 }}>로딩 중...</div>
              ) : (
                <div className={s.wodSidebarInner}>
                  {CATEGORY_ORDER.filter((cat) => grouped[cat].length > 0).map((cat) => (
                    <div key={cat}>
                      <p className={s.wodSidebarCat}>{CATEGORY_LABEL[cat]}</p>
                      {grouped[cat].map((wod) => (
                        <button
                          key={wod.id}
                          className={`${s.wodSidebarItem} ${wod.id === selectedWodId ? s.wodSidebarItemActive : ""}`}
                          onClick={() => setSelectedWodId(wod.id)}
                        >
                          <span className={s.wodSidebarName}>{wod.name}</span>
                          <span className={s.wodSidebarCount}>{wod.verifiedCount}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 오른쪽: 랭킹 리스트 */}
            <div className={s.rankingMain}>
              {!selectedWod ? (
                <div className={s.rankEmpty}>WOD를 선택하세요.</div>
              ) : (
                <>
                  {/* 헤더 */}
                  <div className={s.rankingHeader}>
                    <div className={s.rankingHeaderLeft}>
                      <p className={s.rankingCat}>{CATEGORY_LABEL[selectedWod.category]}</p>
                      <h2 className={s.rankingWodName}>{selectedWod.name}</h2>
                      <div className={s.rankingMeta}>
                        <span className={s.rankingScoreType}>
                          {SCORE_TYPE_LABEL[selectedWod.scoreType]}
                          {selectedWod.scoreUnit && ` (${selectedWod.scoreUnit})`}
                        </span>
                        <span className={s.rankingVerified}>
                          ✓ 인증 {selectedWod.verifiedCount}명
                        </span>
                      </div>
                      {selectedWod.description && (
                        <p className={s.rankingDesc}>{selectedWod.description}</p>
                      )}
                    </div>
                    <Link
                      href={`/ranking/${selectedWod.id}`}
                      className="btn-primary"
                      style={{ padding: "10px 20px", fontSize: 13, textDecoration: "none", display: "inline-block" }}
                    >
                      기록 제출 →
                    </Link>
                  </div>

                  {/* 랭킹 테이블 */}
                  {detailLoading ? (
                    <div className={s.rankSkeleton}>
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className={s.rankSkeletonRow} />
                      ))}
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div className={s.rankEmpty}>
                      아직 인증된 기록이 없습니다.
                      <br />
                      <Link href={`/ranking/${selectedWod.id}`} style={{ color: "var(--red)", fontSize: 13, marginTop: 12, display: "inline-block" }}>
                        첫 번째 기록 제출하기 →
                      </Link>
                    </div>
                  ) : (
                    <table className={s.rankTable}>
                      <thead>
                        <tr>
                          <th style={{ width: 48, textAlign: "center" }}>#</th>
                          <th>이름</th>
                          <th>점수</th>
                          <th className={s.rankBox}>인증 박스</th>
                          <th className={s.rankDate}>기록일</th>
                          <th>영상</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry, idx) => (
                          <tr key={entry.recordId} className={idx < 3 ? s.rankRowTop : ""}>
                            <td>
                              {idx < 3 ? (
                                <span className={s.rankMedal}>{RANK_MEDAL[idx]}</span>
                              ) : (
                                <span className={s.rankNum}>{entry.rank}</span>
                              )}
                            </td>
                            <td className={s.rankName}>{entry.userName}</td>
                            <td className={s.rankScore}>{entry.scoreFormatted}</td>
                            <td className={s.rankBox}>
                              {entry.verifiedBoxName ? (
                                <span>✓ {entry.verifiedBoxName}</span>
                              ) : (
                                <span style={{ color: "var(--muted)" }}>-</span>
                              )}
                            </td>
                            <td className={s.rankDate}>{entry.recordedAt}</td>
                            <td>
                              <a
                                href={entry.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={s.rankVideo}
                              >
                                ▶ 보기
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {leaderboard.length > 0 && (
                    <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 16, textAlign: "right" }}>
                      상위 {leaderboard.length}명 표시 (인증 기록만 포함)
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── WOD 목록 / 기록 제출 탭 ── */}
      {view === "list" && (
        <div className={s.content}>
          {wodsLoading ? (
            <div className={s.skeletonGrid}>
              {[...Array(8)].map((_, i) => <div key={i} className={s.skeleton} />)}
            </div>
          ) : wods.length === 0 ? (
            <div className={s.empty}>등록된 Named WOD가 없습니다.</div>
          ) : (
            CATEGORY_ORDER.filter((cat) => grouped[cat].length > 0).map((cat) => (
              <section key={cat} className={s.section}>
                <h2 className={s.sectionTitle}>{CATEGORY_LABEL[cat]}</h2>
                <div className={s.grid}>
                  {grouped[cat].map((wod) => (
                    <Link key={wod.id} href={`/ranking/${wod.id}`} className={s.card}>
                      <div className={s.cardCategory}>{CATEGORY_LABEL[cat]}</div>
                      <h3 className={s.cardName}>{wod.name}</h3>
                      {wod.description && <p className={s.cardDesc}>{wod.description}</p>}
                      <div className={s.cardFooter}>
                        <span className={s.cardScore}>
                          {SCORE_TYPE_LABEL[wod.scoreType]}
                          {wod.scoreUnit && ` (${wod.scoreUnit})`}
                        </span>
                        <span className={s.cardCount}>{wod.verifiedCount}개 기록</span>
                      </div>
                      <div className={s.cardCta}>기록 제출 / 랭킹 보기 →</div>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
}
