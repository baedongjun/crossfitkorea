"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import { toast } from "react-toastify";
import styles from "@/app/auth.module.css";

const Spinner = () => (
  <div style={{
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)",
  }}>
    <div style={{
      width: 40,
      height: 40,
      border: "3px solid var(--border)",
      borderTop: "3px solid var(--red)",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function OAuth2RegisterInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState("");
  const [boxOwner, setBoxOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    authApi.getOAuth2RegisterInfo(token)
      .then((res) => {
        const info = res.data.data;
        setName(info.name || "");
        setEmail(info.email || "");
        setProvider(info.provider || "");
      })
      .catch(() => {
        toast.error("유효하지 않거나 만료된 링크입니다. 다시 로그인해주세요.");
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authApi.registerOAuth2User(token, name.trim(), boxOwner);
      const auth = res.data.data;
      saveAuth({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        email: auth.email,
        name: auth.name,
        role: auth.role,
      });
      toast.success(`${auth.name}님, 환영합니다!`);
      router.replace("/");
    } catch {
      toast.error("회원가입 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  const providerLabel = provider === "KAKAO" ? "카카오" : provider === "GOOGLE" ? "구글" : provider;

  return (
    <div className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.logoWrap}>
          <span className={styles.logo}>
            CROSSFIT<span>KOREA</span>
          </span>
          <p className={styles.pageTitle}>{providerLabel} 간편가입</p>
        </div>

        <div className={styles.card}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label}>이름</label>
              <input
                className="input-field"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력해주세요"
                maxLength={30}
                required
              />
            </div>

            {email && (
              <div className={styles.field}>
                <label className={styles.label}>이메일</label>
                <input
                  className="input-field"
                  type="email"
                  value={email}
                  disabled
                  style={{ opacity: 0.6, cursor: "not-allowed" }}
                />
                <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                  {providerLabel} 계정의 이메일이 사용됩니다
                </span>
              </div>
            )}

            <div
              className={styles.checkRow}
              onClick={() => setBoxOwner((v) => !v)}
            >
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={boxOwner}
                onChange={(e) => setBoxOwner(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <div>
                <span className={styles.checkLabel}>크로스핏 박스를 운영하고 있어요</span>
                <span className={styles.checkDesc}>
                  박스 오너로 가입하면 박스 등록, WOD 등록, 코치/시간표 관리 기능을 사용할 수 있습니다
                </span>
              </div>
            </div>

            <button
              type="submit"
              className={`btn-primary ${styles.submitBtn}`}
              disabled={submitting}
            >
              {submitting ? "가입 중..." : "가입 완료"}
            </button>
          </form>
        </div>

        <div className={styles.footer}>
          <a href="/login" className={styles.footerLink}>로그인 페이지로 돌아가기</a>
        </div>
      </div>
    </div>
  );
}

export default function OAuth2RegisterPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <OAuth2RegisterInner />
    </Suspense>
  );
}
