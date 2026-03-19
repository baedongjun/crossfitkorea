"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { toast } from "react-toastify";
import s from "./password.module.css";

export default function PasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mutation = useMutation({
    mutationFn: () => userApi.changePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => {
      toast.success("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      router.push("/login");
    },
    onError: () => toast.error("비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해주세요."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!current || !next || !confirm) {
      toast.error("모든 항목을 입력해주세요.");
      return;
    }
    if (next.length < 8) {
      toast.error("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (next !== confirm) {
      toast.error("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className={s.page}>
      <div className={s.content}>
        <Link href="/my" className={s.back}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          내 정보
        </Link>

        <div className={s.header}>
          <p className={s.tag}>SECURITY</p>
          <h1 className={s.title}>비밀번호 변경</h1>
        </div>

        <div className={s.card}>
          <form onSubmit={handleSubmit} className={s.form}>
            <div className={s.field}>
              <label className={s.label}>현재 비밀번호</label>
              <input
                type="password"
                className="input-field"
                placeholder="현재 비밀번호"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className={s.divider} />

            <div className={s.field}>
              <label className={s.label}>새 비밀번호</label>
              <input
                type="password"
                className="input-field"
                placeholder="8자 이상"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className={s.field}>
              <label className={s.label}>새 비밀번호 확인</label>
              <input
                type="password"
                className="input-field"
                placeholder="새 비밀번호 재입력"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
              {confirm && next !== confirm && (
                <p className={s.errorMsg}>비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            <div className={s.actions}>
              <Link href="/my" className="btn-secondary" style={{ padding: "12px 24px" }}>취소</Link>
              <button
                type="submit"
                className="btn-primary"
                disabled={mutation.isPending || !current || !next || next !== confirm}
                style={{ padding: "12px 32px" }}
              >
                {mutation.isPending ? "변경 중..." : "비밀번호 변경"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
