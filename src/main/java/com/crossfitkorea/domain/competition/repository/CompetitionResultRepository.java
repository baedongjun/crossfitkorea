package com.crossfitkorea.domain.competition.repository;

import com.crossfitkorea.domain.competition.entity.CompetitionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface CompetitionResultRepository extends JpaRepository<CompetitionResult, Long> {

    List<CompetitionResult> findByCompetitionIdOrderByRankAsc(Long competitionId);

    Optional<CompetitionResult> findByCompetitionIdAndUserId(Long competitionId, Long userId);

    @Transactional
    void deleteByCompetitionId(Long competitionId);
}
