"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { competitionApi } from "@/lib/api";
import { Competition, CompetitionStatus } from "@/types";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import s from "./competitions.module.css";

dayjs.locale("ko");

const STATUS_LABELS: Record<CompetitionStatus, string> = {
  UPCOMING: "예정",
  OPEN: "접수 중",
  CLOSED: "접수 마감",
  COMPLETED: "종료",
};

const STATUS_BADGE: Record<CompetitionStatus, string> = {
  UPCOMING: "badge-upcoming",
  OPEN: "badge-open",
  CLOSED: "badge-closed",
  COMPLETED: "badge-completed",
};

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "입문",
  SCALED: "스케일드",
  INTERMEDIATE: "중급",
  RX: "Rx",
  ELITE: "엘리트",
  ALL: "전체",
};

const STATUS_FILTERS: { value: CompetitionStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "OPEN", label: "접수 중" },
  { value: "UPCOMING", label: "예정" },
  { value: "CLOSED", label: "접수 마감" },
  { value: "COMPLETED", label: "종료" },
];

const LEVEL_FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "BEGINNER", label: "입문" },
  { value: "SCALED", label: "스케일드" },
  { value: "INTERMEDIATE", label: "중급" },
  { value: "RX", label: "Rx" },
  { value: "ELITE", label: "엘리트" },
];

const CITIES = ["전체", "서울", "경기", "부산", "인천", "대구", "대전", "광주", "제주"];

const FEE_FILTERS = [
  { value: "ALL", label: "전체" },
  { value: "FREE", label: "무료" },
  { value: "30000", label: "3만원 이하" },
  { value: "50000", label: "5만원 이하" },
  { value: "100000", label: "10만원 이하" },
];

const SORT_OPTIONS = [
  { value: "date_asc", label: "날짜 오름차순" },
  { value: "date_desc", label: "날짜 내림차순" },
  { value: "deadline_asc", label: "접수 마감 임박순" },
  { value: "fee_asc", label: "참가비 낮은순" },
];

export default function CompetitionsPage() {
  const [selectedStatus, setSelectedStatus] = useState<CompetitionStatus | "ALL">("ALL");
  const [selectedLevel, setSelectedLevel] = useState("ALL");
  const [selectedCity, setSelectedCity] = useState("전체");
  const [selectedFee, setSelectedFee] = useState("ALL");
  const [sortBy, setSortBy] = useState("date_asc");
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarMonth, setCalendarMonth] = useState(dayjs().startOf("month"));

  const { data, isLoading } = useQuery({
    queryKey: ["competitions", selectedStatus, selectedCity],
    queryFn: async () => {
      const res = await competitionApi.getAll({
        status: selectedStatus === "ALL" ? undefined : selectedStatus,
        city: selectedCity === "전체" ? undefined : selectedCity,
      });
      return res.data.data;
    },
  });

  const filtered = data?.content?.filter((comp: Competition) => {
    const levelMatch = selectedLevel === "ALL" || comp.level === selectedLevel;
    const kwMatch = !keyword || comp.name?.toLowerCase().includes(keyword.toLowerCase()) || comp.location?.toLowerCase().includes(keyword.toLowerCase());
    const feeMatch =
      selectedFee === "ALL" ? true :
      selectedFee === "FREE" ? (!comp.entryFee || comp.entryFee === 0) :
      (comp.entryFee ?? 0) <= Number(selectedFee);
    return levelMatch && feeMatch && kwMatch;
  })?.sort((a: Competition, b: Competition) => {
    if (sortBy === "date_asc") return dayjs(a.startDate).diff(dayjs(b.startDate));
    if (sortBy === "date_desc") return dayjs(b.startDate).diff(dayjs(a.startDate));
    if (sortBy === "deadline_asc") {
      const da = a.registrationDeadline ? dayjs(a.registrationDeadline).unix() : Infinity;
      const db = b.registrationDeadline ? dayjs(b.registrationDeadline).unix() : Infinity;
      return da - db;
    }
    if (sortBy === "fee_asc") return (a.entryFee ?? 0) - (b.entryFee ?? 0);
    return 0;
  });

  const openCount = data?.content?.filter((c: Competition) => c.status === "OPEN").length ?? 0;
  const upcomingCount = data?.content?.filter((c: Competition) => c.status === "UPCOMING").length ?? 0;

  return (
    <div className={s.page}>
      {/* Hero */}
      <div className={s.hero}>
        <div className={s.heroInner}>
          <div className={s.heroLeft}>
            <div className={s.heroEyebrow}>
              <svg className={s.trophyIcon} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
              </svg>
              <span className={s.heroTag}>Competition Schedule</span>
            </div>
            <h1 className={s.heroTitle}>대회 일정</h1>
            <p className={s.heroSub}>전국 크로스핏 대회 일정을 한눈에 확인하세요</p>
          </div>
          {(openCount > 0 || upcomingCount > 0) && (
            <div className={s.heroStats}>
              <div className={s.heroStat}>
                <span className={s.heroStatNum}>{openCount}</span>
                <span className={s.heroStatLabel}>접수 중</span>
              </div>
              <div className={s.heroStat}>
                <span className={s.heroStatNum}>{upcomingCount}</span>
                <span className={s.heroStatLabel}>예정</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={s.content}>
        <div className={s.layout}>
          {/* ── Filter Sidebar ── */}
          <aside className={s.filterSidebar}>
            {/* Search */}
            <div className={s.sidebarSection}>
              <p className={s.sidebarLabel}>검색</p>
              <form
                className={s.searchBar}
                onSubmit={(e) => { e.preventDefault(); setKeyword(searchInput); }}
              >
                <input
                  type="text"
                  className={s.searchInput}
                  placeholder="대회명 또는 장소"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <div className={s.searchActions}>
                  <button type="submit" className={s.searchBtn}>검색</button>
                  {keyword && (
                    <button type="button" className={s.searchClear} onClick={() => { setKeyword(""); setSearchInput(""); }}>✕</button>
                  )}
                </div>
              </form>
            </div>

            {/* Status */}
            <div className={s.sidebarSection}>
              <p className={s.sidebarLabel}>상태</p>
              <div className={s.filters}>
                {STATUS_FILTERS.map((f) => (
                  <button key={f.value} onClick={() => setSelectedStatus(f.value)} className={`${s.pill} ${selectedStatus === f.value ? s.pillActive : ""}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Level */}
            <div className={s.sidebarSection}>
              <p className={s.sidebarLabel}>레벨</p>
              <div className={s.filters}>
                {LEVEL_FILTERS.map((f) => (
                  <button key={f.value} onClick={() => setSelectedLevel(f.value)} className={`${s.pill} ${selectedLevel === f.value ? s.pillActive : ""}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* City */}
            <div className={s.sidebarSection}>
              <p className={s.sidebarLabel}>지역</p>
              <div className={s.filters}>
                {CITIES.map((city) => (
                  <button key={city} onClick={() => setSelectedCity(city)} className={`${s.pill} ${selectedCity === city ? s.pillActive : ""}`}>
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Fee */}
            <div className={s.sidebarSection}>
              <p className={s.sidebarLabel}>참가비</p>
              <div className={s.filters}>
                {FEE_FILTERS.map((f) => (
                  <button key={f.value} onClick={() => setSelectedFee(f.value)} className={`${s.pill} ${selectedFee === f.value ? s.pillActive : ""}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className={s.sidebarSection}>
              <p className={s.sidebarLabel}>정렬</p>
              <select className={s.sortSelect} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <div className={s.main}>
            {/* Result count + View Toggle */}
            <div className={s.resultRow}>
              <p className={s.resultCount}>
                <strong>{filtered?.length ?? 0}</strong>개 대회
              </p>
              <div className={s.viewToggle}>
                <button
                  className={`${s.viewBtn} ${viewMode === "list" ? s.viewBtnActive : ""}`}
                  onClick={() => setViewMode("list")}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                  목록
                </button>
                <button
                  className={`${s.viewBtn} ${viewMode === "calendar" ? s.viewBtnActive : ""}`}
                  onClick={() => setViewMode("calendar")}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="0" ry="0"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  캘린더
                </button>
              </div>
            </div>

            {/* Calendar View */}
            {viewMode === "calendar" && (() => {
              const daysInMonth = calendarMonth.daysInMonth();
              const startDow = calendarMonth.startOf("month").day();
              const today = dayjs().format("YYYY-MM-DD");
              const cells: (string | null)[] = [];
              for (let i = 0; i < startDow; i++) cells.push(null);
              for (let d = 1; d <= daysInMonth; d++) {
                cells.push(calendarMonth.date(d).format("YYYY-MM-DD"));
              }
              const compsByDate: Record<string, Competition[]> = {};
              (filtered ?? []).forEach((comp: Competition) => {
                if (!comp.startDate) return;
                const k = dayjs(comp.startDate).format("YYYY-MM-DD");
                if (!compsByDate[k]) compsByDate[k] = [];
                compsByDate[k].push(comp);
              });
              return (
                <div className={s.calendarSection}>
                  <div className={s.calendarNav}>
                    <button className={s.calendarNavBtn} onClick={() => setCalendarMonth(calendarMonth.subtract(1, "month"))}>‹</button>
                    <span className={s.calendarMonthTitle}>{calendarMonth.format("YYYY.MM")}</span>
                    <button className={s.calendarNavBtn} onClick={() => setCalendarMonth(calendarMonth.add(1, "month"))}>›</button>
                  </div>
                  <div className={s.calendarDaysHeader}>
                    {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                      <div key={d} className={s.calendarDayHeader}>{d}</div>
                    ))}
                  </div>
                  <div className={s.calendarGrid}>
                    {cells.map((cell, i) => (
                      <div key={i} className={`${s.calendarCell} ${!cell ? s.calendarCellEmpty : cell === today ? s.calendarCellToday : ""}`}>
                        {cell && (
                          <>
                            <p className={`${s.calendarDate} ${cell === today ? s.calendarDateToday : ""}`}>
                              {dayjs(cell).date()}
                            </p>
                            {(compsByDate[cell] ?? []).map((comp) => (
                              <Link
                                key={comp.id}
                                href={`/competitions/${comp.id}`}
                                className={`${s.calendarEvent} ${comp.status === "OPEN" ? s.calendarEventOpen : comp.status === "UPCOMING" ? s.calendarEventUpcoming : ""}`}
                                title={comp.name}
                              >
                                {comp.name}
                              </Link>
                            ))}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* List View */}
            {viewMode === "list" && (isLoading ? (
              <div className={s.list}>
                {[...Array(4)].map((_, i) => <div key={i} className={s.skeleton} />)}
              </div>
            ) : filtered?.length === 0 ? (
              <div className={s.empty}>
                <div className={s.emptyIcon}>🏆</div>
                <p>조건에 맞는 대회가 없습니다</p>
              </div>
            ) : (
              <div className={s.list}>
                {filtered?.map((comp: Competition) => (
                  <Link key={comp.id} href={`/competitions/${comp.id}`} className={s.item}>
                    <div className={s.dateBadge}>
                      <p className={s.dateMonth}>{dayjs(comp.startDate).format("MMM")}</p>
                      <p className={s.dateDay}>{dayjs(comp.startDate).format("DD")}</p>
                      <p className={s.dateDow}>{dayjs(comp.startDate).format("ddd")}</p>
                    </div>
                    <div className={s.info}>
                      <div className={s.badges}>
                        <span className={`badge ${STATUS_BADGE[comp.status]}`}>{STATUS_LABELS[comp.status]}</span>
                        {comp.level && <span className="badge badge-default">{LEVEL_LABELS[comp.level] || comp.level}</span>}
                      </div>
                      <p className={s.compName}>{comp.name}</p>
                      <div className={s.meta}>
                        {comp.location && (
                          <span className={s.metaItem}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            {comp.location}
                          </span>
                        )}
                        {comp.registrationDeadline && (
                          <span className={s.metaItem}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="0" ry="0"/><line x1="16" y1="2" x2="16" y2="6"/>
                              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            접수 마감: {dayjs(comp.registrationDeadline).format("MM.DD")}
                          </span>
                        )}
                        {comp.entryFee ? (
                          <span className={s.feeValue}>{comp.entryFee.toLocaleString()}원</span>
                        ) : null}
                        {comp.maxParticipants && (
                          <span className={s.metaItem} style={{ color: (comp.currentParticipants ?? 0) >= comp.maxParticipants ? "var(--red)" : "var(--muted)" }}>
                            {comp.currentParticipants ?? 0}/{comp.maxParticipants}명
                          </span>
                        )}
                      </div>
                      {comp.description && <p className={s.desc}>{comp.description}</p>}
                    </div>
                    {comp.registrationUrl && comp.status === "OPEN" && (
                      <div className={s.action}>
                        <a href={comp.registrationUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" onClick={(e) => e.stopPropagation()}>
                          접수하기
                        </a>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
