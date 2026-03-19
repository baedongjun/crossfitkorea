package com.crossfitkorea.domain.goal.dto;

import com.crossfitkorea.domain.goal.entity.UserGoal;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class UserGoalDto {

    private Long id;
    private String exerciseType;
    private Double targetValue;
    private Double currentValue;
    private String unit;
    private LocalDate targetDate;
    private boolean achieved;
    private String notes;
    private LocalDateTime createdAt;

    public static UserGoalDto from(UserGoal goal) {
        return UserGoalDto.builder()
            .id(goal.getId())
            .exerciseType(goal.getExerciseType())
            .targetValue(goal.getTargetValue())
            .currentValue(goal.getCurrentValue())
            .unit(goal.getUnit())
            .targetDate(goal.getTargetDate())
            .achieved(goal.isAchieved())
            .notes(goal.getNotes())
            .createdAt(goal.getCreatedAt())
            .build();
    }
}
