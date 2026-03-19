"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { challengeApi } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import dayjs from "dayjs";
import s from "./challenges.module.css";

interface ChallengeDto {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  targetDays: number;
  type: "WOD" | "EXERCISE" | "DIET" | "FREE";
  active: boolean;
  participantCount: number;
  myCompletedDays?: number;
  participating: boolean;
  verifiedToday: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  WOD: "WOD", EXERCISE: "운동", DIET: "식단", FREE: "자유",
};
const TYPE_CLASS: Record<string, string> = {
  WOD: s.typeWod, EXERCISE: s.typeExercise, DIET: s.typeDiet, FREE: s.typeFree,
};

function ChallengeCard({ challenge }: { challenge: ChallengeDto }) {
  const isParticipating = challenge.participating && challenge.myCompletedDays !== undefined;
  const pct = isParticipating
    ? Math.min(100, Math.round((challenge.myCompletedDays! / challenge.targetDays) * 100))
    : 0;

  return (
    <Link href={`/challenges/${challenge.id}`} className={s.card}>
      {challenge.imageUrl ? (
        <img src={challenge.imageUrl} alt={challenge.title} className={s.cardImage} />
      ) : (
        <div className={s.cardImagePlaceholder}>CHALLENGE</div>
      )}

      <div className={s.cardBody}>
        <div className={s.cardTop}>
          <span className={`${s.typeBadge} ${TYPE_CLASS[challenge.type] ?? s.typeFree}`}>
            {TYPE_LABEL[challenge.type] ?? challenge.type}
          </span>
          {challenge.verifiedToday && (
            <span style={{ fontSize: 11, color: "#4caf50", fontWeight: 700, letterSpacing: 1 }}>
              오늘 인증완료
            </span>
          )}
        </div>

        <h3 className={s.cardTitle}>{challenge.title}</h3>
        {challenge.description && (
          <p className={s.cardDesc}>{challenge.description}</p>
        )}

        <div className={s.cardMeta}>
          <span>목표 {challenge.targetDays}일</span>
          <span className={s.cardMetaDot}>·</span>
          <span>참가 {challenge.participantCount.toLocaleString()}명</span>
          <span className={s.cardMetaDot}>·</span>
          <span>
            {dayjs(challenge.startDate).format("MM.DD")} ~{" "}
            {dayjs(challenge.endDate).format("MM.DD")}
          </span>
        </div>
      </div>

      <div className={s.cardFooter}>
        {isParticipating ? (
          <div className={s.progressWrap}>
            <div className={s.progressLabel}>
              <span>진행률</span>
              <span>{challenge.myCompletedDays}/{challenge.targetDays}일 ({pct}%)</span>
            </div>
            <div className={s.progressBar}>
              <div className={s.progressFill} style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "var(--muted)" }}>참가 전</span>
        )}
        <span className={s.cardArrow}>→</span>
      </div>
    </Link>
  );
}

export default function ChallengesPage() {
  const loggedIn = typeof window !== "undefined" ? isLoggedIn() : false;

  const { data, isLoading } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => (await challengeApi.getAll()).data.data as ChallengeDto[],
  });

  const challenges = data ?? [];
  const myChallenges = challenges.filter((c) => c.participating);
  const otherChallenges = challenges.filter((c) => !c.participating);

  return (
    <div className={s.pageWrap}>
      <div className={s.pageHeader}>
        <p className={s.pageEyebrow}>CHALLENGE</p>
        <h1 className={s.pageTitle}>
          크로스핏<br /><span>챌린지</span>
        </h1>
        <p className={s.pageDesc}>
          30일 버피 챌린지, 100일 WOD 챌린지 등<br />
          다양한 챌린지에 참여하고 기록을 인증하세요.
        </p>
      </div>

      {isLoading ? (
        <div className={s.loading}>LOADING...</div>
      ) : challenges.length === 0 ? (
        <div className={s.empty}>
          <p className={s.emptyTitle}>진행 중인 챌린지 없음</p>
          <p className={s.emptyDesc}>곧 새로운 챌린지가 시작됩니다.</p>
        </div>
      ) : (
        <>
          {loggedIn && myChallenges.length > 0 && (
            <div className={s.mySection}>
              <p className={s.sectionLabel}>내가 참여 중인 챌린지</p>
              <div className={s.grid}>
                {myChallenges.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} />
                ))}
              </div>
            </div>
          )}

          {otherChallenges.length > 0 && (
            <div>
              {loggedIn && myChallenges.length > 0 && (
                <p className={s.sectionLabel} style={{ marginBottom: 20 }}>다른 챌린지</p>
              )}
              <div className={s.grid}>
                {otherChallenges.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
