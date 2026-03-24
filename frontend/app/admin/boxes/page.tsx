"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { Box } from "@/types";
import { toast } from "react-toastify";
import s from "./adminBoxes.module.css";

interface BoxForm {
  name: string;
  address: string;
  city: string;
  district: string;
  phone: string;
  website: string;
  instagram: string;
  description: string;
  monthlyFee: string;
  openTime: string;
  closeTime: string;
}

const EMPTY_FORM: BoxForm = {
  name: "", address: "", city: "", district: "",
  phone: "", website: "", instagram: "", description: "",
  monthlyFee: "", openTime: "", closeTime: "",
};

type PageTab = "boxes" | "claims";

export default function AdminBoxesPage() {
  const [pageTab, setPageTab] = useState<PageTab>("boxes");
  const [page, setPage] = useState(0);
  const [claimsPage, setClaimsPage] = useState(0);
  const [editTarget, setEditTarget] = useState<Box | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Box | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<BoxForm>(EMPTY_FORM);
  const [createForm, setCreateForm] = useState<BoxForm>(EMPTY_FORM);
  const [claimNoteMap, setClaimNoteMap] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "boxes", page],
    queryFn: async () => (await adminApi.getBoxes(page)).data.data,
  });

  const { data: claimsData, isLoading: claimsLoading } = useQuery({
    queryKey: ["admin", "claims", claimsPage],
    queryFn: async () => (await adminApi.getClaims(claimsPage)).data.data,
    enabled: pageTab === "claims",
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, verified }: { id: number; verified: boolean }) =>
      adminApi.verifyBox(id, verified),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "boxes"] }); toast.success("변경되었습니다."); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => { console.error("[verifyBox]", err?.response?.status, err?.response?.data ?? err); toast.error("오류가 발생했습니다."); },
  });

  const premiumMutation = useMutation({
    mutationFn: ({ id, premium }: { id: number; premium: boolean }) =>
      adminApi.setPremium(id, premium),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin", "boxes"] }); toast.success("변경되었습니다."); },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => { console.error("[setPremium]", err?.response?.status, err?.response?.data ?? err); toast.error("오류가 발생했습니다."); },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: object }) =>
      adminApi.updateBox(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "boxes"] });
      toast.success("박스 정보가 수정되었습니다.");
      setEditTarget(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => { console.error("[updateBox]", err?.response?.status, err?.response?.data ?? err); toast.error("수정 중 오류가 발생했습니다."); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteBox(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "boxes"] });
      toast.success("박스가 삭제되었습니다.");
      setDeleteTarget(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => { console.error("[deleteBox]", err?.response?.status, err?.response?.data ?? err); toast.error("삭제 중 오류가 발생했습니다."); },
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => adminApi.createBox(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "boxes"] });
      toast.success("박스가 등록되었습니다.");
      setShowCreateModal(false);
      setCreateForm(EMPTY_FORM);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => { toast.error(err?.response?.data?.message || "등록 중 오류가 발생했습니다."); },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, adminNote }: { id: number; adminNote?: string }) =>
      adminApi.approveClaim(id, adminNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "boxes"] });
      toast.success("소유권 신청이 승인되었습니다.");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => { toast.error(err?.response?.data?.message || "승인 중 오류가 발생했습니다."); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, adminNote }: { id: number; adminNote?: string }) =>
      adminApi.rejectClaim(id, adminNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "claims"] });
      toast.success("소유권 신청이 거절되었습니다.");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => { toast.error(err?.response?.data?.message || "거절 중 오류가 발생했습니다."); },
  });

  const openEdit = (box: Box) => {
    setForm({
      name: box.name ?? "",
      address: box.address ?? "",
      city: box.city ?? "",
      district: box.district ?? "",
      phone: box.phone ?? "",
      website: box.website ?? "",
      instagram: box.instagram ?? "",
      description: box.description ?? "",
      monthlyFee: box.monthlyFee != null ? String(box.monthlyFee) : "",
      openTime: box.openTime ?? "",
      closeTime: box.closeTime ?? "",
    });
    setEditTarget(box);
  };

  const buildBoxData = (f: BoxForm) => ({
    name: f.name,
    address: f.address,
    city: f.city,
    district: f.district || null,
    phone: f.phone || null,
    website: f.website || null,
    instagram: f.instagram || null,
    description: f.description || null,
    monthlyFee: f.monthlyFee ? parseInt(f.monthlyFee) : null,
    openTime: f.openTime || null,
    closeTime: f.closeTime || null,
  });

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    editMutation.mutate({ id: editTarget.id, data: buildBoxData(form) });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(buildBoxData(createForm));
  };

  const STATUS_LABEL: Record<string, string> = { PENDING: "대기중", APPROVED: "승인", REJECTED: "거절" };
  const STATUS_COLOR: Record<string, string> = { PENDING: "var(--muted)", APPROVED: "#22c55e", REJECTED: "var(--red)" };

  const BoxFormFields = ({ f, setF }: { f: BoxForm; setF: (v: BoxForm) => void }) => (
    <div className={s.formGrid}>
      <div className={s.formField}>
        <label className={s.fieldLabel}>박스명 *</label>
        <input className={s.fieldInput} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
      </div>
      <div className={s.formField}>
        <label className={s.fieldLabel}>전화번호</label>
        <input className={s.fieldInput} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      </div>
      <div className={`${s.formField} ${s.fullWidth}`}>
        <label className={s.fieldLabel}>주소 *</label>
        <input className={s.fieldInput} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} required />
      </div>
      <div className={s.formField}>
        <label className={s.fieldLabel}>도시 *</label>
        <input className={s.fieldInput} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} required />
      </div>
      <div className={s.formField}>
        <label className={s.fieldLabel}>구/군</label>
        <input className={s.fieldInput} value={f.district} onChange={(e) => setF({ ...f, district: e.target.value })} />
      </div>
      <div className={s.formField}>
        <label className={s.fieldLabel}>웹사이트</label>
        <input className={s.fieldInput} value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} />
      </div>
      <div className={s.formField}>
        <label className={s.fieldLabel}>인스타그램</label>
        <input className={s.fieldInput} value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} />
      </div>
      <div className={s.formField}>
        <label className={s.fieldLabel}>월 이용료 (원)</label>
        <input className={s.fieldInput} type="number" value={f.monthlyFee} onChange={(e) => setF({ ...f, monthlyFee: e.target.value })} />
      </div>
      <div className={s.formField}>
        <label className={s.fieldLabel}>오픈 시간</label>
        <input className={s.fieldInput} placeholder="예: 06:00" value={f.openTime} onChange={(e) => setF({ ...f, openTime: e.target.value })} />
      </div>
      <div className={s.formField}>
        <label className={s.fieldLabel}>마감 시간</label>
        <input className={s.fieldInput} placeholder="예: 22:00" value={f.closeTime} onChange={(e) => setF({ ...f, closeTime: e.target.value })} />
      </div>
      <div className={`${s.formField} ${s.fullWidth}`}>
        <label className={s.fieldLabel}>설명</label>
        <textarea className={s.fieldTextarea} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={4} />
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 className={s.pageTitle}>박스 관리</h1>
        <button className="btn-primary" style={{ padding: "10px 20px", fontSize: 13, letterSpacing: 1 }} onClick={() => setShowCreateModal(true)}>
          + 박스 등록
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
        {(["boxes", "claims"] as PageTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setPageTab(t)}
            style={{
              background: "transparent", border: "none", borderBottom: pageTab === t ? "2px solid var(--red)" : "2px solid transparent",
              color: pageTab === t ? "var(--text)" : "var(--muted)", padding: "10px 18px", fontSize: 12,
              fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" as const, cursor: "pointer", marginBottom: -1,
            }}
          >
            {t === "boxes" ? "박스 목록" : `소유권 신청${claimsData?.totalElements ? ` (${claimsData.totalElements})` : ""}`}
          </button>
        ))}
      </div>

      {pageTab === "boxes" && (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead className={s.thead}>
              <tr>
                <th className={s.th}>박스명</th>
                <th className={s.th}>지역</th>
                <th className={s.th}>오너</th>
                <th className={`${s.th} ${s.thCenter}`}>평점</th>
                <th className={`${s.th} ${s.thCenter}`}>인증</th>
                <th className={`${s.th} ${s.thCenter}`}>프리미엄</th>
                <th className={`${s.th} ${s.thCenter}`}>관리</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className={s.tr}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className={s.td}><div className={s.skeletonCell} /></td>
                    ))}
                  </tr>
                ))
              ) : (
                data?.content?.map((box: Box) => (
                  <tr key={box.id} className={s.tr}>
                    <td className={`${s.td} ${s.tdName}`}>{box.name}</td>
                    <td className={s.td}>{box.city}{box.district && ` · ${box.district}`}</td>
                    <td className={s.td}>{box.ownerName || <span style={{ color: "var(--muted)", fontSize: 12 }}>미배정</span>}</td>
                    <td className={`${s.td} ${s.tdCenter}`}>
                      <span className={s.rating}>
                        <svg className={s.star} width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        {box.rating ? Number(box.rating).toFixed(1) : "0.0"}
                      </span>
                    </td>
                    <td className={`${s.td} ${s.tdCenter}`}>
                      <button
                        onClick={() => verifyMutation.mutate({ id: box.id, verified: !box.verified })}
                        className={`${s.toggleBtn} ${box.verified ? s.toggleVerified : ""}`}
                      >
                        {box.verified ? (
                          <><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>인증됨</>
                        ) : "미인증"}
                      </button>
                    </td>
                    <td className={`${s.td} ${s.tdCenter}`}>
                      <button
                        onClick={() => premiumMutation.mutate({ id: box.id, premium: !box.premium })}
                        className={`${s.toggleBtn} ${box.premium ? s.togglePremium : ""}`}
                      >
                        {box.premium ? "PREMIUM" : "일반"}
                      </button>
                    </td>
                    <td className={`${s.td} ${s.tdCenter}`}>
                      <div className={s.actionBtns}>
                        <button className={s.editBtn} onClick={() => openEdit(box)}>수정</button>
                        <button className={s.deleteBtn} onClick={() => setDeleteTarget(box)}>삭제</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {data && data.totalPages > 1 && (
            <div className={s.pagination}>
              <button onClick={() => setPage(page - 1)} disabled={data.first} className="btn-secondary">이전</button>
              <span className={s.pageInfo}>{data.number + 1} / {data.totalPages}</span>
              <button onClick={() => setPage(page + 1)} disabled={data.last} className="btn-secondary">다음</button>
            </div>
          )}
        </div>
      )}

      {pageTab === "claims" && (
        <div className={s.tableWrap}>
          {claimsLoading ? (
            <p style={{ color: "var(--muted)", padding: 20 }}>불러오는 중...</p>
          ) : claimsData?.content?.length === 0 ? (
            <p style={{ color: "var(--muted)", padding: 20 }}>소유권 신청이 없습니다.</p>
          ) : (
            <>
              <table className={s.table}>
                <thead className={s.thead}>
                  <tr>
                    <th className={s.th}>박스</th>
                    <th className={s.th}>신청자</th>
                    <th className={s.th}>신청 메시지</th>
                    <th className={`${s.th} ${s.thCenter}`}>상태</th>
                    <th className={s.th}>어드민 메모</th>
                    <th className={`${s.th} ${s.thCenter}`}>처리</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {claimsData?.content?.map((claim: any) => (
                    <tr key={claim.id} className={s.tr}>
                      <td className={s.td}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{claim.boxName}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{claim.boxCity}</div>
                      </td>
                      <td className={s.td}>
                        <div style={{ fontSize: 13 }}>{claim.requesterName}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{claim.requesterEmail}</div>
                      </td>
                      <td className={s.td} style={{ fontSize: 12, color: "var(--muted)", maxWidth: 200 }}>
                        {claim.message || "—"}
                      </td>
                      <td className={`${s.td} ${s.tdCenter}`}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[claim.status] }}>
                          {STATUS_LABEL[claim.status]}
                        </span>
                      </td>
                      <td className={s.td}>
                        {claim.status === "PENDING" ? (
                          <input
                            style={{ background: "var(--bg-card-2)", border: "1px solid var(--border)", color: "var(--text)", padding: "4px 8px", fontSize: 12, width: "100%" }}
                            placeholder="메모 (선택)"
                            value={claimNoteMap[claim.id] ?? ""}
                            onChange={(e) => setClaimNoteMap(prev => ({ ...prev, [claim.id]: e.target.value }))}
                          />
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>{claim.adminNote || "—"}</span>
                        )}
                      </td>
                      <td className={`${s.td} ${s.tdCenter}`}>
                        {claim.status === "PENDING" && (
                          <div className={s.actionBtns}>
                            <button
                              className={s.editBtn}
                              style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
                              disabled={approveMutation.isPending}
                              onClick={() => approveMutation.mutate({ id: claim.id, adminNote: claimNoteMap[claim.id] })}
                            >
                              승인
                            </button>
                            <button
                              className={s.deleteBtn}
                              disabled={rejectMutation.isPending}
                              onClick={() => rejectMutation.mutate({ id: claim.id, adminNote: claimNoteMap[claim.id] })}
                            >
                              거절
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {claimsData && claimsData.totalPages > 1 && (
                <div className={s.pagination}>
                  <button onClick={() => setClaimsPage(claimsPage - 1)} disabled={claimsData.first} className="btn-secondary">이전</button>
                  <span className={s.pageInfo}>{claimsData.number + 1} / {claimsData.totalPages}</span>
                  <button onClick={() => setClaimsPage(claimsPage + 1)} disabled={claimsData.last} className="btn-secondary">다음</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 박스 등록 모달 */}
      {showCreateModal && (
        <div className={s.overlay} onClick={() => setShowCreateModal(false)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>박스 등록 (오너 없이)</h2>
              <button className={s.modalClose} onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
              초기 데이터 등록용입니다. 나중에 박스 오너가 소유권을 신청하면 승인할 수 있습니다.
            </p>
            <form onSubmit={handleCreateSubmit} className={s.modalForm}>
              <BoxFormFields f={createForm} setF={setCreateForm} />
              <div className={s.modalActions}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>취소</button>
                <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "등록 중..." : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editTarget && (
        <div className={s.overlay} onClick={() => setEditTarget(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>박스 수정</h2>
              <button className={s.modalClose} onClick={() => setEditTarget(null)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className={s.modalForm}>
              <BoxFormFields f={form} setF={setForm} />
              <div className={s.modalActions}>
                <button type="button" className="btn-secondary" onClick={() => setEditTarget(null)}>취소</button>
                <button type="submit" className="btn-primary" disabled={editMutation.isPending}>
                  {editMutation.isPending ? "저장 중..." : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className={s.overlay} onClick={() => setDeleteTarget(null)}>
          <div className={s.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h2 className={s.confirmTitle}>박스 삭제</h2>
            <p className={s.confirmMsg}>
              <strong>{deleteTarget.name}</strong>을(를) 삭제하시겠습니까?<br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className={s.modalActions}>
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>취소</button>
              <button
                className={s.confirmDeleteBtn}
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
              >
                {deleteMutation.isPending ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
