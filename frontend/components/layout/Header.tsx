"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { clearAuth, getUser, isLoggedIn } from "@/lib/auth";
import s from "./Header.module.css";

const NAV_ITEMS = [
  { href: "/boxes",        label: "박스 찾기" },
  { href: "/wod",          label: "오늘의 WOD" },
  { href: "/competitions", label: "대회 일정" },
  { href: "/community",    label: "커뮤니티" },
];

export default function Header() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open,     setOpen]     = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const u = getUser();
    setUserName(u?.name ?? null);
    setUserRole(u?.role ?? null);
    setOpen(false);
  }, [pathname]);

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
            {loggedIn ? (
              <>
                {userRole === "ROLE_ADMIN" && (
                  <Link href="/admin" className={s.adminLink}>어드민</Link>
                )}
                {(userRole === "ROLE_BOX_OWNER" || userRole === "ROLE_ADMIN") && (
                  <Link href="/my/box" className={s.ownerLink}>내 박스</Link>
                )}
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
        </nav>
        <div className={s.mobileAuth}>
          {loggedIn ? (
            <>
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
