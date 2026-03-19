"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { challengeApi } from "@/lib/api";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import s from "./adminChallenges.module.css";

interface ChallengeDto {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  targetDays: number;
  type: "WOD" | "EXERCISE" | "DIET" | "FREE";
  active: boolean;
  participantCount: number;
}

const TYPE_LABELS: Record<string, string> = {
  WOD: "WOD", EXERCISE: "운동", DIET: "식단", FREE: "자유",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  startDate: dayjs().format("YYYY-MM-DD"),
  endDate: dayjs().add(30, "day").format("YYYY-MM-DD"),
  targetDays: 30,
  type: "WOD" as const,
  imageUrl: "",
};

export default function AdminChallengesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "challenges"],
    queryFn: async () => (await challengeApi.getAll()).data.data as ChallengeDto[],
  });

  const challenges = data ?? [];

  const createMutation = useMutation({
    mutationFn: () => challengeApi.create(form),
    onSuccess: () => {
      toast.success("챌린지가 등록됐습니다.");
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin", "challenges"] });
    },
    onError: () => toast.error("등록에 실패했습니다."),
  });

  const updateMutation = useMutation({
    mutationFn: () => challengeApi.update(editId!, form),
    onSuccess: () => {
      toast.success("챌린지가 수정됐습니다.");
      resetForm();
      qc.invalidateQueries({ queryKey: ["admin", "challenges"] });
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      challengeApi.toggleActive(id, active),
    onSuccess: (_, { active }) => {
      toast.success(active ? "챌린지가 활성화됐습니다." : "챌린지가 비활성화됐습니다.");
      qc.invalidateQueries({ queryKey: ["admin", "challenges"] });
    },
    onError: () => toast.error("상태 변경에 실패했습니다."),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (c: ChallengeDto) => {
    setEditId(c.id);
    setForm({
      title: c.title,
      description: c.description ?? "",
      startDate: c.startDate,
      endDate: c.endDate,
      targetDays: c.targetDays,
      type: c.type,
      imageUrl: "",
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error("제목을 입력해주세요."); return; }
    if (editId) updateMutation.mutate();
    else createMutation.mutate();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>챌린지 관리</h1>
          <p className={s.pageSub}>총 {challenges.length}개의 챌린지</p>
        </div>
        <button
          className="btn-primary"
          style={{ padding: "10px 24px", fontSize: 14 }}
          onClick={() => { resetForm(); setShowForm(true); }}
        >
          + 챌린지 등록
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className={s.formWrap}>
          <h3 className={s.formTitle}>{editId ? "챌린지 수정" : "새 챌린지 등록"}</h3>
          <div className={s.formGrid}>
            <div className={s.field}>
              <label className={s.label}>제목 *</label>
              <input
                className="input-field"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="챌린지 제목"
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>유형</label>
              <select
                className={s.select}
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))}
              >
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className={s.field}>
              <label className={s.label}>시작일</label>
              <input
                className="input-field"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>종료일</label>
              <input
                className="input-field"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>목표 일수</label>
              <input
                className="input-field"
                type="number"
                min="1"
                value={form.targetDays}
                onChange={(e) => setForm((f) => ({ ...f, targetDays: parseInt(e.target.value) || 30 }))}
              />
            </div>
          </div>
          <div className={s.field} style={{ marginTop: 12 }}>
            <label className={s.label}>설명</label>
            <textarea
              className={s.textarea}
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="챌린지 설명"
            />
          </div>
          <div className={s.formActions}>
            <button
              className="btn-primary"
              style={{ padding: "10px 28px", fontSize: 14 }}
              disabled={isPending}
              onClick={handleSubmit}
            >
              {isPending ? "처리 중..." : editId ? "수정" : "등록"}
            </button>
            <button
              className="btn-secondary"
              style={{ padding: "10px 20px", fontSize: 14 }}
              onClick={resetForm}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className={s.loading}>LOADING...</div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>제목</th>
                <th>유형</th>
                <th>기간</th>
                <th>목표</th>
                <th>참가자</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((c) => (
                <tr key={c.id}>
                  <td className={s.tdTitle}>{c.title}</td>
                  <td><span className={s.typeBadge}>{TYPE_LABELS[c.type]}</span></td>
                  <td className={s.tdMeta}>
                    {dayjs(c.startDate).format("YY.MM.DD")} ~ {dayjs(c.endDate).format("YY.MM.DD")}
                  </td>
                  <td className={s.tdMeta}>{c.targetDays}일</td>
                  <td className={s.tdMeta}>{c.participantCount.toLocaleString()}명</td>
                  <td>
                    <span className={c.active ? s.badgeActive : s.badgeInactive}>
                      {c.active ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td>
                    <div className={s.actions}>
                      <button className={s.btnEdit} onClick={() => handleEdit(c)}>수정</button>
                      <button
                        className={c.active ? s.btnDeactivate : s.btnActivate}
                        disabled={toggleMutation.isPending}
                        onClick={() => toggleMutation.mutate({ id: c.id, active: !c.active })}
                      >
                        {c.active ? "비활성화" : "활성화"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
