package com.crossfitkorea.domain.box.dto;

import com.crossfitkorea.domain.box.entity.BoxAnnouncement;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BoxAnnouncementDto {

    private Long id;
    private Long boxId;
    private String title;
    private String content;
    private boolean pinned;
    private LocalDateTime createdAt;

    public static BoxAnnouncementDto from(BoxAnnouncement announcement) {
        return BoxAnnouncementDto.builder()
            .id(announcement.getId())
            .boxId(announcement.getBox().getId())
            .title(announcement.getTitle())
            .content(announcement.getContent())
            .pinned(announcement.isPinned())
            .createdAt(announcement.getCreatedAt())
            .build();
    }
}
