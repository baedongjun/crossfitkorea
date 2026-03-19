"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, competitionApi, competitionResultApi } from "@/lib/api";
import { Competition, CompetitionStatus } from "@/types";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import s from "./adminComp.module.css";

const LEVELS = ["BEGINNER","SCALED","INTERMEDIATE","RX","ELITE","ALL"] as const;
const LEVEL_LABELS: Record<string, string> = {
  BEGINNER:"입문", SCALED:"스케일드", INTERMEDIATE:"중급", RX:"Rx", ELITE:"엘리트", ALL:"전체",
};
const STATUSES: CompetitionStatus[] = ["UPCOMING","OPEN","CLOSED","COMPLETED"];
const STATUS_LABELS: Record<CompetitionStatus, string> = {
  UPCOMING:"예정", OPEN:"접수 중", CLOSED:"접수 마감", COMPLETED:"종료",
};
const STATUS_BADGE: Record<CompetitionStatus, string> = {
  UPCOMING:"badge-upcoming", OPEN:"badge-open", CLOSED:"badge-closed", COMPLETED:"badge-completed",
};

export default function AdminCompetitionsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    description: "",
    organizer: "",
    imageUrl: "",
    startDate: dayjs().format("YYYY-MM-DD"),
    endDate: "",
    location: "",
    city: "",
    registrationDeadline: "",
    registrationUrl: "",
    level: "ALL",
    entryFee: "",
    maxParticipants: "",
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [resultCompId, setResultCompId] = useState<number | null>(null);
  const [resultRows, setResultRows] = useState<{ rank: string; userName: string; score: string; notes: string }[]>([
    { rank: "1", userName: "", score: "", notes: "" },
  ]);
  const [editForm, setEditForm] = useState({
    name: "", description: "", organizer: "", imageUrl: "",
    startDate: "", endDate: "", location: "", city: "",
    registrationDeadline: "", registrationUrl: "",
    level: "ALL", entryFee: "", maxParticipants: "",
  });

  const { data } = useQuery({
    queryKey: ["competitions", "ALL"],
    queryFn: async () => (await competitionApi.getAll()).data.data,
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createCompetition({
      ...form,
      entryFee: form.entryFee ? Number(form.entryFee) : null,
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
      endDate: form.endDate || null,
      registrationDeadline: form.registrationDeadline || null,
      registrationUrl: form.registrationUrl || null,
    }),
    onSuccess: () => {
      toast.success("대회가 등록되었습니다.");
      setForm({ name:"", description:"", organizer:"", imageUrl:"", startDate:dayjs().format("YYYY-MM-DD"), endDate:"", location:"", city:"", registrationDeadline:"", registrationUrl:"", level:"ALL", entryFee:"", maxParticipants:"" });
      queryClient.invalidateQueries({ queryKey: ["competitions"] });
    },
    onError: () => toast.error("등록에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteCompetition(id),
    onSuccess: () => {
      toast.success("대회가 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["competitions"] });
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      adminApi.updateCompetitionStatus(id, status),
    onSuccess: () => {
      toast.success("상태가 변경되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["competitions"] });
    },
    onError: () => toast.error("변경에 실패했습니다."),
  });

  const saveResultsMutation = useMutation({
    mutationFn: () => competitionResultApi.saveResults(
      resultCompId!,
      resultRows
        .filter((r) => r.userName.trim())
        .map((r) => ({ rank: Number(r.rank), userName: r.userName, score: r.score || undefined, notes: r.notes || undefined }))
    ),
    onSuccess: () => {
      toast.success("결과가 저장되었습니다.");
      setResultCompId(null);
      setResultRows([{ rank: "1", userName: "", score: "", notes: "" }]);
    },
    onError: () => toast.error("저장에 실패했습니다."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate) {
      toast.error("대회명과 시작일을 입력하세요.");
      return;
    }
    createMutation.mutate();
  };

  const updateMutation = useMutation({
    mutationFn: () => adminApi.updateCompetition(editingId!, {
      ...editForm,
      entryFee: editForm.entryFee ? Number(editForm.entryFee) : null,
      maxParticipants: editForm.maxParticipants ? Number(editForm.maxParticipants) : null,
      endDate: editForm.endDate || null,
      registrationDeadline: editForm.registrationDeadline || null,
      registrationUrl: editForm.registrationUrl || null,
    }),
    onSuccess: () => {
      toast.success("대회가 수정되었습니다.");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["competitions"] });
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const startEdit = (comp: Competition) => {
    setEditingId(comp.id);
    setEditForm({
      name: comp.name || "",
      description: comp.description || "",
      organizer: comp.organizer || "",
      imageUrl: comp.imageUrl || "",
      startDate: comp.startDate || dayjs().format("YYYY-MM-DD"),
      endDate: comp.endDate || "",
      location: comp.location || "",
      city: comp.city || "",
      registrationDeadline: comp.registrationDeadline || "",
      registrationUrl: comp.registrationUrl || "",
      level: comp.level || "ALL",
      entryFee: comp.entryFee ? String(comp.entryFee) : "",
      maxParticipants: comp.maxParticipants ? String(comp.maxParticipants) : "",
    });
  };

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));
  const setEdit = (key: string, val: string) => setEditForm((f) => ({ ...f, [key]: val }));

  return (
    <div>
      <h1 className={s.pageTitle}>대회 관리</h1>
      <div className={s.grid}>
        {/* Form */}
        <div className={s.formCard}>
          <p className={s.formTitle}>대회 등록</p>
          <form onSubmit={handleSubmit} className={s.form}>
            <div className={s.field}>
              <label className={s.label}>대회명</label>
              <input type="text" className="input-field" placeholder="2026 CrossFit Korea Open" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className={s.field}>
              <label className={s.label}>주최</label>
              <input type="text" className="input-field" placeholder="CrossFit Korea" value={form.organizer} onChange={(e) => set("organizer", e.target.value)} />
            </div>
            <div className={s.field}>
              <label className={s.label}>대표 이미지 URL (선택)</label>
              <input type="url" className="input-field" placeholder="https://..." value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
            </div>
            <div className={s.row}>
              <div className={s.field}>
                <label className={s.label}>시작일</label>
                <input type="date" className="input-field" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
              </div>
              <div className={s.field}>
                <label className={s.label}>종료일 (선택)</label>
                <input type="date" className="input-field" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
              </div>
            </div>
            <div className={s.row}>
              <div className={s.field}>
                <label className={s.label}>도시</label>
                <input type="text" className="input-field" placeholder="서울" value={form.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className={s.field}>
                <label className={s.label}>레벨</label>
                <select className={s.select} value={form.level} onChange={(e) => set("level", e.target.value)}>
                  {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
                </select>
              </div>
            </div>
            <div className={s.field}>
              <label className={s.label}>장소</label>
              <input type="text" className="input-field" placeholder="상세 장소" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>
            <div className={s.row}>
              <div className={s.field}>
                <label className={s.label}>참가비 (원)</label>
                <input type="number" className="input-field" placeholder="50000" value={form.entryFee} onChange={(e) => set("entryFee", e.target.value)} />
              </div>
              <div className={s.field}>
                <label className={s.label}>최대 인원</label>
                <input type="number" className="input-field" placeholder="200" value={form.maxParticipants} onChange={(e) => set("maxParticipants", e.target.value)} />
              </div>
            </div>
            <div className={s.field}>
              <label className={s.label}>접수 마감일</label>
              <input type="date" className="input-field" value={form.registrationDeadline} onChange={(e) => set("registrationDeadline", e.target.value)} />
            </div>
            <div className={s.field}>
              <label className={s.label}>접수 URL</label>
              <input type="url" className="input-field" placeholder="https://..." value={form.registrationUrl} onChange={(e) => set("registrationUrl", e.target.value)} />
            </div>
            <div className={s.field}>
              <label className={s.label}>설명 (선택)</label>
              <textarea className={s.textarea} placeholder="대회 설명" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <button type="submit" className={`btn-primary ${s.submitBtn}`} disabled={createMutation.isPending}>
              {createMutation.isPending ? "등록 중..." : "대회 등록"}
            </button>
          </form>
        </div>

        {/* List */}
        <div className={s.listCard}>
          <p className={s.listHeader}>등록된 대회</p>
          <div className={s.list}>
            {data?.content?.length > 0 ? (
              data.content.map((comp: Competition) => (
                <div key={comp.id}>
                  <div className={s.item}>
                    <div className={s.itemBody}>
                      <span className={`badge ${STATUS_BADGE[comp.status]}`}>{STATUS_LABELS[comp.status]}</span>
                      <p className={s.itemName}>{comp.name}</p>
                      <p className={s.itemMeta}>
                        {dayjs(comp.startDate).format("YYYY.MM.DD")}
                        {comp.location && ` · ${comp.location}`}
                      </p>
                    </div>
                    <div className={s.itemActions}>
                      <select
                        className={s.statusSelect}
                        value={comp.status}
                        onChange={(e) => statusMutation.mutate({ id: comp.id, status: e.target.value })}
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>{STATUS_LABELS[st]}</option>
                        ))}
                      </select>
                      {comp.status === "COMPLETED" && (
                        <button
                          className={s.editBtn}
                          onClick={() => {
                            if (resultCompId === comp.id) { setResultCompId(null); }
                            else { setResultCompId(comp.id); setEditingId(null); }
                          }}
                        >
                          {resultCompId === comp.id ? "결과 닫기" : "결과 입력"}
                        </button>
                      )}
                      <button
                        className={s.editBtn}
                        onClick={() => editingId === comp.id ? setEditingId(null) : startEdit(comp)}
                      >
                        {editingId === comp.id ? "닫기" : "수정"}
                      </button>
                      <button
                        className={s.deleteBtn}
                        onClick={() => {
                          if (window.confirm(`"${comp.name}" 대회를 삭제하시겠습니까?`)) {
                            deleteMutation.mutate(comp.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  {resultCompId === comp.id && (
                    <div className={s.editForm}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 16 }}>대회 결과 입력</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {resultRows.map((row, idx) => (
                          <div key={idx} style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
                            <input className="input-field" style={{ textAlign: "center" }} placeholder="순위" value={row.rank} onChange={(e) => { const nr = [...resultRows]; nr[idx] = { ...nr[idx], rank: e.target.value }; setResultRows(nr); }} />
                            <input className="input-field" placeholder="참가자 이름" value={row.userName} onChange={(e) => { const nr = [...resultRows]; nr[idx] = { ...nr[idx], userName: e.target.value }; setResultRows(nr); }} />
                            <input className="input-field" placeholder="기록 (선택)" value={row.score} onChange={(e) => { const nr = [...resultRows]; nr[idx] = { ...nr[idx], score: e.target.value }; setResultRows(nr); }} />
                            <input className="input-field" placeholder="메모 (선택)" value={row.notes} onChange={(e) => { const nr = [...resultRows]; nr[idx] = { ...nr[idx], notes: e.target.value }; setResultRows(nr); }} />
                            <button className="btn-secondary" style={{ padding: "8px 10px", fontSize: 12 }} onClick={() => setResultRows((r) => r.filter((_, i) => i !== idx))}>✕</button>
                          </div>
                        ))}
                      </div>
                      <div className={s.editActions} style={{ marginTop: 12 }}>
                        <button className="btn-secondary" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => setResultRows((r) => [...r, { rank: String(r.length + 1), userName: "", score: "", notes: "" }])}>+ 행 추가</button>
                        <button className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }} onClick={() => saveResultsMutation.mutate()} disabled={saveResultsMutation.isPending}>
                          {saveResultsMutation.isPending ? "저장 중..." : "결과 저장"}
                        </button>
                      </div>
                    </div>
                  )}
                  {editingId === comp.id && (
                    <div className={s.editForm}>
                      <div className={s.editRow}>
                        <div className={s.field}>
                          <label className={s.label}>대회명</label>
                          <input type="text" className="input-field" value={editForm.name} onChange={(e) => setEdit("name", e.target.value)} />
                        </div>
                        <div className={s.field}>
                          <label className={s.label}>주최</label>
                          <input type="text" className="input-field" value={editForm.organizer} onChange={(e) => setEdit("organizer", e.target.value)} />
                        </div>
                      </div>
                      <div className={s.editRow}>
                        <div className={s.field}>
                          <label className={s.label}>시작일</label>
                          <input type="date" className="input-field" value={editForm.startDate} onChange={(e) => setEdit("startDate", e.target.value)} />
                        </div>
                        <div className={s.field}>
                          <label className={s.label}>종료일</label>
                          <input type="date" className="input-field" value={editForm.endDate} onChange={(e) => setEdit("endDate", e.target.value)} />
                        </div>
                        <div className={s.field}>
                          <label className={s.label}>도시</label>
                          <input type="text" className="input-field" value={editForm.city} onChange={(e) => setEdit("city", e.target.value)} />
                        </div>
                      </div>
                      <div className={s.editRow}>
                        <div className={s.field}>
                          <label className={s.label}>장소</label>
                          <input type="text" className="input-field" value={editForm.location} onChange={(e) => setEdit("location", e.target.value)} />
                        </div>
                        <div className={s.field}>
                          <label className={s.label}>접수 마감일</label>
                          <input type="date" className="input-field" value={editForm.registrationDeadline} onChange={(e) => setEdit("registrationDeadline", e.target.value)} />
                        </div>
                        <div className={s.field}>
                          <label className={s.label}>접수 URL</label>
                          <input type="url" className="input-field" value={editForm.registrationUrl} onChange={(e) => setEdit("registrationUrl", e.target.value)} />
                        </div>
                      </div>
                      <div className={s.editRow}>
                        <div className={s.field}>
                          <label className={s.label}>참가비</label>
                          <input type="number" className="input-field" value={editForm.entryFee} onChange={(e) => setEdit("entryFee", e.target.value)} />
                        </div>
                        <div className={s.field}>
                          <label className={s.label}>최대 인원</label>
                          <input type="number" className="input-field" value={editForm.maxParticipants} onChange={(e) => setEdit("maxParticipants", e.target.value)} />
                        </div>
                        <div className={s.field}>
                          <label className={s.label}>레벨</label>
                          <select className={s.select} value={editForm.level} onChange={(e) => setEdit("level", e.target.value)}>
                            {LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
                          </select>
                        </div>
                      </div>
                      <textarea className={s.textarea} placeholder="설명" value={editForm.description} onChange={(e) => setEdit("description", e.target.value)} />
                      <div className={s.editActions}>
                        <button className="btn-secondary" style={{ padding: "8px 16px", fontSize: 13 }} onClick={() => setEditingId(null)}>취소</button>
                        <button className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }} disabled={updateMutation.isPending} onClick={() => updateMutation.mutate()}>
                          {updateMutation.isPending ? "저장 중..." : "저장"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className={s.empty}>등록된 대회가 없습니다</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
