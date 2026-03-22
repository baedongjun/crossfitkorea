"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { boxApi } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import api from "@/lib/api";
import { Box } from "@/types";
import s from "./scan.module.css";

export default function BoxScanPage() {
  const { id } = useParams<{ id: string }>();
  const boxId = Number(id);
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "duplicate" | "error">("idle");
  const [boxName, setBoxName] = useState("");
  const [checkedInAt, setCheckedInAt] = useState("");

  const { data: box } = useQuery({
    queryKey: ["box", boxId],
    queryFn: async () => (await boxApi.getOne(boxId)).data.data as Box,
    enabled: !!boxId,
  });

  const checkInMutation = useMutation({
    mutationFn: () => api.post(`/api/v1/boxes/${boxId}/checkin`),
    onSuccess: (res) => {
      const data = res.data.data;
      setBoxName(data.boxName || box?.name || "");
      setCheckedInAt(data.checkedInAt || "");
      setStatus(data.alreadyCheckedIn ? "duplicate" : "success");
    },
    onError: () => setStatus("error"),
  });

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace(`/login?redirect=/boxes/${boxId}/scan`);
      return;
    }
    setStatus("loading");
    checkInMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={s.page}>
      <div className={s.card}>
        {status === "loading" && (
          <>
            <div className={s.spinner} />
            <p className={s.message}>체크인 처리 중...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className={s.iconSuccess}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <p className={s.label}>체크인 완료!</p>
            <p className={s.boxName}>{boxName || box?.name}</p>
            {checkedInAt && (
              <p className={s.time}>
                {new Date(checkedInAt).toLocaleString("ko-KR", {
                  month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                })}
              </p>
            )}
            <p className={s.sub}>오늘도 파이팅! 💪</p>
          </>
        )}

        {status === "duplicate" && (
          <>
            <div className={s.iconDuplicate}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <p className={s.label}>이미 체크인했습니다</p>
            <p className={s.boxName}>{boxName || box?.name}</p>
            <p className={s.sub}>1시간 이내 중복 체크인은 불가합니다</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className={s.iconError}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <p className={s.label}>체크인 실패</p>
            <p className={s.sub}>잠시 후 다시 시도해주세요</p>
          </>
        )}

        <div className={s.actions}>
          <Link href={`/boxes/${boxId}`} className="btn-secondary" style={{ padding: "12px 24px", fontSize: 14 }}>
            박스 페이지로
          </Link>
          <Link href="/wod" className="btn-primary" style={{ padding: "12px 24px", fontSize: 14 }}>
            오늘의 WOD 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
