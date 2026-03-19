"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isLoggedIn } from "@/lib/auth";
import { toast } from "react-toastify";
import s from "./notifSettings.module.css";

const STORAGE_KEY = "notif_settings";

interface NotifSettings {
  comment: boolean;
  reply: boolean;
  review: boolean;
  badge: boolean;
  membership: boolean;
  competition: boolean;
  system: boolean;
  emailDigest: boolean;
  pushEnabled: boolean;
}

const DEFAULT_SETTINGS: NotifSettings = {
  comment: true,
  reply: true,
  review: true,
  badge: true,
  membership: true,
  competition: true,
  system: true,
  emailDigest: false,
  pushEnabled: true,
};

const NOTIF_ITEMS = [
  { key: "comment",     label: "댓글 알림",       desc: "내 게시글에 댓글이 달렸을 때" },
  { key: "reply",       label: "대댓글 알림",      desc: "내 댓글에 대댓글이 달렸을 때" },
  { key: "review",      label: "후기 알림",        desc: "내 박스에 후기가 등록되었을 때" },
  { key: "badge",       label: "배지 획득 알림",   desc: "새 배지를 획득했을 때" },
  { key: "membership",  label: "박스 가입 알림",   desc: "박스 가입/탈퇴 처리가 완료되었을 때" },
  { key: "competition", label: "대회 알림",        desc: "신청한 대회 상태 변경 시" },
  { key: "system",      label: "시스템 알림",      desc: "공지사항 및 중요 알림" },
] as const;

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotifSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setSettings(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [router]);

  const toggle = (key: keyof NotifSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    toast.success("알림 설정이 저장되었습니다.");
    setTimeout(() => setSaved(false), 3000);
  };

  const resetAll = (value: boolean) => {
    const updated = { ...settings };
    NOTIF_ITEMS.forEach(({ key }) => { (updated as Record<string, boolean>)[key] = value; });
    setSettings(updated);
    setSaved(false);
  };

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <Link href="/my" className={s.back}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          마이페이지
        </Link>

        <div className={s.header}>
          <p className={s.tag}>NOTIFICATION</p>
          <h1 className={s.title}>알림 설정</h1>
          <p className={s.sub}>받을 알림 종류를 설정하세요</p>
        </div>

        {/* In-app notifications */}
        <div className={s.section}>
          <div className={s.sectionHeader}>
            <p className={s.sectionTitle}>앱 알림</p>
            <div className={s.sectionActions}>
              <button className="btn-secondary" style={{ fontSize: 12, padding: "5px 12px" }} onClick={() => resetAll(true)}>전체 켜기</button>
              <button className="btn-secondary" style={{ fontSize: 12, padding: "5px 12px" }} onClick={() => resetAll(false)}>전체 끄기</button>
            </div>
          </div>
          <div className={s.list}>
            {NOTIF_ITEMS.map(({ key, label, desc }) => (
              <div key={key} className={s.item}>
                <div className={s.itemInfo}>
                  <p className={s.itemLabel}>{label}</p>
                  <p className={s.itemDesc}>{desc}</p>
                </div>
                <button
                  className={`${s.toggle} ${settings[key as keyof NotifSettings] ? s.toggleOn : ""}`}
                  onClick={() => toggle(key as keyof NotifSettings)}
                  aria-label={label}
                >
                  <span className={s.toggleThumb} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Push / Email */}
        <div className={s.section}>
          <p className={s.sectionTitle}>기타 설정</p>
          <div className={s.list}>
            <div className={s.item}>
              <div className={s.itemInfo}>
                <p className={s.itemLabel}>푸시 알림</p>
                <p className={s.itemDesc}>브라우저 푸시 알림 허용 (PWA 지원 시)</p>
              </div>
              <button
                className={`${s.toggle} ${settings.pushEnabled ? s.toggleOn : ""}`}
                onClick={() => toggle("pushEnabled")}
                aria-label="푸시 알림"
              >
                <span className={s.toggleThumb} />
              </button>
            </div>
            <div className={s.item}>
              <div className={s.itemInfo}>
                <p className={s.itemLabel}>이메일 다이제스트</p>
                <p className={s.itemDesc}>주간 활동 요약을 이메일로 받기</p>
              </div>
              <button
                className={`${s.toggle} ${settings.emailDigest ? s.toggleOn : ""}`}
                onClick={() => toggle("emailDigest")}
                aria-label="이메일 다이제스트"
              >
                <span className={s.toggleThumb} />
              </button>
            </div>
          </div>
        </div>

        <div className={s.footer}>
          <button
            className="btn-primary"
            style={{ padding: "13px 40px", fontSize: 14 }}
            onClick={save}
          >
            {saved ? "저장됨 ✓" : "설정 저장"}
          </button>
          <Link href="/notifications" className="btn-secondary" style={{ padding: "13px 24px", fontSize: 14 }}>
            알림 목록 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
