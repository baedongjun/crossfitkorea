package com.crossfitkorea.domain.wod.repository;

import com.crossfitkorea.domain.wod.entity.Wod;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WodRepository extends JpaRepository<Wod, Long> {

    Optional<Wod> findByBoxIdAndWodDateAndActiveTrue(Long boxId, LocalDate date);

    Optional<Wod> findByBoxIsNullAndWodDateAndActiveTrue(LocalDate date);

    // 배지 체크용: 공통 WOD 제목 조회
    Optional<Wod> findByWodDateAndBoxIdIsNull(LocalDate date);

    Page<Wod> findByBoxIsNullAndActiveTrueOrderByWodDateDesc(Pageable pageable);

    List<Wod> findByBoxIdAndActiveTrueAndWodDateBetweenOrderByWodDateDesc(
        Long boxId, LocalDate from, LocalDate to
    );

    List<Wod> findByBoxIdAndWodDateBetweenOrderByWodDateAsc(Long boxId, LocalDate start, LocalDate end);
}
