"use client";

import { useState, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rankingApi } from "@/lib/api";
import { NamedWodDetail, RankingEntry } from "@/types";
import { isLoggedIn, getUser } from "@/lib/auth";
import s from "./detail.module.css";

const CATEGORY_LABEL: Record<string, string> = {
  GIRLS: "Girls WODs", HEROES: "Hero WODs", BENCHMARK: "Benchmark", CUSTOM: "Custom",
};

export default function RankingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const wodId = Number(id);
  const queryClient = useQueryClient();
  const user = getUser();
  const loggedIn = isLoggedIn();

  const [showForm, setShowForm] = useState(false);
  const [score, setScore] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().split("T")[0]);
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useQuery<NamedWodDetail>({
    queryKey: ["ranking", "wod", wodId],
    queryFn: async () => (await rankingApi.getWodDetail(wodId)).data.data,
  });

  const submitMutation = useMutation({
    mutationFn: () => rankingApi.submitRecord({
      namedWodId: wodId,
      score: parseFloat(score),
      videoUrl,
      notes: notes || undefined,
      recordedAt,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ranking", "wod", wodId] });
      setShowForm(false);
      setScore(""); setVideoUrl(""); setNotes("");
    },
    onError: () => setFormError("기록 제출에 실패했습니다."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!score || isNaN(parseFloat(score))) return setFormError("점수를 입력해주세요.");
    if (!videoUrl.trim()) return setFormError("YouTube 영상 URL을 입력해주세요.");
    if (!videoUrl.includes("youtube") && !videoUrl.includes("youtu.be"))
      return setFormError("YouTube URL만 허용됩니다.");
    submitMutation.mutate();
  };

  if (isLoading) return <div className={s.loading}>로딩 중...</div>;
  if (!data) return <div className={s.loading}>WOD를 찾을 수 없습니다.</div>;

  const scoreLabel = data.scoreType === "TIME"
    ? `시간 (분:초 입력 → 총 초로 변환됩니다)`
    : data.scoreType === "REPS" ? "횟수 (reps)"
    : data.scoreType === "WEIGHT" ? `무게 (${data.scoreUnit || "kg"})`
    : `라운드 (${data.scoreUnit || "rounds"})`;

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerInner}>
          <div className={s.headerMeta}>
            <span className={s.category}>{CATEGORY_LABEL[data.category] || data.category}</span>
            <span className={s.scoreTypeBadge}>
              {data.scoreType === "TIME" ? "⏱ TIME" :
               data.scoreType === "REPS" ? "🔢 REPS" :
               data.scoreType === "WEIGHT" ? "🏋️ WEIGHT" : "🔄 ROUNDS"}
            </span>
          </div>
          <h1 className={s.wodName}>{data.name}</h1>
          {data.description && <p className={s.wodDesc}>{data.description}</p>}
          <div className={s.headerStats}>
            <span>{data.leaderboard.length}명 인증 기록</span>
          </div>
        </div>
      </div>

      <div className={s.body}>
        <div className={s.main}>
          {/* My Record Status */}
          {loggedIn && data.myLatestRecord && (
            <div className={s.myRecord}>
              <p className={s.myRecordLabel}>내 최근 기록</p>
              <div className={s.myRecordRow}>
                <span className={s.myRecordScore}>{data.myLatestRecord.scoreFormatted}</span>
                <span className={s.myRecordUnit}>{data.scoreUnit}</span>
                <StatusBadge status={data.myLatestRecord.status} />
              </div>
              {data.myLatestRecord.verifiedBoxName && (
                <p className={s.myRecordBox}>✓ {data.myLatestRecord.verifiedBoxName} 인증</p>
              )}
              {data.myLatestRecord.verificationComment && (
                <p className={s.myRecordComment}>{data.myLatestRecord.verificationComment}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          {loggedIn && !showForm && (
            <button className={s.submitBtn} onClick={() => setShowForm(true)}>
              + 기록 제출
            </button>
          )}

          {!loggedIn && (
            <div className={s.loginPrompt}>
              <a href="/login" className={s.loginLink}>로그인</a>하면 기록을 제출할 수 있습니다.
            </div>
          )}

          {/* Submit Form */}
          {showForm && (
            <form className={s.form} onSubmit={handleSubmit}>
              <h3 className={s.formTitle}>기록 제출</h3>

              <div className={s.formGroup}>
                <label className={s.label}>
                  {data.scoreType === "TIME" ? "기록 (초)" : scoreLabel}
                  {data.scoreType === "TIME" && (
                    <span className={s.labelHint}> — 예: 3분 45초 = 225</span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className={s.input}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder={data.scoreType === "TIME" ? "225 (3분 45초)" : "점수 입력"}
                />
              </div>

              {data.scoreType === "TIME" && (
                <div className={s.timeHelper}>
                  <p className={s.timeHelperLabel}>시간 계산기</p>
                  <div className={s.timeHelperRow}>
                    <input
                      type="number"
                      className={s.timeInput}
                      min="0"
                      placeholder="분"
                      onChange={(e) => {
                        const min = parseInt(e.target.value) || 0;
                        const sec = parseInt((document.getElementById("sec-input") as HTMLInputElement)?.value) || 0;
                        setScore(String(min * 60 + sec));
                      }}
                    />
                    <span className={s.timeSep}>:</span>
                    <input
                      id="sec-input"
                      type="number"
                      className={s.timeInput}
                      min="0"
                      max="59"
                      placeholder="초"
                      onChange={(e) => {
                        const sec = parseInt(e.target.value) || 0;
                        const min = parseInt((e.target.closest(`.${s.timeHelperRow}`)?.querySelector("input:first-child") as HTMLInputElement)?.value) || 0;
                        setScore(String(min * 60 + sec));
                      }}
                    />
                    <span className={s.timeResult}>{score ? `= ${score}초` : ""}</span>
                  </div>
                </div>
              )}

              <div className={s.formGroup}>
                <label className={s.label}>YouTube 영상 URL <span className={s.required}>*</span></label>
                <input
                  type="url"
                  className={s.input}
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
                <p className={s.hint}>기록 수행 영상이 포함된 YouTube 링크를 입력하세요. 박스 오너가 영상을 보고 인증합니다.</p>
              </div>

              <div className={s.formGroup}>
                <label className={s.label}>기록 날짜</label>
                <input
                  type="date"
                  className={s.input}
                  value={recordedAt}
                  onChange={(e) => setRecordedAt(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className={s.formGroup}>
                <label className={s.label}>메모 (선택)</label>
                <textarea
                  className={s.textarea}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="기록 관련 메모 (Rx, Scale 등)"
                  rows={3}
                />
              </div>

              {formError && <p className={s.error}>{formError}</p>}

              <div className={s.formActions}>
                <button type="submit" className={s.confirmBtn} disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? "제출 중..." : "기록 제출"}
                </button>
                <button type="button" className={s.cancelBtn} onClick={() => setShowForm(false)}>
                  취소
                </button>
              </div>

              <p className={s.notice}>
                기록 제출 후 박스 오너의 인증을 받아야 랭킹에 등재됩니다.
              </p>
            </form>
          )}

          {/* Leaderboard */}
          <div className={s.leaderboard}>
            <h2 className={s.leaderboardTitle}>LEADERBOARD</h2>
            {data.leaderboard.length === 0 ? (
              <div className={s.leaderboardEmpty}>아직 인증된 기록이 없습니다. 첫 번째 기록을 남겨보세요!</div>
            ) : (
              <div className={s.table}>
                <div className={s.tableHead}>
                  <span className={s.colRank}>순위</span>
                  <span className={s.colAthlete}>선수</span>
                  <span className={s.colScore}>기록</span>
                  <span className={s.colVerif}>인증</span>
                  <span className={s.colDate}>날짜</span>
                </div>
                {data.leaderboard.map((entry) => (
                  <LeaderboardRow
                    key={entry.recordId}
                    entry={entry}
                    isMe={user?.name === entry.userName}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = status === "VERIFIED" ? "인증완료" : status === "REJECTED" ? "거절됨" : "인증대기";
  const color = status === "VERIFIED" ? "#22c55e" : status === "REJECTED" ? "#e8220a" : "#f59e0b";
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "2px 8px",
      background: `${color}20`, color, border: `1px solid ${color}`,
    }}>
      {label}
    </span>
  );
}

function LeaderboardRow({ entry, isMe }: { entry: RankingEntry; isMe: boolean }) {
  const rankColor = entry.rank === 1 ? "#FFD700" : entry.rank === 2 ? "#C0C0C0" : entry.rank === 3 ? "#CD7F32" : "var(--muted)";

  return (
    <div className={`${s.tableRow} ${isMe ? s.tableRowMe : ""}`}>
      <span className={s.colRank} style={{ color: rankColor, fontFamily: "Bebas Neue", fontSize: 20 }}>
        {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
      </span>
      <span className={s.colAthlete}>
        <a href={`/users/${entry.userId}`} className={s.athleteName}>
          {entry.userName}
        </a>
        {isMe && <span className={s.meTag}>나</span>}
      </span>
      <span className={s.colScore} style={{ fontFamily: "Bebas Neue", fontSize: 22, color: "var(--text)" }}>
        {entry.scoreFormatted}
        <a href={entry.videoUrl} target="_blank" rel="noopener noreferrer" className={s.videoLink} title="영상 보기">
          ▶
        </a>
      </span>
      <span className={s.colVerif}>
        {entry.verifiedBoxName ? (
          <span className={s.verifiedBox}>✓ {entry.verifiedBoxName}</span>
        ) : (
          <span style={{ color: "var(--muted)", fontSize: 11 }}>-</span>
        )}
      </span>
      <span className={s.colDate} style={{ fontSize: 11, color: "var(--muted)" }}>
        {entry.recordedAt}
      </span>
    </div>
  );
}
