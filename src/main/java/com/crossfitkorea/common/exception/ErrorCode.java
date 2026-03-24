package com.crossfitkorea.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // Common
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "잘못된 입력값입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    INVALID_PASSWORD(HttpStatus.BAD_REQUEST, "비밀번호가 올바르지 않습니다."),
    USER_DEACTIVATED(HttpStatus.FORBIDDEN, "비활성화된 계정입니다."),

    // Box
    BOX_NOT_FOUND(HttpStatus.NOT_FOUND, "박스를 찾을 수 없습니다."),
    BOX_NOT_AUTHORIZED(HttpStatus.FORBIDDEN, "박스 수정/삭제 권한이 없습니다."),

    // Coach
    COACH_NOT_FOUND(HttpStatus.NOT_FOUND, "코치를 찾을 수 없습니다."),

    // Schedule
    SCHEDULE_NOT_FOUND(HttpStatus.NOT_FOUND, "시간표를 찾을 수 없습니다."),

    // Review
    REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "후기를 찾을 수 없습니다."),
    REVIEW_NOT_AUTHORIZED(HttpStatus.FORBIDDEN, "후기 수정/삭제 권한이 없습니다."),
    REVIEW_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 후기를 작성하셨습니다."),

    // WOD
    WOD_NOT_FOUND(HttpStatus.NOT_FOUND, "WOD를 찾을 수 없습니다."),

    // Competition
    COMPETITION_NOT_FOUND(HttpStatus.NOT_FOUND, "대회를 찾을 수 없습니다."),

    // Community
    POST_NOT_FOUND(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."),
    POST_NOT_AUTHORIZED(HttpStatus.FORBIDDEN, "게시글 수정/삭제 권한이 없습니다."),
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다."),
    COMMENT_NOT_AUTHORIZED(HttpStatus.FORBIDDEN, "댓글 수정/삭제 권한이 없습니다."),

    // Common
    COMMON_NOT_FOUND(HttpStatus.NOT_FOUND, "리소스를 찾을 수 없습니다."),
    COMMON_FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),

    // Competition Registration
    COMPETITION_ALREADY_REGISTERED(HttpStatus.CONFLICT, "이미 참가 신청한 대회입니다."),
    COMPETITION_FULL(HttpStatus.BAD_REQUEST, "참가 인원이 마감되었습니다."),
    COMPETITION_REGISTRATION_NOT_FOUND(HttpStatus.NOT_FOUND, "참가 신청 내역을 찾을 수 없습니다."),

    // Payment
    PAYMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "결제 내역을 찾을 수 없습니다."),
    PAYMENT_CONFIRM_FAILED(HttpStatus.BAD_REQUEST, "결제 승인에 실패했습니다."),
    PAYMENT_AMOUNT_MISMATCH(HttpStatus.BAD_REQUEST, "결제 금액이 일치하지 않습니다."),

    // Challenge
    CHALLENGE_NOT_FOUND(HttpStatus.NOT_FOUND, "챌린지를 찾을 수 없습니다."),
    CHALLENGE_ALREADY_JOINED(HttpStatus.CONFLICT, "이미 참가 중인 챌린지입니다."),
    CHALLENGE_NOT_JOINED(HttpStatus.BAD_REQUEST, "참가 중인 챌린지가 아닙니다."),
    CHALLENGE_ALREADY_VERIFIED(HttpStatus.CONFLICT, "오늘 이미 인증을 완료했습니다."),

    // Announcement
    ANNOUNCEMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다."),

    // Competition Result
    COMPETITION_RESULT_NOT_FOUND(HttpStatus.NOT_FOUND, "대회 결과를 찾을 수 없습니다."),

    // Goal
    GOAL_NOT_FOUND(HttpStatus.NOT_FOUND, "목표를 찾을 수 없습니다."),
    GOAL_NOT_AUTHORIZED(HttpStatus.FORBIDDEN, "목표 수정/삭제 권한이 없습니다."),

    // Follow
    CANNOT_FOLLOW_SELF(HttpStatus.BAD_REQUEST, "자기 자신을 팔로우할 수 없습니다."),

    // Box Claim
    BOX_ALREADY_HAS_OWNER(HttpStatus.CONFLICT, "이미 오너가 있는 박스입니다."),
    BOX_CLAIM_ALREADY_PENDING(HttpStatus.CONFLICT, "이미 대기 중인 소유권 신청이 있습니다."),
    BOX_CLAIM_NOT_FOUND(HttpStatus.NOT_FOUND, "소유권 신청을 찾을 수 없습니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }
}
