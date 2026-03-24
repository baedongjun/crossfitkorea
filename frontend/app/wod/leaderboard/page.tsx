"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { leaderboardApi } from "@/lib/api";
import { getUser } from "@/lib/auth";
import dayjs from "dayjs";
import s from "./leaderboard.module.css";

interface LeaderboardEntry {
  rank: number;
  userId: number;
  userName: string;
  score: string;
  rx: boolean;
  notes?: string;
}

export default function LeaderboardPage() {
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const currentUser = getUser();

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", date],
    queryFn: async () => (await leaderboardApi.getLeaderboard(date)).data.data as LeaderboardEntry[],
  });

  const entries: LeaderboardEntry[] = data || [];

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <Link href="/wod" className={s.back}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          오늘의 WOD
        </Link>

        <div className={s.header}>
          <div>
            <p className={s.tag}>WOD LEADERBOARD</p>
            <h1 className={s.title}>리더보드</h1>
          </div>
          <div className={s.datePicker}>
            <button
              className={s.dateBtn}
              onClick={() => setDate(d => dayjs(d).subtract(1, "day").format("YYYY-MM-DD"))}
            >
              ‹
            </button>
            <input
              type="date"
              value={date}
              max={dayjs().format("YYYY-MM-DD")}
              onChange={(e) => setDate(e.target.value)}
              className={s.dateInput}
            />
            <button
              className={s.dateBtn}
              onClick={() => setDate(d => dayjs(d).add(1, "day").format("YYYY-MM-DD"))}
              disabled={date >= dayjs().format("YYYY-MM-DD")}
            >
              ›
            </button>
          </div>
        </div>

        <p className={s.dateLabel}>{dayjs(date).format("YYYY년 M월 D일 (ddd)")}</p>

        {isLoading ? (
          <div className={s.list}>
            {[...Array(10)].map((_, i) => <div key={i} className={s.skeleton} />)}
          </div>
        ) : entries.length === 0 ? (
          <div className={s.empty}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--muted)" }}>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <p>이 날짜의 기록이 없습니다</p>
            {date === dayjs().format("YYYY-MM-DD") && (
              <Link href="/wod" className="btn-primary" style={{ marginTop: 8, padding: "10px 24px", fontSize: 14, display: "inline-block" }}>
                오늘 기록 남기기
              </Link>
            )}
          </div>
        ) : (
          <div className={s.list}>
            {entries.map((entry) => {
              const isMe = currentUser?.name === entry.userName;
              const isTop3 = entry.rank <= 3;
              return (
                <div key={entry.userId} className={`${s.item} ${isMe ? s.itemMe : ""} ${isTop3 ? s.itemTop3 : ""}`}>
                  <div className={s.rank}>
                    {entry.rank <= 3 ? (
                      <span className={`${s.rankMedal} ${entry.rank === 1 ? s.gold : entry.rank === 2 ? s.silver : s.bronze}`}>
                        {entry.rank === 1 ? "1ST" : entry.rank === 2 ? "2ND" : "3RD"}
                      </span>
                    ) : (
                      <span className={s.rankNum}>{entry.rank}</span>
                    )}
                  </div>

                  <div className={s.info}>
                    <span className={s.name}>
                      {isMe ? (
                        <>
                          {entry.userName}
                          <span className={s.meTag}>나</span>
                        </>
                      ) : (
                        <Link href={`/users/${entry.userId}`} className={s.nameLink}>
                          {entry.userName}
                        </Link>
                      )}
                    </span>
                    {entry.notes && <p className={s.notes}>{entry.notes}</p>}
                  </div>

                  <div className={s.right}>
                    {entry.rx && <span className={s.rxBadge}>RX</span>}
                    {entry.score && <span className={s.score}>{entry.score}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && entries.length > 0 && (
          <p className={s.total}>{entries.length}명 참여</p>
        )}
      </div>
    </div>
  );
}
