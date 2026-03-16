"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { boxApi, wodApi, competitionApi, communityApi } from "@/lib/api";
import { isLoggedIn, getUser } from "@/lib/auth";
import { Box, Wod, Competition, Post } from "@/types";
import BoxCard from "@/components/box/BoxCard";
import dayjs from "dayjs";
import s from "./page.module.css";

const CITIES = [
  { name: "서울", count: "120+" },
  { name: "경기", count: "80+" },
  { name: "부산", count: "45+" },
  { name: "인천", count: "30+" },
  { name: "대구", count: "25+" },
  { name: "대전", count: "20+" },
  { name: "광주", count: "18+" },
  { name: "제주", count: "10+" },
];

const QUICK_LINKS = [
  {
    href: "/boxes",
    label: "박스 찾기",
    sub: "전국 크로스핏 박스",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    ),
  },
  {
    href: "/wod",
    label: "오늘의 WOD",
    sub: "매일 업데이트",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
  },
  {
    href: "/competitions",
    label: "대회 일정",
    sub: "전국 대회 정보",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 21h8m-4-4v4M5 3h14l1 7H4L5 3zM4 10c0 4.418 3.582 8 8 8s8-3.582 8-8"/>
      </svg>
    ),
  },
  {
    href: "/community",
    label: "커뮤니티",
    sub: "회원 게시판",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    href: "/my",
    label: "내 활동",
    sub: "기록 & 즐겨찾기",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    href: "/boxes/create",
    label: "박스 등록",
    sub: "무료로 시작",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
];

const FEATURES = [
  {
    href: "/boxes",
    title: "지역별 박스 검색",
    desc: "카카오맵 기반으로 내 주변 크로스핏 박스를 지도에서 바로 찾아보세요.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5"/>
      </svg>
    ),
  },
  {
    href: "/boxes",
    title: "수업 시간표",
    desc: "박스별 수업 시간표를 요일 기준으로 한눈에 확인하세요.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="0"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="9" y1="4" x2="9" y2="22"/>
      </svg>
    ),
  },
  {
    href: "/wod",
    title: "오늘의 WOD",
    desc: "매일 업데이트되는 WOD를 확인하고 기록을 남겨보세요.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
  },
  {
    href: "/competitions",
    title: "대회 일정",
    desc: "전국 크로스핏 대회 정보를 한곳에서 확인하고 접수하세요.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 21h8m-4-4v4M5 3h14l1 7H4L5 3zM4 10c0 4.418 3.582 8 8 8s8-3.582 8-8"/>
      </svg>
    ),
  },
];

const STATS = [
  { num: "300+",   label: "등록 박스" },
  { num: "17",     label: "서비스 지역" },
  { num: "5,000+", label: "커뮤니티 회원" },
  { num: "매일",   label: "WOD 업데이트" },
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

  const { data: premiumBoxes } = useQuery({
    queryKey: ["premium-boxes"],
    queryFn: async () => (await boxApi.getPremium()).data.data as Box[],
  });

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
            시간표·코치·후기를 한눈에 확인하세요.<br />
            오늘의 WOD와 대회 일정도 제공합니다.
          </p>
          <div className={s.heroCta}>
            <Link href="/boxes" className="btn-primary">박스 찾기</Link>
            <Link href="/wod" className="btn-secondary">오늘의 WOD</Link>
            <Link href="/competitions" className="btn-secondary">대회 일정</Link>
            <Link href="/community" className="btn-secondary">커뮤니티</Link>
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

      {/* Stats */}
      <div className={s.stats}>
        <div className={s.statsGrid}>
          {STATS.map((st) => (
            <div key={st.label} className={`${s.statItem} fade-in`}>
              <p className={s.statNum}>{st.num}</p>
              <p className={s.statLabel}>{st.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Today's WOD Preview */}
      <section className={s.wodSection}>
        <div className={s.wodInner}>
          <div className={s.wodHeader}>
            <div>
              <p className="section-tag">TODAY&apos;S WOD</p>
              <h2 className="section-title">오늘의<br /><span>운동</span></h2>
            </div>
            <Link href="/wod" className={s.viewAll}>전체 보기</Link>
          </div>

          {todayWod ? (
            <Link href="/wod" className={s.wodCard}>
              <div className={s.wodCardTop}>
                <span className={`badge ${WOD_TYPE_BADGE[todayWod.type] ?? "badge-default"}`}>
                  {WOD_TYPE_LABEL[todayWod.type] ?? todayWod.type}
                </span>
                <span className={s.wodDate}>{dayjs(todayWod.wodDate).format("YYYY.MM.DD")}</span>
              </div>
              <h3 className={s.wodTitle}>{todayWod.title}</h3>
              <p className={s.wodContent}>{todayWod.content}</p>
              <div className={s.wodFooter}>
                <span className={s.wodScoreType}>SCORE: {todayWod.scoreType}</span>
                <span className={s.wodArrow}>기록 남기기 →</span>
              </div>
            </Link>
          ) : (
            <Link href="/wod" className={s.wodEmpty}>
              <div className={s.wodEmptyIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <p className={s.wodEmptyText}>오늘의 WOD 확인하기</p>
              <p className={s.wodEmptySub}>WOD 페이지에서 확인하세요 →</p>
            </Link>
          )}
        </div>
      </section>

      {/* Premium Boxes */}
      {premiumBoxes && premiumBoxes.length > 0 && (
        <section className={s.premium}>
          <div className={s.premiumInner}>
            <div className={s.premiumHeader}>
              <div>
                <p className="section-tag">FEATURED</p>
                <h2 className="section-title">
                  프리미엄<br /><span>박스</span>
                </h2>
              </div>
              <Link href="/boxes?premium=true" className={s.viewAll}>전체 보기</Link>
            </div>
            <div className={s.premiumGrid}>
              {premiumBoxes.slice(0, 3).map((box) => (
                <BoxCard key={box.id} box={box} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cities */}
      <section className={s.cities}>
        <div className={s.citiesInner}>
          <div className={s.citiesHeader}>
            <div>
              <p className="section-tag">지역별 검색</p>
              <h2 className="section-title">
                가까운 박스를<br /><span>찾아보세요</span>
              </h2>
            </div>
            <Link href="/boxes" className={s.viewAll}>전체 보기</Link>
          </div>
          <div className={s.cityGrid}>
            {CITIES.map((city) => (
              <Link key={city.name} href={`/boxes?city=${city.name}`} className={s.cityCard}>
                <p className={s.cityName}>{city.name}</p>
                <p className={s.cityCount}>{city.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Competitions Preview */}
      <section className={s.compSection}>
        <div className={s.compInner}>
          <div className={s.compHeader}>
            <div>
              <p className="section-tag">COMPETITION</p>
              <h2 className="section-title">대회<br /><span>일정</span></h2>
            </div>
            <Link href="/competitions" className={s.viewAll}>전체 보기</Link>
          </div>

          {activeComps.length > 0 ? (
            <div className={s.compList}>
              {activeComps.map((comp) => (
                <Link key={comp.id} href="/competitions" className={s.compItem}>
                  <div className={s.compItemLeft}>
                    <span className={`badge ${STATUS_BADGE[comp.status]}`}>
                      {STATUS_LABEL[comp.status]}
                    </span>
                    <p className={s.compName}>{comp.name}</p>
                    <p className={s.compMeta}>
                      {dayjs(comp.startDate).format("YYYY.MM.DD")}
                      {comp.city && ` · ${comp.city}`}
                      {comp.location && ` ${comp.location}`}
                    </p>
                  </div>
                  <div className={s.compItemRight}>
                    {comp.registrationDeadline && (
                      <p className={s.compDeadline}>
                        접수 마감 {dayjs(comp.registrationDeadline).format("MM.DD")}
                      </p>
                    )}
                    <span className={s.compArrow}>→</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Link href="/competitions" className={s.compEmpty}>
              대회 일정 확인하기 →
            </Link>
          )}
        </div>
      </section>

      {/* Features */}
      <section className={s.features}>
        <div className={s.featuresInner}>
          <div>
            <p className="section-tag">서비스 소개</p>
            <h2 className="section-title">
              CrossFit Korea에서<br /><span>할 수 있는 것</span>
            </h2>
          </div>
          <div className={s.featuresGrid}>
            {FEATURES.map((f) => (
              <Link key={f.title} href={f.href} className={`${s.featureCard} fade-in`}>
                <div className={s.featureIcon}>{f.icon}</div>
                <h3 className={s.featureTitle}>{f.title}</h3>
                <p className={s.featureDesc}>{f.desc}</p>
                <span className={s.featureLink}>바로가기 →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Community Preview */}
      {latestPosts.length > 0 && (
        <section className={s.communitySection}>
          <div className={s.communityInner}>
            <div className={s.communityHeader}>
              <div>
                <p className="section-tag">COMMUNITY</p>
                <h2 className="section-title">최근<br /><span>게시글</span></h2>
              </div>
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

      {/* CTA */}
      <section className={s.cta}>
        <div className={s.ctaInner}>
          <h2 className={s.ctaTitle}>
            박스를<br />운영하고 계신가요?
          </h2>
          <p className={s.ctaDesc}>
            CrossFit Korea에 박스를 등록하고 더 많은 회원과 연결되세요.<br />
            프리미엄 노출로 더 높은 가시성을 확보하세요.
          </p>
          <div className={s.ctaButtons}>
            <Link href={boxRegisterHref} className="btn-primary">무료 박스 등록</Link>
            <Link href="/advertise" className="btn-secondary">프리미엄 광고 문의</Link>
          </div>
        </div>
      </section>
    </>
  );
}
