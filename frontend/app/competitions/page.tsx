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

  const { data, isLoading } = useQuery({
    queryKey: ["competitions", selectedStatus],
    queryFn: async () => {
      const res = await competitionApi.getAll({
        status: selectedStatus === "ALL" ? undefined : selectedStatus,
      });
      return res.data.data;
    },
  });

  // Client-side filter by level, city, fee
  const filtered = data?.content?.filter((comp: Competition) => {
    const levelMatch = selectedLevel === "ALL" || comp.level === selectedLevel;
    const cityMatch = selectedCity === "전체" || comp.city === selectedCity || comp.location?.includes(selectedCity);
    const feeMatch =
      selectedFee === "ALL" ? true :
      selectedFee === "FREE" ? (!comp.entryFee || comp.entryFee === 0) :
      (comp.entryFee ?? 0) <= Number(selectedFee);
    return levelMatch && cityMatch && feeMatch;
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

  return (
    <div className={s.page}>
      {/* Hero */}
      <div className={s.hero}>
        <div className={s.heroInner}>
          <div className={s.heroEyebrow}>
            <svg className={s.trophyIcon} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
            </svg>
            <span className={s.heroTag}>Competition Schedule</span>
          </div>
          <h1 className={s.heroTitle}>대회 일정</h1>
          <p className={s.heroSub}>전국 크로스핏 대회 일정을 한눈에 확인하세요</p>
        </div>
      </div>

      {/* Content */}
      <div className={s.content}>
        {/* Status Filter */}
        <div className={s.filterGroup}>
          <span className={s.filterGroupLabel}>상태</span>
          <div className={s.filters}>
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedStatus(filter.value)}
                className={`${s.pill} ${selectedStatus === filter.value ? s.pillActive : ""}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Level Filter */}
        <div className={s.filterGroup}>
          <span className={s.filterGroupLabel}>레벨</span>
          <div className={s.filters}>
            {LEVEL_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedLevel(filter.value)}
                className={`${s.pill} ${selectedLevel === filter.value ? s.pillActive : ""}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* City Filter */}
        <div className={s.filterGroup}>
          <span className={s.filterGroupLabel}>지역</span>
          <div className={s.filters}>
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`${s.pill} ${selectedCity === city ? s.pillActive : ""}`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Fee Filter + Sort */}
        <div className={s.filterRow}>
          <div className={s.filterGroup} style={{ flex: 1, marginBottom: 0 }}>
            <span className={s.filterGroupLabel}>참가비</span>
            <div className={s.filters}>
              {FEE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSelectedFee(f.value)}
                  className={`${s.pill} ${selectedFee === f.value ? s.pillActive : ""}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span className={s.filterGroupLabel} style={{ margin: 0 }}>정렬</span>
            <select
              className={s.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Result count */}
        <div className={s.resultRow}>
          <p className={s.resultCount}>
            <strong>{filtered?.length ?? 0}</strong>개 대회
          </p>
        </div>

        {/* List */}
        {isLoading ? (
          <div className={s.list}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={s.skeleton} />
            ))}
          </div>
        ) : filtered?.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}>🏆</div>
            <p>대회 일정이 없습니다</p>
          </div>
        ) : (
          <div className={s.list}>
            {filtered?.map((comp: Competition) => (
              <Link key={comp.id} href={`/competitions/${comp.id}`} className={s.item} style={{ textDecoration: "none", color: "inherit", display: "flex" }}>
                {/* Date Badge */}
                <div className={s.dateBadge}>
                  <p className={s.dateMonth}>{dayjs(comp.startDate).format("MMM")}</p>
                  <p className={s.dateDay}>{dayjs(comp.startDate).format("DD")}</p>
                  <p className={s.dateDow}>{dayjs(comp.startDate).format("ddd")}</p>
                </div>

                {/* Info */}
                <div className={s.info}>
                  <div className={s.badges}>
                    <span className={`badge ${STATUS_BADGE[comp.status]}`}>
                      {STATUS_LABELS[comp.status]}
                    </span>
                    {comp.level && (
                      <span className="badge badge-default">
                        {LEVEL_LABELS[comp.level] || comp.level}
                      </span>
                    )}
                  </div>
                  <p className={s.compName}>{comp.name}</p>
                  <div className={s.meta}>
                    {comp.location && (
                      <span className={s.metaItem}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                        </svg>
                        {comp.location}
                      </span>
                    )}
                    {comp.registrationDeadline && (
                      <span className={s.metaItem}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        접수 마감: {dayjs(comp.registrationDeadline).format("MM.DD")}
                      </span>
                    )}
                    {comp.entryFee && (
                      <span className={s.feeValue}>
                        {comp.entryFee.toLocaleString()}원
                      </span>
                    )}
                  </div>
                  {comp.description && <p className={s.desc}>{comp.description}</p>}
                </div>

                {/* Action */}
                {comp.registrationUrl && comp.status === "OPEN" && (
                  <div className={s.action}>
                    <a
                      href={comp.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                    >
                      접수하기
                    </a>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
