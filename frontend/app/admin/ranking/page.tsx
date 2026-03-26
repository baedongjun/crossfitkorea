"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rankingApi } from "@/lib/api";
import { NamedWod, NamedWodCategory, ScoreType, NamedWodRecord } from "@/types";
import { toast } from "react-toastify";
import s from "./adminRanking.module.css";

const CATEGORY_OPTIONS: NamedWodCategory[] = ["GIRLS", "HEROES", "BENCHMARK", "CUSTOM"];
const SCORE_TYPES: ScoreType[] = ["TIME", "REPS", "WEIGHT", "ROUNDS"];

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "GIRLS" as NamedWodCategory,
  scoreType: "TIME" as ScoreType,
  scoreUnit: "",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "대기중",
  VERIFIED: "인증완료",
  REJECTED: "거절됨",
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: "#f59e0b",
  VERIFIED: "#22c55e",
  REJECTED: "#e8220a",
};

export default function AdminRankingPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"wods" | "verify">("wods");

  // ── WOD 관리 상태 ──
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // ── 기록 인증 상태 ──
  const [pendingPage, setPendingPage] = useState(0);
  const [rejectComment, setRejectComment] = useState<Record<number, string>>({});

  // ── 쿼리 ──
  const { data: wods = [], isLoading: wodsLoading } = useQuery<NamedWod[]>({
    queryKey: ["admin", "ranking", "wods"],
    queryFn: async () => (await rankingApi.getWods()).data.data,
    enabled: tab === "wods",
  });

  // 항상 fetch — 탭 뱃지 표시를 위해 staleTime으로 빈도 조절
  const { data: pendingPageData, isLoading: pendingLoading } = useQuery({
    queryKey: ["admin", "ranking", "pending", pendingPage],
    queryFn: async () => (await rankingApi.getPendingRecords(pendingPage, 15)).data.data,
    staleTime: 1000 * 60 * 2,
  });

  const pendingRecords: NamedWodRecord[] = pendingPageData?.content ?? [];
  const totalPages: number = pendingPageData?.totalPages ?? 0;
  const totalElements: number = pendingPageData?.totalElements ?? 0;

  // ── WOD 뮤테이션 ──
  const createMutation = useMutation({
    mutationFn: () => rankingApi.createWod(form),
    onSuccess: () => {
      toast.success("Named WOD가 등록되었습니다.");
      qc.invalidateQueries({ queryKey: ["admin", "ranking"] });
      qc.invalidateQueries({ queryKey: ["ranking"] });
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
    onError: () => toast.error("등록에 실패했습니다."),
  });

  const updateMutation = useMutation({
    mutationFn: () => rankingApi.updateWod(editId!, form),
    onSuccess: () => {
      toast.success("수정되었습니다.");
      qc.invalidateQueries({ queryKey: ["admin", "ranking"] });
      qc.invalidateQueries({ queryKey: ["ranking"] });
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      rankingApi.toggleWodActive(id, active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "ranking"] });
      qc.invalidateQueries({ queryKey: ["ranking"] });
    },
    onError: () => toast.error("상태 변경에 실패했습니다."),
  });

  // ── 인증/거절 뮤테이션 ──
  const verifyMutation = useMutation({
    mutationFn: ({ id }: { id: number }) => rankingApi.verifyRecord(id),
    onSuccess: () => {
      toast.success("기록이 인증되었습니다.");
      qc.invalidateQueries({ queryKey: ["admin", "ranking", "pending"] });
    },
    onError: () => toast.error("인증에 실패했습니다."),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment }: { id: number; comment: string }) =>
      rankingApi.rejectRecord(id, comment),
    onSuccess: (_, vars) => {
      toast.success("기록이 거절되었습니다.");
      setRejectComment((prev) => {
        const next = { ...prev };
        delete next[vars.id];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["admin", "ranking", "pending"] });
    },
    onError: () => toast.error("거절 처리에 실패했습니다."),
  });

  const handleEdit = (wod: NamedWod) => {
    setEditId(wod.id);
    setForm({
      name: wod.name,
      description: wod.description || "",
      category: wod.category,
      scoreType: wod.scoreType,
      scoreUnit: wod.scoreUnit || "",
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("이름을 입력하세요.");
    if (editId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  return (
    <div>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>랭킹 관리</h1>
        {tab === "wods" && (
          <button
            className="btn-primary"
            onClick={() => {
              setShowForm(true);
              setEditId(null);
              setForm(EMPTY_FORM);
            }}
          >
            + Named WOD 추가
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className={s.tabs}>
        <button
          className={`${s.tab} ${tab === "wods" ? s.tabActive : ""}`}
          onClick={() => setTab("wods")}
        >
          WOD 관리
        </button>
        <button
          className={`${s.tab} ${tab === "verify" ? s.tabActive : ""}`}
          onClick={() => setTab("verify")}
        >
          기록 인증
          {totalElements > 0 && tab !== "verify" && (
            <span className={s.tabBadge}>{totalElements}</span>
          )}
        </button>
      </div>

      {/* ── WOD 관리 탭 ── */}
      {tab === "wods" && (
        <>
          {showForm && (
            <form className={s.formCard} onSubmit={handleSubmit}>
              <h3 className={s.formTitle}>{editId ? "WOD 수정" : "WOD 등록"}</h3>
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label className={s.label}>WOD 이름 *</label>
                  <input
                    className="input-field"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Fran, Murph, ..."
                  />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>카테고리</label>
                  <select
                    className="input-field"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as NamedWodCategory })
                    }
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label className={s.label}>점수 타입</label>
                  <select
                    className="input-field"
                    value={form.scoreType}
                    onChange={(e) =>
                      setForm({ ...form, scoreType: e.target.value as ScoreType })
                    }
                  >
                    {SCORE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>점수 단위</label>
                  <input
                    className="input-field"
                    value={form.scoreUnit}
                    onChange={(e) => setForm({ ...form, scoreUnit: e.target.value })}
                    placeholder="초, kg, 회, 라운드..."
                  />
                </div>
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>설명 (와드 동작 설명)</label>
                <textarea
                  className="input-field"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={"21-15-9\nThruster (43/29 kg)\nPull-up"}
                  style={{ resize: "vertical" }}
                />
              </div>
              <div className={s.formActions}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editId ? "수정" : "등록"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditId(null);
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          )}

          {wodsLoading ? (
            <p className={s.loading}>LOADING...</p>
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>카테고리</th>
                    <th>점수 타입</th>
                    <th>인증 기록</th>
                    <th>활성 상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {wods.map((wod) => (
                    <tr key={wod.id}>
                      <td style={{ fontWeight: 700 }}>{wod.name}</td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }}>{wod.category}</td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }}>{wod.scoreType}</td>
                      <td>{wod.verifiedCount}</td>
                      <td>
                        <span className={wod.active !== false ? s.badgeActive : s.badgeInactive}>
                          {wod.active !== false ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td>
                        <div className={s.actions}>
                          <button className={s.btnEdit} onClick={() => handleEdit(wod)}>
                            수정
                          </button>
                          {wod.active !== false ? (
                            <button
                              className={s.btnDeactivate}
                              onClick={() => toggleMutation.mutate({ id: wod.id, active: false })}
                            >
                              비활성화
                            </button>
                          ) : (
                            <button
                              className={s.btnActivate}
                              onClick={() => toggleMutation.mutate({ id: wod.id, active: true })}
                            >
                              활성화
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── 기록 인증 탭 ── */}
      {tab === "verify" && (
        <div>
          <p className={s.verifyInfo}>
            인증 대기 기록{" "}
            <strong style={{ color: "var(--text)" }}>{totalElements}건</strong> — YouTube
            영상을 확인 후 인증 또는 거절하세요.
          </p>

          {pendingLoading ? (
            <p className={s.loading}>LOADING...</p>
          ) : pendingRecords.length === 0 ? (
            <div className={s.empty}>인증 대기 중인 기록이 없습니다.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pendingRecords.map((record) => (
                <div
                  key={record.id}
                  className={s.recordCard}
                  style={{ borderLeft: `3px solid ${STATUS_COLOR[record.status]}` }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    {/* 기록 정보 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={s.recordMeta}>
                        <span className={s.recordWodName}>{record.namedWodName}</span>
                        <span className={s.scoreBadge}>{record.scoreType}</span>
                        <span
                          style={{
                            fontSize: 11,
                            background: `${STATUS_COLOR[record.status]}20`,
                            color: STATUS_COLOR[record.status],
                            border: `1px solid ${STATUS_COLOR[record.status]}`,
                            padding: "1px 6px",
                            fontWeight: 700,
                          }}
                        >
                          {STATUS_LABEL[record.status]}
                        </span>
                      </div>

                      <div className={s.recordScore}>
                        <span className={s.userName}>{record.userName}</span>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>·</span>
                        <span className={s.scoreValue}>{record.scoreFormatted}</span>
                        {record.scoreUnit && (
                          <span className={s.scoreUnit}>{record.scoreUnit}</span>
                        )}
                        <span className={s.recordDate}>{record.recordedAt}</span>
                      </div>

                      {record.notes && <p className={s.recordNotes}>{record.notes}</p>}

                      <a
                        href={record.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={s.ytBtn}
                      >
                        ▶ YouTube 영상 확인
                      </a>
                    </div>

                    {/* 인증/거절 액션 */}
                    <div className={s.verifyActions}>
                      <button
                        className={s.btnVerify}
                        disabled={verifyMutation.isPending}
                        onClick={() => verifyMutation.mutate({ id: record.id })}
                      >
                        ✓ 인증
                      </button>

                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <input
                          type="text"
                          className={s.rejectInput}
                          placeholder="거절 사유 (선택)"
                          value={rejectComment[record.id] ?? ""}
                          onChange={(e) =>
                            setRejectComment((prev) => ({
                              ...prev,
                              [record.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          className={s.btnReject}
                          disabled={rejectMutation.isPending}
                          onClick={() =>
                            rejectMutation.mutate({
                              id: record.id,
                              comment: rejectComment[record.id] ?? "",
                            })
                          }
                        >
                          ✕ 거절
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className={s.pagination}>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: "6px 16px" }}
                    disabled={pendingPage === 0}
                    onClick={() => setPendingPage((p) => p - 1)}
                  >
                    이전
                  </button>
                  <span className={s.pageInfo}>
                    {pendingPage + 1} / {totalPages}
                  </span>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: "6px 16px" }}
                    disabled={pendingPage >= totalPages - 1}
                    onClick={() => setPendingPage((p) => p + 1)}
                  >
                    다음
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
