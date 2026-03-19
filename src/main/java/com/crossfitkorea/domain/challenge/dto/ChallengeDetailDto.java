package com.crossfitkorea.domain.challenge.dto;

import com.crossfitkorea.domain.challenge.entity.Challenge;
import com.crossfitkorea.domain.challenge.entity.ChallengeType;
import com.crossfitkorea.domain.challenge.entity.ChallengeVerification;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class ChallengeDetailDto {

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
    private Integer myCompletedDays;
    private boolean participating;
    private boolean verifiedToday;
    private List<VerificationDto> myVerifications;
    private List<LeaderboardEntryDto> leaderboard;

    @Getter
    @Builder
    public static class VerificationDto {
        private Long id;
        private String content;
        private String imageUrl;
        private LocalDate verifiedDate;

        public static VerificationDto from(ChallengeVerification v) {
            return VerificationDto.builder()
                    .id(v.getId())
                    .content(v.getContent())
                    .imageUrl(v.getImageUrl())
                    .verifiedDate(v.getVerifiedDate())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class LeaderboardEntryDto {
        private Long userId;
        private String userName;
        private String profileImageUrl;
        private int completedDays;
        private int rank;
    }

    public static ChallengeDetailDto from(Challenge challenge, long participantCount,
                                          Integer myCompletedDays, boolean participating, boolean verifiedToday,
                                          List<VerificationDto> myVerifications,
                                          List<LeaderboardEntryDto> leaderboard) {
        return ChallengeDetailDto.builder()
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
                .myVerifications(myVerifications)
                .leaderboard(leaderboard)
                .build();
    }
}
