"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { goalApi } from "@/lib/api";
import { UserGoal } from "@/types";
import { isLoggedIn } from "@/lib/auth";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import s from "./goals.module.css";

const EXERCISE_OPTIONS = [
  "백스쿼트", "프론트스쿼트", "데드리프트", "클린", "스내치",
  "클린앤저크", "오버헤드스쿼트", "프레스", "푸시프레스", "벤치프레스",
  "체중", "체지방률", "풀업", "머슬업", "기타",
];

const EMPTY_FORM = {
  exerciseType: EXERCISE_OPTIONS[0],
  targetValue: "",
  currentValue: "",
  unit: "kg",
  targetDate: "",
  notes: "",
};

export default function MyGoalsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setMounted(true);
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["my", "goals"],
    queryFn: async () => (await goalApi.getAll()).data.data as UserGoal[],
    enabled: mounted,
  });

  const createMutation = useMutation({
    mutationFn: () => goalApi.create({
      exerciseType: form.exerciseType,
      targetValue: parseFloat(form.targetValue),
      unit: form.unit || undefined,
      targetDate: form.targetDate || undefined,
      notes: form.notes || undefined,
    }),
    onSuccess: () => {
      toast.success("목표가 추가됐습니다.");
      resetForm();
      qc.invalidateQueries({ queryKey: ["my", "goals"] });
    },
    onError: () => toast.error("목표 추가에 실패했습니다."),
  });

  const updateMutation = useMutation({
    mutationFn: () => goalApi.update(editId!, {
      targetValue: parseFloat(form.targetValue) || undefined,
      currentValue: form.currentValue ? parseFloat(form.currentValue) : undefined,
      notes: form.notes || undefined,
    }),
    onSuccess: () => {
      toast.success("수정됐습니다.");
      resetForm();
      qc.invalidateQueries({ queryKey: ["my", "goals"] });
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => goalApi.delete(id),
    onSuccess: () => {
      toast.success("삭제됐습니다.");
      qc.invalidateQueries({ queryKey: ["my", "goals"] });
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const achieveMutation = useMutation({
    mutationFn: (id: number) => goalApi.achieve(id),
    onSuccess: () => {
      toast.success("목표 달성을 축하합니다!");
      qc.invalidateQueries({ queryKey: ["my", "goals"] });
    },
    onError: () => toast.error("처리에 실패했습니다."),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (g: UserGoal) => {
    setEditId(g.id);
    setForm({
      exerciseType: g.exerciseType,
      targetValue: String(g.targetValue),
      currentValue: g.currentValue ? String(g.currentValue) : "",
      unit: g.unit ?? "kg",
      targetDate: g.targetDate ?? "",
      notes: g.notes ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.targetValue || isNaN(parseFloat(form.targetValue))) {
      toast.error("목표 값을 입력해주세요.");
      return;
    }
    if (editId) updateMutation.mutate();
    else createMutation.mutate();
  };

  const active = goals.filter((g) => !g.achieved);
  const achieved = goals.filter((g) => g.achieved);

  if (!mounted) return null;

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.header}>
          <div>
            <Link href="/my" className={s.back}>← 마이페이지</Link>
            <h1 className={s.title}>개인 목표</h1>
            <p className={s.sub}>진행 중 {active.length}개 · 달성 {achieved.length}개</p>
          </div>
          <button
            className="btn-primary"
            style={{ padding: "10px 24px", fontSize: 13 }}
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            + 목표 추가
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className={s.formWrap}>
            <h3 className={s.formTitle}>{editId ? "목표 수정" : "새 목표 추가"}</h3>
            <div className={s.formGrid}>
              <div className={s.field}>
                <label className={s.label}>종목</label>
                <select className={s.select} value={form.exerciseType}
                  onChange={(e) => setForm((f) => ({ ...f, exerciseType: e.target.value }))}>
                  {EXERCISE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className={s.field}>
                <label className={s.label}>목표 값</label>
                <input className="input-field" type="number" value={form.targetValue}
                  onChange={(e) => setForm((f) => ({ ...f, targetValue: e.target.value }))}
                  placeholder="예: 100" />
              </div>
              <div className={s.field}>
                <label className={s.label}>단위</label>
                <input className="input-field" value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="kg, %, 개..." />
              </div>
              {editId && (
                <div className={s.field}>
                  <label className={s.label}>현재 값</label>
                  <input className="input-field" type="number" value={form.currentValue}
                    onChange={(e) => setForm((f) => ({ ...f, currentValue: e.target.value }))}
                    placeholder="현재 기록" />
                </div>
              )}
              <div className={s.field}>
                <label className={s.label}>목표 날짜</label>
                <input className="input-field" type="date" value={form.targetDate}
                  onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))} />
              </div>
            </div>
            <div className={s.field} style={{ marginTop: 12 }}>
              <label className={s.label}>메모</label>
              <input className="input-field" value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="목표에 대한 메모 (선택)" />
            </div>
            <div className={s.formActions}>
              <button className="btn-primary" style={{ padding: "10px 28px", fontSize: 13 }}
                disabled={createMutation.isPending || updateMutation.isPending}
                onClick={handleSubmit}>
                {editId ? "수정" : "추가"}
              </button>
              <button className="btn-secondary" style={{ padding: "10px 20px", fontSize: 13 }} onClick={resetForm}>취소</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className={s.loading}>LOADING...</div>
        ) : (
          <>
            {/* Active Goals */}
            {active.length > 0 && (
              <section>
                <h2 className={s.sectionTitle}>진행 중</h2>
                <div className={s.goalList}>
                  {active.map((g) => {
                    const progress = g.currentValue && g.targetValue
                      ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100))
                      : 0;
                    return (
                      <div key={g.id} className={s.goalCard}>
                        <div className={s.goalTop}>
                          <div>
                            <span className={s.goalExercise}>{g.exerciseType}</span>
                            {g.targetDate && (
                              <span className={s.goalDate}>
                                {dayjs(g.targetDate).format("YYYY.MM.DD")} 목표
                              </span>
                            )}
                          </div>
                          <div className={s.goalActions}>
                            <button className={s.btnSmall} onClick={() => handleEdit(g)}>수정</button>
                            <button
                              className={`${s.btnSmall} ${s.btnAchieve}`}
                              onClick={() => achieveMutation.mutate(g.id)}
                              disabled={achieveMutation.isPending}
                            >달성</button>
                            <button
                              className={`${s.btnSmall} ${s.btnDelete}`}
                              onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMutation.mutate(g.id); }}
                            >삭제</button>
                          </div>
                        </div>
                        <div className={s.goalValue}>
                          <span className={s.goalCurrent}>{g.currentValue ?? "—"}</span>
                          <span className={s.goalSep}>/</span>
                          <span className={s.goalTarget}>{g.targetValue}</span>
                          <span className={s.goalUnit}>{g.unit}</span>
                        </div>
                        {g.currentValue != null && (
                          <div className={s.progressBar}>
                            <div className={s.progressFill} style={{ width: `${progress}%` }} />
                            <span className={s.progressPct}>{progress}%</span>
                          </div>
                        )}
                        {g.notes && <p className={s.goalNotes}>{g.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Achieved Goals */}
            {achieved.length > 0 && (
              <section style={{ marginTop: 40 }}>
                <h2 className={s.sectionTitle}>달성 완료</h2>
                <div className={s.goalList}>
                  {achieved.map((g) => (
                    <div key={g.id} className={`${s.goalCard} ${s.goalAchieved}`}>
                      <div className={s.goalTop}>
                        <div>
                          <span className={s.achievedBadge}>달성</span>
                          <span className={s.goalExercise}>{g.exerciseType}</span>
                        </div>
                        <button className={`${s.btnSmall} ${s.btnDelete}`}
                          onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMutation.mutate(g.id); }}>삭제</button>
                      </div>
                      <div className={s.goalValue}>
                        <span className={s.goalTarget}>{g.targetValue}</span>
                        <span className={s.goalUnit}>{g.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {goals.length === 0 && (
              <div className={s.empty}>
                <p className={s.emptyText}>아직 설정한 목표가 없습니다.</p>
                <p className={s.emptyHint}>백스쿼트 100kg, 데드리프트 150kg 등 목표를 설정하고 달성해보세요!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
