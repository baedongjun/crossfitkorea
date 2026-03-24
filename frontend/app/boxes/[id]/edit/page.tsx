"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import { boxApi, uploadApi } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import AddressSearch from "@/components/common/AddressSearch";
import { toast } from "react-toastify";
import s from "../../create/create.module.css";


export default function BoxEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", address: "", city: "서울", district: "", phone: "",
    website: "", instagram: "", youtube: "", description: "",
    monthlyFee: "", openTime: "06:00", closeTime: "22:00",
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: box } = useQuery({
    queryKey: ["box", id],
    queryFn: async () => (await boxApi.getOne(id)).data.data,
    enabled: !!id,
  });

  useEffect(() => {
    if (box && !loaded) {
      setForm({
        name: box.name || "",
        address: box.address || "",
        city: box.city || "서울",
        district: box.district || "",
        phone: box.phone || "",
        website: box.website || "",
        instagram: box.instagram || "",
        youtube: box.youtube || "",
        description: box.description || "",
        monthlyFee: box.monthlyFee ? String(box.monthlyFee) : "",
        openTime: box.openTime || "06:00",
        closeTime: box.closeTime || "22:00",
      });
      setImageUrls(box.imageUrls || []);
      setLoaded(true);
    }
  }, [box, loaded]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (imageUrls.length + files.length > 5) {
      toast.error("이미지는 최대 5장까지 업로드할 수 있습니다.");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadApi.uploadImages(files, "boxes");
      setImageUrls((prev) => [...prev, ...res.data.data]);
      toast.success(`${files.length}장 업로드 완료`);
    } catch {
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const mutation = useMutation({
    mutationFn: () =>
      boxApi.update(id, {
        ...form,
        monthlyFee: form.monthlyFee ? parseInt(form.monthlyFee) : null,
        imageUrls,
      }),
    onSuccess: () => {
      toast.success("박스 정보가 수정되었습니다.");
      router.push(`/boxes/${id}`);
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim()) {
      toast.error("박스 이름과 주소는 필수입니다.");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className={s.page}>
      <div className={s.content}>
        <Link href={`/boxes/${id}`} className={s.back}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          박스 상세
        </Link>

        <div className={s.header}>
          <p className={s.tag}>BOX EDIT</p>
          <h1 className={s.title}>박스 정보 수정</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={s.section}>
            <p className={s.sectionTitle}>기본 정보</p>
            <div className={s.grid2}>
              <div className={s.field}>
                <label className={s.label}>박스 이름 <span className={s.required}>*</span></label>
                <input className="input-field" value={form.name} onChange={set("name")} />
              </div>
              <div className={s.field}>
                <label className={s.label}>전화번호</label>
                <input className="input-field" value={form.phone} onChange={set("phone")} />
              </div>
            </div>
            <div className={s.field}>
              <label className={s.label}>주소 <span className={s.required}>*</span></label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input-field"
                  style={{ flex: 1 }}
                  value={form.address}
                  readOnly
                  placeholder="주소 검색 버튼을 클릭하세요"
                />
                <AddressSearch
                  buttonClassName="btn-secondary"
                  buttonStyle={{ padding: "0 16px", fontSize: 13, whiteSpace: "nowrap" }}
                  onSelect={({ address, city, district }) =>
                    setForm((f) => ({ ...f, address, city, district }))
                  }
                />
              </div>
            </div>
            <div className={s.grid2}>
              <div className={s.field}>
                <label className={s.label}>지역 <span className={s.required}>*</span></label>
                <input className="input-field" value={form.city} readOnly placeholder="주소 검색 시 자동 입력" />
              </div>
              <div className={s.field}>
                <label className={s.label}>구/군</label>
                <input className="input-field" value={form.district} readOnly placeholder="주소 검색 시 자동 입력" />
              </div>
            </div>
          </div>

          {/* 박스 이미지 */}
          <div className={s.section}>
            <p className={s.sectionTitle}>박스 이미지 (최대 5장)</p>
            <div className={s.imageUploadArea}>
              {imageUrls.map((url, i) => (
                <div key={i} className={s.imagePreview}>
                  <Image src={url} alt={`박스 이미지 ${i + 1}`} fill style={{ objectFit: "cover" }} />
                  <button
                    type="button"
                    className={s.removeImgBtn}
                    onClick={() => removeImage(i)}
                  >✕</button>
                </div>
              ))}
              {imageUrls.length < 5 && (
                <button
                  type="button"
                  className={s.addImgBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <span className={s.uploadingText}>업로드 중...</span>
                  ) : (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      <span>이미지 추가</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
            <p className={s.imageHint}>JPG, PNG, WebP · 최대 10MB · 최대 5장</p>
          </div>

          <div className={s.section}>
            <p className={s.sectionTitle}>운영 정보</p>
            <div className={s.grid3}>
              <div className={s.field}>
                <label className={s.label}>월 회비 (원)</label>
                <input className="input-field" type="number" value={form.monthlyFee} onChange={set("monthlyFee")} />
              </div>
              <div className={s.field}>
                <label className={s.label}>오픈 시간</label>
                <input className="input-field" type="time" value={form.openTime} onChange={set("openTime")} />
              </div>
              <div className={s.field}>
                <label className={s.label}>마감 시간</label>
                <input className="input-field" type="time" value={form.closeTime} onChange={set("closeTime")} />
              </div>
            </div>
          </div>

          <div className={s.section}>
            <p className={s.sectionTitle}>소셜 & 링크</p>
            <div className={s.grid2}>
              <div className={s.field}>
                <label className={s.label}>웹사이트</label>
                <input className="input-field" value={form.website} onChange={set("website")} />
              </div>
              <div className={s.field}>
                <label className={s.label}>인스타그램</label>
                <input className="input-field" value={form.instagram} onChange={set("instagram")} />
              </div>
            </div>
            <div className={s.field}>
              <label className={s.label}>유튜브</label>
              <input className="input-field" value={form.youtube} onChange={set("youtube")} />
            </div>
          </div>

          <div className={s.section}>
            <p className={s.sectionTitle}>박스 소개</p>
            <div className={s.field}>
              <label className={s.label}>소개글</label>
              <textarea className={s.textarea} value={form.description} onChange={set("description")} />
            </div>
          </div>

          <div className={s.actions}>
            <Link href={`/boxes/${id}`} className="btn-secondary" style={{ padding: "15px 32px" }}>취소</Link>
            <button type="submit" className="btn-primary" disabled={mutation.isPending || uploading}>
              {mutation.isPending ? "저장 중..." : "수정 완료"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
