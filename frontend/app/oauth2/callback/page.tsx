"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveAuth } from "@/lib/auth";
import { userApi } from "@/lib/api";
import { toast } from "react-toastify";

const Spinner = () => (
  <div style={{
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)",
    flexDirection: "column",
    gap: 16,
  }}>
    <div style={{
      width: 40,
      height: 40,
      border: "3px solid var(--border)",
      borderTop: "3px solid var(--red)",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
    <p style={{ color: "var(--muted)", fontSize: 14 }}>로그인 처리 중...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function OAuth2CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    if (error || !accessToken || !refreshToken) {
      toast.error("소셜 로그인에 실패했습니다.");
      router.replace("/login");
      return;
    }

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    userApi.getMe()
      .then((res) => {
        const user = res.data.data;
        saveAuth({
          id: user.id,
          accessToken,
          refreshToken,
          email: user.email,
          name: user.name,
          role: user.role,
        });
        toast.success(`${user.name}님, 환영합니다!`);
        router.replace("/");
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        toast.error("로그인 처리 중 오류가 발생했습니다.");
        router.replace("/login");
      });
  }, [router, searchParams]);

  return <Spinner />;
}

export default function OAuth2CallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <OAuth2CallbackInner />
    </Suspense>
  );
}
