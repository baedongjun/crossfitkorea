package com.crossfitkorea.domain.box.dto;

import com.crossfitkorea.domain.box.entity.BoxNotice;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BoxNoticeDto {
    private Long id;
    private String title;
    private String content;
    private String authorName;
    private boolean pinned;
    private LocalDateTime createdAt;

    public static BoxNoticeDto from(BoxNotice n) {
        return BoxNoticeDto.builder()
            .id(n.getId())
            .title(n.getTitle())
            .content(n.getContent())
            .authorName(n.getAuthor().getName())
            .pinned(n.isPinned())
            .createdAt(n.getCreatedAt())
            .build();
    }
}
