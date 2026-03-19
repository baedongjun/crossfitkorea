package com.crossfitkorea.domain.challenge.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChallengeVerifyRequest {
    private String content;
    private String imageUrl;
}
