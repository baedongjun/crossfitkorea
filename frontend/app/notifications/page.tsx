"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import s from "./notifications.module.css";

dayjs.extend(relativeTime);
dayjs.locale("ko");

interface Notif {
  id: number;
  type: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  BADGE: "🏅",
  MEMBERSHIP: "🏋️",
  REVIEW: "⭐",
  COMPETITION: "🏆",
  COMMUNITY: "💬",
  COMMENT: "💬",
  REPLY: "↩️",
  FOLLOW: "👤",
  SYSTEM: "🔔",
};

const TYPE_LABEL: Record<string, string> = {
  BADGE: "배지",
  MEMBERSHIP: "멤버십",
  REVIEW: "리뷰",
  COMPETITION: "대회",
  COMMUNITY: "커뮤니티",
  COMMENT: "댓글",
  REPLY: "답글",
  FOLLOW: "팔로우",
  SYSTEM: "시스템",
};

const FILTER_TYPES = ["ALL", "BADGE", "MEMBERSHIP", "COMPETITION", "COMMENT", "REPLY", "SYSTEM"] as const;
type FilterType = typeof FILTER_TYPES[number];

export default function NotificationsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FilterType>("ALL");

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", "all"],
    queryFn: async () => (await notificationApi.getAll()).data.data as Notif[],
    enabled: isLoggedIn(),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("모든 알림을 읽음 처리했습니다.");
    },
  });

  const deleteOneMutation = useMutation({
    mutationFn: (id: number) => notificationApi.deleteOne(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const deleteReadMutation = useMutation({
    mutationFn: () => notificationApi.deleteRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("읽은 알림을 삭제했습니다.");
    },
  });

  const handleClick = (n: Notif) => {
    if (!n.read) markOneMutation.mutate(n.id);
    if (n.link) router.push(n.link);
  };

  const filtered = notifications?.filter((n) => filter === "ALL" || n.type === filter) ?? [];
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;
  const readCount = notifications?.filter((n) => n.read).length ?? 0;

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.header}>
          <div>
            <p className={s.eyebrow}>NOTIFICATIONS</p>
            <h1 className={s.title}>알림</h1>
            {unreadCount > 0 && (
              <p className={s.sub}>읽지 않은 알림 {unreadCount}개</p>
            )}
          </div>
          <div className={s.headerActions}>
            {unreadCount > 0 && (
              <button
                className={s.readAllBtn}
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
              >
                모두 읽음
              </button>
            )}
            {readCount > 0 && (
              <button
                className={s.deleteReadBtn}
                onClick={() => {
                  if (confirm("읽은 알림을 모두 삭제하시겠습니까?")) {
                    deleteReadMutation.mutate();
                  }
                }}
                disabled={deleteReadMutation.isPending}
              >
                읽은 알림 삭제
              </button>
            )}
          </div>
        </div>

        {/* Type Filter */}
        <div className={s.filterRow}>
          {FILTER_TYPES.map((f) => {
            const count = f === "ALL"
              ? (notifications?.length ?? 0)
              : (notifications?.filter((n) => n.type === f).length ?? 0);
            if (f !== "ALL" && count === 0) return null;
            return (
              <button
                key={f}
                className={`${s.filterBtn} ${filter === f ? s.filterBtnActive : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "ALL" ? "전체" : TYPE_LABEL[f] || f}
                {count > 0 && <span className={s.filterCount}>{count}</span>}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className={s.list}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={s.skeleton} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}>🔔</div>
            <p className={s.emptyText}>
              {filter === "ALL" ? "아직 알림이 없습니다" : `${TYPE_LABEL[filter] || filter} 알림이 없습니다`}
            </p>
            {filter === "ALL" && (
              <p className={s.emptySub}>WOD 기록, 배지 획득, 대회 소식이 여기에 표시됩니다.</p>
            )}
          </div>
        ) : (
          <div className={s.list}>
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`${s.item} ${!n.read ? s.itemUnread : ""} ${n.link ? s.itemClickable : ""}`}
              >
                <div className={s.itemInner} onClick={() => handleClick(n)}>
                  <div className={s.itemIcon}>
                    {TYPE_ICON[n.type] || "🔔"}
                  </div>
                  <div className={s.itemBody}>
                    <p className={s.itemMessage}>{n.message}</p>
                    <p className={s.itemTime}>{dayjs(n.createdAt).fromNow()}</p>
                  </div>
                  {!n.read && <div className={s.unreadDot} />}
                </div>
                <button
                  className={s.deleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteOneMutation.mutate(n.id);
                  }}
                  title="알림 삭제"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
