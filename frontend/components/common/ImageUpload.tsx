"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { uploadApi } from "@/lib/api";
import s from "./ImageUpload.module.css";

interface Props {
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

export default function ImageUpload({ value, onChange, placeholder = "이미지 업로드" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setUploading(true);
    try {
      const res = await uploadApi.getPresignedUrl(file.name, "general", file.type);
      const { presignedUrl, publicUrl } = res.data.data;

      await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      setPreview(publicUrl);
      onChange(publicUrl);
    } catch {
      alert("업로드에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={s.wrap}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {preview ? (
        <div className={s.preview}>
          <Image src={preview} alt="미리보기" fill style={{ objectFit: "cover" }} />
          <button
            type="button"
            className={s.removeBtn}
            onClick={() => { setPreview(null); onChange(""); }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={s.uploadBtn}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <span className={s.spinner} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          )}
          <span>{uploading ? "업로드 중..." : placeholder}</span>
        </button>
      )}
    </div>
  );
}
