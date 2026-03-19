package com.crossfitkorea.domain.performance.service;

import com.crossfitkorea.domain.performance.dto.PersonalRecordDto;
import com.crossfitkorea.domain.performance.entity.ExerciseType;
import com.crossfitkorea.domain.performance.entity.PersonalRecord;
import com.crossfitkorea.domain.performance.repository.PersonalRecordRepository;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PersonalRecordService {

    private final PersonalRecordRepository repository;
    private final UserService userService;

    private static final Map<ExerciseType, String> DEFAULT_UNITS = Map.ofEntries(
        Map.entry(ExerciseType.BACK_SQUAT, "kg"),
        Map.entry(ExerciseType.FRONT_SQUAT, "kg"),
        Map.entry(ExerciseType.DEADLIFT, "kg"),
        Map.entry(ExerciseType.CLEAN, "kg"),
        Map.entry(ExerciseType.SNATCH, "kg"),
        Map.entry(ExerciseType.CLEAN_AND_JERK, "kg"),
        Map.entry(ExerciseType.OVERHEAD_SQUAT, "kg"),
        Map.entry(ExerciseType.PRESS, "kg"),
        Map.entry(ExerciseType.PUSH_PRESS, "kg"),
        Map.entry(ExerciseType.PUSH_JERK, "kg"),
        Map.entry(ExerciseType.BENCH_PRESS, "kg"),
        Map.entry(ExerciseType.PULL_UP, "회"),
        Map.entry(ExerciseType.MUSCLE_UP, "회"),
        Map.entry(ExerciseType.BODYWEIGHT, "kg"),
        Map.entry(ExerciseType.BODY_FAT, "%"),
        Map.entry(ExerciseType.HEIGHT, "cm"),
        Map.entry(ExerciseType.CUSTOM, "")
    );

    public List<PersonalRecordDto> getMyRecords(String email) {
        User user = userService.getUserByEmail(email);
        return repository.findByUserOrderByRecordedAtDesc(user)
            .stream().map(PersonalRecordDto::from).toList();
    }

    public List<PersonalRecordDto> getRecordsByType(String email, ExerciseType type) {
        User user = userService.getUserByEmail(email);
        return repository.findByUserAndExerciseTypeOrderByRecordedAtDesc(user, type)
            .stream().map(PersonalRecordDto::from).toList();
    }

    public Map<String, PersonalRecordDto> getPRs(String email) {
        User user = userService.getUserByEmail(email);
        Map<String, PersonalRecordDto> prs = new LinkedHashMap<>();
        for (ExerciseType type : ExerciseType.values()) {
            repository.findTopByUserAndExerciseTypeOrderByValueDesc(user, type)
                .map(PersonalRecordDto::from)
                .ifPresent(dto -> prs.put(type.name(), dto));
        }
        return prs;
    }

    @Transactional
    public PersonalRecordDto save(String email, ExerciseType type, Double value, String unit, String notes, LocalDate recordedAt) {
        User user = userService.getUserByEmail(email);
        String resolvedUnit = (unit != null && !unit.isBlank()) ? unit : DEFAULT_UNITS.getOrDefault(type, "");
        PersonalRecord pr = PersonalRecord.builder()
            .user(user).exerciseType(type).value(value)
            .unit(resolvedUnit).notes(notes)
            .recordedAt(recordedAt != null ? recordedAt : LocalDate.now())
            .build();
        return PersonalRecordDto.from(repository.save(pr));
    }

    @Transactional
    public PersonalRecordDto update(Long id, String email, Double value, String notes) {
        PersonalRecord pr = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("기록을 찾을 수 없습니다."));
        if (!pr.getUser().getEmail().equals(email))
            throw new IllegalArgumentException("권한이 없습니다.");
        pr.update(value, notes);
        return PersonalRecordDto.from(pr);
    }

    @Transactional
    public void delete(Long id, String email) {
        PersonalRecord pr = repository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("기록을 찾을 수 없습니다."));
        if (!pr.getUser().getEmail().equals(email))
            throw new IllegalArgumentException("권한이 없습니다.");
        repository.delete(pr);
    }
}
