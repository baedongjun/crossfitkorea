"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { boxApi, wodApi, membershipApi, adminApi, checkInApi, reservationApi } from "@/lib/api";
import { isLoggedIn, getUser } from "@/lib/auth";
import { Box, Review } from "@/types";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import s from "./box.module.css";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_KOR: Record<string, string> = { MONDAY: "월", TUESDAY: "화", WEDNESDAY: "수", THURSDAY: "목", FRIDAY: "금", SATURDAY: "토", SUNDAY: "일" };

const WOD_TYPES = ["AMRAP", "FOR_TIME", "EMOM", "TABATA", "STRENGTH", "SKILL", "REST_DAY", "CUSTOM"];
const WOD_COLORS: Record<string, string> = {
  AMRAP: "#e8220a", FOR_TIME: "#ff6b1a", EMOM: "#22c55e",
  TABATA: "#3b82f6", STRENGTH: "#a855f7", SKILL: "#eab308",
  REST_DAY: "#888", CUSTOM: "#888",
};

const BOX_TABS = ["관리", "WOD 프로그래밍", "멤버 통계", "출석 관리", "예약 현황"] as const;
type BoxTab = typeof BOX_TABS[number];

interface WodEntry {
  id: number;
  title: string;
  type: string;
  content: string;
  wodDate: string;
  scoreType: string;
}

interface MemberEntry { id: number; userId?: number; boxId: number; boxName: string; joinedAt: string; daysInBox: number; userName?: string; userEmail?: string; }

function MemberStats({ members, onRemove }: { members: MemberEntry[] | undefined; onRemove?: (userId: number, name: string) => void }) {
  const list = members ?? [];
  const now = dayjs();
  const thisMonth = now.format("YYYY-MM");
  const lastMonth = now.subtract(1, "month").format("YYYY-MM");

  const joinedThisMonth = list.filter((m) => dayjs(m.joinedAt).format("YYYY-MM") === thisMonth).length;
  const joinedLastMonth = list.filter((m) => dayjs(m.joinedAt).format("YYYY-MM") === lastMonth).length;
  const veterans = list.filter((m) => m.daysInBox >= 180).length;
  const newbies = list.filter((m) => m.daysInBox < 30).length;

  // Group by month joined (last 6 months)
  const monthGroups: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = now.subtract(i, "month");
    monthGroups.push({
      label: m.format("M월"),
      count: list.filter((mem) => dayjs(mem.joinedAt).format("YYYY-MM") === m.format("YYYY-MM")).length,
    });
  }
  const maxCount = Math.max(...monthGroups.map((g) => g.count), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "전체 멤버", value: list.length, unit: "명" },
          { label: "이번 달 신규", value: joinedThisMonth, unit: "명" },
          { label: "6개월+ 장기 멤버", value: veterans, unit: "명" },
          { label: "신규 (30일 이내)", value: newbies, unit: "명" },
        ].map(({ label, value, unit }) => (
          <div key={label} style={{ background: "var(--bg-card-2)", border: "1px solid var(--border)", padding: "16px 20px" }}>
            <p style={{ fontSize: 11, color: "var(--muted)", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>{label}</p>
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: "var(--red)", lineHeight: 1 }}>{value}<span style={{ fontSize: 14, color: "var(--muted)", marginLeft: 4 }}>{unit}</span></p>
          </div>
        ))}
      </div>

      {/* Monthly join chart */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "var(--red)", marginBottom: 20, textTransform: "uppercase" }}>월별 신규 가입</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120 }}>
          {monthGroups.map(({ label, count }) => (
            <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text)", fontFamily: "'Bebas Neue', sans-serif" }}>{count}</span>
              <div style={{ width: "100%", background: "var(--red)", height: `${Math.max((count / maxCount) * 90, count > 0 ? 4 : 0)}px`, transition: "height 0.3s" }} />
              <span style={{ fontSize: 11, color: "var(--muted)" }}>{label}</span>
            </div>
          ))}
        </div>
        {joinedLastMonth > 0 && (
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 16 }}>
            지난 달 대비: {joinedThisMonth >= joinedLastMonth ? "+" : ""}{joinedThisMonth - joinedLastMonth}명 ({joinedLastMonth > 0 ? Math.round(((joinedThisMonth - joinedLastMonth) / joinedLastMonth) * 100) : 0}%)
          </p>
        )}
      </div>

      {/* Full member list */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "var(--red)", marginBottom: 16, textTransform: "uppercase" }}>멤버 목록 ({list.length})</p>
        {list.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>등록된 멤버가 없습니다.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {list.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, background: "var(--bg-card-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>👤</div>
                  <div>
                    <p style={{ fontSize: 13, color: "var(--text)" }}>{m.userName || m.userEmail || `멤버 #${m.id}`}</p>
                    <p style={{ fontSize: 11, color: "var(--muted)" }}>가입: {dayjs(m.joinedAt).format("YYYY.MM.DD")}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{m.daysInBox}일째</span>
                  {onRemove && m.userId && (
                    <button
                      style={{ background: "transparent", border: "1px solid rgba(232,34,10,0.3)", color: "var(--red)", padding: "3px 8px", fontSize: 11, cursor: "pointer" }}
                      onClick={() => onRemove(m.userId!, m.userName || `멤버 #${m.id}`)}
                    >
                      내보내기
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyBoxPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = getUser();

  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [activeBoxTab, setActiveBoxTab] = useState<BoxTab>("관리");
  const [wodForm, setWodForm] = useState({ title: "", type: "AMRAP", content: "", scoreType: "TIME", wodDate: dayjs().format("YYYY-MM-DD") });
  const [showWodForm, setShowWodForm] = useState(false);

  // WOD Programming state
  const [calendarMonth, setCalendarMonth] = useState(dayjs().startOf("month"));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [progWodForm, setProgWodForm] = useState({ title: "", type: "AMRAP", content: "", scoreType: "TIME" });
  const [showProgForm, setShowProgForm] = useState(false);
  const [editingWodId, setEditingWodId] = useState<number | null>(null);

  // Coach management
  const [showCoachForm, setShowCoachForm] = useState(false);
  const [coachForm, setCoachForm] = useState({ name: "", bio: "", experienceYears: 1, certifications: "" });

  // Schedule management
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ dayOfWeek: "MONDAY", startTime: "06:00", endTime: "07:00", className: "크로스핏", maxCapacity: 15 });

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    if (user?.role !== "ROLE_BOX_OWNER" && user?.role !== "ROLE_ADMIN") {
      toast.error("박스 오너 권한이 필요합니다.");
      router.replace("/my");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: boxPage, isLoading } = useQuery({
    queryKey: ["my-boxes"],
    queryFn: async () => (await boxApi.getMy()).data.data,
    enabled: isLoggedIn(),
  });

  const boxes: Box[] = boxPage?.content || [];

  const selectedBox = boxes.find((b) => b.id === selectedBoxId) || boxes[0] || null;
  const boxId = selectedBox?.id;

  const { data: coaches } = useQuery({
    queryKey: ["coaches", boxId],
    queryFn: async () => (await boxApi.getCoaches(boxId!)).data.data,
    enabled: !!boxId,
  });

  const { data: schedules } = useQuery({
    queryKey: ["schedules", boxId],
    queryFn: async () => (await boxApi.getSchedules(boxId!)).data.data,
    enabled: !!boxId,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ["box-reviews", boxId],
    queryFn: async () => (await boxApi.getReviews(boxId!, 0)).data.data,
    enabled: !!boxId,
  });

  const { data: todayWod } = useQuery({
    queryKey: ["wod-today", boxId],
    queryFn: async () => (await wodApi.getToday(boxId!)).data.data,
    enabled: !!boxId,
  });

  const { data: members } = useQuery({
    queryKey: ["box-members", boxId],
    queryFn: async () => (await membershipApi.getBoxMembers(boxId!)).data.data as MemberEntry[],
    enabled: !!boxId,
  });

  const { data: checkInsData } = useQuery({
    queryKey: ["box-checkins", boxId],
    queryFn: async () => (await checkInApi.getBoxCheckIns(boxId!)).data.data,
    enabled: !!boxId && activeBoxTab === "출석 관리",
  });
  const checkIns: Array<{ id: number; userId: number; userName: string; checkedInAt: string }> =
    checkInsData?.content ?? [];

  const { data: checkInStats } = useQuery({
    queryKey: ["box-checkins-stats", boxId],
    queryFn: async () => (await checkInApi.getBoxCheckInStats(boxId!)).data.data as { today: number; thisWeek: number; thisMonth: number; total: number },
    enabled: !!boxId && activeBoxTab === "출석 관리",
  });

  const { data: boxReservations } = useQuery({
    queryKey: ["box-reservations", boxId],
    queryFn: async () => (await reservationApi.getBoxReservations(boxId!)).data.data as Array<{ id: number; userId: number; userName: string; scheduleId: number; className: string; startTime: string; classDate: string }>,
    enabled: !!boxId && activeBoxTab === "예약 현황",
  });

  // WOD Programming: load WODs for current calendar month
  const monthStart = calendarMonth.format("YYYY-MM-DD");
  const monthEnd = calendarMonth.endOf("month").format("YYYY-MM-DD");

  const { data: monthWods } = useQuery({
    queryKey: ["wod-range", boxId, monthStart, monthEnd],
    queryFn: async () => (await wodApi.getRange(boxId!, monthStart, monthEnd)).data.data as WodEntry[],
    enabled: !!boxId && activeBoxTab === "WOD 프로그래밍",
  });

  // Build a map: date string -> WodEntry
  const wodByDate: Record<string, WodEntry> = {};
  (monthWods || []).forEach((w) => {
    wodByDate[w.wodDate] = w;
  });

  const selectedDateWod = selectedDate ? wodByDate[selectedDate] : null;

  const wodMutation = useMutation({
    mutationFn: () =>
      wodApi.createBoxWod(boxId!, wodForm),
    onSuccess: () => {
      toast.success("WOD가 등록되었습니다.");
      setShowWodForm(false);
      setWodForm({ title: "", type: "AMRAP", content: "", scoreType: "TIME", wodDate: dayjs().format("YYYY-MM-DD") });
      queryClient.invalidateQueries({ queryKey: ["wod-today", boxId] });
    },
    onError: () => toast.error("WOD 등록에 실패했습니다."),
  });

  const progWodMutation = useMutation({
    mutationFn: () =>
      wodApi.createBoxWod(boxId!, { ...progWodForm, wodDate: selectedDate }),
    onSuccess: () => {
      toast.success("WOD가 등록되었습니다.");
      setShowProgForm(false);
      setProgWodForm({ title: "", type: "AMRAP", content: "", scoreType: "TIME" });
      queryClient.invalidateQueries({ queryKey: ["wod-range", boxId, monthStart, monthEnd] });
    },
    onError: () => toast.error("WOD 등록에 실패했습니다."),
  });

  const updateWodMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) => adminApi.updateWod(id, data),
    onSuccess: () => {
      toast.success("WOD가 수정되었습니다.");
      setEditingWodId(null);
      queryClient.invalidateQueries({ queryKey: ["wod-range", boxId, monthStart, monthEnd] });
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const deleteWodMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteWod(id),
    onSuccess: () => {
      toast.success("WOD가 삭제되었습니다.");
      setSelectedDate(null);
      queryClient.invalidateQueries({ queryKey: ["wod-range", boxId, monthStart, monthEnd] });
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const addCoachMutation = useMutation({
    mutationFn: () => boxApi.addCoach(boxId!, {
      name: coachForm.name,
      bio: coachForm.bio || undefined,
      experienceYears: coachForm.experienceYears,
      certifications: coachForm.certifications ? coachForm.certifications.split(",").map(s => s.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => {
      toast.success("코치가 등록되었습니다.");
      setShowCoachForm(false);
      setCoachForm({ name: "", bio: "", experienceYears: 1, certifications: "" });
      queryClient.invalidateQueries({ queryKey: ["coaches", boxId] });
    },
    onError: () => toast.error("코치 등록에 실패했습니다."),
  });

  const deleteCoachMutation = useMutation({
    mutationFn: (coachId: number) => boxApi.deleteCoach(coachId),
    onSuccess: () => {
      toast.success("코치가 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["coaches", boxId] });
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const addScheduleMutation = useMutation({
    mutationFn: () => boxApi.addSchedule(boxId!, scheduleForm),
    onSuccess: () => {
      toast.success("수업이 등록되었습니다.");
      setShowScheduleForm(false);
      setScheduleForm({ dayOfWeek: "MONDAY", startTime: "06:00", endTime: "07:00", className: "크로스핏", maxCapacity: 15 });
      queryClient.invalidateQueries({ queryKey: ["schedules", boxId] });
    },
    onError: () => toast.error("수업 등록에 실패했습니다."),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (scheduleId: number) => boxApi.deleteSchedule(scheduleId),
    onSuccess: () => {
      toast.success("수업이 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["schedules", boxId] });
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ userId }: { userId: number }) => membershipApi.removeMember(boxId!, userId),
    onSuccess: () => {
      toast.success("멤버가 내보내졌습니다.");
      queryClient.invalidateQueries({ queryKey: ["box-members", boxId] });
    },
    onError: () => toast.error("처리에 실패했습니다."),
  });

  // Calendar helpers
  const daysInMonth = calendarMonth.daysInMonth();
  const startDayOfWeek = calendarMonth.startOf("month").day(); // 0=Sun
  const today = dayjs().format("YYYY-MM-DD");

  const calendarDays: (string | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(calendarMonth.date(d).format("YYYY-MM-DD"));
  }

  if (!isLoggedIn()) return null;

  return (
    <div className={s.page}>
      <div className={s.inner}>
        {/* 헤더 */}
        <div className={s.pageHeader}>
          <div>
            <p className={s.tag}>BOX OWNER</p>
            <h1 className={s.title}>내 박스 관리</h1>
          </div>
          <Link href="/boxes/create" className="btn-primary">+ 박스 등록</Link>
        </div>

        {isLoading ? (
          <div className={s.loading}>로딩 중...</div>
        ) : boxes.length === 0 ? (
          <div className={s.emptyState}>
            <p className={s.emptyTitle}>등록된 박스가 없습니다</p>
            <p className={s.emptyDesc}>새로 박스를 등록하거나, 기존 박스의 소유권을 신청하세요.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
              <Link href="/boxes/create" className="btn-primary" style={{ display: "inline-block" }}>
                새 박스 등록하기
              </Link>
              <Link href="/my/claim-box" className="btn-secondary" style={{ display: "inline-block" }}>
                기존 박스 소유권 신청
              </Link>
            </div>
          </div>
        ) : (
          <div className={s.layout}>
            {/* 박스 목록 사이드바 */}
            <div className={s.sidebar}>
              <p className={s.sidebarTitle}>내 박스</p>
              {boxes.map((box) => (
                <button
                  key={box.id}
                  onClick={() => setSelectedBoxId(box.id)}
                  className={`${s.boxTab} ${(selectedBoxId ?? boxes[0]?.id) === box.id ? s.boxTabActive : ""}`}
                >
                  <span className={s.boxTabName}>{box.name}</span>
                  <div className={s.boxTabMeta}>
                    {box.verified && <span className="badge badge-approved">인증</span>}
                    {box.premium && <span className="badge badge-premium">프리미엄</span>}
                    {!box.verified && <span className="badge badge-pending">검토중</span>}
                  </div>
                </button>
              ))}
            </div>

            {/* 박스 상세 관리 */}
            {selectedBox && (
              <div className={s.main}>
                {/* 박스 정보 카드 */}
                <div className={s.card}>
                  <div className={s.cardHeader}>
                    <div>
                      <h2 className={s.boxName}>{selectedBox.name}</h2>
                      <p className={s.boxAddr}>{selectedBox.address}</p>
                    </div>
                    <Link href={`/boxes/${selectedBox.id}/edit`} className="btn-secondary" style={{ padding: "10px 20px", fontSize: 13 }}>
                      정보 수정
                    </Link>
                  </div>
                  <div className={s.boxStats}>
                    <div className={s.boxStat}>
                      <p className={s.boxStatNum}>{selectedBox.rating?.toFixed(1) || "—"}</p>
                      <p className={s.boxStatLabel}>평점</p>
                    </div>
                    <div className={s.boxStat}>
                      <p className={s.boxStatNum}>{selectedBox.reviewCount || 0}</p>
                      <p className={s.boxStatLabel}>리뷰</p>
                    </div>
                    <div className={s.boxStat}>
                      <p className={s.boxStatNum}>{coaches?.length || 0}</p>
                      <p className={s.boxStatLabel}>코치</p>
                    </div>
                    <div className={s.boxStat}>
                      <p className={s.boxStatNum}>{schedules?.length || 0}</p>
                      <p className={s.boxStatLabel}>수업</p>
                    </div>
                  </div>
                  <div className={s.boxActions}>
                    <Link href={`/boxes/${selectedBox.id}`} className="btn-secondary" style={{ padding: "10px 20px", fontSize: 13 }}>
                      박스 페이지 보기
                    </Link>
                  </div>
                </div>

                {/* 탭 */}
                <div className={s.boxTabNav}>
                  {BOX_TABS.map((t) => (
                    <button
                      key={t}
                      className={`${s.boxTabBtn} ${activeBoxTab === t ? s.boxTabBtnActive : ""}`}
                      onClick={() => setActiveBoxTab(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* 관리 탭 */}
                {activeBoxTab === "관리" && (
                  <>
                    {/* 오늘의 WOD */}
                    <div className={s.card}>
                      <div className={s.cardHeader}>
                        <h3 className={s.cardTitle}>오늘의 WOD</h3>
                        <button
                          className="btn-primary"
                          style={{ padding: "8px 16px", fontSize: 13 }}
                          onClick={() => setShowWodForm(!showWodForm)}
                        >
                          {showWodForm ? "취소" : "WOD 등록"}
                        </button>
                      </div>

                      {showWodForm && (
                        <div className={s.wodForm}>
                          <div className={s.wodFormGrid}>
                            <div className={s.field}>
                              <label className={s.label}>날짜</label>
                              <input
                                type="date"
                                className="input-field"
                                value={wodForm.wodDate}
                                onChange={(e) => setWodForm((f) => ({ ...f, wodDate: e.target.value }))}
                              />
                            </div>
                            <div className={s.field}>
                              <label className={s.label}>WOD 타입</label>
                              <select
                                className={s.select}
                                value={wodForm.type}
                                onChange={(e) => setWodForm((f) => ({ ...f, type: e.target.value }))}
                              >
                                {WOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div className={s.field}>
                              <label className={s.label}>WOD 제목</label>
                              <input
                                className="input-field"
                                placeholder="오늘의 WOD 제목"
                                value={wodForm.title}
                                onChange={(e) => setWodForm((f) => ({ ...f, title: e.target.value }))}
                              />
                            </div>
                            <div className={s.field}>
                              <label className={s.label}>점수 유형</label>
                              <select
                                className={s.select}
                                value={wodForm.scoreType}
                                onChange={(e) => setWodForm((f) => ({ ...f, scoreType: e.target.value }))}
                              >
                                <option value="TIME">TIME</option>
                                <option value="ROUNDS">ROUNDS</option>
                                <option value="REPS">REPS</option>
                                <option value="WEIGHT">WEIGHT</option>
                              </select>
                            </div>
                          </div>
                          <div className={s.field}>
                            <label className={s.label}>WOD 내용</label>
                            <textarea
                              className={s.textarea}
                              placeholder="WOD 내용을 입력하세요"
                              value={wodForm.content}
                              onChange={(e) => setWodForm((f) => ({ ...f, content: e.target.value }))}
                            />
                          </div>
                          <button
                            className="btn-primary"
                            disabled={wodMutation.isPending || !wodForm.title || !wodForm.content}
                            onClick={() => wodMutation.mutate()}
                          >
                            {wodMutation.isPending ? "등록 중..." : "WOD 등록"}
                          </button>
                        </div>
                      )}

                      {todayWod ? (
                        <div className={s.wodCard}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <span className={s.wodTypeBadge} style={{ background: WOD_COLORS[todayWod.type] + "22", color: WOD_COLORS[todayWod.type], border: `1px solid ${WOD_COLORS[todayWod.type]}44` }}>
                              {todayWod.type}
                            </span>
                            <span className={s.wodDate}>{dayjs(todayWod.wodDate).format("YYYY.MM.DD")}</span>
                          </div>
                          <p className={s.wodTitle}>{todayWod.title}</p>
                          <p className={s.wodContent}>{todayWod.content}</p>
                        </div>
                      ) : (
                        <p className={s.emptyText}>오늘 등록된 WOD가 없습니다.</p>
                      )}
                    </div>

                    {/* 코치 관리 */}
                    <div className={s.card}>
                      <div className={s.cardHeader}>
                        <h3 className={s.cardTitle}>코치진 ({coaches?.length || 0})</h3>
                        <button
                          className="btn-primary"
                          style={{ padding: "8px 16px", fontSize: 13 }}
                          onClick={() => setShowCoachForm(!showCoachForm)}
                        >
                          {showCoachForm ? "취소" : "+ 코치 추가"}
                        </button>
                      </div>

                      {showCoachForm && (
                        <div className={s.manageForm}>
                          <div className={s.manageFormGrid}>
                            <div className={s.field}>
                              <label className={s.label}>이름 *</label>
                              <input className="input-field" placeholder="코치 이름" value={coachForm.name} onChange={(e) => setCoachForm(f => ({ ...f, name: e.target.value }))} />
                            </div>
                            <div className={s.field}>
                              <label className={s.label}>경력 (년)</label>
                              <input type="number" className="input-field" min={0} value={coachForm.experienceYears} onChange={(e) => setCoachForm(f => ({ ...f, experienceYears: Number(e.target.value) }))} />
                            </div>
                          </div>
                          <div className={s.field}>
                            <label className={s.label}>소개</label>
                            <input className="input-field" placeholder="간단한 소개" value={coachForm.bio} onChange={(e) => setCoachForm(f => ({ ...f, bio: e.target.value }))} />
                          </div>
                          <div className={s.field}>
                            <label className={s.label}>자격증 (쉼표로 구분)</label>
                            <input className="input-field" placeholder="CrossFit L1, CrossFit L2" value={coachForm.certifications} onChange={(e) => setCoachForm(f => ({ ...f, certifications: e.target.value }))} />
                          </div>
                          <button className="btn-primary" style={{ padding: "10px 24px" }} disabled={!coachForm.name.trim() || addCoachMutation.isPending} onClick={() => addCoachMutation.mutate()}>
                            {addCoachMutation.isPending ? "등록 중..." : "코치 등록"}
                          </button>
                        </div>
                      )}

                      {coaches?.length > 0 ? (
                        <div className={s.coachList}>
                          {coaches.map((c: { id: number; name: string; imageUrl: string | null; experienceYears: number; bio?: string }) => (
                            <div key={c.id} className={s.coachItemRow}>
                              <div className={s.coachAvatar} style={{ position: "relative" }}>
                                {c.imageUrl ? <Image src={c.imageUrl} alt="" fill style={{ objectFit: "cover" }} /> : c.name[0]}
                              </div>
                              <div style={{ flex: 1 }}>
                                <p className={s.coachName}>{c.name}</p>
                                <p className={s.coachExp}>경력 {c.experienceYears}년{c.bio ? ` · ${c.bio}` : ""}</p>
                              </div>
                              <button className={s.deleteRowBtn} onClick={() => { if (confirm(`'${c.name}' 코치를 삭제하시겠습니까?`)) deleteCoachMutation.mutate(c.id); }} disabled={deleteCoachMutation.isPending}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={s.emptyText}>등록된 코치가 없습니다. 코치를 추가해보세요!</p>
                      )}
                    </div>

                    {/* 리뷰 통계 */}
                    <div className={s.card}>
                      <div className={s.cardHeader}>
                        <h3 className={s.cardTitle}>리뷰 통계</h3>
                        <div className={s.reviewAvg}>
                          <span className={s.reviewAvgNum}>{selectedBox.rating?.toFixed(1) || "—"}</span>
                          <span className={s.reviewAvgStar}>★</span>
                          <span className={s.reviewAvgCount}>({selectedBox.reviewCount || 0})</span>
                        </div>
                      </div>
                      {(() => {
                        const reviews: Review[] = reviewsData?.content || [];
                        const dist = [5, 4, 3, 2, 1].map((star) => ({
                          star,
                          count: reviews.filter((r) => Math.round(r.rating) === star).length,
                        }));
                        const max = Math.max(...dist.map((d) => d.count), 1);
                        return (
                          <>
                            <div className={s.ratingDist}>
                              {dist.map(({ star, count }) => (
                                <div key={star} className={s.ratingRow}>
                                  <span className={s.ratingStar}>{star}★</span>
                                  <div className={s.ratingBar}>
                                    <div className={s.ratingBarFill} style={{ width: `${(count / max) * 100}%` }} />
                                  </div>
                                  <span className={s.ratingCount}>{count}</span>
                                </div>
                              ))}
                            </div>
                            {reviews.length > 0 && (
                              <div className={s.recentReviews}>
                                <p className={s.recentReviewsTitle}>최근 리뷰</p>
                                {reviews.slice(0, 3).map((r) => (
                                  <div key={r.id} className={s.reviewItem}>
                                    <div className={s.reviewTop}>
                                      <span className={s.reviewUser}>{r.userName}</span>
                                      <span className={s.reviewRating}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                                    </div>
                                    <p className={s.reviewContent}>{r.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {reviews.length === 0 && <p className={s.emptyText}>아직 리뷰가 없습니다.</p>}
                          </>
                        );
                      })()}
                    </div>

                    {/* 멤버 목록 */}
                    <div className={s.card}>
                      <div className={s.cardHeader}>
                        <h3 className={s.cardTitle}>박스 멤버 ({members?.length || 0})</h3>
                      </div>
                      {members && members.length > 0 ? (
                        <div className={s.coachList}>
                          {members.slice(0, 10).map((m: { id: number; boxId: number; boxName: string; joinedAt: string; daysInBox: number }) => (
                            <div key={m.id} className={s.coachItem}>
                              <div className={s.coachAvatar} style={{ fontSize: 12, background: "var(--bg-card-2)" }}>
                                👤
                              </div>
                              <div>
                                <p className={s.coachName}>{dayjs(m.joinedAt).format("YYYY.MM.DD")} 가입</p>
                                <p className={s.coachExp}>{m.daysInBox}일째 멤버</p>
                              </div>
                            </div>
                          ))}
                          {members.length > 10 && (
                            <p className={s.moreText}>+{members.length - 10}명 더</p>
                          )}
                        </div>
                      ) : (
                        <p className={s.emptyText}>아직 가입한 멤버가 없습니다.</p>
                      )}
                    </div>

                    {/* 수업 시간표 관리 */}
                    <div className={s.card}>
                      <div className={s.cardHeader}>
                        <h3 className={s.cardTitle}>수업 시간표 ({schedules?.length || 0})</h3>
                        <button
                          className="btn-primary"
                          style={{ padding: "8px 16px", fontSize: 13 }}
                          onClick={() => setShowScheduleForm(!showScheduleForm)}
                        >
                          {showScheduleForm ? "취소" : "+ 수업 추가"}
                        </button>
                      </div>

                      {showScheduleForm && (
                        <div className={s.manageForm}>
                          <div className={s.manageFormGrid}>
                            <div className={s.field}>
                              <label className={s.label}>요일</label>
                              <select className={s.select} value={scheduleForm.dayOfWeek} onChange={(e) => setScheduleForm(f => ({ ...f, dayOfWeek: e.target.value }))}>
                                {DAYS.map(d => <option key={d} value={d}>{DAY_KOR[d]}요일</option>)}
                              </select>
                            </div>
                            <div className={s.field}>
                              <label className={s.label}>수업명</label>
                              <input className="input-field" placeholder="크로스핏" value={scheduleForm.className} onChange={(e) => setScheduleForm(f => ({ ...f, className: e.target.value }))} />
                            </div>
                            <div className={s.field}>
                              <label className={s.label}>시작 시간</label>
                              <input type="time" className="input-field" value={scheduleForm.startTime} onChange={(e) => setScheduleForm(f => ({ ...f, startTime: e.target.value }))} />
                            </div>
                            <div className={s.field}>
                              <label className={s.label}>종료 시간</label>
                              <input type="time" className="input-field" value={scheduleForm.endTime} onChange={(e) => setScheduleForm(f => ({ ...f, endTime: e.target.value }))} />
                            </div>
                            <div className={s.field}>
                              <label className={s.label}>최대 인원</label>
                              <input type="number" className="input-field" min={1} value={scheduleForm.maxCapacity} onChange={(e) => setScheduleForm(f => ({ ...f, maxCapacity: Number(e.target.value) }))} />
                            </div>
                          </div>
                          <button className="btn-primary" style={{ padding: "10px 24px" }} disabled={!scheduleForm.className.trim() || addScheduleMutation.isPending} onClick={() => addScheduleMutation.mutate()}>
                            {addScheduleMutation.isPending ? "등록 중..." : "수업 등록"}
                          </button>
                        </div>
                      )}

                      {schedules?.length > 0 ? (
                        <div className={s.scheduleList}>
                          {schedules.map((sc: { id: number; dayOfWeek?: string; dayOfWeekKorean: string; startTime: string; endTime: string; className: string; maxCapacity: number }) => (
                            <div key={sc.id} className={s.scheduleItemRow}>
                              <span className={s.scheduleDay}>{sc.dayOfWeekKorean || DAY_KOR[sc.dayOfWeek || ""] || sc.dayOfWeek}</span>
                              <span className={s.scheduleTime}>{sc.startTime} – {sc.endTime}</span>
                              <span className={s.scheduleName}>{sc.className}</span>
                              <span className={s.scheduleCap}>최대 {sc.maxCapacity}명</span>
                              <button className={s.deleteRowBtn} onClick={() => { if (confirm("이 수업을 삭제하시겠습니까?")) deleteScheduleMutation.mutate(sc.id); }} disabled={deleteScheduleMutation.isPending}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={s.emptyText}>등록된 수업이 없습니다. 수업을 추가해보세요!</p>
                      )}
                    </div>
                  </>
                )}

                {/* 멤버 통계 탭 */}
                {activeBoxTab === "멤버 통계" && (
                  <MemberStats
                    members={members}
                    onRemove={(userId, name) => {
                      if (window.confirm(`"${name}" 멤버를 내보내시겠습니까?`)) {
                        removeMemberMutation.mutate({ userId });
                      }
                    }}
                  />
                )}

                {/* 출석 관리 탭 */}
                {activeBoxTab === "출석 관리" && (
                  <>
                  {checkInStats && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, marginBottom: 8 }}>
                      {[
                        { label: "오늘", value: checkInStats.today },
                        { label: "이번 주", value: checkInStats.thisWeek },
                        { label: "이번 달", value: checkInStats.thisMonth },
                        { label: "전체", value: checkInStats.total },
                      ].map((stat) => (
                        <div key={stat.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", padding: "16px 12px", textAlign: "center" }}>
                          <p style={{ fontSize: 24, fontFamily: "'Bebas Neue', sans-serif", color: "var(--red)", lineHeight: 1 }}>{stat.value}</p>
                          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={s.card}>
                    <div className={s.cardHeader}>
                      <h3 className={s.cardTitle}>출석 기록</h3>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>총 {checkInsData?.totalElements ?? 0}회</span>
                    </div>
                    {checkIns.length === 0 ? (
                      <p className={s.emptyText}>아직 체크인 기록이 없습니다.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {checkIns.map((c) => (
                          <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 28, height: 28, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                  <polyline points="22 4 12 14.01 9 11.01"/>
                                </svg>
                              </div>
                              <span style={{ fontSize: 13, color: "var(--text)" }}>{c.userName}</span>
                            </div>
                            <span style={{ fontSize: 12, color: "var(--muted)" }}>
                              {dayjs(c.checkedInAt).format("MM.DD HH:mm")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  </>
                )}

                {/* 예약 현황 탭 */}
                {activeBoxTab === "예약 현황" && (
                  <div className={s.card}>
                    <div className={s.cardHeader}>
                      <h3 className={s.cardTitle}>예약 현황</h3>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>오늘 이후 예약 {boxReservations?.length ?? 0}건</span>
                    </div>
                    {!boxReservations || boxReservations.length === 0 ? (
                      <p className={s.emptyText}>예약된 수업이 없습니다.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {boxReservations.map((r) => (
                          <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{r.userName}</span>
                              <span style={{ fontSize: 12, color: "var(--muted)" }}>{r.className} · {r.startTime}</span>
                            </div>
                            <span style={{ fontSize: 12, color: "var(--red)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>
                              {dayjs(r.classDate).format("MM/DD (ddd)")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* WOD 프로그래밍 탭 */}
                {activeBoxTab === "WOD 프로그래밍" && (
                  <div className={s.card}>
                    <div className={s.cardHeader}>
                      <h3 className={s.cardTitle}>WOD 프로그래밍</h3>
                      <div className={s.calendarMonthNav}>
                        <button
                          className={s.calendarNavBtn}
                          onClick={() => {
                            setCalendarMonth((m) => m.subtract(1, "month"));
                            setSelectedDate(null);
                          }}
                        >
                          ‹
                        </button>
                        <span className={s.calendarMonthLabel}>
                          {calendarMonth.format("YYYY년 M월")}
                        </span>
                        <button
                          className={s.calendarNavBtn}
                          onClick={() => {
                            setCalendarMonth((m) => m.add(1, "month"));
                            setSelectedDate(null);
                          }}
                        >
                          ›
                        </button>
                      </div>
                    </div>

                    <div className={s.calendarLayout}>
                      {/* 달력 */}
                      <div className={s.calendar}>
                        <div className={s.calendarWeekRow}>
                          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                            <div key={d} className={s.calendarWeekDay}>{d}</div>
                          ))}
                        </div>
                        <div className={s.calendarGrid}>
                          {calendarDays.map((dateStr, idx) => {
                            if (!dateStr) {
                              return <div key={`empty-${idx}`} className={s.calendarEmpty} />;
                            }
                            const hasWod = !!wodByDate[dateStr];
                            const isToday = dateStr === today;
                            const isSelected = dateStr === selectedDate;
                            return (
                              <button
                                key={dateStr}
                                className={[
                                  s.calendarDay,
                                  isToday ? s.calendarDayToday : "",
                                  isSelected ? s.calendarDaySelected : "",
                                  hasWod ? s.calendarDayHasWod : "",
                                ].join(" ")}
                                onClick={() => {
                                  setSelectedDate(dateStr);
                                  setShowProgForm(false);
                                  setEditingWodId(null);
                                }}
                              >
                                <span className={s.calendarDayNum}>{dayjs(dateStr).date()}</span>
                                {hasWod && (
                                  <span
                                    className={s.wodDot}
                                    style={{ background: WOD_COLORS[wodByDate[dateStr].type] || "#e8220a" }}
                                  />
                                )}
                                {hasWod && (
                                  <span className={s.calendarDayWodTitle}>
                                    {wodByDate[dateStr].title.length > 8
                                      ? wodByDate[dateStr].title.slice(0, 8) + "…"
                                      : wodByDate[dateStr].title}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 사이드 패널 */}
                      {selectedDate && (
                        <div className={s.calendarPanel}>
                          <div className={s.calendarPanelHeader}>
                            <p className={s.calendarPanelDate}>
                              {dayjs(selectedDate).format("M월 D일 (ddd)")}
                            </p>
                            <button
                              className={s.calendarPanelClose}
                              onClick={() => setSelectedDate(null)}
                            >
                              ✕
                            </button>
                          </div>

                          {selectedDateWod && editingWodId !== selectedDateWod.id ? (
                            <>
                              <div className={s.panelWodCard}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                  <span
                                    className={s.wodTypeBadge}
                                    style={{
                                      background: WOD_COLORS[selectedDateWod.type] + "22",
                                      color: WOD_COLORS[selectedDateWod.type],
                                      border: `1px solid ${WOD_COLORS[selectedDateWod.type]}44`,
                                    }}
                                  >
                                    {selectedDateWod.type}
                                  </span>
                                </div>
                                <p className={s.wodTitle}>{selectedDateWod.title}</p>
                                <p className={s.wodContent}>{selectedDateWod.content}</p>
                              </div>
                              <div className={s.panelActions}>
                                <button
                                  className="btn-secondary"
                                  style={{ padding: "8px 16px", fontSize: 12 }}
                                  onClick={() => {
                                    setEditingWodId(selectedDateWod.id);
                                    setProgWodForm({
                                      title: selectedDateWod.title,
                                      type: selectedDateWod.type,
                                      content: selectedDateWod.content,
                                      scoreType: selectedDateWod.scoreType,
                                    });
                                  }}
                                >
                                  수정
                                </button>
                                <button
                                  className={s.panelDeleteBtn}
                                  disabled={deleteWodMutation.isPending}
                                  onClick={() => {
                                    if (confirm("이 WOD를 삭제하시겠습니까?")) {
                                      deleteWodMutation.mutate(selectedDateWod.id);
                                    }
                                  }}
                                >
                                  {deleteWodMutation.isPending ? "삭제 중..." : "삭제"}
                                </button>
                              </div>
                            </>
                          ) : editingWodId && selectedDateWod ? (
                            <div className={s.progForm}>
                              <div className={s.field}>
                                <label className={s.label}>WOD 제목</label>
                                <input
                                  className="input-field"
                                  value={progWodForm.title}
                                  onChange={(e) => setProgWodForm((f) => ({ ...f, title: e.target.value }))}
                                />
                              </div>
                              <div className={s.field}>
                                <label className={s.label}>WOD 타입</label>
                                <select
                                  className={s.select}
                                  value={progWodForm.type}
                                  onChange={(e) => setProgWodForm((f) => ({ ...f, type: e.target.value }))}
                                >
                                  {WOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                              <div className={s.field}>
                                <label className={s.label}>점수 유형</label>
                                <select
                                  className={s.select}
                                  value={progWodForm.scoreType}
                                  onChange={(e) => setProgWodForm((f) => ({ ...f, scoreType: e.target.value }))}
                                >
                                  <option value="TIME">TIME</option>
                                  <option value="ROUNDS">ROUNDS</option>
                                  <option value="REPS">REPS</option>
                                  <option value="WEIGHT">WEIGHT</option>
                                </select>
                              </div>
                              <div className={s.field}>
                                <label className={s.label}>WOD 내용</label>
                                <textarea
                                  className={s.textarea}
                                  value={progWodForm.content}
                                  onChange={(e) => setProgWodForm((f) => ({ ...f, content: e.target.value }))}
                                />
                              </div>
                              <div className={s.panelActions}>
                                <button
                                  className="btn-primary"
                                  style={{ padding: "8px 16px", fontSize: 12 }}
                                  disabled={updateWodMutation.isPending || !progWodForm.title || !progWodForm.content}
                                  onClick={() => updateWodMutation.mutate({
                                    id: editingWodId,
                                    data: { ...progWodForm, wodDate: selectedDate },
                                  })}
                                >
                                  {updateWodMutation.isPending ? "저장 중..." : "저장"}
                                </button>
                                <button
                                  className="btn-secondary"
                                  style={{ padding: "8px 16px", fontSize: 12 }}
                                  onClick={() => setEditingWodId(null)}
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className={s.panelEmpty}>이 날짜에 등록된 WOD가 없습니다.</p>
                              {!showProgForm ? (
                                <button
                                  className="btn-primary"
                                  style={{ width: "100%", padding: "10px", fontSize: 13, marginTop: 8 }}
                                  onClick={() => setShowProgForm(true)}
                                >
                                  + WOD 등록
                                </button>
                              ) : (
                                <div className={s.progForm}>
                                  <div className={s.field}>
                                    <label className={s.label}>WOD 제목</label>
                                    <input
                                      className="input-field"
                                      placeholder="오늘의 WOD 제목"
                                      value={progWodForm.title}
                                      onChange={(e) => setProgWodForm((f) => ({ ...f, title: e.target.value }))}
                                    />
                                  </div>
                                  <div className={s.field}>
                                    <label className={s.label}>WOD 타입</label>
                                    <select
                                      className={s.select}
                                      value={progWodForm.type}
                                      onChange={(e) => setProgWodForm((f) => ({ ...f, type: e.target.value }))}
                                    >
                                      {WOD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                  </div>
                                  <div className={s.field}>
                                    <label className={s.label}>점수 유형</label>
                                    <select
                                      className={s.select}
                                      value={progWodForm.scoreType}
                                      onChange={(e) => setProgWodForm((f) => ({ ...f, scoreType: e.target.value }))}
                                    >
                                      <option value="TIME">TIME</option>
                                      <option value="ROUNDS">ROUNDS</option>
                                      <option value="REPS">REPS</option>
                                      <option value="WEIGHT">WEIGHT</option>
                                    </select>
                                  </div>
                                  <div className={s.field}>
                                    <label className={s.label}>WOD 내용</label>
                                    <textarea
                                      className={s.textarea}
                                      placeholder="WOD 내용을 입력하세요"
                                      value={progWodForm.content}
                                      onChange={(e) => setProgWodForm((f) => ({ ...f, content: e.target.value }))}
                                    />
                                  </div>
                                  <div className={s.panelActions}>
                                    <button
                                      className="btn-primary"
                                      style={{ padding: "8px 16px", fontSize: 12 }}
                                      disabled={progWodMutation.isPending || !progWodForm.title || !progWodForm.content}
                                      onClick={() => progWodMutation.mutate()}
                                    >
                                      {progWodMutation.isPending ? "등록 중..." : "등록"}
                                    </button>
                                    <button
                                      className="btn-secondary"
                                      style={{ padding: "8px 16px", fontSize: 12 }}
                                      onClick={() => setShowProgForm(false)}
                                    >
                                      취소
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
