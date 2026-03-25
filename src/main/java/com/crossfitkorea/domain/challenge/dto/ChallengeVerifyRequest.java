package com.crossfitkorea.domain.challenge.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ChallengeVerifyRequest {
    private String content;
    private String imageUrl;
    private String videoUrl;
}
