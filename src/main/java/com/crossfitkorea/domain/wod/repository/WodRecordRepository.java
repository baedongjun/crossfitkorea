package com.crossfitkorea.domain.wod.repository;

import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.wod.entity.WodRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WodRecordRepository extends JpaRepository<WodRecord, Long> {

    Optional<WodRecord> findByUserIdAndWodDate(Long userId, LocalDate wodDate);

    Page<WodRecord> findByUserEmailOrderByWodDateDesc(String email, Pageable pageable);

    List<WodRecord> findByUserEmailAndWodDateBetweenOrderByWodDateDesc(
        String email, LocalDate from, LocalDate to);

    List<WodRecord> findByWodDateOrderByScoreAsc(LocalDate wodDate);

    List<WodRecord> findByWodDate(LocalDate wodDate);

    long countByUserEmail(String email);

    List<WodRecord> findByUserInOrderByCreatedAtDesc(List<User> users);

    List<WodRecord> findByUserEmailAndWodDateBetweenOrderByWodDateAsc(String email, LocalDate from, LocalDate to);
}
