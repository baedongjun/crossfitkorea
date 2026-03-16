"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { communityApi, adminApi } from "@/lib/api";
import { Post, Comment } from "@/types";
import { isLoggedIn, getUser } from "@/lib/auth";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ko";
import s from "./post.module.css";

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
        <span className={s.commentUser}>{comment.userName}</span>
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

  const { data: post, isLoading, refetch: refetchPost } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => (await communityApi.getPost(postId)).data.data as Post,
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
    },
    onError: () => toast.error("댓글 작성에 실패했습니다."),
  });

  const likeMutation = useMutation({
    mutationFn: () => communityApi.likePost(postId),
    onSuccess: () => {
      setLiked(true);
      refetchPost();
    },
    onError: () => toast.error("좋아요 처리에 실패했습니다."),
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
                <span>{post.userName}</span>
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
                  {post.commentCount}
                </span>
              </div>
            </div>
          </div>

          <div className={s.postBody}>{post.content}</div>

          {post.imageUrls?.length > 0 && (
            <div className={s.postImages}>
              {post.imageUrls.map((url, i) => (
                <img key={i} src={url} alt="" className={s.postImg} />
              ))}
            </div>
          )}

          <div className={s.postActions}>
            <button
              className={`${s.likeBtn} ${liked ? s.likeBtnActive : ""}`}
              onClick={() => { if (isLoggedIn() && !liked) likeMutation.mutate(); }}
              disabled={!isLoggedIn() || liked}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              좋아요 {post.likeCount}
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
                  onReplySuccess={refetchComments}
                  onDeleteSuccess={refetchComments}
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
