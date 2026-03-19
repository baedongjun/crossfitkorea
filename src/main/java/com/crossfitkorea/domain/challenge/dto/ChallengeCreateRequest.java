package com.crossfitkorea.domain.challenge.dto;

import com.crossfitkorea.domain.challenge.entity.ChallengeType;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class ChallengeCreateRequest {

    private String title;
    private String description;
    private String imageUrl;
    private LocalDate startDate;
    private LocalDate endDate;
    private int targetDays = 30;
    private ChallengeType type = ChallengeType.WOD;
}
