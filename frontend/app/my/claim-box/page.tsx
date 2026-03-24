"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { boxApi } from "@/lib/api";
import { isLoggedIn, getUser } from "@/lib/auth";
import { useEffect } from "react";
import { toast } from "react-toastify";
import s from "./claim-box.module.css";

const STATUS_LABEL: Record<string, string> = { PENDING: "검토중", APPROVED: "승인됨", REJECTED: "거절됨" };
const STATUS_COLOR: Record<string, string> = { PENDING: "var(--muted)", APPROVED: "#22c55e", REJECTED: "var(--red)" };

export default function ClaimBoxPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = getUser();

  const [page, setPage] = useState(0);
  const [claimTarget, setClaimTarget] = useState<{ id: number; name: string } | null>(null);
  const [claimMessage, setClaimMessage] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    if (user?.role !== "ROLE_BOX_OWNER" && user?.role !== "ROLE_ADMIN") {
      toast.error("박스 오너 권한이 필요합니다.");
      router.replace("/my");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: unclaimedData, isLoading } = useQuery({
    queryKey: ["boxes", "unclaimed", page],
    queryFn: async () => (await boxApi.getUnclaimed(page)).data.data,
    enabled: isLoggedIn(),
  });

  const { data: myClaims } = useQuery({
    queryKey: ["boxes", "my-claims"],
    queryFn: async () => (await boxApi.getMyClaims()).data.data as {
      id: number; boxId: number; boxName: string; boxCity: string;
      status: string; message: string; adminNote: string; createdAt: string;
    }[],
    enabled: isLoggedIn(),
  });

  const claimMutation = useMutation({
    mutationFn: ({ boxId, message }: { boxId: number; message?: string }) =>
      boxApi.submitClaim(boxId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boxes", "my-claims"] });
      toast.success("소유권 신청이 완료되었습니다. 어드민 승인 후 연결됩니다.");
      setClaimTarget(null);
      setClaimMessage("");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "신청 중 오류가 발생했습니다.");
    },
  });

  const pendingBoxIds = new Set(
    (myClaims ?? []).filter(c => c.status === "PENDING").map(c => c.boxId)
  );

  return (
    <main className={s.page}>
      <div className={s.inner}>
        <div className={s.header}>
          <Link href="/my/box" className={s.backLink}>← 내 박스로</Link>
          <h1 className={s.title}>박스 소유권 신청</h1>
          <p className={s.subtitle}>내 박스를 찾아 소유권을 신청하세요. 어드민 확인 후 연결됩니다.</p>
        </div>

        {/* 내 신청 현황 */}
        {myClaims && myClaims.length > 0 && (
          <section className={s.section}>
            <h2 className={s.sectionTitle}>내 신청 현황</h2>
            <div className={s.claimList}>
              {myClaims.map((c) => (
                <div key={c.id} className={s.claimItem}>
                  <div className={s.claimInfo}>
                    <span className={s.claimBoxName}>{c.boxName}</span>
                    <span className={s.claimCity}>{c.boxCity}</span>
                  </div>
                  <div className={s.claimRight}>
                    <span className={s.claimStatus} style={{ color: STATUS_COLOR[c.status] }}>
                      {STATUS_LABEL[c.status]}
                    </span>
                    {c.adminNote && (
                      <span className={s.claimNote}>어드민: {c.adminNote}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 미배정 박스 목록 */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>오너 없는 박스 목록</h2>
          {isLoading ? (
            <div className={s.grid}>
              {[...Array(6)].map((_, i) => <div key={i} className={s.skeleton} />)}
            </div>
          ) : unclaimedData?.content?.length === 0 ? (
            <div className={s.empty}>
              <p>현재 소유권 신청 가능한 박스가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className={s.grid}>
                {unclaimedData?.content?.map((box: { id: number; name: string; city: string; district?: string; address: string }) => (
                  <div key={box.id} className={s.card}>
                    <div className={s.cardBody}>
                      <h3 className={s.cardName}>{box.name}</h3>
                      <p className={s.cardLoc}>{box.city}{box.district && ` · ${box.district}`}</p>
                      <p className={s.cardAddr}>{box.address}</p>
                    </div>
                    {pendingBoxIds.has(box.id) ? (
                      <div className={s.pendingBadge}>신청 검토중</div>
                    ) : (
                      <button
                        className={s.claimBtn}
                        onClick={() => setClaimTarget({ id: box.id, name: box.name })}
                      >
                        소유권 신청
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {unclaimedData && unclaimedData.totalPages > 1 && (
                <div className={s.pagination}>
                  <button onClick={() => setPage(page - 1)} disabled={unclaimedData.first} className="btn-secondary">이전</button>
                  <span className={s.pageInfo}>{unclaimedData.number + 1} / {unclaimedData.totalPages}</span>
                  <button onClick={() => setPage(page + 1)} disabled={unclaimedData.last} className="btn-secondary">다음</button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* 신청 확인 모달 */}
      {claimTarget && (
        <div className={s.overlay} onClick={() => setClaimTarget(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={s.modalTitle}>소유권 신청</h2>
            <p className={s.modalDesc}>
              <strong>{claimTarget.name}</strong>의 소유권을 신청합니다.<br />
              어드민 검토 후 승인되면 내 박스로 연결됩니다.
            </p>
            <div className={s.modalField}>
              <label className={s.fieldLabel}>신청 메시지 (선택)</label>
              <textarea
                className={s.fieldTextarea}
                rows={3}
                placeholder="박스 오너임을 증명할 내용을 입력하세요 (예: 사업자등록번호, 연락처 등)"
                value={claimMessage}
                onChange={(e) => setClaimMessage(e.target.value)}
              />
            </div>
            <div className={s.modalActions}>
              <button className="btn-secondary" onClick={() => { setClaimTarget(null); setClaimMessage(""); }}>취소</button>
              <button
                className="btn-primary"
                disabled={claimMutation.isPending}
                onClick={() => claimMutation.mutate({ boxId: claimTarget.id, message: claimMessage || undefined })}
              >
                {claimMutation.isPending ? "신청 중..." : "신청하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
