"use client";

import { useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api";
import s from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("이메일을 입력해주세요."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setTempPassword(res.data.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "등록된 이메일이 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.wrap}>
        <div className={s.logoWrap}>
          <span className={s.logo}><span>CF</span>KOREA</span>
          <p className={s.pageTitle}>비밀번호 찾기</p>
        </div>

        <div className={s.card}>
          {tempPassword ? (
            <div>
              <div style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
                padding: "20px 24px",
                marginBottom: 24,
              }}>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>임시 비밀번호가 발급되었습니다</p>
                <p style={{
                  fontSize: 24,
                  fontFamily: "'Bebas Neue', sans-serif",
                  letterSpacing: 4,
                  color: "#22c55e",
                }}>
                  {tempPassword}
                </p>
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24, lineHeight: 1.8 }}>
                위 임시 비밀번호로 로그인 후<br />
                마이페이지 → 비밀번호 변경에서 새 비밀번호로 변경해주세요.
              </p>
              <Link href="/login" className={`btn-primary ${s.submitBtn}`}>
                로그인하러 가기
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={s.form}>
              <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 20, lineHeight: 1.7 }}>
                가입 시 사용한 이메일을 입력하면<br />임시 비밀번호를 발급해드립니다.
              </p>
              <div className={s.field}>
                <label className={s.label}>이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="input-field"
                  autoComplete="email"
                />
                {error && <p className={s.error}>{error}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`btn-primary ${s.submitBtn}`}
              >
                {loading ? "처리 중..." : "임시 비밀번호 발급"}
              </button>
            </form>
          )}

          <p className={s.footer}>
            <Link href="/login" className={s.footerLink}>← 로그인으로 돌아가기</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
