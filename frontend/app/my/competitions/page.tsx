"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { competitionApi } from "@/lib/api";
import { Competition } from "@/types";
import { isLoggedIn } from "@/lib/auth";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import s from "./competitions.module.css";

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "예정", OPEN: "접수 중", CLOSED: "접수 마감", COMPLETED: "종료",
};
const STATUS_BADGE: Record<string, string> = {
  UPCOMING: "badge-upcoming", OPEN: "badge-open", CLOSED: "badge-closed", COMPLETED: "badge-completed",
};

export default function MyCompetitionsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  const { data: competitions, isLoading } = useQuery({
    queryKey: ["competitions", "mine"],
    queryFn: async () => (await competitionApi.getMyRegistrations()).data.data as Competition[],
    enabled: isLoggedIn(),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => competitionApi.cancelRegistration(id),
    onSuccess: () => {
      toast.success("참가 신청이 취소되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["competitions", "mine"] });
    },
    onError: () => toast.error("취소에 실패했습니다."),
  });

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

        <div className={s.header}>
          <div>
            <h1 className={s.title}>신청한 대회</h1>
            <p className={s.sub}>총 {competitions?.length || 0}개의 대회에 신청했습니다</p>
          </div>
          <Link href="/competitions" className="btn-secondary" style={{ padding: "10px 20px", fontSize: 13 }}>
            대회 둘러보기
          </Link>
        </div>

        {isLoading ? (
          <div className={s.list}>
            {[...Array(4)].map((_, i) => <div key={i} className={s.skeleton} />)}
          </div>
        ) : competitions?.length === 0 ? (
          <div className={s.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--muted)" }}>
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
            </svg>
            <p>아직 신청한 대회가 없습니다</p>
            <Link href="/competitions" className="btn-primary" style={{ marginTop: 12, padding: "10px 24px", fontSize: 14, display: "inline-block" }}>
              대회 일정 보기
            </Link>
          </div>
        ) : (
          <div className={s.list}>
            {competitions?.map((comp) => {
              const isPast = comp.status === "COMPLETED" || comp.status === "CLOSED";
              return (
                <div key={comp.id} className={s.item}>
                  {comp.imageUrl && (
                    <div className={s.itemImg} style={{ position: "relative" }}>
                      <Image src={comp.imageUrl} alt={comp.name} fill style={{ objectFit: "cover" }} />
                    </div>
                  )}
                  <div className={s.itemBody}>
                    <div className={s.itemTop}>
                      <span className={`badge ${STATUS_BADGE[comp.status]}`}>
                        {STATUS_LABELS[comp.status]}
                      </span>
                      <span className={s.itemDate}>
                        {dayjs(comp.startDate).format("YYYY.MM.DD")}
                        {comp.endDate && comp.endDate !== comp.startDate && ` ~ ${dayjs(comp.endDate).format("MM.DD")}`}
                      </span>
                    </div>
                    <Link href={`/competitions/${comp.id}`} className={s.itemName}>{comp.name}</Link>
                    <p className={s.itemMeta}>
                      {comp.location || comp.city}
                      {comp.organizer && ` · ${comp.organizer}`}
                    </p>
                  </div>
                  <div className={s.itemActions}>
                    <Link href={`/competitions/${comp.id}`} className="btn-secondary" style={{ padding: "8px 16px", fontSize: 13, textAlign: "center" }}>
                      상세 보기
                    </Link>
                    {!isPast && (
                      <button
                        className={s.cancelBtn}
                        onClick={() => {
                          if (confirm(`'${comp.name}' 참가 신청을 취소하시겠습니까?`))
                            cancelMutation.mutate(comp.id);
                        }}
                        disabled={cancelMutation.isPending}
                      >
                        신청 취소
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
