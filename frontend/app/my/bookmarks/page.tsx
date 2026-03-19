"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { bookmarkApi } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import dayjs from "dayjs";
import s from "./bookmarks.module.css";

export default function MyBookmarksPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["my", "bookmarks"],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await bookmarkApi.getMyBookmarks(pageParam as number);
      return res.data.data;
    },
    getNextPageParam: (last: { last: boolean; number: number }) =>
      last.last ? undefined : last.number + 1,
    initialPageParam: 0,
    enabled: mounted,
  });

  const posts = data?.pages.flatMap((p: { content: unknown[] }) => p.content) ?? [];

  if (!mounted) return null;

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.header}>
          <Link href="/my" className={s.back}>← 마이페이지</Link>
          <h1 className={s.title}>북마크한 게시글</h1>
          <p className={s.sub}>저장한 게시글 {posts.length}개</p>
        </div>

        {isLoading ? (
          <div className={s.loading}>LOADING...</div>
        ) : posts.length === 0 ? (
          <div className={s.empty}>
            <p className={s.emptyText}>저장한 게시글이 없습니다.</p>
            <Link href="/community" className={s.emptyLink}>커뮤니티 둘러보기 →</Link>
          </div>
        ) : (
          <>
            <div className={s.list}>
              {posts.map((post: {
                id: number;
                title: string;
                category: string;
                likeCount: number;
                commentCount: number;
                viewCount: number;
                createdAt: string;
                author?: { name: string };
              }) => (
                <Link key={post.id} href={`/community/${post.id}`} className={s.item}>
                  <div className={s.itemTop}>
                    <span className={s.category}>{post.category}</span>
                    <span className={s.date}>{dayjs(post.createdAt).format("MM.DD")}</span>
                  </div>
                  <h3 className={s.itemTitle}>{post.title}</h3>
                  <div className={s.itemMeta}>
                    <span>{post.author?.name ?? "익명"}</span>
                    <span>조회 {post.viewCount}</span>
                    <span>좋아요 {post.likeCount}</span>
                    <span>댓글 {post.commentCount}</span>
                  </div>
                </Link>
              ))}
            </div>
            {hasNextPage && (
              <button
                className={s.moreBtn}
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "로딩 중..." : "더 보기"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
