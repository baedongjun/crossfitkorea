"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import s from "./dashboard.module.css";

dayjs.extend(relativeTime);
dayjs.locale("ko");

export default function AdminDashboard() {
  const [months, setMonths] = useState<3 | 6 | 12>(6);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "dashboard", months],
    queryFn: async () => {
      const res = await adminApi.getDashboard(months);
      return res.data.data as {
        totalUsers: number;
        totalBoxes: number;
        totalPosts: number;
        totalCompetitions: number;
        pendingBoxCount: number;
        totalWodRecords: number;
        totalBadgesAwarded: number;
        monthlySignups: { month: string; count: number }[];
        recentUsers: { id: number; name: string; email: string; role: string; createdAt: string }[];
        recentPosts: { id: number; title: string; userName: string; createdAt: string }[];
        pendingBoxes: { id: number; name: string; city: string; createdAt: string }[];
        boxesByCity: { city: string; count: number }[];
        topBoxesByMembers: { id: number; name: string; memberCount: number }[];
      };
    },
  });

  const ROLE_LABEL: Record<string, string> = {
    ROLE_USER: "일반", ROLE_BOX_OWNER: "오너", ROLE_ADMIN: "관리자",
  };

  const stats = [
    {
      label: "총 박스 수",
      value: data?.totalBoxes ?? 0,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      label: "총 회원 수",
      value: data?.totalUsers ?? 0,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
      ),
    },
    {
      label: "커뮤니티 게시글",
      value: data?.totalPosts ?? 0,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
        </svg>
      ),
    },
    {
      label: "등록된 대회",
      value: data?.totalCompetitions ?? 0,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="8 6 2 12 8 18"/><path d="M2 12h20"/><polyline points="16 6 22 12 16 18"/>
        </svg>
      ),
    },
    {
      label: "WOD 기록 수",
      value: data?.totalWodRecords ?? 0,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
    },
    {
      label: "배지 발급 수",
      value: data?.totalBadgesAwarded ?? 0,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
        </svg>
      ),
    },
  ];

  if (isError) {
    return (
      <div>
        <h1 className={s.pageTitle}>대시보드</h1>
        <div style={{ padding: "40px", textAlign: "center", color: "var(--red)", background: "var(--bg-card)", border: "1px solid rgba(232,34,10,0.3)" }}>
          <p style={{ fontSize: 16, fontWeight: 700 }}>대시보드 데이터를 불러올 수 없습니다.</p>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>서버 로그를 확인해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className={s.pageTitle}>대시보드</h1>

      <div className={s.statsGrid}>
        {stats.map((stat) => (
          <div key={stat.label} className={s.statCard}>
            <div className={s.statIcon}>{stat.icon}</div>
            <div>
              <p className={s.statLabel}>{stat.label}</p>
              <p className={s.statValue}>
                {isLoading ? "—" : stat.value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Signups Chart */}
      {data?.monthlySignups && (
        <div className={s.chartPanel}>
          <div className={s.chartHeader}>
            <p className={s.chartTitle}>월별 신규 회원</p>
            <select
              className={s.monthsSelect}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value) as 3 | 6 | 12)}
            >
              <option value={3}>최근 3개월</option>
              <option value={6}>최근 6개월</option>
              <option value={12}>최근 12개월</option>
            </select>
          </div>
          <div className={s.barChart}>
            {(() => {
              const maxCount = Math.max(...data.monthlySignups.map(m => m.count), 1);
              return data.monthlySignups.map((m) => (
                <div key={m.month} className={s.barItem}>
                  <div className={s.barWrap}>
                    <div
                      className={s.bar}
                      style={{ height: `${Math.max((m.count / maxCount) * 100, m.count > 0 ? 5 : 2)}%` }}
                    >
                      {m.count > 0 && <span className={s.barValue}>{m.count}</span>}
                    </div>
                  </div>
                  <span className={s.barLabel}>{m.month}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* 도시별 박스 분포 + 멤버 수 TOP 5 박스 */}
      {(data?.boxesByCity || data?.topBoxesByMembers) && (
        <div className={s.hBarChartsGrid}>
          {/* 도시별 박스 분포 */}
          {data?.boxesByCity && data.boxesByCity.length > 0 && (
            <div className={s.hBarChartPanel}>
              <p className={s.chartTitle}>도시별 박스 분포</p>
              <div className={s.hBarList}>
                {(() => {
                  const maxCount = Math.max(...data.boxesByCity.map(d => d.count), 1);
                  return data.boxesByCity.map((d) => (
                    <div key={d.city} className={s.hBarRow}>
                      <span className={s.hBarRowLabel}>{d.city}</span>
                      <div className={s.hBarTrack}>
                        <div
                          className={s.hBar}
                          style={{ width: `${Math.max((d.count / maxCount) * 100, 4)}%` }}
                        />
                      </div>
                      <span className={s.hBarRowValue}>{d.count}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* 멤버 수 TOP 5 박스 */}
          {data?.topBoxesByMembers && data.topBoxesByMembers.length > 0 && (
            <div className={s.hBarChartPanel}>
              <p className={s.chartTitle}>멤버 수 TOP 5 박스</p>
              <div className={s.hBarList}>
                {(() => {
                  const maxCount = Math.max(...data.topBoxesByMembers.map(d => d.memberCount), 1);
                  return data.topBoxesByMembers.map((d, i) => (
                    <div key={d.id} className={s.hBarRow}>
                      <span className={s.hBarRank}>{i + 1}</span>
                      <span className={s.hBarRowLabel}>{d.name}</span>
                      <div className={s.hBarTrack}>
                        <div
                          className={s.hBar}
                          style={{ width: `${Math.max((d.memberCount / maxCount) * 100, d.memberCount > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                      <span className={s.hBarRowValue}>{d.memberCount}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={s.bottomGrid}>
        <div className={s.panel}>
          <p className={s.panelTitle}>빠른 작업</p>
          <div className={s.quickLinks}>
            <a href="/admin/boxes" className={s.quickLink}>
              박스 인증 처리
              {(data?.pendingBoxCount ?? 0) > 0 && (
                <span className={s.quickLinkBadge}>{data!.pendingBoxCount}</span>
              )}
              <span style={{ marginLeft: "auto" }}>→</span>
            </a>
            <a href="/admin/wod" className={s.quickLink}>오늘의 WOD 등록 →</a>
            <a href="/admin/competitions" className={s.quickLink}>대회 일정 등록 →</a>
            <a href="/admin/users" className={s.quickLink}>회원 관리 →</a>
            <a href="/admin/posts" className={s.quickLink}>게시글 관리 →</a>
            <a href="/admin/advertisements" className={s.quickLink}>광고 관리 →</a>
          </div>
        </div>

        <div className={s.panel}>
          <p className={s.panelTitle}>서비스 현황</p>
          <div className={s.statusList}>
            <div className={s.statusRow}>
              <span>API 서버</span>
              <span className={s.statusOk}><span className={s.statusDot} />정상</span>
            </div>
            <div className={s.statusRow}>
              <span>데이터베이스</span>
              <span className={s.statusOk}><span className={s.statusDot} />정상</span>
            </div>
            <div className={s.statusRow}>
              <span>Redis 캐시</span>
              <span className={s.statusOk}><span className={s.statusDot} />정상</span>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 활동 피드 */}
      <div className={s.feedGrid}>
        {/* 최근 가입자 */}
        <div className={s.feedPanel}>
          <div className={s.feedHeader}>
            <p className={s.panelTitle}>최근 가입자</p>
            <Link href="/admin/users" className={s.feedMore}>전체 보기 →</Link>
          </div>
          {data?.recentUsers?.map((u) => (
            <div key={u.id} className={s.feedItem}>
              <div className={s.feedAvatar}>{u.name?.[0] || "U"}</div>
              <div className={s.feedInfo}>
                <p className={s.feedName}>{u.name}</p>
                <p className={s.feedMeta}>{u.email} · {ROLE_LABEL[u.role] || u.role}</p>
              </div>
              <span className={s.feedTime}>{dayjs(u.createdAt).fromNow()}</span>
            </div>
          ))}
        </div>

        {/* 최근 게시글 */}
        <div className={s.feedPanel}>
          <div className={s.feedHeader}>
            <p className={s.panelTitle}>최근 게시글</p>
            <Link href="/admin/posts" className={s.feedMore}>전체 보기 →</Link>
          </div>
          {data?.recentPosts?.map((p) => (
            <div key={p.id} className={s.feedItem}>
              <div className={s.feedIcon}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div className={s.feedInfo}>
                <Link href={`/community/${p.id}`} className={s.feedName} style={{ textDecoration: "none" }}>{p.title}</Link>
                <p className={s.feedMeta}>{p.userName}</p>
              </div>
              <span className={s.feedTime}>{dayjs(p.createdAt).fromNow()}</span>
            </div>
          ))}
        </div>

        {/* 인증 대기 박스 */}
        <div className={s.feedPanel}>
          <div className={s.feedHeader}>
            <p className={s.panelTitle}>인증 대기 박스</p>
            <Link href="/admin/boxes" className={s.feedMore}>전체 보기 →</Link>
          </div>
          {(data?.pendingBoxes?.length ?? 0) === 0 ? (
            <p className={s.feedEmpty}>대기 중인 박스가 없습니다</p>
          ) : data?.pendingBoxes?.map((b) => (
            <div key={b.id} className={s.feedItem}>
              <div className={s.feedIcon} style={{ color: "#eab308", borderColor: "rgba(234,179,8,0.3)", background: "rgba(234,179,8,0.08)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
              </div>
              <div className={s.feedInfo}>
                <Link href={`/boxes/${b.id}`} className={s.feedName} style={{ textDecoration: "none" }}>{b.name}</Link>
                <p className={s.feedMeta}>{b.city}</p>
              </div>
              <span className={s.feedTime}>{dayjs(b.createdAt).fromNow()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
