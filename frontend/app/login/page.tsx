"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { authApi } from "@/lib/api";
import { saveAuth } from "@/lib/auth";
import s from "../auth.module.css";

const schema = z.object({
  email: z.string().email("올바른 이메일을 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data);
      saveAuth(res.data.data);
      toast.success("로그인되었습니다.");
      router.push("/");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "로그인에 실패했습니다.");
    }
  };

  return (
    <div className={s.page}>
      <div className={s.wrap}>
        <div className={s.logoWrap}>
          <span className={s.logo}><span>CF</span>KOREA</span>
          <p className={s.pageTitle}>로그인</p>
        </div>

        <div className={s.card}>
          <form onSubmit={handleSubmit(onSubmit)} className={s.form}>
            <div className={s.field}>
              <label className={s.label}>이메일</label>
              <input
                type="email"
                {...register("email")}
                placeholder="example@email.com"
                className="input-field"
                autoComplete="email"
              />
              {errors.email && <p className={s.error}>{errors.email.message}</p>}
            </div>

            <div className={s.field}>
              <label className={s.label}>비밀번호</label>
              <input
                type="password"
                {...register("password")}
                placeholder="비밀번호 입력"
                className="input-field"
                autoComplete="current-password"
              />
              {errors.password && <p className={s.error}>{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className={`btn-primary ${s.submitBtn}`}>
              {isSubmitting ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <p className={s.footer}>
            <Link href="/forgot-password" className={s.footerLink}>비밀번호를 잊으셨나요?</Link>
          </p>
          <p className={s.footer}>
            계정이 없으신가요?{" "}
            <Link href="/signup" className={s.footerLink}>회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
