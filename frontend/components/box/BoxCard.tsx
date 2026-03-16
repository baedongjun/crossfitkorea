import Link from "next/link";
import { Box } from "@/types";
import s from "./BoxCard.module.css";

export default function BoxCard({ box }: { box: Box }) {
  const img = box.imageUrls?.[0] || "";

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
        </div>

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
