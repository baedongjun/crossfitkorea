"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { boxApi } from "@/lib/api";
import BoxDetailMap from "@/components/box/BoxDetailMap";
import { Box, Coach, Schedule, Review, Page } from "@/types";
import { isLoggedIn, getUser } from "@/lib/auth";
import { toast } from "react-toastify";
import { useEffect } from "react";
import dayjs from "dayjs";
import s from "./box.module.css";

const DAY_ORDER = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
const DAY_LABEL: Record<string, string> = {
  MONDAY:"월요일", TUESDAY:"화요일", WEDNESDAY:"수요일",
  THURSDAY:"목요일", FRIDAY:"금요일", SATURDAY:"토요일", SUNDAY:"일요일",
};

const TABS = ["정보", "코치", "시간표", "후기"] as const;
type Tab = typeof TABS[number];

export default function BoxDetailPage() {
  const { id } = useParams<{ id: string }>();
  const boxId = Number(id);
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>("정보");
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const currentUser = getUser();
  const isOwner = currentUser?.role === "ROLE_ADMIN" ||
    (currentUser?.role === "ROLE_BOX_OWNER");

  // Coach form state
  const [showCoachForm, setShowCoachForm] = useState(false);
  const [coachForm, setCoachForm] = useState({ name: "", bio: "", experienceYears: "", certifications: "" });

  // Schedule form state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: "MONDAY", startTime: "06:00", endTime: "07:00", className: "CrossFit", maxCapacity: "20",
  });

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewContent, setReviewContent] = useState("");
  const [favorited, setFavorited] = useState(false);
  const [reviewPage, setReviewPage] = useState(0);

  const { data: box, isLoading } = useQuery({
    queryKey: ["box", boxId],
    queryFn: async () => (await boxApi.getOne(boxId)).data.data as Box,
  });

  const { data: coaches } = useQuery({
    queryKey: ["box", boxId, "coaches"],
    queryFn: async () => (await boxApi.getCoaches(boxId)).data.data as Coach[],
    enabled: tab === "코치",
  });

  const { data: schedules } = useQuery({
    queryKey: ["box", boxId, "schedules"],
    queryFn: async () => (await boxApi.getSchedules(boxId)).data.data as Schedule[],
    enabled: tab === "시간표",
  });

  const { data: reviewData } = useQuery({
    queryKey: ["box", boxId, "reviews", reviewPage],
    queryFn: async () => (await boxApi.getReviews(boxId, reviewPage)).data.data,
    enabled: tab === "후기",
  });

  const { data: favoriteData } = useQuery({
    queryKey: ["box", boxId, "favorite"],
    queryFn: async () => (await boxApi.checkFavorite(boxId)).data.data as { favorited: boolean },
    enabled: isLoggedIn(),
  });

  useEffect(() => {
    if (favoriteData !== undefined) {
      setFavorited(favoriteData.favorited);
    }
  }, [favoriteData]);

  const favoriteMutation = useMutation({
    mutationFn: () => boxApi.toggleFavorite(boxId),
    onSuccess: (res) => {
      const isFav = (res.data.data as { favorited: boolean }).favorited;
      setFavorited(isFav);
      toast.success(isFav ? "즐겨찾기에 추가되었습니다." : "즐겨찾기에서 해제되었습니다.");
    },
    onError: () => toast.error("처리에 실패했습니다."),
  });

  const { data: relatedBoxes } = useQuery({
    queryKey: ["boxes", "related", box?.city],
    queryFn: async () => (await boxApi.search({ city: box!.city, size: 4 })).data.data as Page<Box>,
    enabled: !!box?.city,
  });

  const addCoachMutation = useMutation({
    mutationFn: () => boxApi.addCoach(boxId, {
      name: coachForm.name,
      bio: coachForm.bio || undefined,
      experienceYears: coachForm.experienceYears ? parseInt(coachForm.experienceYears) : undefined,
      certifications: coachForm.certifications ? coachForm.certifications.split(",").map((c) => c.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => {
      toast.success("코치가 추가되었습니다.");
      setCoachForm({ name: "", bio: "", experienceYears: "", certifications: "" });
      setShowCoachForm(false);
      queryClient.invalidateQueries({ queryKey: ["box", boxId, "coaches"] });
    },
    onError: () => toast.error("코치 추가에 실패했습니다."),
  });

  const deleteCoachMutation = useMutation({
    mutationFn: (coachId: number) => boxApi.deleteCoach(coachId),
    onSuccess: () => {
      toast.success("코치가 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["box", boxId, "coaches"] });
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const addScheduleMutation = useMutation({
    mutationFn: () => boxApi.addSchedule(boxId, {
      dayOfWeek: scheduleForm.dayOfWeek,
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      className: scheduleForm.className,
      maxCapacity: scheduleForm.maxCapacity ? parseInt(scheduleForm.maxCapacity) : undefined,
    }),
    onSuccess: () => {
      toast.success("수업이 추가되었습니다.");
      setScheduleForm({ dayOfWeek: "MONDAY", startTime: "06:00", endTime: "07:00", className: "CrossFit", maxCapacity: "20" });
      setShowScheduleForm(false);
      queryClient.invalidateQueries({ queryKey: ["box", boxId, "schedules"] });
    },
    onError: () => toast.error("수업 추가에 실패했습니다."),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (scId: number) => boxApi.deleteSchedule(scId),
    onSuccess: () => {
      toast.success("수업이 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["box", boxId, "schedules"] });
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const reviewMutation = useMutation({
    mutationFn: () => boxApi.createReview(boxId, { rating, content: reviewContent }),
    onSuccess: () => {
      toast.success("후기가 등록되었습니다.");
      setRating(0);
      setReviewContent("");
      setReviewPage(0);
      queryClient.invalidateQueries({ queryKey: ["box", boxId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["box", boxId] });
    },
    onError: () => toast.error("후기 등록에 실패했습니다."),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: number) => boxApi.deleteReview(reviewId),
    onSuccess: () => {
      toast.success("후기가 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["box", boxId, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["box", boxId] });
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const handleShare = () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      navigator.share({ title: box?.name, text: `${box?.name} - ${box?.city} ${box?.district}`, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      toast.success("링크가 복사되었습니다.");
    }
  };

  // Group schedules by day
  const scheduleByDay: Record<string, Schedule[]> = {};
  schedules?.forEach((s) => {
    if (!scheduleByDay[s.dayOfWeek]) scheduleByDay[s.dayOfWeek] = [];
    scheduleByDay[s.dayOfWeek].push(s);
  });

  if (isLoading) {
    return (
      <div className={s.page}>
        <div className={s.hero} style={{ height: 360 }}>
          <div className={s.skeleton} style={{ height: "100%" }} />
        </div>
      </div>
    );
  }
  if (!box) return null;

  const displayRating = hoverRating || rating;

  return (
    <div className={s.page}>
      {/* Hero */}
      <div className={s.hero}>
        {box.imageUrls?.[0] ? (
          <img src={box.imageUrls[currentImgIdx] || box.imageUrls[0]} alt={box.name} className={s.heroImg} />
        ) : (
          <div className={s.heroNoImg}>CROSSFIT</div>
        )}
        {box.imageUrls && box.imageUrls.length > 1 && (
          <>
            <button
              className={`${s.imgNav} ${s.imgNavPrev}`}
              onClick={() => setCurrentImgIdx((i) => (i - 1 + box.imageUrls.length) % box.imageUrls.length)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <button
              className={`${s.imgNav} ${s.imgNavNext}`}
              onClick={() => setCurrentImgIdx((i) => (i + 1) % box.imageUrls.length)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
            <div className={s.imgDots}>
              {box.imageUrls.map((_, i) => (
                <button
                  key={i}
                  className={`${s.imgDot} ${i === currentImgIdx ? s.imgDotActive : ""}`}
                  onClick={() => setCurrentImgIdx(i)}
                />
              ))}
            </div>
          </>
        )}
        <div className={s.heroOverlay} />
        <div style={{ position: "absolute", inset: 0, maxWidth: 1280, margin: "0 auto" }}>
          <div className={s.heroContent}>
            <div className={s.heroBadges}>
              {box.verified && <span className="badge badge-approved">인증</span>}
              {box.premium && <span className="badge badge-premium">PREMIUM</span>}
            </div>
            <h1 className={s.heroName}>{box.name}</h1>
            <div className={s.heroMeta}>
              <span className={s.heroRating}>★ {Number(box.rating || 0).toFixed(1)}</span>
              <span>({box.reviewCount}개 후기)</span>
              <span>·</span>
              <span>{box.city} {box.district}</span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
              {isLoggedIn() && (
                <button
                  className={s.favBtn}
                  onClick={() => favoriteMutation.mutate()}
                  disabled={favoriteMutation.isPending}
                  style={{ color: favorited ? "var(--red)" : "rgba(255,255,255,0.6)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  {favorited ? "즐겨찾기 해제" : "즐겨찾기"}
                </button>
              )}
              <button className={s.shareBtn} onClick={handleShare}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                공유
              </button>
              {(currentUser?.role === "ROLE_ADMIN" ||
                (currentUser?.role === "ROLE_BOX_OWNER" && box.ownerName === currentUser?.name)) && (
                <Link href={`/boxes/${boxId}/edit`} className={s.editBtn}>
                  정보 수정
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className={s.layout}>
        <div>
          {/* Tabs */}
          <div className={s.tabs}>
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`${s.tab} ${tab === t ? s.tabActive : ""}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* 정보 */}
          {tab === "정보" && (
            <div>
              <div className={s.infoGrid}>
                <div className={s.infoItem}>
                  <svg className={s.infoIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <div>
                    <p className={s.infoLabel}>주소</p>
                    <p className={s.infoValue}>{box.address}</p>
                  </div>
                </div>
                {box.phone && (
                  <div className={s.infoItem}>
                    <svg className={s.infoIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <div>
                      <p className={s.infoLabel}>전화</p>
                      <a href={`tel:${box.phone}`} className={`${s.infoValue} ${s.infoLink}`}>{box.phone}</a>
                    </div>
                  </div>
                )}
                {(box.openTime || box.closeTime) && (
                  <div className={s.infoItem}>
                    <svg className={s.infoIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <div>
                      <p className={s.infoLabel}>운영시간</p>
                      <p className={s.infoValue}>{box.openTime} – {box.closeTime}</p>
                    </div>
                  </div>
                )}
                {box.monthlyFee > 0 && (
                  <div className={s.infoItem}>
                    <svg className={s.infoIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    <div>
                      <p className={s.infoLabel}>월 회비</p>
                      <p className={s.infoValue}>{box.monthlyFee.toLocaleString()}원</p>
                    </div>
                  </div>
                )}
              </div>
              {box.description && <div className={s.description}>{box.description}</div>}
            </div>
          )}

          {/* 코치 */}
          {tab === "코치" && (
            <div>
              {isOwner && (
                <div className={s.ownerBar}>
                  <button className="btn-primary" style={{ padding: "10px 20px", fontSize: 13 }} onClick={() => setShowCoachForm(!showCoachForm)}>
                    {showCoachForm ? "취소" : "+ 코치 추가"}
                  </button>
                </div>
              )}
              {showCoachForm && (
                <div className={s.addForm}>
                  <div className={s.addFormGrid}>
                    <div className={s.addField}>
                      <label className={s.addLabel}>이름 *</label>
                      <input className="input-field" placeholder="코치 이름" value={coachForm.name} onChange={(e) => setCoachForm((f) => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className={s.addField}>
                      <label className={s.addLabel}>경력 (년)</label>
                      <input className="input-field" type="number" placeholder="5" value={coachForm.experienceYears} onChange={(e) => setCoachForm((f) => ({ ...f, experienceYears: e.target.value }))} />
                    </div>
                  </div>
                  <div className={s.addField}>
                    <label className={s.addLabel}>자기소개</label>
                    <input className="input-field" placeholder="간단한 소개" value={coachForm.bio} onChange={(e) => setCoachForm((f) => ({ ...f, bio: e.target.value }))} />
                  </div>
                  <div className={s.addField}>
                    <label className={s.addLabel}>자격증 (쉼표로 구분)</label>
                    <input className="input-field" placeholder="CF-L1, CF-L2, Olympic Lifting" value={coachForm.certifications} onChange={(e) => setCoachForm((f) => ({ ...f, certifications: e.target.value }))} />
                  </div>
                  <button className="btn-primary" disabled={addCoachMutation.isPending || !coachForm.name} onClick={() => addCoachMutation.mutate()} style={{ padding: "10px 24px", fontSize: 13 }}>
                    {addCoachMutation.isPending ? "추가 중..." : "추가"}
                  </button>
                </div>
              )}
              {coaches && coaches.length > 0 ? (
                <div className={s.coachGrid}>
                  {coaches.map((coach) => (
                    <div key={coach.id} className={s.coachCard}>
                      <div className={s.coachAvatar}>
                        {coach.imageUrl
                          ? <img src={coach.imageUrl} alt={coach.name} className={s.coachImg} />
                          : coach.name[0]
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <p className={s.coachName}>{coach.name}</p>
                        <p className={s.coachExp}>경력 {coach.experienceYears}년</p>
                        {coach.bio && <p className={s.coachBio}>{coach.bio}</p>}
                        {coach.certifications?.length > 0 && (
                          <div className={s.certList}>
                            {coach.certifications.map((c, i) => (
                              <span key={i} className={s.cert}>{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {isOwner && (
                        <button className={s.deleteBtn} onClick={() => { if (window.confirm("코치를 삭제할까요?")) deleteCoachMutation.mutate(coach.id); }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={s.empty}>
                  <div className={s.emptyIcon}>👤</div>
                  <p>등록된 코치 정보가 없습니다</p>
                </div>
              )}
            </div>
          )}

          {/* 시간표 */}
          {tab === "시간표" && (
            <div>
              {isOwner && (
                <div className={s.ownerBar}>
                  <button className="btn-primary" style={{ padding: "10px 20px", fontSize: 13 }} onClick={() => setShowScheduleForm(!showScheduleForm)}>
                    {showScheduleForm ? "취소" : "+ 수업 추가"}
                  </button>
                </div>
              )}
              {showScheduleForm && (
                <div className={s.addForm}>
                  <div className={s.addFormGrid}>
                    <div className={s.addField}>
                      <label className={s.addLabel}>요일 *</label>
                      <select className={s.addSelect} value={scheduleForm.dayOfWeek} onChange={(e) => setScheduleForm((f) => ({ ...f, dayOfWeek: e.target.value }))}>
                        {Object.entries(DAY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div className={s.addField}>
                      <label className={s.addLabel}>수업명 *</label>
                      <input className="input-field" value={scheduleForm.className} onChange={(e) => setScheduleForm((f) => ({ ...f, className: e.target.value }))} />
                    </div>
                    <div className={s.addField}>
                      <label className={s.addLabel}>시작</label>
                      <input className="input-field" type="time" value={scheduleForm.startTime} onChange={(e) => setScheduleForm((f) => ({ ...f, startTime: e.target.value }))} />
                    </div>
                    <div className={s.addField}>
                      <label className={s.addLabel}>종료</label>
                      <input className="input-field" type="time" value={scheduleForm.endTime} onChange={(e) => setScheduleForm((f) => ({ ...f, endTime: e.target.value }))} />
                    </div>
                    <div className={s.addField}>
                      <label className={s.addLabel}>최대 인원</label>
                      <input className="input-field" type="number" placeholder="20" value={scheduleForm.maxCapacity} onChange={(e) => setScheduleForm((f) => ({ ...f, maxCapacity: e.target.value }))} />
                    </div>
                  </div>
                  <button className="btn-primary" disabled={addScheduleMutation.isPending || !scheduleForm.className} onClick={() => addScheduleMutation.mutate()} style={{ padding: "10px 24px", fontSize: 13 }}>
                    {addScheduleMutation.isPending ? "추가 중..." : "추가"}
                  </button>
                </div>
              )}
              {DAY_ORDER.some((d) => scheduleByDay[d]?.length > 0) ? (
                <div>
                  {DAY_ORDER.filter((d) => scheduleByDay[d]?.length > 0).map((day) => (
                    <div key={day} className={s.scheduleDay}>
                      <p className={s.scheduleDayName}>{DAY_LABEL[day]}</p>
                      <div className={s.scheduleList}>
                        {scheduleByDay[day]
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map((sc) => (
                            <div key={sc.id} className={s.scheduleItem}>
                              <span className={s.scheduleTime}>{sc.startTime} – {sc.endTime}</span>
                              <span className={s.scheduleClass}>{sc.className}</span>
                              {sc.coachName && <span className={s.scheduleCoach}>{sc.coachName}</span>}
                              {sc.maxCapacity && <span className={s.scheduleCap}>{sc.maxCapacity}명</span>}
                              {isOwner && (
                                <button className={s.deleteBtn} onClick={() => { if (window.confirm("수업을 삭제할까요?")) deleteScheduleMutation.mutate(sc.id); }}>✕</button>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={s.empty}>
                  <div className={s.emptyIcon}>📅</div>
                  <p>등록된 시간표가 없습니다</p>
                </div>
              )}
            </div>
          )}

          {/* 후기 */}
          {tab === "후기" && (
            <div>
              {isLoggedIn() && (
                <div className={s.reviewForm}>
                  <p className={s.reviewFormTitle}>후기 작성</p>
                  <div className={s.ratingSelect}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        className={`${s.ratingStar} ${n <= displayRating ? s.ratingStarOn : ""}`}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(n)}
                      >★</button>
                    ))}
                  </div>
                  <textarea
                    className={s.reviewTextarea}
                    placeholder="이 박스에 대한 솔직한 후기를 남겨주세요"
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                  />
                  <div className={s.reviewSubmitRow}>
                    <button
                      className="btn-primary"
                      disabled={rating === 0 || !reviewContent.trim() || reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate()}
                    >
                      {reviewMutation.isPending ? "등록 중..." : "후기 등록"}
                    </button>
                  </div>
                </div>
              )}

              {reviewData?.content?.length > 0 ? (
                <>
                  <div className={s.reviewList}>
                    {reviewData.content.map((rev: Review) => (
                      <div key={rev.id} className={s.reviewItem}>
                        <div className={s.reviewHeader}>
                          <span className={s.reviewUser}>{rev.userName}</span>
                          <span className={s.reviewDate}>{dayjs(rev.createdAt).format("YYYY.MM.DD")}</span>
                          {currentUser && (currentUser.name === rev.userName || currentUser.role === "ROLE_ADMIN") && (
                            <button
                              className={s.reviewDeleteBtn}
                              onClick={() => { if (window.confirm("후기를 삭제하시겠습니까?")) deleteReviewMutation.mutate(rev.id); }}
                              disabled={deleteReviewMutation.isPending}
                            >삭제</button>
                          )}
                        </div>
                        <div className={s.reviewStars}>
                          {"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}
                        </div>
                        <p className={s.reviewContent}>{rev.content}</p>
                      </div>
                    ))}
                  </div>
                  {reviewData.totalPages > 1 && (
                    <div className={s.reviewPagination}>
                      <button
                        className={s.reviewPageBtn}
                        disabled={reviewPage === 0}
                        onClick={() => setReviewPage((p) => p - 1)}
                      >이전</button>
                      <span className={s.reviewPageInfo}>{reviewPage + 1} / {reviewData.totalPages}</span>
                      <button
                        className={s.reviewPageBtn}
                        disabled={reviewPage >= reviewData.totalPages - 1}
                        onClick={() => setReviewPage((p) => p + 1)}
                      >다음</button>
                    </div>
                  )}
                </>
              ) : (
                <div className={s.empty}>
                  <div className={s.emptyIcon}>⭐</div>
                  <p>아직 후기가 없습니다</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={s.sidebar}>
          {box.monthlyFee > 0 && (
            <div className={s.sideCard}>
              <p className={s.sideTitle}>월 회비</p>
              <p className={s.feeValue}>{box.monthlyFee.toLocaleString()}</p>
              <p className={s.feeUnit}>원 / 월</p>
            </div>
          )}

          <div className={s.sideCard}>
            <p className={s.sideTitle}>연락처</p>
            <div className={s.contactList}>
              {box.phone && (
                <div className={s.contactItem}>
                  <svg className={s.contactIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <a href={`tel:${box.phone}`} className={s.contactLink}>{box.phone}</a>
                </div>
              )}
              {box.website && (
                <div className={s.contactItem}>
                  <svg className={s.contactIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <a href={box.website} target="_blank" rel="noopener noreferrer" className={s.contactLink}>홈페이지</a>
                </div>
              )}
            </div>
            {(box.instagram || box.youtube) && (
              <div className={s.snsRow}>
                {box.instagram && (
                  <a href={`https://instagram.com/${box.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer" className={s.snsBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                    Instagram
                  </a>
                )}
                {box.youtube && (
                  <a href={box.youtube} target="_blank" rel="noopener noreferrer" className={s.snsBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.97C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.97A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
                    </svg>
                    YouTube
                  </a>
                )}
              </div>
            )}
          </div>

          <div className={s.sideCard}>
            <p className={s.sideTitle}>위치</p>
            <div className={s.contactItem} style={{ gap: 10, marginBottom: 12 }}>
              <svg className={s.contactIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{box.address}</span>
            </div>
            <BoxDetailMap
              name={box.name}
              address={box.address}
              latitude={box.latitude}
              longitude={box.longitude}
            />
          </div>

          {relatedBoxes && relatedBoxes.content.filter((b) => b.id !== boxId).length > 0 && (
            <div className={s.sideCard}>
              <p className={s.relatedTitle}>{box.city} 다른 박스</p>
              <div className={s.relatedList}>
                {relatedBoxes.content
                  .filter((b) => b.id !== boxId)
                  .slice(0, 3)
                  .map((b) => (
                    <Link key={b.id} href={`/boxes/${b.id}`} className={s.relatedItem}>
                      <div className={s.relatedImg}>
                        {b.imageUrls?.[0]
                          ? <img src={b.imageUrls[0]} alt={b.name} />
                          : <div className={s.relatedPlaceholder}>CF</div>
                        }
                      </div>
                      <div>
                        <p className={s.relatedName}>{b.name}</p>
                        <p className={s.relatedMeta}>{b.district} · ★ {Number(b.rating || 0).toFixed(1)}</p>
                      </div>
                    </Link>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
