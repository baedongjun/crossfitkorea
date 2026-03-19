"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { competitionApi, paymentApi, competitionResultApi } from "@/lib/api";
import { Competition } from "@/types";
import { isLoggedIn, getUser } from "@/lib/auth";
import { toast } from "react-toastify";
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

interface CompetitionResult {
  id: number;
  rank: number;
  userName: string;
  score?: string;
  notes?: string;
}

function ResultsSection({ competitionId }: { competitionId: number }) {
  const { data: results, isLoading } = useQuery({
    queryKey: ["competition", competitionId, "results"],
    queryFn: async () => (await competitionResultApi.getResults(competitionId)).data.data as CompetitionResult[],
  });

  if (isLoading) return <div className={s.resultsCard}><p className={s.cardLabel}>대회 결과</p><p style={{ fontSize: 13, color: "var(--muted)" }}>로딩 중...</p></div>;
  if (!results || results.length === 0) return null;

  return (
    <div className={s.resultsCard}>
      <p className={s.cardLabel}>대회 결과</p>
      <table className={s.resultsTable}>
        <thead>
          <tr>
            <th>순위</th>
            <th>참가자</th>
            <th>기록</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id} className={r.rank <= 3 ? s.topRow : ""}>
              <td className={s.rankCell}>
                {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : r.rank}
              </td>
              <td>{r.userName}</td>
              <td className={s.scoreCell}>{r.score || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const loggedIn = isLoggedIn();
  const currentUser = getUser();

  const { data: comp, isLoading } = useQuery({
    queryKey: ["competition", id],
    queryFn: async () => (await competitionApi.getOne(Number(id))).data.data as Competition,
  });

  const { data: regStatus } = useQuery({
    queryKey: ["competition", id, "registration"],
    queryFn: async () => (await competitionApi.getRegistrationStatus(Number(id))).data.data as { registered: boolean; count: number },
    enabled: !!id,
  });

  const registerMutation = useMutation({
    mutationFn: () => competitionApi.register(Number(id)),
    onSuccess: () => {
      toast.success("참가 신청이 완료되었습니다!");
      qc.invalidateQueries({ queryKey: ["competition", id, "registration"] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "참가 신청에 실패했습니다.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => competitionApi.cancelRegistration(Number(id)),
    onSuccess: () => {
      toast.success("참가 신청이 취소되었습니다.");
      qc.invalidateQueries({ queryKey: ["competition", id, "registration"] });
    },
    onError: () => toast.error("취소에 실패했습니다."),
  });

  const handlePaymentRegister = async () => {
    if (!comp?.entryFee || comp.entryFee <= 0) {
      registerMutation.mutate();
      return;
    }

    try {
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const orderName = `${comp.name} 참가비`;

      await paymentApi.initiate({ competitionId: Number(id), orderId, orderName });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const TossPayments = (window as any).TossPayments;
      if (!TossPayments) {
        toast.error("결제 모듈 로딩 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      const toss = TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "");
      await toss.requestPayment("카드", {
        amount: comp.entryFee,
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payment/success?competitionId=${id}`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerName: currentUser?.name || "",
      });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      if (error?.code !== "USER_CANCEL") {
        toast.error(error?.message || "결제 처리 중 오류가 발생했습니다.");
      }
    }
  };

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

  const buildGoogleCalendarUrl = () => {
    const fmt = (d: string) => dayjs(d).format("YYYYMMDDTHHmmss");
    const start = fmt(comp.startDate + "T09:00:00");
    const end = fmt((comp.endDate || comp.startDate) + "T18:00:00");
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: comp.name,
      dates: `${start}/${end}`,
      details: comp.description || "",
      location: comp.location || "",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  return (
    <>
    <Script src="https://js.tosspayments.com/v1/payment" strategy="lazyOnload" />
    <div className={s.page}>
      {/* Hero */}
      <div className={s.hero}>
        {comp.imageUrl && (
          <Image src={comp.imageUrl} alt={comp.name} fill style={{ objectFit: "cover", opacity: 0.3 }} />
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
                (navigator as Navigator).share({ title: comp.name, text: `${comp.name} — ${comp.city || ""}`, url: window.location.href }).catch(() => {});
              } else {
                (navigator as Navigator).clipboard?.writeText(window.location.href);
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

          {/* Results */}
          {comp.status === "COMPLETED" && (
            <ResultsSection competitionId={Number(id)} />
          )}
        </div>

        {/* Sidebar */}
        <div className={s.sidebar}>
          {/* Registration */}
          <div className={s.regCard}>
            <p className={s.cardLabel}>참가 신청</p>
            {regStatus && (
              <p className={s.regCount}>
                현재 <strong>{regStatus.count}</strong>명 신청
                {comp.maxParticipants && ` / ${comp.maxParticipants}명`}
              </p>
            )}
            {isOpen ? (
              <>
                <p className={s.regDesc}>지금 바로 참가 신청하세요!</p>
                {comp.registrationDeadline && (
                  <p className={s.regDeadline}>
                    마감: {dayjs(comp.registrationDeadline).format("MM.DD HH:mm")}
                  </p>
                )}
                {loggedIn ? (
                  regStatus?.registered ? (
                    <button
                      className="btn-secondary"
                      style={{ width: "100%", padding: 14, marginTop: 12 }}
                      onClick={() => { if (window.confirm("참가 신청을 취소하시겠습니까?")) cancelMutation.mutate(); }}
                      disabled={cancelMutation.isPending}
                    >
                      신청 취소
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      style={{ width: "100%", padding: 14, marginTop: 12 }}
                      onClick={handlePaymentRegister}
                      disabled={registerMutation.isPending || (comp.maxParticipants != null && (regStatus?.count ?? 0) >= comp.maxParticipants)}
                    >
                      {registerMutation.isPending ? "신청 중..." : comp.entryFee && comp.entryFee > 0 ? `결제하고 신청 (${comp.entryFee.toLocaleString()}원)` : "참가 신청"}
                    </button>
                  )
                ) : (
                  <Link
                    href="/login"
                    className="btn-primary"
                    style={{ display: "block", textAlign: "center", padding: 14, marginTop: 12 }}
                  >
                    로그인 후 신청
                  </Link>
                )}
                {comp.registrationUrl && (
                  <a href={comp.registrationUrl} target="_blank" rel="noopener noreferrer" className={s.extLink}>
                    외부 접수 사이트 →
                  </a>
                )}
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

          {/* Google Calendar */}
          <a
            href={buildGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={s.calendarBtn}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Google 캘린더에 추가
          </a>

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
    </>
  );
}
