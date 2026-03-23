"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { Box } from "@/types";
import { toast } from "react-toastify";
import s from "./adminBoxes.module.css";

interface BoxEditForm {
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

export default function AdminBoxesPage() {
  const [page, setPage] = useState(0);
  const [editTarget, setEditTarget] = useState<Box | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Box | null>(null);
  const [form, setForm] = useState<BoxEditForm>({
    name: "", address: "", city: "", district: "",
    phone: "", website: "", instagram: "", description: "",
    monthlyFee: "", openTime: "", closeTime: "",
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "boxes", page],
    queryFn: async () => (await adminApi.getBoxes(page)).data.data,
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

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    editMutation.mutate({
      id: editTarget.id,
      data: {
        name: form.name,
        address: form.address,
        city: form.city,
        district: form.district || null,
        phone: form.phone || null,
        website: form.website || null,
        instagram: form.instagram || null,
        description: form.description || null,
        monthlyFee: form.monthlyFee ? parseInt(form.monthlyFee) : null,
        openTime: form.openTime || null,
        closeTime: form.closeTime || null,
      },
    });
  };

  return (
    <div>
      <h1 className={s.pageTitle}>박스 관리</h1>

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
                  <td className={s.td}>{box.ownerName || "—"}</td>
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

      {/* 수정 모달 */}
      {editTarget && (
        <div className={s.overlay} onClick={() => setEditTarget(null)}>
          <div className={s.modal} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>박스 수정</h2>
              <button className={s.modalClose} onClick={() => setEditTarget(null)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className={s.modalForm}>
              <div className={s.formGrid}>
                <div className={s.formField}>
                  <label className={s.fieldLabel}>박스명 *</label>
                  <input className={s.fieldInput} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className={s.formField}>
                  <label className={s.fieldLabel}>전화번호</label>
                  <input className={s.fieldInput} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className={`${s.formField} ${s.fullWidth}`}>
                  <label className={s.fieldLabel}>주소 *</label>
                  <input className={s.fieldInput} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                </div>
                <div className={s.formField}>
                  <label className={s.fieldLabel}>도시 *</label>
                  <input className={s.fieldInput} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                </div>
                <div className={s.formField}>
                  <label className={s.fieldLabel}>구/군</label>
                  <input className={s.fieldInput} value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
                </div>
                <div className={s.formField}>
                  <label className={s.fieldLabel}>웹사이트</label>
                  <input className={s.fieldInput} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                </div>
                <div className={s.formField}>
                  <label className={s.fieldLabel}>인스타그램</label>
                  <input className={s.fieldInput} value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
                </div>
                <div className={s.formField}>
                  <label className={s.fieldLabel}>월 이용료 (원)</label>
                  <input className={s.fieldInput} type="number" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} />
                </div>
                <div className={s.formField}>
                  <label className={s.fieldLabel}>오픈 시간</label>
                  <input className={s.fieldInput} placeholder="예: 06:00" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} />
                </div>
                <div className={s.formField}>
                  <label className={s.fieldLabel}>마감 시간</label>
                  <input className={s.fieldInput} placeholder="예: 22:00" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} />
                </div>
                <div className={`${s.formField} ${s.fullWidth}`}>
                  <label className={s.fieldLabel}>설명</label>
                  <textarea className={s.fieldTextarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
                </div>
              </div>
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
