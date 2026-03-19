"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import Link from "next/link";
import s from "./users.module.css";

interface UserResult {
  id: number;
  name: string;
  profileImageUrl?: string;
  role: string;
}

const ROLE_LABEL: Record<string, string> = {
  ROLE_ADMIN: "관리자",
  ROLE_BOX_OWNER: "박스 오너",
  ROLE_USER: "회원",
};

export default function UsersSearchPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["users", "search", search],
    queryFn: async () => (await userApi.searchUsers(search)).data.data,
    enabled: search.trim().length >= 1,
  });

  const users: UserResult[] = data?.content ?? [];

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (keyword.trim()) setSearch(keyword.trim());
    },
    [keyword]
  );

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.header}>
          <p className={s.eyebrow}>COMMUNITY</p>
          <h1 className={s.title}>회원 검색</h1>
          <p className={s.sub}>이름으로 크로스핏 회원을 찾아보세요.</p>
        </div>

        <form className={s.searchForm} onSubmit={handleSubmit}>
          <input
            className={s.searchInput}
            type="text"
            placeholder="이름 검색..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn-primary" style={{ padding: "12px 24px", fontSize: "14px" }}>
            검색
          </button>
        </form>

        {search && (
          <p className={s.resultMeta}>
            {isLoading ? "검색 중..." : `"${search}" 검색 결과 ${data?.totalElements ?? 0}명`}
          </p>
        )}

        {isLoading ? (
          <div className={s.grid}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className={s.skeleton} />
            ))}
          </div>
        ) : users.length > 0 ? (
          <div className={s.grid}>
            {users.map((u) => (
              <Link key={u.id} href={`/users/${u.id}`} className={s.card}>
                <div className={s.avatar}>
                  {u.profileImageUrl ? (
                    <img src={u.profileImageUrl} alt={u.name} className={s.avatarImg} />
                  ) : (
                    <span className={s.avatarFallback}>{u.name.charAt(0)}</span>
                  )}
                </div>
                <div className={s.info}>
                  <p className={s.name}>{u.name}</p>
                  {u.role !== "ROLE_USER" && (
                    <span className={s.roleBadge}>{ROLE_LABEL[u.role] || u.role}</span>
                  )}
                </div>
                <span className={s.arrow}>→</span>
              </Link>
            ))}
          </div>
        ) : search ? (
          <div className={s.empty}>
            <p className={s.emptyIcon}>🔍</p>
            <p className={s.emptyText}>검색 결과가 없습니다</p>
            <p className={s.emptySub}>다른 이름으로 검색해보세요.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
