"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { challengeApi, uploadApi } from "@/lib/api";
import { isLoggedIn, getUser } from "@/lib/auth";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import s from "./challenge-detail.module.css";

interface VerificationDto {
  id: number;
  content?: string;
  imageUrl?: string;
  verifiedDate: string;
}

interface LeaderboardEntry {
  userId: number;
  userName: string;
  profileImageUrl?: string;
  completedDays: number;
  rank: number;
}

interface ChallengeDetailDto {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  targetDays: number;
  type: "WOD" | "EXERCISE" | "DIET" | "FREE";
  active: boolean;
  participantCount: number;
  myCompletedDays?: number;
  participating: boolean;
  verifiedToday: boolean;
  myVerifications: VerificationDto[];
  leaderboard: LeaderboardEntry[];
}

const TYPE_LABEL: Record<string, string> = {
  WOD: "WOD", EXERCISE: "운동", DIET: "식단", FREE: "자유",
};
const TYPE_CLASS: Record<string, string> = {
  WOD: s.typeWod, EXERCISE: s.typeExercise, DIET: s.typeDiet, FREE: s.typeFree,
};

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const id = Number(params.id);
  const loggedIn = typeof window !== "undefined" ? isLoggedIn() : false;
  const currentUser = typeof window !== "undefined" ? getUser() : null;

  const [tab, setTab] = useState<"leaderboard" | "verifications" | "allVerifications">("leaderboard");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["challenge", id],
    queryFn: async () => (await challengeApi.getOne(id)).data.data as ChallengeDetailDto,
  });

  interface PublicVerificationItem {
    id: number; userId: number; userName: string; profileImageUrl?: string;
    content?: string; imageUrl?: string; verifiedDate: string;
  }

  const { data: allVerifs } = useQuery({
    queryKey: ["challenge", id, "verifications"],
    queryFn: async () => (await challengeApi.getVerifications(id)).data.data as PublicVerificationItem[],
    enabled: tab === "allVerifications",
  });

  const joinMutation = useMutation({
    mutationFn: () => challengeApi.join(id),
    onSuccess: () => {
      toast.success("챌린지에 참가했습니다!");
      qc.invalidateQueries({ queryKey: ["challenge", id] });
      qc.invalidateQueries({ queryKey: ["challenges"] });
    },
    onError: () => toast.error("참가 처리 중 오류가 발생했습니다."),
  });

  const leaveMutation = useMutation({
    mutationFn: () => challengeApi.leave(id),
    onSuccess: () => {
      toast.success("참가를 취소했습니다.");
      qc.invalidateQueries({ queryKey: ["challenge", id] });
      qc.invalidateQueries({ queryKey: ["challenges"] });
    },
    onError: () => toast.error("취소 처리 중 오류가 발생했습니다."),
  });

  const verifyMutation = useMutation({
    mutationFn: () => challengeApi.verify(id, { content: content || undefined, imageUrl: imageUrl || undefined }),
    onSuccess: () => {
      toast.success("오늘 인증이 완료됐습니다!");
      setContent("");
      setImageUrl("");
      setImageName("");
      qc.invalidateQueries({ queryKey: ["challenge", id] });
      qc.invalidateQueries({ queryKey: ["challenges"] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? "인증 처리 중 오류가 발생했습니다.");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadApi.uploadImage(file, "challenges"),
    onSuccess: (res) => {
      setImageUrl(res.data.data ?? "");
      toast.success("이미지가 업로드됐습니다.");
    },
    onError: () => toast.error("이미지 업로드에 실패했습니다."),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    uploadMutation.mutate(file);
  };

  if (isLoading) return <div className={s.loading}>LOADING...</div>;
  if (!data) return <div className={s.loading}>챌린지를 찾을 수 없습니다.</div>;

  const pct = data.participating && data.myCompletedDays !== undefined
    ? Math.min(100, Math.round((data.myCompletedDays / data.targetDays) * 100))
    : 0;

  return (
    <div className={s.pageWrap}>
      {/* Hero */}
      <div className={s.hero}>
        <div className={s.heroLeft}>
          <div className={s.heroTop}>
            <span className={`${s.typeBadge} ${TYPE_CLASS[data.type] ?? s.typeFree}`}>
              {TYPE_LABEL[data.type] ?? data.type}
            </span>
            {data.verifiedToday && (
              <span style={{ fontSize: 11, color: "#4caf50", fontWeight: 700, letterSpacing: 1 }}>
                오늘 인증완료
              </span>
            )}
          </div>

          <h1 className={s.heroTitle}>{data.title}</h1>

          {data.description && (
            <p className={s.heroDesc}>{data.description}</p>
          )}

          <div className={s.heroMeta}>
            <div className={s.heroMetaItem}>
              <span className={s.heroMetaLabel}>목표 일수</span>
              <span className={`${s.heroMetaValue} ${s.heroMetaValueRed}`}>{data.targetDays}일</span>
            </div>
            <div className={s.heroMetaItem}>
              <span className={s.heroMetaLabel}>참가자</span>
              <span className={s.heroMetaValue}>{data.participantCount.toLocaleString()}명</span>
            </div>
            <div className={s.heroMetaItem}>
              <span className={s.heroMetaLabel}>기간</span>
              <span className={s.heroMetaValue} style={{ fontSize: 16 }}>
                {dayjs(data.startDate).format("YY.MM.DD")} ~ {dayjs(data.endDate).format("YY.MM.DD")}
              </span>
            </div>
          </div>

          <div className={s.heroActions}>
            {!loggedIn ? (
              <button className="btn-secondary" onClick={() => router.push("/login")} style={{ padding: "12px 24px", fontSize: 14 }}>
                로그인 후 참가
              </button>
            ) : data.participating ? (
              <button
                className="btn-secondary"
                onClick={() => {
                  if (confirm("챌린지 참가를 취소하시겠습니까?")) leaveMutation.mutate();
                }}
                disabled={leaveMutation.isPending}
                style={{ padding: "12px 24px", fontSize: 14 }}
              >
                {leaveMutation.isPending ? "처리 중..." : "참가 취소"}
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                style={{ padding: "12px 32px", fontSize: 14 }}
              >
                {joinMutation.isPending ? "처리 중..." : "챌린지 참가"}
              </button>
            )}
          </div>
        </div>

        <div className={s.heroRight}>
          {data.imageUrl ? (
            <img src={data.imageUrl} alt={data.title} className={s.heroImage} />
          ) : (
            <div className={s.heroImagePlaceholder}>CHALLENGE</div>
          )}
        </div>
      </div>

      {/* Progress Bar (참가 중인 경우) */}
      {data.participating && data.myCompletedDays !== undefined && (
        <div className={s.progressSection}>
          <div className={s.progressHeader}>
            <span className={s.progressTitle}>내 진행률</span>
            <span className={s.progressPct}>{pct}%</span>
          </div>
          <div className={s.progressBar}>
            <div className={s.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <p className={s.progressDays}>
            {data.myCompletedDays}일 완료 / {data.targetDays}일 목표
            {data.myCompletedDays >= data.targetDays && " — 목표 달성!"}
          </p>
        </div>
      )}

      {/* 인증 섹션 (로그인 + 참가 중) */}
      {loggedIn && data.participating && (
        <div className={s.verifySection}>
          <h3 className={s.verifySectionTitle}>오늘 인증하기</h3>
          {data.verifiedToday ? (
            <div className={s.verifiedToday}>
              <span className={s.verifiedTodayIcon}>✓</span>
              <span className={s.verifiedTodayText}>오늘 인증을 완료했습니다!</span>
            </div>
          ) : (
            <div className={s.verifyForm}>
              <textarea
                className={s.verifyTextarea}
                placeholder="인증 내용을 작성해주세요 (선택)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
              />
              <div className={s.verifyImageWrap}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <button
                  className={s.verifyImageBtn}
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? "업로드 중..." : "인증 사진 첨부"}
                </button>
                {imageUrl && (
                  <img src={imageUrl} alt="인증 사진" className={s.verifyImagePreview} />
                )}
                {imageName && !imageUrl && (
                  <span className={s.verifyImageName}>{imageName}</span>
                )}
              </div>
              <div className={s.verifySubmitRow}>
                <button
                  className="btn-primary"
                  onClick={() => verifyMutation.mutate()}
                  disabled={verifyMutation.isPending}
                  style={{ padding: "12px 32px", fontSize: 14 }}
                >
                  {verifyMutation.isPending ? "인증 중..." : "오늘 인증 완료"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className={s.tabs}>
        <button
          className={`${s.tab} ${tab === "leaderboard" ? s.tabActive : ""}`}
          onClick={() => setTab("leaderboard")}
        >
          랭킹
        </button>
        {data.participating && (
          <button
            className={`${s.tab} ${tab === "verifications" ? s.tabActive : ""}`}
            onClick={() => setTab("verifications")}
          >
            내 인증 기록
          </button>
        )}
        <button
          className={`${s.tab} ${tab === "allVerifications" ? s.tabActive : ""}`}
          onClick={() => setTab("allVerifications")}
        >
          전체 인증
        </button>
      </div>

      {/* Tab content */}
      {tab === "leaderboard" && (
        <div className={s.leaderboard}>
          {data.leaderboard.length === 0 ? (
            <div className={s.emptyList}>아직 참가자가 없습니다.</div>
          ) : (
            data.leaderboard.map((entry) => (
              <div key={entry.userId} className={s.lbItem}>
                <span className={`${s.lbRank} ${entry.rank === 1 ? s.lbRankFirst : ""}`}>
                  {entry.rank}
                </span>
                {entry.profileImageUrl ? (
                  <img src={entry.profileImageUrl} alt={entry.userName} className={s.lbAvatar} />
                ) : (
                  <div className={s.lbAvatarPlaceholder}>
                    {entry.userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={s.lbBody}>
                  {currentUser?.name === entry.userName ? (
                    <p className={s.lbName}>{entry.userName}</p>
                  ) : (
                    <Link href={`/users/${entry.userId}`} className={s.lbNameLink}>
                      {entry.userName}
                    </Link>
                  )}
                  <p className={s.lbDays}>완료 일수</p>
                </div>
                <span className={s.lbDaysVal}>{entry.completedDays}일</span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "allVerifications" && (
        <div className={s.verifications}>
          {!allVerifs ? (
            <div className={s.emptyList}>불러오는 중...</div>
          ) : allVerifs.length === 0 ? (
            <div className={s.emptyList}>아직 인증 기록이 없습니다.</div>
          ) : (
            allVerifs.map((v) => (
              <div key={v.id} className={s.verifItem}>
                <span className={s.verifiDate}>{v.verifiedDate.substring(5)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {currentUser?.name !== v.userName ? (
                    <Link href={`/users/${v.userId}`} className={s.lbNameLink} style={{ fontSize: 13, marginBottom: 4, display: "block" }}>
                      {v.userName}
                    </Link>
                  ) : (
                    <p style={{ fontSize: 13, color: "var(--text)", marginBottom: 4 }}>{v.userName}</p>
                  )}
                  <p className={s.verifiContent}>{v.content || "(내용 없음)"}</p>
                </div>
                {v.imageUrl && (
                  <img src={v.imageUrl} alt="인증 사진" className={s.verifiImage} />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "verifications" && data.participating && (
        <div className={s.verifications}>
          {data.myVerifications.length === 0 ? (
            <div className={s.emptyList}>아직 인증 기록이 없습니다. 오늘 첫 인증을 해보세요!</div>
          ) : (
            data.myVerifications.map((v) => (
              <div key={v.id} className={s.verifItem}>
                <span className={s.verifiDate}>{dayjs(v.verifiedDate).format("MM.DD")}</span>
                <p className={s.verifiContent}>{v.content || "(내용 없음)"}</p>
                {v.imageUrl && (
                  <img src={v.imageUrl} alt="인증 사진" className={s.verifiImage} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
