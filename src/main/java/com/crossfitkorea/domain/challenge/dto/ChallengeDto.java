package com.crossfitkorea.domain.challenge.dto;

import com.crossfitkorea.domain.challenge.entity.Challenge;
import com.crossfitkorea.domain.challenge.entity.ChallengeType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class ChallengeDto {

    private Long id;
    private String title;
    private String description;
    private String imageUrl;
    private LocalDate startDate;
    private LocalDate endDate;
    private int targetDays;
    private ChallengeType type;
    private boolean active;
    private long participantCount;
    private Integer myCompletedDays;   // null: 미참가
    private boolean participating;
    private boolean verifiedToday;

    public static ChallengeDto from(Challenge challenge, long participantCount,
                                    Integer myCompletedDays, boolean participating, boolean verifiedToday) {
        return ChallengeDto.builder()
                .id(challenge.getId())
                .title(challenge.getTitle())
                .description(challenge.getDescription())
                .imageUrl(challenge.getImageUrl())
                .startDate(challenge.getStartDate())
                .endDate(challenge.getEndDate())
                .targetDays(challenge.getTargetDays())
                .type(challenge.getType())
                .active(challenge.isActive())
                .participantCount(participantCount)
                .myCompletedDays(myCompletedDays)
                .participating(participating)
                .verifiedToday(verifiedToday)
                .build();
    }
}
