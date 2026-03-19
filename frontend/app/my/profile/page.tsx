"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { userApi, uploadApi } from "@/lib/api";
import { isLoggedIn, getUser, setUser } from "@/lib/auth";
import { toast } from "react-toastify";
import s from "./profile.module.css";

export default function ProfileEditPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const currentUser = getUser();

  const [form, setForm] = useState({ name: "", phone: "", profileImageUrl: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
  }, [router]);

  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await userApi.getMe()).data.data,
    enabled: isLoggedIn(),
  });

  useEffect(() => {
    if (me) {
      setForm({ name: me.name || "", phone: me.phone || "", profileImageUrl: me.profileImageUrl || "" });
    }
  }, [me]);

  const updateMutation = useMutation({
    mutationFn: () => userApi.updateMe({ name: form.name, phone: form.phone || undefined, profileImageUrl: form.profileImageUrl || undefined }),
    onSuccess: (res) => {
      const updated = res.data.data;
      if (currentUser) {
        setUser({ ...currentUser, name: updated.name, profileImageUrl: updated.profileImageUrl });
      }
      toast.success("프로필이 업데이트되었습니다.");
      router.push("/my");
    },
    onError: () => toast.error("업데이트에 실패했습니다."),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("파일 크기는 5MB 이하여야 합니다."); return; }
    setUploading(true);
    try {
      const res = await uploadApi.uploadImage(file, "profiles");
      setForm(f => ({ ...f, profileImageUrl: res.data.data }));
      toast.success("이미지가 업로드되었습니다.");
    } catch {
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  if (!isLoggedIn()) return null;

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <Link href="/my" className={s.back}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          마이페이지
        </Link>

        <h1 className={s.title}>프로필 수정</h1>
        <p className={s.sub}>이름, 프로필 사진을 변경할 수 있습니다</p>

        {isLoading ? (
          <div className={s.skeleton} />
        ) : (
          <div className={s.form}>
            {/* Profile Image */}
            <div className={s.avatarSection}>
              <div className={s.avatarWrap} onClick={() => fileRef.current?.click()}>
                {form.profileImageUrl ? (
                  <Image src={form.profileImageUrl} alt="프로필" fill style={{ objectFit: "cover" }} />
                ) : (
                  <div className={s.avatarPlaceholder}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                )}
                <div className={s.avatarOverlay}>
                  {uploading ? (
                    <span className={s.avatarOverlayText}>업로드 중...</span>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                      </svg>
                      <span className={s.avatarOverlayText}>사진 변경</span>
                    </>
                  )}
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
              {form.profileImageUrl && (
                <button className={s.removePhotoBtn} onClick={() => setForm(f => ({ ...f, profileImageUrl: "" }))}>
                  사진 제거
                </button>
              )}
            </div>

            {/* Fields */}
            <div className={s.field}>
              <label className={s.label}>이름 *</label>
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="이름을 입력하세요"
                maxLength={50}
              />
            </div>

            <div className={s.field}>
              <label className={s.label}>전화번호</label>
              <input
                className="input-field"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="010-0000-0000"
                type="tel"
              />
            </div>

            <div className={s.field}>
              <label className={s.label}>이메일</label>
              <input
                className="input-field"
                value={me?.email || ""}
                disabled
                style={{ opacity: 0.5, cursor: "not-allowed" }}
              />
              <p className={s.hint}>이메일은 변경할 수 없습니다</p>
            </div>

            <div className={s.actions}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                disabled={!form.name.trim() || updateMutation.isPending || uploading}
                onClick={() => updateMutation.mutate()}
              >
                {updateMutation.isPending ? "저장 중..." : "저장하기"}
              </button>
              <Link href="/my/password" className="btn-secondary" style={{ flex: 1, textAlign: "center", padding: "15px 32px" }}>
                비밀번호 변경
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
