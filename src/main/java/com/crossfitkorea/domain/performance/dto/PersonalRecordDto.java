package com.crossfitkorea.domain.performance.dto;

import com.crossfitkorea.domain.performance.entity.ExerciseType;
import com.crossfitkorea.domain.performance.entity.PersonalRecord;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class PersonalRecordDto {
    private Long id;
    private ExerciseType exerciseType;
    private Double value;
    private String unit;
    private String notes;
    private LocalDate recordedAt;

    public static PersonalRecordDto from(PersonalRecord pr) {
        return PersonalRecordDto.builder()
            .id(pr.getId())
            .exerciseType(pr.getExerciseType())
            .value(pr.getValue())
            .unit(pr.getUnit())
            .notes(pr.getNotes())
            .recordedAt(pr.getRecordedAt())
            .build();
    }
}
