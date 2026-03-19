"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, boxApi } from "@/lib/api";
import { Box } from "@/types";
import { isLoggedIn } from "@/lib/auth";
import { toast } from "react-toastify";
import s from "./favorites.module.css";

export default function FavoritesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  const { data, isLoading } = useQuery({
    queryKey: ["favorites", "mine", page],
    queryFn: async () => (await userApi.getMyFavorites(page)).data.data,
    enabled: isLoggedIn(),
  });

  const removeMutation = useMutation({
    mutationFn: (boxId: number) => boxApi.toggleFavorite(boxId),
    onSuccess: () => {
      toast.success("즐겨찾기에서 해제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["favorites", "mine"] });
    },
    onError: () => toast.error("처리에 실패했습니다."),
  });

  const boxes: Box[] = data?.content || [];
  const totalPages = data?.totalPages || 1;

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
        <h1 className={s.title}>즐겨찾기 박스</h1>
        <p className={s.sub}>총 {data?.totalElements || 0}개</p>

        {isLoading ? (
          <div className={s.grid}>
            {[...Array(6)].map((_, i) => <div key={i} className={s.skeleton} />)}
          </div>
        ) : boxes.length === 0 ? (
          <div className={s.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--muted)" }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <p>즐겨찾기한 박스가 없습니다</p>
            <Link href="/boxes" className="btn-primary" style={{ marginTop: 8, padding: "10px 24px", fontSize: 14, display: "inline-block" }}>
              박스 찾기
            </Link>
          </div>
        ) : (
          <>
            <div className={s.grid}>
              {boxes.map((box) => (
                <div key={box.id} className={s.card}>
                  <Link href={`/boxes/${box.id}`} className={s.cardLink}>
                    <div className={s.cardImg}>
                      {box.imageUrls?.[0]
                        ? <Image src={box.imageUrls[0]} alt={box.name} fill style={{ objectFit: "cover" }} />
                        : <div className={s.imgPlaceholder}>CF</div>
                      }
                      {box.premium && <span className="badge badge-premium" style={{ position: "absolute", top: 8, left: 8 }}>PREMIUM</span>}
                      {box.verified && <span className="badge badge-approved" style={{ position: "absolute", top: 8, left: box.premium ? 90 : 8 }}>인증</span>}
                    </div>
                    <div className={s.cardBody}>
                      <h3 className={s.cardName}>{box.name}</h3>
                      <p className={s.cardAddr}>{box.city} {box.district}</p>
                      <div className={s.cardMeta}>
                        <span className={s.cardRating}>★ {Number(box.rating || 0).toFixed(1)}</span>
                        <span className={s.cardReviews}>리뷰 {box.reviewCount || 0}</span>
                        {box.monthlyFee > 0 && (
                          <span className={s.cardFee}>{box.monthlyFee.toLocaleString()}원~</span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <button
                    className={s.removeBtn}
                    onClick={() => removeMutation.mutate(box.id)}
                    disabled={removeMutation.isPending}
                    title="즐겨찾기 해제"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    해제
                  </button>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className={s.pagination}>
                <button className={s.pageBtn} disabled={page === 0} onClick={() => setPage(p => p - 1)}>이전</button>
                <span className={s.pageInfo}>{page + 1} / {totalPages}</span>
                <button className={s.pageBtn} disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>다음</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
