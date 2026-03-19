package com.crossfitkorea.domain.competition.dto;

import com.crossfitkorea.domain.competition.entity.CompetitionResult;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CompetitionResultDto {

    private Long id;
    private Long competitionId;
    private Long userId;
    private String userName;
    private int rank;
    private String score;
    private String notes;
    private LocalDateTime createdAt;

    public static CompetitionResultDto from(CompetitionResult result) {
        return CompetitionResultDto.builder()
            .id(result.getId())
            .competitionId(result.getCompetition().getId())
            .userId(result.getUserId())
            .userName(result.getUserName())
            .rank(result.getRank())
            .score(result.getScore())
            .notes(result.getNotes())
            .createdAt(result.getCreatedAt())
            .build();
    }
}
