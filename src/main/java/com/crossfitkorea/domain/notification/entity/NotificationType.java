package com.crossfitkorea.domain.notification.entity;

public enum NotificationType {
    COMMENT,      // 내 글에 댓글
    REPLY,        // 내 댓글에 답글
    REVIEW,       // 내 박스에 리뷰
    BADGE,        // 배지 획득
    MEMBERSHIP,   // 박스 가입/탈퇴
    COMPETITION,  // 대회 신청/취소
    COMMUNITY,    // 커뮤니티 (좋아요 등)
    FOLLOW,       // 팔로우
    SYSTEM        // 시스템 공지
}
