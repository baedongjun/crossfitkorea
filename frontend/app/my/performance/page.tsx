"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { performanceApi } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import s from "./performance.module.css";

const EXERCISE_LABELS: Record<string, string> = {
  BACK_SQUAT: "백스쿼트",
  FRONT_SQUAT: "프론트스쿼트",
  DEADLIFT: "데드리프트",
  CLEAN: "클린",
  SNATCH: "스내치",
  CLEAN_AND_JERK: "클린앤저크",
  OVERHEAD_SQUAT: "오버헤드스쿼트",
  PRESS: "프레스",
  PUSH_PRESS: "푸시프레스",
  PUSH_JERK: "푸시저크",
  BENCH_PRESS: "벤치프레스",
  PULL_UP: "풀업",
  MUSCLE_UP: "머슬업",
  BODYWEIGHT: "체중",
  BODY_FAT: "체지방률",
  HEIGHT: "키",
  CUSTOM: "기타",
};

const ALL_TYPES = Object.keys(EXERCISE_LABELS);
const PR_SPOTLIGHT = ["BACK_SQUAT", "DEADLIFT", "CLEAN", "SNATCH"];

interface PersonalRecord {
  id: number;
  exerciseType: string;
  value: number;
  unit: string;
  notes?: string;
  recordedAt: string;
}

interface PrMap {
  [key: string]: PersonalRecord;
}

function LineChart({ records }: { records: PersonalRecord[] }) {
  const sorted = useMemo(
    () => [...records].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)),
    [records]
  );

  if (sorted.length < 2) {
    return (
      <div className={s.noData}>
        그래프를 표시하려면 기록이 2개 이상 필요합니다
      </div>
    );
  }

  const values = sorted.map((r) => r.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const W = 800;
  const H = 100;
  const PAD_X = 10;
  const PAD_Y = 10;

  const points = sorted.map((r, i) => {
    const x = PAD_X + (i / (sorted.length - 1)) * (W - PAD_X * 2);
    const y = PAD_Y + (1 - (r.value - minVal) / range) * (H - PAD_Y * 2);
    return { x, y, value: r.value, date: r.recordedAt };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H + 20}`}
      className={s.chartArea}
      preserveAspectRatio="none"
    >
      {/* Y axis labels */}
      <text x={0} y={PAD_Y + 4} className={s.chartAxisLabel}>
        {maxVal}
      </text>
      <text x={0} y={H - PAD_Y + 4} className={s.chartAxisLabel}>
        {minVal}
      </text>

      {/* Line */}
      <polyline
        points={polyline}
        stroke="#e8220a"
        strokeWidth="2"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3" fill="#e8220a" />
          {i === points.length - 1 && (
            <text
              x={p.x}
              y={p.y - 6}
              textAnchor="middle"
              className={s.chartAxisLabel}
              fontSize="9"
              fill="#e8220a"
            >
              {p.value}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

export default function PerformancePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedType, setSelectedType] = useState("BACK_SQUAT");
  const [valueInput, setValueInput] = useState("");
  const [dateInput, setDateInput] = useState(dayjs().format("YYYY-MM-DD"));
  const [notesInput, setNotesInput] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  const { data: prsData } = useQuery({
    queryKey: ["performance", "prs"],
    queryFn: async () => (await performanceApi.getPRs()).data.data as PrMap,
    enabled: isLoggedIn(),
  });

  const { data: typeRecords, isLoading: typeLoading } = useQuery({
    queryKey: ["performance", "type", selectedType],
    queryFn: async () =>
      (await performanceApi.getByType(selectedType)).data.data as PersonalRecord[],
    enabled: isLoggedIn(),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      performanceApi.save({
        exerciseType: selectedType,
        value: parseFloat(valueInput),
        notes: notesInput || undefined,
        recordedAt: dateInput || undefined,
      }),
    onSuccess: () => {
      toast.success("기록이 저장되었습니다.");
      setValueInput("");
      setNotesInput("");
      setDateInput(dayjs().format("YYYY-MM-DD"));
      queryClient.invalidateQueries({ queryKey: ["performance"] });
    },
    onError: () => toast.error("저장에 실패했습니다."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, value, notes }: { id: number; value: number; notes?: string }) =>
      performanceApi.update(id, { value, notes }),
    onSuccess: () => {
      toast.success("수정되었습니다.");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["performance"] });
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => performanceApi.delete(id),
    onSuccess: () => {
      toast.success("삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["performance"] });
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const handleStartEdit = (record: PersonalRecord) => {
    setEditingId(record.id);
    setEditValue(String(record.value));
    setEditNotes(record.notes || "");
  };

  const handleConfirmEdit = () => {
    if (!editingId) return;
    const v = parseFloat(editValue);
    if (isNaN(v) || v <= 0) { toast.error("유효한 값을 입력해주세요."); return; }
    updateMutation.mutate({ id: editingId, value: v, notes: editNotes || undefined });
  };

  if (!isLoggedIn()) return null;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.headerInner}>
          <p className={s.title}>PERFORMANCE</p>
          <p className={s.subtitle}>개인 기록 트래킹 — 체중, 1RM, 체성분을 날짜별로 관리하세요</p>
        </div>
      </div>

      <div className={s.content}>
        {/* PR 스포트라이트 */}
        <div className={s.prSection}>
          <p className={s.sectionTitle}>주요 종목 최고 기록 (PR)</p>
          <div className={s.prGrid}>
            {PR_SPOTLIGHT.map((type) => {
              const pr = prsData?.[type];
              return pr ? (
                <div key={type} className={s.prCard}>
                  <p className={s.prLabel}>{EXERCISE_LABELS[type]}</p>
                  <p className={s.prValue}>
                    {pr.value}
                    <span style={{ fontSize: 16, fontFamily: "Noto Sans KR", marginLeft: 4 }}>
                      {pr.unit}
                    </span>
                  </p>
                  <p className={s.prDate}>{dayjs(pr.recordedAt).format("YYYY.MM.DD")}</p>
                </div>
              ) : (
                <div key={type} className={s.prCardEmpty}>
                  <p className={s.prLabel}>{EXERCISE_LABELS[type]}</p>
                  <p className={s.prValueEmpty}>—</p>
                  <p className={s.prDate}>기록 없음</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 종목 선택 + 기록 추가 폼 */}
        <div className={s.inputSection}>
          <p className={s.sectionTitle} style={{ marginBottom: 20 }}>기록 추가</p>
          <div className={s.inputRow}>
            <div className={s.field}>
              <label className={s.label}>종목</label>
              <select
                className={s.select}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {ALL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EXERCISE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className={s.field}>
              <label className={s.label}>값</label>
              <input
                type="number"
                className="input-field"
                placeholder="ex) 100"
                value={valueInput}
                onChange={(e) => setValueInput(e.target.value)}
                step="0.5"
                min="0"
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>메모</label>
              <input
                type="text"
                className="input-field"
                placeholder="선택 사항"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
              />
            </div>
            <div className={s.field}>
              <label className={s.label}>날짜</label>
              <input
                type="date"
                className="input-field"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
              />
            </div>
            <button
              className="btn-primary"
              style={{ padding: "10px 24px", alignSelf: "flex-end" }}
              disabled={saveMutation.isPending || !valueInput || isNaN(parseFloat(valueInput)) || parseFloat(valueInput) <= 0}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>

        {/* 선택 종목 기록 그래프 + 목록 */}
        <div className={s.recordSection}>
          <p className={s.sectionTitle}>
            {EXERCISE_LABELS[selectedType]} 기록 히스토리
          </p>

          {/* 꺾은선 그래프 */}
          {typeRecords && typeRecords.length >= 2 && (
            <div className={s.chartWrap}>
              <p className={s.chartTitle}>추이 그래프</p>
              <LineChart records={typeRecords} />
            </div>
          )}

          {/* 기록 목록 */}
          {typeLoading ? (
            <div className={s.empty}>로딩 중...</div>
          ) : !typeRecords || typeRecords.length === 0 ? (
            <div className={s.empty}>아직 {EXERCISE_LABELS[selectedType]} 기록이 없습니다</div>
          ) : (
            <div className={s.recordList}>
              {typeRecords.map((record) => (
                <div key={record.id} className={s.recordItem}>
                  <span className={s.recordDate}>
                    {dayjs(record.recordedAt).format("YYYY.MM.DD")}
                  </span>

                  {editingId === record.id ? (
                    <div className={s.editForm}>
                      <input
                        type="number"
                        className={s.editInput}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        step="0.5"
                        min="0"
                      />
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>{record.unit}</span>
                      <input
                        type="text"
                        className={s.editNotesInput}
                        placeholder="메모"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                      />
                      <button
                        className={s.iconBtn}
                        onClick={handleConfirmEdit}
                        disabled={updateMutation.isPending}
                        title="저장"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </button>
                      <button
                        className={s.iconBtn}
                        onClick={() => setEditingId(null)}
                        title="취소"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className={s.recordValue}>
                        {record.value}
                        <span style={{ fontSize: 14, fontFamily: "Noto Sans KR", marginLeft: 4 }}>
                          {record.unit}
                        </span>
                      </span>
                      <span className={s.recordNotes}>{record.notes || ""}</span>
                      <div className={s.recordActions}>
                        <button
                          className={s.iconBtn}
                          onClick={() => handleStartEdit(record)}
                          title="수정"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          className={`${s.iconBtn} ${s.danger}`}
                          onClick={() => {
                            if (confirm("이 기록을 삭제하시겠습니까?")) deleteMutation.mutate(record.id);
                          }}
                          disabled={deleteMutation.isPending}
                          title="삭제"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
