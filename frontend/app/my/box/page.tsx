"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { boxApi, wodApi } from "@/lib/api";
import { isLoggedIn, getUser } from "@/lib/auth";
import { Box } from "@/types";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import s from "./box.module.css";

const WOD_TYPES = ["AMRAP", "FOR_TIME", "EMOM", "TABATA", "STRENGTH", "SKILL", "REST_DAY", "CUSTOM"];
const WOD_COLORS: Record<string, string> = {
  AMRAP: "#e8220a", FOR_TIME: "#ff6b1a", EMOM: "#22c55e",
  TABATA: "#3b82f6", STRENGTH: "#a855f7", SKILL: "#eab308",
  REST_DAY: "#888", CUSTOM: "#888",
};

export default function MyBoxPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = getUser();

  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [wodForm, setWodForm] = useState({ title: "", type: "AMRAP", content: "", scoreType: "TIME", wodDate: dayjs().format("YYYY-MM-DD") });
  const [showWodForm, setShowWodForm] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    if (user?.role !== "ROLE_BOX_OWNER" && user?.role !== "ROLE_ADMIN") {
      toast.error("박스 오너 권한이 필요합니다.");
      router.replace("/my");
    }
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

  const { data: todayWod } = useQuery({
    queryKey: ["wod-today", boxId],
    queryFn: async () => (await wodApi.getToday(boxId!)).data.data,
    enabled: !!boxId,
  });

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
            <p className={s.emptyDesc}>새 박스를 등록하고 관리를 시작하세요.</p>
            <Link href="/boxes/create" className="btn-primary" style={{ display: "inline-block", marginTop: 20 }}>
              박스 등록하기
            </Link>
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

                {/* 코치 목록 */}
                <div className={s.card}>
                  <div className={s.cardHeader}>
                    <h3 className={s.cardTitle}>코치진 ({coaches?.length || 0})</h3>
                    <Link href={`/boxes/${selectedBox.id}?tab=coaches`} className="btn-secondary" style={{ padding: "8px 16px", fontSize: 13 }}>
                      관리
                    </Link>
                  </div>
                  {coaches?.length > 0 ? (
                    <div className={s.coachList}>
                      {coaches.map((c: { id: number; name: string; imageUrl: string | null; experienceYears: number }) => (
                        <div key={c.id} className={s.coachItem}>
                          <div className={s.coachAvatar}>
                            {c.imageUrl ? <img src={c.imageUrl} alt="" /> : c.name[0]}
                          </div>
                          <div>
                            <p className={s.coachName}>{c.name}</p>
                            <p className={s.coachExp}>경력 {c.experienceYears}년</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={s.emptyText}>등록된 코치가 없습니다.</p>
                  )}
                </div>

                {/* 수업 시간표 */}
                <div className={s.card}>
                  <div className={s.cardHeader}>
                    <h3 className={s.cardTitle}>수업 시간표 ({schedules?.length || 0})</h3>
                    <Link href={`/boxes/${selectedBox.id}?tab=schedules`} className="btn-secondary" style={{ padding: "8px 16px", fontSize: 13 }}>
                      관리
                    </Link>
                  </div>
                  {schedules?.length > 0 ? (
                    <div className={s.scheduleList}>
                      {schedules.slice(0, 5).map((sc: { id: number; dayOfWeekKorean: string; startTime: string; endTime: string; className: string; maxCapacity: number }) => (
                        <div key={sc.id} className={s.scheduleItem}>
                          <span className={s.scheduleDay}>{sc.dayOfWeekKorean}</span>
                          <span className={s.scheduleTime}>{sc.startTime} – {sc.endTime}</span>
                          <span className={s.scheduleName}>{sc.className}</span>
                          <span className={s.scheduleCap}>최대 {sc.maxCapacity}명</span>
                        </div>
                      ))}
                      {schedules.length > 5 && (
                        <p className={s.moreText}>+{schedules.length - 5}개 더</p>
                      )}
                    </div>
                  ) : (
                    <p className={s.emptyText}>등록된 수업이 없습니다.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
