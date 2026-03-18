"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import s from "../success/success.module.css";

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams.get("message") || "결제가 취소되었습니다.";
  const code = searchParams.get("code");

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.iconFail}>✕</div>
        <h1 className={s.title}>결제 실패</h1>
        <p className={s.desc}>{message}</p>
        {code && <p style={{ fontSize: 12, color: "var(--muted)" }}>오류 코드: {code}</p>}
        <div className={s.actions}>
          <button className="btn-primary" style={{ padding: "12px 32px" }} onClick={() => router.back()}>
            다시 시도
          </button>
          <Link href="/competitions" className="btn-secondary" style={{ padding: "12px 32px", display: "inline-block", textAlign: "center" }}>
            대회 목록
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div style={{ paddingTop: 120, textAlign: "center", color: "#888" }}>로딩 중...</div>}>
      <PaymentFailContent />
    </Suspense>
  );
}
