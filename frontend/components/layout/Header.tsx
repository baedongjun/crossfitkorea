"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clearAuth, getUser, isLoggedIn } from "@/lib/auth";
import { notificationApi } from "@/lib/api";
import { useNotificationSse } from "@/lib/useNotificationSse";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import s from "./Header.module.css";

dayjs.extend(relativeTime);
dayjs.locale("ko");

const NAV_ITEMS = [
  { href: "/boxes",        label: "박스 찾기" },
  { href: "/wod",          label: "오늘의 WOD" },
  { href: "/competitions", label: "대회 일정" },
  { href: "/community",    label: "커뮤니티" },
  { href: "/challenges",   label: "챌린지" },
  { href: "/feed",         label: "피드" },
  { href: "/tools",        label: "도구" },
];

export default function Header() {
  const pathname    = usePathname();
  const router      = useRouter();
  const qc          = useQueryClient();
  const [open,      setOpen]      = useState(false);
  const [loggedIn,  setLoggedIn]  = useState(false);
  const [userName,  setUserName]  = useState<string | null>(null);
  const [userRole,  setUserRole]  = useState<string | null>(null);
  const [showNotif, setShowNotif] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const u = getUser();
    setUserName(u?.name ?? null);
    setUserRole(u?.role ?? null);
    setOpen(false);
    setShowNotif(false);
  }, [pathname]);

  // 외부 클릭 시 알림 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: countData } = useQuery({
    queryKey: ["notifications", "count"],
    queryFn: async () => (await notificationApi.getUnreadCount()).data.data as { count: number },
    enabled: loggedIn,
  });

  // SSE 실시간 알림
  const handleSseNotification = useCallback((event: { id: number; message: string; type: string; link: string }) => {
    qc.invalidateQueries({ queryKey: ["notifications", "count"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
    toast.info(event.message, {
      onClick: () => {
        if (event.link) router.push(event.link);
      },
      autoClose: 5000,
      closeOnClick: true,
    });
  }, [qc, router]);

  useNotificationSse(loggedIn ? handleSseNotification : () => {});

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await notificationApi.getAll()).data.data as Notification[],
    enabled: loggedIn && showNotif,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });

  const unreadCount = countData?.count ?? 0;

  const logout = () => {
    clearAuth();
    setLoggedIn(false);
    router.push("/");
  };

  return (
    <>
      <header className={s.header}>
        <div className={s.inner}>
          <Link href="/" className={s.logo}>
            CF<span>KOREA</span>
          </Link>

          <nav className={s.nav}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${s.navLink} ${pathname.startsWith(item.href) ? s.navLinkActive : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className={s.auth}>
            {/* 검색 버튼 */}
            <Link href="/search" className={s.searchBtn} aria-label="검색">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </Link>

            {loggedIn ? (
              <>
                {userRole === "ROLE_ADMIN" && (
                  <Link href="/admin" className={s.adminLink}>어드민</Link>
                )}
                {(userRole === "ROLE_BOX_OWNER" || userRole === "ROLE_ADMIN") && (
                  <Link href="/my/box" className={s.ownerLink}>내 박스</Link>
                )}

                {/* 알림 벨 */}
                <div className={s.bellWrap} ref={bellRef}>
                  <button
                    className={s.bellBtn}
                    onClick={() => setShowNotif((v) => !v)}
                    aria-label="알림"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    {unreadCount > 0 && (
                      <span className={s.bellBadge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                    )}
                  </button>

                  {showNotif && (
                    <div className={s.notifDropdown}>
                      <div className={s.notifHeader}>
                        <span className={s.notifTitle}>알림</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          {unreadCount > 0 && (
                            <button
                              className={s.notifReadAll}
                              onClick={() => markAllMutation.mutate()}
                            >
                              모두 읽음
                            </button>
                          )}
                          <Link href="/notifications" className={s.notifReadAll} onClick={() => setShowNotif(false)}>
                            전체 보기
                          </Link>
                        </div>
                      </div>
                      <div className={s.notifList}>
                        {!notifications || (notifications as unknown as Notif[]).length === 0 ? (
                          <div className={s.notifEmpty}>새 알림이 없습니다</div>
                        ) : (
                          (notifications as unknown as Notif[]).map((n) => (
                            <div
                              key={n.id}
                              className={`${s.notifItem} ${!n.read ? s.notifItemUnread : ""}`}
                              onClick={() => {
                                if (!n.read) markOneMutation.mutate(n.id);
                                if (n.link) router.push(n.link);
                                setShowNotif(false);
                              }}
                            >
                              <p className={s.notifMsg}>{n.message}</p>
                              <p className={s.notifTime}>{dayjs(n.createdAt).fromNow()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link href="/my" className={s.userName}>{userName}</Link>
                <button onClick={logout} className="btn-secondary" style={{ fontSize: 13, padding: "8px 16px" }}>로그아웃</button>
              </>
            ) : (
              <>
                <Link href="/login"  className={`btn-secondary ${s.authSecondary}`}>로그인</Link>
                <Link href="/signup" className={`btn-primary  ${s.authPrimary}`}>회원가입</Link>
              </>
            )}
          </div>

          <button
            className={s.menuBtn}
            onClick={() => setOpen(!open)}
            aria-label="메뉴"
          >
            {open ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="17" x2="21" y2="17"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className={`${s.mobileMenu} ${open ? s.mobileMenuOpen : ""}`}>
        <nav className={s.mobileNav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={s.mobileNavLink}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/search" className={s.mobileNavLink} onClick={() => setOpen(false)}>
            🔍 전체 검색
          </Link>
        </nav>
        <div className={s.mobileAuth}>
          {loggedIn ? (
            <>
              {userRole === "ROLE_ADMIN" && (
                <Link href="/admin" className={s.mobileAdminLink} onClick={() => setOpen(false)}>어드민 패널</Link>
              )}
              {(userRole === "ROLE_BOX_OWNER" || userRole === "ROLE_ADMIN") && (
                <Link href="/my/box" className="btn-secondary" onClick={() => setOpen(false)} style={{ textAlign: "center" }}>내 박스 관리</Link>
              )}
              <Link href="/my" className="btn-secondary" onClick={() => setOpen(false)}>마이페이지</Link>
              <button onClick={logout} className="btn-secondary" style={{ flex: 1, padding: 12 }}>로그아웃</button>
            </>
          ) : (
            <>
              <Link href="/login"  className="btn-secondary" onClick={() => setOpen(false)}>로그인</Link>
              <Link href="/signup" className="btn-primary"   onClick={() => setOpen(false)}>회원가입</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// 타입 정의
interface Notif {
  id: number;
  type: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}
