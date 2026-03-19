package com.crossfitkorea.domain.performance.entity;

public enum ExerciseType {
    // 역도/파워리프팅
    BACK_SQUAT,
    FRONT_SQUAT,
    DEADLIFT,
    CLEAN,
    SNATCH,
    CLEAN_AND_JERK,
    OVERHEAD_SQUAT,
    PRESS,
    PUSH_PRESS,
    PUSH_JERK,
    BENCH_PRESS,

    // 맨몸
    PULL_UP,
    MUSCLE_UP,

    // 신체 기록
    BODYWEIGHT,    // 체중 (kg)
    BODY_FAT,      // 체지방률 (%)
    HEIGHT,        // 키 (cm)

    // 기타 (사용자 직접 입력)
    CUSTOM
}
