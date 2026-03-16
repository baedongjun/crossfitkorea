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
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
  passwordConfirm: z.string(),
  name: z.string().min(1, "이름을 입력해주세요."),
  phone: z.string().optional(),
  boxOwner: z.boolean().optional(),
}).refine((d) => d.password === d.passwordConfirm, {
  message: "비밀번호가 일치하지 않습니다.",
  path: ["passwordConfirm"],
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordConfirm, ...requestData } = data;
      const res = await authApi.signup(requestData);
      saveAuth(res.data.data);
      toast.success("회원가입이 완료되었습니다.");
      router.push("/");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "회원가입에 실패했습니다.");
    }
  };

  return (
    <div className={s.page}>
      <div className={s.wrap}>
        <div className={s.logoWrap}>
          <span className={s.logo}><span>CF</span>KOREA</span>
          <p className={s.pageTitle}>회원가입</p>
        </div>

        <div className={s.card}>
          <form onSubmit={handleSubmit(onSubmit)} className={s.form}>
            <div className={s.field}>
              <label className={s.label}>이름</label>
              <input type="text" {...register("name")} placeholder="홍길동" className="input-field" />
              {errors.name && <p className={s.error}>{errors.name.message}</p>}
            </div>

            <div className={s.field}>
              <label className={s.label}>이메일</label>
              <input type="email" {...register("email")} placeholder="example@email.com" className="input-field" autoComplete="email" />
              {errors.email && <p className={s.error}>{errors.email.message}</p>}
            </div>

            <div className={s.field}>
              <label className={s.label}>전화번호 (선택)</label>
              <input type="tel" {...register("phone")} placeholder="010-0000-0000" className="input-field" />
            </div>

            <div className={s.field}>
              <label className={s.label}>비밀번호</label>
              <input type="password" {...register("password")} placeholder="8자 이상" className="input-field" autoComplete="new-password" />
              {errors.password && <p className={s.error}>{errors.password.message}</p>}
            </div>

            <div className={s.field}>
              <label className={s.label}>비밀번호 확인</label>
              <input type="password" {...register("passwordConfirm")} placeholder="비밀번호 재입력" className="input-field" autoComplete="new-password" />
              {errors.passwordConfirm && <p className={s.error}>{errors.passwordConfirm.message}</p>}
            </div>

            <label className={s.checkRow}>
              <input type="checkbox" {...register("boxOwner")} className={s.checkbox} />
              <div>
                <span className={s.checkLabel}>크로스핏 박스를 운영 중입니다</span>
                <p className={s.checkDesc}>체크 시 박스 오너 계정으로 가입 — 박스 등록 및 WOD 관리 가능</p>
              </div>
            </label>

            <button type="submit" disabled={isSubmitting} className={`btn-primary ${s.submitBtn}`}>
              {isSubmitting ? "처리 중..." : "회원가입"}
            </button>
          </form>

          <p className={s.footer}>
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className={s.footerLink}>로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
