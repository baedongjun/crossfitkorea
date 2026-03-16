package com.crossfitkorea.domain.competition.repository;

import com.crossfitkorea.domain.competition.entity.Competition;
import com.crossfitkorea.domain.competition.entity.CompetitionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface CompetitionRepository extends JpaRepository<Competition, Long> {

    Page<Competition> findByActiveTrueOrderByStartDateAsc(Pageable pageable);

    long countByActiveTrue();

    List<Competition> findByActiveTrueAndStatusNot(CompetitionStatus status);

    @Query("SELECT c FROM Competition c WHERE c.active = true " +
           "AND (:status IS NULL OR c.status = :status) " +
           "AND (:city IS NULL OR c.city = :city) " +
           "ORDER BY c.startDate ASC")
    Page<Competition> searchCompetitions(
        @Param("status") CompetitionStatus status,
        @Param("city") String city,
        Pageable pageable
    );
}
