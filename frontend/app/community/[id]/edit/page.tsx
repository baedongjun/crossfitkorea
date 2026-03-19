"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { communityApi, uploadApi } from "@/lib/api";
import { PostCategory } from "@/types";
import { isLoggedIn } from "@/lib/auth";
import { toast } from "react-toastify";
import s from "../../write/write.module.css";

const CATEGORIES: { value: PostCategory; label: string }[] = [
  { value: "FREE", label: "자유게시판" },
  { value: "QNA", label: "질문/답변" },
  { value: "RECORD", label: "운동 기록" },
  { value: "MARKET", label: "중고장터" },
];

export default function PostEditPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PostCategory>("FREE");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: post } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => (await communityApi.getPost(postId)).data.data,
    enabled: !!postId,
  });

  useEffect(() => {
    if (post && !loaded) {
      setTitle(post.title || "");
      setContent(post.content || "");
      setCategory(post.category || "FREE");
      setImageUrls(post.imageUrls || []);
      setLoaded(true);
    }
  }, [post, loaded]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (imageUrls.length + files.length > 5) { toast.error("이미지는 최대 5개까지 첨부할 수 있습니다."); return; }
    setUploading(true);
    try {
      const res = await uploadApi.uploadImages(files, "community");
      setImageUrls((prev) => [...prev, ...(res.data.data as string[])]);
    } catch { toast.error("이미지 업로드에 실패했습니다."); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const mutation = useMutation({
    mutationFn: () => communityApi.updatePost(postId, { title, content, category, imageUrls }),
    onSuccess: () => {
      toast.success("게시글이 수정되었습니다.");
      router.push(`/community/${postId}`);
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 입력해주세요.");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className={s.page}>
      <div className={s.content}>
        <Link href={`/community/${postId}`} className={s.back}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          게시글 보기
        </Link>

        <h1 className={s.pageTitle}>글 수정</h1>

        <div className={s.card}>
          <form onSubmit={handleSubmit} className={s.form}>
            <div className={s.field}>
              <label className={s.label}>카테고리</label>
              <select className={s.select} value={category} onChange={(e) => setCategory(e.target.value as PostCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className={s.field}>
              <label className={s.label}>제목</label>
              <input
                type="text"
                className="input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className={s.field}>
              <label className={s.label}>내용</label>
              <textarea
                className={s.textarea}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className={s.field}>
              <label className={s.label}>이미지 첨부 (최대 5장)</label>
              <div className={s.imageSection}>
                <div className={s.imageList}>
                  {imageUrls.map((url, i) => (
                    <div key={i} className={s.imageItem}>
                      <Image src={url} alt="" fill style={{ objectFit: "cover" }} />
                      <button type="button" className={s.removeImgBtn} onClick={() => setImageUrls((p) => p.filter((_, idx) => idx !== i))}>✕</button>
                    </div>
                  ))}
                  {imageUrls.length < 5 && (
                    <button type="button" className={s.addImgBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? "…" : "+"}
                    </button>
                  )}
                </div>
                <p className={s.imageHint}>JPG, PNG, WEBP · 장당 최대 10MB</p>
                <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageUpload} />
              </div>
            </div>

            <div className={s.actions}>
              <Link href={`/community/${postId}`} className="btn-secondary" style={{ padding: "12px 24px" }}>
                취소
              </Link>
              <button type="submit" className="btn-primary" disabled={mutation.isPending || uploading} style={{ padding: "12px 32px" }}>
                {mutation.isPending ? "저장 중..." : "수정 완료"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
