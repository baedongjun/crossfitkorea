"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { Post } from "@/types";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import s from "./adminReports.module.css";

const CATEGORY_LABEL: Record<string, string> = {
  FREE: "자유", QNA: "Q&A", RECORD: "기록", MARKET: "장터",
};

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reported-posts", page],
    queryFn: async () => (await adminApi.getReportedPosts(page)).data.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deletePost(id),
    onSuccess: () => {
      toast.success("삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["admin", "reported-posts"] });
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const clearMutation = useMutation({
    mutationFn: (id: number) => adminApi.clearReports(id),
    onSuccess: () => {
      toast.success("신고가 초기화되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["admin", "reported-posts"] });
    },
    onError: () => toast.error("처리에 실패했습니다."),
  });

  const posts: Post[] = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  return (
    <div className={s.page}>
      <div className={s.headerRow}>
        <div>
          <h1 className={s.title}>신고 게시글 관리</h1>
          <p className={s.sub}>총 {totalElements}개의 신고된 게시글</p>
        </div>
      </div>

      {isLoading ? (
        <div className={s.loading}>로딩 중...</div>
      ) : posts.length === 0 ? (
        <div className={s.empty}>신고된 게시글이 없습니다 ✅</div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>신고수</th>
                <th>카테고리</th>
                <th>제목</th>
                <th>작성자</th>
                <th>작성일</th>
                <th>조회/좋아요</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <span className={s.reportBadge}>
                      ⚠ {post.reportCount}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-default" style={{ fontSize: 10 }}>
                      {CATEGORY_LABEL[post.category] || post.category}
                    </span>
                  </td>
                  <td>
                    <Link href={`/community/${post.id}`} target="_blank" className={s.postLink}>
                      {post.title.length > 40 ? post.title.slice(0, 40) + "…" : post.title}
                    </Link>
                  </td>
                  <td className={s.muted}>{post.userName}</td>
                  <td className={s.muted}>{dayjs(post.createdAt).format("YY.MM.DD")}</td>
                  <td className={s.muted}>{post.viewCount} / {post.likeCount}</td>
                  <td>
                    <div className={s.actions}>
                      <button
                        className={s.clearBtn}
                        onClick={() => clearMutation.mutate(post.id)}
                        disabled={clearMutation.isPending}
                        title="신고 초기화"
                      >
                        초기화
                      </button>
                      <button
                        className={s.deleteBtn}
                        onClick={() => {
                          if (confirm("게시글을 삭제하시겠습니까?")) {
                            deleteMutation.mutate(post.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className={s.pagination}>
          <button
            className={s.pageBtn}
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ← 이전
          </button>
          <span className={s.pageInfo}>{page + 1} / {totalPages}</span>
          <button
            className={s.pageBtn}
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            다음 →
          </button>
        </div>
      )}
    </div>
  );
}
