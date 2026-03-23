"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { wodApi, competitionApi, communityApi, membershipApi, leaderboardApi, challengeApi } from "@/lib/api";
import { isLoggedIn, getUser } from "@/lib/auth";
import { Wod, Competition, Post, BoxMembership, BoxRanking } from "@/types";
import dayjs from "dayjs";
import s from "./page.module.css";

const QUICK_LINKS = [
  {
    href: "/boxes",
    label: "박스 찾기",
    sub: "전국 지도 검색",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    ),
  },
  {
    href: "/wod",
    label: "오늘의 WOD",
    sub: "기록 남기기",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
  },
  {
    href: "/competitions",
    label: "대회 일정",
    sub: "신청 & 정보",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 21h8m-4-4v4M5 3h14l1 7H4L5 3zM4 10c0 4.418 3.582 8 8 8s8-3.582 8-8"/>
      </svg>
    ),
  },
  {
    href: "/community",
    label: "커뮤니티",
    sub: "게시판",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: "/challenges",
    label: "챌린지",
    sub: "함께 도전",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
  },
  {
    href: "/my",
    label: "내 활동",
    sub: "기록 & 즐겨찾기",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

const WOD_TYPE_LABEL: Record<string, string> = {
  AMRAP: "AMRAP", FOR_TIME: "FOR TIME", EMOM: "EMOM",
  TABATA: "TABATA", STRENGTH: "STRENGTH", SKILL: "SKILL",
  REST_DAY: "REST DAY", CUSTOM: "CUSTOM",
};
const WOD_TYPE_BADGE: Record<string, string> = {
  AMRAP: "badge-amrap", FOR_TIME: "badge-fortime", EMOM: "badge-emom",
  TABATA: "badge-emom", STRENGTH: "badge-strength", SKILL: "badge-pending",
  REST_DAY: "badge-default", CUSTOM: "badge-default",
};
const STATUS_LABEL: Record<string, string> = {
  UPCOMING: "예정", OPEN: "접수 중", CLOSED: "마감", COMPLETED: "종료",
};
const STATUS_BADGE: Record<string, string> = {
  UPCOMING: "badge-upcoming", OPEN: "badge-open", CLOSED: "badge-closed", COMPLETED: "badge-completed",
};
const CATEGORY_LABEL: Record<string, string> = {
  FREE: "자유", QNA: "Q&A", RECORD: "기록", MARKET: "장터",
};
const CATEGORY_BADGE: Record<string, string> = {
  FREE: "badge-default", QNA: "badge-upcoming", RECORD: "badge-open", MARKET: "badge-amrap",
};

export default function HomePage() {
  const currentUser = typeof window !== "undefined" ? getUser() : null;
  const loggedIn = typeof window !== "undefined" ? isLoggedIn() : false;
  const canRegisterBox = currentUser?.role === "ROLE_BOX_OWNER" || currentUser?.role === "ROLE_ADMIN";
  const boxRegisterHref = !loggedIn ? "/signup" : canRegisterBox ? "/boxes/create" : "/my";

  const { data: todayWod } = useQuery({
    queryKey: ["wod", "today"],
    queryFn: async () => (await wodApi.getToday()).data.data as Wod | null,
  });

  const { data: competitions } = useQuery({
    queryKey: ["competitions", "home"],
    queryFn: async () => (await competitionApi.getAll({ page: 0 })).data.data,
  });

  const { data: recentPosts } = useQuery({
    queryKey: ["posts", "home"],
    queryFn: async () => (await communityApi.getPosts({ page: 0 })).data.data,
  });

  const todayDate = dayjs().format("YYYY-MM-DD");

  const { data: myBox } = useQuery({
    queryKey: ["membership", "myBox", "home"],
    queryFn: async () => (await membershipApi.getMyBox()).data.data as BoxMembership | null,
    enabled: loggedIn,
  });

  const { data: boxRanking } = useQuery({
    queryKey: ["wod", "boxRanking", todayDate, "home"],
    queryFn: async () => (await leaderboardApi.getBoxRanking(todayDate)).data.data as BoxRanking[],
    enabled: !!todayWod,
  });

  const { data: challenges } = useQuery({
    queryKey: ["challenges", "home"],
    queryFn: async () => (await challengeApi.getAll()).data.data as { id: number; title: string; type: string; targetDays: number; participantCount: number; active: boolean }[],
  });

  const activeComps: Competition[] = (competitions?.content ?? []).filter(
    (c: Competition) => c.status === "OPEN" || c.status === "UPCOMING"
  ).slice(0, 3);

  const latestPosts: Post[] = (recentPosts?.content ?? []).slice(0, 5);

  return (
    <>
      {/* Hero */}
      <section className={s.hero}>
        <div className={s.heroGlow} />
        <div className={s.heroContent}>
          <div className={s.heroEyebrow}>
            <span className={s.heroDot} />
            <span className={s.heroEyebrowText}>Korea&apos;s #1 CrossFit Platform</span>
          </div>
          <h1 className={s.heroTitle}>
            CROSSFIT
            <span className={s.heroTitleRed}>KOREA</span>
          </h1>
          <p className={s.heroSub}>대한민국 크로스핏 커뮤니티</p>
          <p className={s.heroDesc}>
            전국 크로스핏 박스를 지도에서 찾고,<br />
            오늘의 WOD와 대회 일정을 한눈에 확인하세요.
          </p>
          <div className={s.heroCta}>
            <Link href="/boxes" className="btn-primary">박스 찾기</Link>
            <Link href="/wod" className="btn-secondary">오늘의 WOD</Link>
            <Link href="/competitions" className="btn-secondary">대회 일정</Link>
          </div>
        </div>
        <span className={s.heroBg} aria-hidden="true">CROSSFIT</span>
      </section>

      {/* Quick Nav */}
      <nav className={s.quickNav}>
        <div className={s.quickNavGrid}>
          {QUICK_LINKS.map((item) => (
            <Link key={item.href + item.label} href={item.href} className={s.quickNavItem}>
              <div className={s.quickNavIcon}>{item.icon}</div>
              <p className={s.quickNavLabel}>{item.label}</p>
              <p className={s.quickNavSub}>{item.sub}</p>
            </Link>
          ))}
        </div>
      </nav>

      {/* WOD + Competition Highlight */}
      <section className={s.highlight}>
        <div className={s.highlightInner}>
          {/* Today's WOD */}
          <div className={s.highlightCard}>
            <div className={s.highlightHead}>
              <p className="section-tag">TODAY&apos;S WOD</p>
              <Link href="/wod" className={s.viewAll}>전체 보기</Link>
            </div>
            {todayWod ? (
              <Link href="/wod" className={s.wodCard}>
                <div className={s.wodCardTop}>
                  <span className={`badge ${WOD_TYPE_BADGE[todayWod.type] ?? "badge-default"}`}>
                    {WOD_TYPE_LABEL[todayWod.type] ?? todayWod.type}
                  </span>
                  <span className={s.wodDate}>{dayjs(todayWod.wodDate).format("MM.DD")}</span>
                </div>
                <h3 className={s.wodTitle}>{todayWod.title}</h3>
                <p className={s.wodContent}>{todayWod.content}</p>
                <div className={s.wodFooter}>
                  <span className={s.wodScoreType}>SCORE: {todayWod.scoreType}</span>
                  <span className={s.wodArrow}>기록 남기기 →</span>
                </div>
              </Link>
            ) : (
              <Link href="/wod" className={s.emptyCard}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                <p className={s.emptyText}>오늘의 WOD 확인하기 →</p>
              </Link>
            )}
          </div>

          {/* Competition */}
          <div className={s.highlightCard}>
            <div className={s.highlightHead}>
              <p className="section-tag">COMPETITION</p>
              <Link href="/competitions" className={s.viewAll}>전체 보기</Link>
            </div>
            {activeComps.length > 0 ? (
              <div className={s.compList}>
                {activeComps.map((comp) => (
                  <Link key={comp.id} href={`/competitions/${comp.id}`} className={s.compItem}>
                    <div className={s.compItemLeft}>
                      <span className={`badge ${STATUS_BADGE[comp.status]}`}>
                        {STATUS_LABEL[comp.status]}
                      </span>
                      <p className={s.compName}>{comp.name}</p>
                      <p className={s.compMeta}>
                        {dayjs(comp.startDate).format("YYYY.MM.DD")}
                        {comp.city && ` · ${comp.city}`}
                      </p>
                    </div>
                    <span className={s.compArrow}>→</span>
                  </Link>
                ))}
              </div>
            ) : (
              <Link href="/competitions" className={s.emptyCard}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 21h8m-4-4v4M5 3h14l1 7H4L5 3zM4 10c0 4.418 3.582 8 8 8s8-3.582 8-8"/>
                </svg>
                <p className={s.emptyText}>대회 일정 확인하기 →</p>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Community Preview */}
      {latestPosts.length > 0 && (
        <section className={s.communitySection}>
          <div className={s.communityInner}>
            <div className={s.sectionHead}>
              <p className="section-tag">COMMUNITY</p>
              <Link href="/community" className={s.viewAll}>전체 보기</Link>
            </div>
            <div className={s.postList}>
              {latestPosts.map((post) => (
                <Link key={post.id} href={`/community/${post.id}`} className={s.postItem}>
                  <span className={`badge ${CATEGORY_BADGE[post.category] ?? "badge-default"}`}>
                    {CATEGORY_LABEL[post.category]}
                  </span>
                  <span className={s.postTitle}>{post.title}</span>
                  <div className={s.postMeta}>
                    <span>{post.userName}</span>
                    <span className={s.postDot}>·</span>
                    <span>{dayjs(post.createdAt).format("MM.DD")}</span>
                    <span className={s.postDot}>·</span>
                    <span>댓글 {post.commentCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Challenge Preview */}
      {challenges && challenges.length > 0 && (
        <section className={s.challengeSection}>
          <div className={s.challengeInner}>
            <div className={s.sectionHead}>
              <p className="section-tag">CHALLENGE</p>
              <Link href="/challenges" className={s.viewAll}>전체 보기</Link>
            </div>
            <div className={s.challengeGrid}>
              {challenges.slice(0, 3).map((c) => (
                <Link key={c.id} href={`/challenges/${c.id}`} className={s.challengeCard}>
                  <span className="badge badge-open" style={{ fontSize: 10, letterSpacing: 1 }}>
                    {c.type === "WOD" ? "WOD" : c.type === "EXERCISE" ? "운동" : c.type === "DIET" ? "식단" : "자유"}
                  </span>
                  <p className={s.challengeName}>{c.title}</p>
                  <p className={s.challengeMeta}>목표 {c.targetDays}일 · 참가 {c.participantCount.toLocaleString()}명</p>
                  <span className={s.challengeArrow}>참여하기 →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Box Ranking */}
      {boxRanking && boxRanking.length > 0 && (
        <section className={s.rankSection}>
          <div className={s.rankInner}>
            <div className={s.sectionHead}>
              <p className="section-tag">BOX RANKING</p>
              <Link href="/wod" className={s.viewAll}>전체 보기</Link>
            </div>
            <div className={s.rankList}>
              {boxRanking.slice(0, 5).map((box, idx) => (
                <Link key={box.boxId} href={`/boxes/${box.boxId}`} className={s.rankItem}>
                  <span className={`${s.rankNum} ${idx === 0 ? s.rankNumFirst : ""}`}>{idx + 1}</span>
                  <div className={s.rankBody}>
                    <p className={s.rankBoxName}>{box.boxName}</p>
                    <p className={s.rankBoxCity}>{box.boxCity}</p>
                  </div>
                  <div className={s.rankStats}>
                    <span className={s.rankStat}>참여 {box.participantCount}명</span>
                    <span className={s.rankStatRx}>RX {box.rxCount}명</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* My Box */}
      {loggedIn && myBox && (
        <section className={s.myBoxSection}>
          <div className={s.myBoxInner}>
            <p className="section-tag">MY BOX</p>
            <Link href={`/boxes/${myBox.boxId}`} className={s.myBoxCard}>
              <div>
                <p className={s.myBoxName}>{myBox.boxName}</p>
                <p className={s.myBoxMeta}>{myBox.boxCity} {myBox.boxDistrict} · 멤버 {myBox.memberCount}명</p>
                <p className={s.myBoxDays}>가입 {myBox.daysInBox}일째</p>
              </div>
              <span className={s.myBoxArrow}>→</span>
            </Link>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className={s.cta}>
        <div className={s.ctaInner}>
          <h2 className={s.ctaTitle}>
            박스를 운영하고<br />계신가요?
          </h2>
          <p className={s.ctaDesc}>
            CrossFit Korea에 박스를 등록하고<br />
            더 많은 회원과 연결되세요.
          </p>
          <Link href={boxRegisterHref} className="btn-primary">무료 박스 등록</Link>
        </div>
      </section>
    </>
  );
}
