"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rankingApi } from "@/lib/api";
import { NamedWod, NamedWodCategory, ScoreType } from "@/types";
import { toast } from "react-toastify";
import s from "../admin.module.css";

const CATEGORY_OPTIONS: NamedWodCategory[] = ["GIRLS", "HEROES", "BENCHMARK", "CUSTOM"];
const SCORE_TYPES: ScoreType[] = ["TIME", "REPS", "WEIGHT", "ROUNDS"];

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "GIRLS" as NamedWodCategory,
  scoreType: "TIME" as ScoreType,
  scoreUnit: "",
};

export default function AdminRankingPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: wods = [], isLoading } = useQuery<NamedWod[]>({
    queryKey: ["admin", "ranking", "wods"],
    queryFn: async () => (await rankingApi.getWods()).data.data,
  });

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
    mutationFn: ({ id, active }: { id: number; active: boolean }) => rankingApi.toggleWodActive(id, active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "ranking"] });
      qc.invalidateQueries({ queryKey: ["ranking"] });
    },
    onError: () => toast.error("상태 변경에 실패했습니다."),
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
    if (editId) { updateMutation.mutate(); } else { createMutation.mutate(); }
  };

  return (
    <div>
      <div className={s.pageHeader}>
        <h1 className={s.pageTitle}>Named WOD 관리</h1>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}>
          + Named WOD 추가
        </button>
      </div>

      {showForm && (
        <form className={s.formCard} onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 20px", color: "var(--text)", fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 1 }}>
            {editId ? "WOD 수정" : "WOD 등록"}
          </h3>
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.label}>WOD 이름 *</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Fran, Murph, ..." />
            </div>
            <div className={s.formGroup}>
              <label className={s.label}>카테고리</label>
              <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as NamedWodCategory })}>
                {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className={s.formRow}>
            <div className={s.formGroup}>
              <label className={s.label}>점수 타입</label>
              <select className="input-field" value={form.scoreType} onChange={(e) => setForm({ ...form, scoreType: e.target.value as ScoreType })}>
                {SCORE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={s.formGroup}>
              <label className={s.label}>점수 단위</label>
              <input className="input-field" value={form.scoreUnit} onChange={(e) => setForm({ ...form, scoreUnit: e.target.value })} placeholder="초, kg, 회, 라운드..." />
            </div>
          </div>
          <div className={s.formGroup}>
            <label className={s.label}>설명 (와드 동작 설명)</label>
            <textarea className="input-field" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="21-15-9&#10;Thruster (43/29 kg)&#10;Pull-up" style={{ resize: "vertical" }} />
          </div>
          <div className={s.formActions}>
            <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
              {editId ? "수정" : "등록"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditId(null); }}>
              취소
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p style={{ color: "var(--muted)" }}>로딩 중...</p>
      ) : (
        <table className={s.table}>
          <thead>
            <tr>
              <th>이름</th>
              <th>카테고리</th>
              <th>점수 타입</th>
              <th>인증 기록</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {wods.map((wod) => (
              <tr key={wod.id}>
                <td style={{ fontWeight: 700, color: "var(--text)" }}>{wod.name}</td>
                <td style={{ color: "var(--muted)", fontSize: 12 }}>{wod.category}</td>
                <td style={{ color: "var(--muted)", fontSize: 12 }}>{wod.scoreType}</td>
                <td>{wod.verifiedCount}</td>
                <td>
                  <button
                    style={{
                      background: "transparent",
                      border: `1px solid ${wod.verifiedCount >= 0 ? "var(--border)" : "var(--border)"}`,
                      color: "var(--muted)",
                      padding: "3px 10px",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                    onClick={() => toggleMutation.mutate({ id: wod.id, active: true })}
                  >
                    활성
                  </button>
                </td>
                <td>
                  <button className="btn-secondary" style={{ fontSize: 12, padding: "4px 12px" }} onClick={() => handleEdit(wod)}>
                    수정
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
