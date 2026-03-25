"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { communityApi, adminApi, bookmarkApi } from "@/lib/api";
import { Post, Comment } from "@/types";
import { isLoggedIn, getUser } from "@/lib/auth";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import s from "./post.module.css";
import YouTubeEmbed from "@/components/common/YouTubeEmbed";

dayjs.extend(relativeTime);
dayjs.locale("ko");

const CATEGORY_LABEL: Record<string, string> = {
  FREE: "자유게시판", QNA: "질문/답변", RECORD: "운동 기록", MARKET: "중고장터",
};
const CATEGORY_BADGE: Record<string, string> = {
  FREE: "badge-default", QNA: "badge-upcoming", RECORD: "badge-open", MARKET: "badge-amrap",
};

function CommentItem({ comment, postId, currentUser, onReplySuccess, onDeleteSuccess }: {
  comment: Comment;
  postId: number;
  currentUser: { name: string; role: string } | null;
  onReplySuccess: () => void;
  onDeleteSuccess: () => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const replyMutation = useMutation({
    mutationFn: () => communityApi.createComment(postId, replyText, comment.id),
    onSuccess: () => {
      setReplyText("");
      setShowReply(false);
      onReplySuccess();
    },
    onError: () => toast.error("댓글 작성에 실패했습니다."),
  });

  const editMutation = useMutation({
    mutationFn: () => communityApi.updateComment(comment.id, editText),
    onSuccess: () => {
      toast.success("댓글이 수정되었습니다.");
      setEditing(false);
      onReplySuccess();
    },
    onError: () => toast.error("수정에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => currentUser?.role === "ROLE_ADMIN"
      ? adminApi.deleteComment(comment.id)
      : communityApi.deleteComment(comment.id),
    onSuccess: () => {
      toast.success("댓글이 삭제되었습니다.");
      onDeleteSuccess();
    },
    onError: () => toast.error("삭제에 실패했습니다."),
  });

  const [likeCount, setLikeCount] = useState(comment.likeCount ?? 0);
  const likeMutation = useMutation({
    mutationFn: () => communityApi.likeComment(comment.id),
    onSuccess: (res) => {
      setLikeCount(res.data.data.likeCount ?? likeCount);
    },
    onError: () => toast.error("좋아요에 실패했습니다."),
  });

  const isMyComment = currentUser && currentUser.name === comment.userName;
  const canDelete = currentUser && (isMyComment || currentUser.role === "ROLE_ADMIN");

  return (
    <div className={s.comment}>
      <div className={s.commentHeader}>
        {comment.userId ? (
          <Link href={`/users/${comment.userId}`} className={s.commentUser} style={{ textDecoration: "none" }}>{comment.userName}</Link>
        ) : (
          <span className={s.commentUser}>{comment.userName}</span>
        )}
        <span className={s.commentDate}>{dayjs(comment.createdAt).fromNow()}</span>
        {isMyComment && !editing && (
          <button className={s.commentEditBtn} onClick={() => { setEditing(true); setEditText(comment.content); }}>수정</button>
        )}
        {canDelete && !editing && (
          <button
            className={s.commentDeleteBtn}
            onClick={() => { if (confirm("댓글을 삭제하시겠습니까?")) deleteMutation.mutate(); }}
          >
            삭제
          </button>
        )}
      </div>
      {editing ? (
        <div className={s.editCommentForm}>
          <textarea
            className={s.editCommentInput}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={2}
          />
          <div className={s.editCommentActions}>
            <button className={s.editCommentSave} disabled={!editText.trim() || editMutation.isPending} onClick={() => editMutation.mutate()}>저장</button>
            <button className={s.editCommentCancel} onClick={() => setEditing(false)}>취소</button>
          </div>
        </div>
      ) : (
        <p className={s.commentContent}>{comment.content}</p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
        <button className={s.commentLikeBtn} onClick={() => isLoggedIn() && likeMutation.mutate()} disabled={likeMutation.isPending}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        {isLoggedIn() && (
          <button className={s.commentReplyBtn} onClick={() => setShowReply(!showReply)}>
            답글
          </button>
        )}
      </div>

      {comment.replies?.length > 0 && (
        <div className={s.replies}>
          {comment.replies.map((reply) => (
            <div key={reply.id} className={s.reply}>
              <div className={s.commentHeader}>
                <span className={s.commentUser}>{reply.userName}</span>
                <span className={s.commentDate}>{dayjs(reply.createdAt).fromNow()}</span>
              </div>
              <p className={s.commentContent}>{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {showReply && (
        <div className={s.replyForm}>
          <input
            className={s.replyInput}
            placeholder="답글을 입력하세요"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && replyText.trim()) replyMutation.mutate(); }}
          />
          <button
            className="btn-primary"
            disabled={!replyText.trim() || replyMutation.isPending}
            onClick={() => replyMutation.mutate()}
            style={{ padding: "8px 16px", fontSize: 13 }}
          >
            등록
          </button>
        </div>
      )}
    </div>
  );
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);
  const router = useRouter();
  const currentUser = getUser();
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { data: post, isLoading, refetch: refetchPost } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => (await communityApi.getPost(postId)).data.data as Post,
  });

  useQuery({
    queryKey: ["post", postId, "likeStatus"],
    queryFn: async () => {
      const res = await communityApi.getLikeStatus(postId);
      setLiked(res.data.data.liked);
      return res.data.data.liked as boolean;
    },
    enabled: !!currentUser,
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ["post", postId, "comments"],
    queryFn: async () => (await communityApi.getComments(postId)).data.data as Comment[],
  });

  const commentMutation = useMutation({
    mutationFn: () => communityApi.createComment(postId, commentText),
    onSuccess: () => {
      setCommentText("");
      refetchComments();
      refetchPost();
    },
    onError: () => toast.error("댓글 작성에 실패했습니다."),
  });

  const likeMutation = useMutation({
    mutationFn: () => communityApi.likePost(postId),
    onMutate: () => {
      // 뮤테이션 시점의 상태를 context로 캡처
      const wasLiked = liked;
      const prevCount = likeCount ?? post?.likeCount ?? 0;
      setLiked(!wasLiked);
      setLikeCount(prevCount + (wasLiked ? -1 : 1));
      return { wasLiked, prevCount };
    },
    onError: (_err, _vars, context) => {
      // context로 정확히 되돌리기 (클로저 stale 문제 방지)
      if (context) {
        setLiked(context.wasLiked);
        setLikeCount(context.prevCount);
      }
      toast.error("좋아요 처리에 실패했습니다.");
    },
    onSettled: () => refetchPost(),
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => bookmarkApi.toggle(postId),
    onSuccess: (res) => {
      setBookmarked(res.data.data.bookmarked);
      toast.success(res.data.data.bookmarked ? "북마크에 저장됐습니다." : "북마크가 해제됐습니다.");
    },
    onError: () => toast.error("북마크 처리에 실패했습니다."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => communityApi.deletePost(postId),
    onSuccess: () => {
      toast.success("삭제되었습니다.");
      router.push("/community");
    },
  });

  const reportMutation = useMutation({
    mutationFn: () => communityApi.reportPost(postId),
    onSuccess: () => toast.success("신고가 접수되었습니다."),
    onError: () => toast.error("신고 처리에 실패했습니다."),
  });

  if (isLoading) return <div className={s.loading}>로딩 중...</div>;
  if (!post) return null;

  return (
    <div className={s.page}>
      <div className={s.content}>
        <Link href="/community" className={s.back}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          커뮤니티 목록
        </Link>

        {/* Post */}
        <div className={s.postCard}>
          <div className={s.postHeader}>
            <div className={s.postBadgeRow}>
              <span className={`badge ${CATEGORY_BADGE[post.category] || "badge-default"}`}>
                {CATEGORY_LABEL[post.category]}
              </span>
            </div>
            <h1 className={s.postTitle}>{post.title}</h1>
            <div className={s.postMeta}>
              <div className={s.postMetaLeft}>
                {post.userId ? (
                  <a href={`/users/${post.userId}`} style={{ color: "inherit", textDecoration: "none" }}>{post.userName}</a>
                ) : (
                  <span>{post.userName}</span>
                )}
                <span>·</span>
                <span>{dayjs(post.createdAt).fromNow()}</span>
              </div>
              <div className={s.postMetaStats}>
                <span className={s.metaStat}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  {post.viewCount}
                </span>
                <span className={s.metaStat}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  {comments
                    ? comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)
                    : post.commentCount}
                </span>
              </div>
            </div>
          </div>

          <div className={s.postBody}>{post.content}</div>

          {post.imageUrls?.length > 0 && (
            <div className={s.postImages}>
              {post.imageUrls.map((url, i) => (
                <div key={i} className={s.postImg} style={{ position: "relative", cursor: "zoom-in" }} onClick={() => setLightboxUrl(url)}>
                  <Image src={url} alt="" fill style={{ objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}

          {post.videoUrl && (
            <div style={{ marginTop: 16 }}>
              <YouTubeEmbed url={post.videoUrl} />
            </div>
          )}

          {lightboxUrl && (
            <div className={s.lightboxOverlay} onClick={() => setLightboxUrl(null)}>
              <button className={s.lightboxClose} onClick={() => setLightboxUrl(null)}>✕</button>
              <div className={s.lightboxImgWrap} onClick={(e) => e.stopPropagation()}>
                <img src={lightboxUrl} alt="" className={s.lightboxImg} />
              </div>
            </div>
          )}

          <div className={s.postActions}>
            <button
              className={`${s.likeBtn} ${liked ? s.likeBtnActive : ""}`}
              onClick={() => { if (isLoggedIn()) likeMutation.mutate(); }}
              disabled={!isLoggedIn() || likeMutation.isPending}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              좋아요 {likeCount ?? post.likeCount}
            </button>
            {isLoggedIn() && (
              <button
                className={`${s.reportBtn} ${bookmarked ? s.bookmarkActive : ""}`}
                style={{ color: bookmarked ? "var(--orange)" : undefined, borderColor: bookmarked ? "rgba(255,107,26,0.4)" : undefined }}
                onClick={() => bookmarkMutation.mutate()}
                disabled={bookmarkMutation.isPending}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                {bookmarked ? "저장됨" : "저장"}
              </button>
            )}
            <button
              className={s.reportBtn}
              onClick={() => {
                navigator.clipboard.writeText(window.location.href).then(() => toast.success("링크가 복사됐습니다.")).catch(() => toast.error("복사에 실패했습니다."));
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
              </svg>
              링크 복사
            </button>
            {isLoggedIn() && currentUser?.name !== post.userName && (
              <button
                className={s.reportBtn}
                onClick={() => { if (confirm("이 게시글을 신고하시겠습니까?")) reportMutation.mutate(); }}
                disabled={reportMutation.isPending || reportMutation.isSuccess}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                {reportMutation.isSuccess ? "신고됨" : "신고"}
              </button>
            )}
            {(currentUser?.name === post.userName || currentUser?.role === "ROLE_ADMIN") && (
              <>
                <Link
                  href={`/community/${postId}/edit`}
                  className="btn-secondary"
                  style={{ padding: "8px 16px", fontSize: 13 }}
                >
                  수정
                </Link>
                <button
                  className="btn-secondary"
                  onClick={() => { if (confirm("삭제하시겠습니까?")) deleteMutation.mutate(); }}
                  style={{ padding: "8px 16px", fontSize: 13, color: "var(--red)", borderColor: "rgba(232,34,10,0.3)" }}
                >
                  삭제
                </button>
              </>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className={s.commentsSection}>
          <div className={s.commentsHeader}>
            댓글 <span className={s.commentsCount}>{comments?.length || 0}</span>
          </div>

          {isLoggedIn() && (
            <div className={s.commentForm}>
              <input
                className={s.commentInput}
                placeholder="댓글을 입력하세요"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && commentText.trim()) commentMutation.mutate(); }}
              />
              <button
                className="btn-primary"
                disabled={!commentText.trim() || commentMutation.isPending}
                onClick={() => commentMutation.mutate()}
                style={{ padding: "10px 20px", fontSize: 13, whiteSpace: "nowrap" }}
              >
                등록
              </button>
            </div>
          )}

          <div className={s.commentList}>
            {comments && comments.length > 0 ? (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={postId}
                  currentUser={currentUser}
                  onReplySuccess={() => { refetchComments(); refetchPost(); }}
                  onDeleteSuccess={() => { refetchComments(); refetchPost(); }}
                />
              ))
            ) : (
              <div className={s.emptyComments}>첫 번째 댓글을 남겨보세요</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
