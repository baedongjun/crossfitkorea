package com.crossfitkorea.domain.box.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class BoxNoticeRequest {
    private String title;
    private String content;
    private boolean pinned = false;
}
