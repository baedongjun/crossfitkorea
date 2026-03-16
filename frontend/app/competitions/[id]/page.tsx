"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { competitionApi } from "@/lib/api";
import { Competition } from "@/types";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import s from "./competitionDetail.module.css";

dayjs.locale("ko");

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "예정", OPEN: "접수 중", CLOSED: "접수 마감", COMPLETED: "종료",
};
const STATUS_BADGE: Record<string, string> = {
  UPCOMING: "badge-upcoming", OPEN: "badge-open", CLOSED: "badge-closed", COMPLETED: "badge-completed",
};
const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "입문", SCALED: "스케일드", INTERMEDIATE: "중급", RX: "Rx", ELITE: "엘리트", ALL: "전체",
};

export default function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: comp, isLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: async () => (await competitionApi.getOne(Number(id))).data.data as Competition,
  });

  if (isLoading) {
    return (
      <div className={s.page}>
        <div className={s.loading}>
          <div className={s.skeleton} style={{ height: 300 }} />
        </div>
      </div>
    );
  }
  if (!comp) return null;

  const isOpen = comp.status === "OPEN";
  const deadlinePassed = comp.registrationDeadline && dayjs().isAfter(dayjs(comp.registrationDeadline));

  return (
    <div className={s.page}>
      {/* Hero */}
      <div className={s.hero}>
        {comp.imageUrl && (
          <img src={comp.imageUrl} alt={comp.name} className={s.heroImg} />
        )}
        <div className={s.heroOverlay} />
        <div className={s.heroContent}>
          <div className={s.heroBadges}>
            <span className={`badge ${STATUS_BADGE[comp.status]}`}>
              {STATUS_LABELS[comp.status]}
            </span>
            {comp.level && (
              <span className="badge badge-default">
                {LEVEL_LABELS[comp.level] || comp.level}
              </span>
            )}
          </div>
          <h1 className={s.heroTitle}>{comp.name}</h1>
          <div className={s.heroMeta}>
            {comp.organizer && <span>{comp.organizer}</span>}
            {comp.city && <><span>·</span><span>{comp.city}</span></>}
          </div>
          <button
            className={s.shareBtn}
            onClick={() => {
              if (typeof navigator !== "undefined" && "share" in navigator) {
                navigator.share({ title: comp.name, text: `${comp.name} — ${comp.city || ""}`, url: window.location.href }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(window.location.href);
              }
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            공유
          </button>
        </div>
      </div>

      <div className={s.content}>
        <div className={s.main}>
          {/* Back */}
          <Link href="/competitions" className={s.back}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            대회 일정
          </Link>

          {/* Info Card */}
          <div className={s.infoCard}>
            <p className={s.cardLabel}>대회 정보</p>
            <div className={s.infoGrid}>
              <div className={s.infoItem}>
                <span className={s.infoLabel}>대회 일정</span>
                <span className={s.infoValue}>
                  {dayjs(comp.startDate).format("YYYY.MM.DD (ddd)")}
                  {comp.endDate && comp.endDate !== comp.startDate && (
                    <> ~ {dayjs(comp.endDate).format("MM.DD (ddd)")}</>
                  )}
                </span>
              </div>
              {comp.location && (
                <div className={s.infoItem}>
                  <span className={s.infoLabel}>장소</span>
                  <span className={s.infoValue}>{comp.location}</span>
                </div>
              )}
              {comp.registrationDeadline && (
                <div className={s.infoItem}>
                  <span className={s.infoLabel}>접수 마감</span>
                  <span className={s.infoValue} style={{ color: deadlinePassed ? "var(--muted)" : "var(--red)" }}>
                    {dayjs(comp.registrationDeadline).format("YYYY.MM.DD (ddd) HH:mm")}
                    {deadlinePassed && " (마감)"}
                  </span>
                </div>
              )}
              {comp.maxParticipants && (
                <div className={s.infoItem}>
                  <span className={s.infoLabel}>모집 인원</span>
                  <span className={s.infoValue}>{comp.maxParticipants.toLocaleString()}명</span>
                </div>
              )}
              {comp.entryFee && (
                <div className={s.infoItem}>
                  <span className={s.infoLabel}>참가비</span>
                  <span className={s.infoValue}>{comp.entryFee.toLocaleString()}원</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {comp.description && (
            <div className={s.descCard}>
              <p className={s.cardLabel}>대회 소개</p>
              <p className={s.descText}>{comp.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={s.sidebar}>
          {/* Registration */}
          <div className={s.regCard}>
            <p className={s.cardLabel}>참가 신청</p>
            {comp.registrationUrl && isOpen ? (
              <>
                <p className={s.regDesc}>지금 바로 참가 신청하세요!</p>
                {comp.registrationDeadline && (
                  <p className={s.regDeadline}>
                    마감: {dayjs(comp.registrationDeadline).format("MM.DD HH:mm")}
                  </p>
                )}
                <a
                  href={comp.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ display: "block", textAlign: "center", padding: 16, marginTop: 16 }}
                >
                  접수하기
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 6, verticalAlign: "middle" }}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </>
            ) : (
              <div className={s.regClosed}>
                <span className={`badge ${STATUS_BADGE[comp.status]}`} style={{ fontSize: 13, padding: "6px 16px" }}>
                  {STATUS_LABELS[comp.status]}
                </span>
                <p className={s.regClosedDesc}>
                  {comp.status === "UPCOMING" && "접수가 아직 시작되지 않았습니다."}
                  {comp.status === "CLOSED" && "접수가 마감되었습니다."}
                  {comp.status === "COMPLETED" && "종료된 대회입니다."}
                </p>
              </div>
            )}
          </div>

          {/* Level */}
          <div className={s.levelCard}>
            <p className={s.cardLabel}>참가 레벨</p>
            <p className={s.levelBig}>{LEVEL_LABELS[comp.level] || comp.level}</p>
          </div>

          {/* Share */}
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              className={s.shareBtn}
              onClick={() => {
                navigator.share({
                  title: comp.name,
                  text: `${comp.name} - ${dayjs(comp.startDate).format("YYYY.MM.DD")} · ${comp.location || comp.city || ""}`,
                  url: window.location.href,
                }).catch(() => {});
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              대회 공유하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
