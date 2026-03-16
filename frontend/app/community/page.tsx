"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { communityApi } from "@/lib/api";
import { Post, PostCategory } from "@/types";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { isLoggedIn } from "@/lib/auth";
import s from "./community.module.css";

dayjs.extend(relativeTime);
dayjs.locale("ko");

const CATEGORY_LABELS: Record<PostCategory, string> = {
  FREE: "자유",
  QNA: "Q&A",
  RECORD: "기록",
  MARKET: "장터",
};

const CATEGORY_BADGE: Record<PostCategory, string> = {
  FREE: "badge-default",
  QNA: "badge-upcoming",
  RECORD: "badge-open",
  MARKET: "badge-amrap",
};

const CATEGORIES: { value: PostCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "FREE", label: "자유게시판" },
  { value: "QNA", label: "질문/답변" },
  { value: "RECORD", label: "운동 기록" },
  { value: "MARKET", label: "중고장터" },
];

export default function CommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState<PostCategory | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("createdAt,desc");

  const { data: hotPosts } = useQuery({
    queryKey: ["posts", "hot"],
    queryFn: async () => (await communityApi.getHotPosts()).data.data as Post[],
    staleTime: 1000 * 60 * 5,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["posts", selectedCategory, page, keyword, sortBy],
    queryFn: async () => {
      const res = await communityApi.getPosts({
        category: selectedCategory === "ALL" ? undefined : selectedCategory,
        keyword: keyword || undefined,
        page,
        sort: sortBy,
      });
      return res.data.data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(0);
  };

  return (
    <div className={s.page}>
      {/* Sticky Bar */}
      <div className={s.bar}>
        <div className={s.barTop}>
          <span className={s.barTitle}>커뮤니티</span>
          {isLoggedIn() && (
            <Link href="/community/write" className={`btn-primary ${s.writeBtn}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              글쓰기
            </Link>
          )}
        </div>

        <div className={s.pills}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => { setSelectedCategory(cat.value); setPage(0); }}
              className={`${s.pill} ${selectedCategory === cat.value ? s.pillActive : ""}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className={s.searchBar}>
          <div className={s.searchInputWrap}>
            <svg className={s.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className={s.searchInput}
              placeholder="게시글 검색"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          {(keyword || searchInput) && (
            <button
              type="button"
              className={s.searchClear}
              onClick={() => { setSearchInput(""); setKeyword(""); setPage(0); }}
            >✕</button>
          )}
        </form>
      </div>

      {/* Content + Sidebar */}
      <div className={s.layout}>
      <div className={s.content}>
        <div className={s.contentHeader}>
          <p className={s.resultCount}>총 <strong>{data?.totalElements || 0}</strong>개 게시글</p>
          <select
            className={s.sortSelect}
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
          >
            <option value="createdAt,desc">최신순</option>
            <option value="likeCount,desc">인기순</option>
            <option value="commentCount,desc">댓글 많은순</option>
            <option value="viewCount,desc">조회 많은순</option>
          </select>
        </div>
        {isLoading ? (
          <div className={s.postList}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className={s.skeleton} />
            ))}
          </div>
        ) : data?.content?.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}>💬</div>
            <p>게시글이 없습니다</p>
            {isLoggedIn() && (
              <div className={s.emptyAction}>
                <Link href="/community/write" className="btn-primary">첫 번째 글 작성하기</Link>
              </div>
            )}
          </div>
        ) : (
          <div className={s.postList}>
            {data?.content?.map((post: Post) => (
              <Link key={post.id} href={`/community/${post.id}`} className={s.postItem}>
                <span className={`badge ${CATEGORY_BADGE[post.category]}`}>
                  {CATEGORY_LABELS[post.category]}
                </span>

                <div className={s.postMain}>
                  <p className={s.postTitle}>{post.title}</p>
                  <p className={s.postMeta}>
                    {post.userName} · {dayjs(post.createdAt).fromNow()}
                  </p>
                </div>

                {post.imageUrls?.[0] && (
                  <img src={post.imageUrls[0]} alt="" className={s.postThumb} />
                )}

                <div className={s.postStats}>
                  <span className={s.stat}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    {post.viewCount}
                  </span>
                  <span className={s.stat}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    {post.commentCount}
                  </span>
                  <span className={s.stat}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {post.likeCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className={s.pagination}>
            <button onClick={() => setPage(page - 1)} disabled={data.first} className="btn-secondary">이전</button>
            <span className={s.pageInfo}>{data.number + 1} / {data.totalPages}</span>
            <button onClick={() => setPage(page + 1)} disabled={data.last} className="btn-secondary">다음</button>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className={s.sidebar}>
        <div className={s.sideCard}>
          <p className={s.sideTitle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--red)" }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            인기 게시글 TOP 5
          </p>
          {(hotPosts?.length ?? 0) === 0 ? (
            <p className={s.sideEmpty}>아직 인기 게시글이 없습니다</p>
          ) : (
            <ol className={s.hotList}>
              {hotPosts?.map((post, idx) => (
                <li key={post.id} className={s.hotItem}>
                  <span className={`${s.hotRank} ${idx === 0 ? s.hotRank1 : ""}`}>{idx + 1}</span>
                  <Link href={`/community/${post.id}`} className={s.hotTitle}>{post.title}</Link>
                  <span className={s.hotLike}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {post.likeCount}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className={s.sideCard}>
          <p className={s.sideTitle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--red)" }}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            글쓰기
          </p>
          {isLoggedIn() ? (
            <Link href="/community/write" className={`btn-primary ${s.sideWriteBtn}`}>새 글 작성하기</Link>
          ) : (
            <Link href="/login" className={`btn-secondary ${s.sideWriteBtn}`}>로그인 후 작성</Link>
          )}
        </div>
      </aside>
      </div>
    </div>
  );
}
