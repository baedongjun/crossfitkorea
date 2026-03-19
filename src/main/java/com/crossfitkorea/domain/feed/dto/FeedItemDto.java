package com.crossfitkorea.domain.feed.dto;

import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class FeedItemDto {
    private String type;          // "WOD_RECORD", "BADGE", "COMPETITION", "POST"
    private Long actorId;         // 활동한 유저 ID
    private String actorName;
    private String actorProfileImageUrl;
    private String title;         // "오늘 WOD 완료!", "배지 획득", "대회 신청" 등
    private String description;   // score, badge 이름, competition 이름 등
    private String link;          // 연결 URL
    private String imageUrl;      // 관련 이미지 (optional)
    private LocalDateTime createdAt;
}
