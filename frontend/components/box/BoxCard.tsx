"use client";

import { useState } from "react";
import Link from "next/link";
import { Box } from "@/types";
import { boxApi } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import s from "./BoxCard.module.css";

function isOpenNow(openTime?: string, closeTime?: string): boolean | null {
  if (!openTime || !closeTime) return null;
  const now = new Date();
  const [oh, om] = openTime.split(":").map(Number);
  const [ch, cm] = closeTime.split(":").map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;
  return nowMins >= openMins && nowMins < closeMins;
}

export default function BoxCard({ box }: { box: Box }) {
  const img = box.imageUrls?.[0] || "";
  const [favorited, setFavorited] = useState(false);
  const [toggling, setToggling] = useState(false);
  const openStatus = isOpenNow(box.openTime, box.closeTime);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLoggedIn() || toggling) return;
    setToggling(true);
    try {
      await boxApi.toggleFavorite(box.id);
      setFavorited((f) => !f);
    } finally {
      setToggling(false);
    }
  };

  return (
    <Link href={`/boxes/${box.id}`} className={s.card}>
      <div className={s.imgWrap}>
        {img ? (
          <img src={img} alt={box.name} className={s.img} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
          </div>
        )}

        <div className={s.badges}>
          {box.premium  && <span className="badge badge-premium">PREMIUM</span>}
          {box.verified && <span className="badge badge-verified">인증</span>}
          {openStatus === true  && <span className={s.openBadge}>영업중</span>}
          {openStatus === false && <span className={s.closedBadge}>영업종료</span>}
        </div>

        {isLoggedIn() && (
          <button className={`${s.favoriteBtn} ${favorited ? s.favoriteBtnActive : ""}`} onClick={handleFavorite} title="즐겨찾기">
            <svg width="16" height="16" viewBox="0 0 24 24" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        )}

        <div className={s.ratingBadge}>
          <span className={s.star}>★</span>
          {box.rating ? Number(box.rating).toFixed(1) : "0.0"}
          <span className={s.reviewCount}>({box.reviewCount})</span>
        </div>
      </div>

      <div className={s.body}>
        <h3 className={s.name}>{box.name}</h3>

        <div className={s.meta}>
          <div className={s.metaItem}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            <span className={s.metaText}>{box.address}</span>
          </div>

          {(box.openTime || box.closeTime) && (
            <div className={s.metaItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
              </svg>
              <span>{box.openTime} — {box.closeTime}</span>
            </div>
          )}

          {box.phone && (
            <div className={s.metaItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 012 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              <span>{box.phone}</span>
            </div>
          )}
        </div>

        <div className={s.footer}>
          <span className={s.feeLabel}>월 회비</span>
          {box.monthlyFee > 0
            ? <span className={s.feeValue}>{box.monthlyFee.toLocaleString()}<span className={s.feeUnit}>원~</span></span>
            : <span className={s.feeInquiry}>문의</span>
          }
        </div>
      </div>
    </Link>
  );
}
