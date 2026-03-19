package com.crossfitkorea.domain.competition.service;

import com.crossfitkorea.common.exception.BusinessException;
import com.crossfitkorea.common.exception.ErrorCode;
import com.crossfitkorea.domain.competition.dto.CompetitionResultDto;
import com.crossfitkorea.domain.competition.entity.Competition;
import com.crossfitkorea.domain.competition.entity.CompetitionResult;
import com.crossfitkorea.domain.competition.repository.CompetitionRepository;
import com.crossfitkorea.domain.competition.repository.CompetitionResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompetitionResultService {

    private final CompetitionResultRepository competitionResultRepository;
    private final CompetitionRepository competitionRepository;

    public List<CompetitionResultDto> getResults(Long competitionId) {
        return competitionResultRepository.findByCompetitionIdOrderByRankAsc(competitionId)
            .stream()
            .map(CompetitionResultDto::from)
            .toList();
    }

    @Transactional
    public List<CompetitionResultDto> saveResults(Long competitionId, List<CompetitionResultDto> results) {
        Competition competition = competitionRepository.findById(competitionId)
            .orElseThrow(() -> new BusinessException(ErrorCode.COMPETITION_NOT_FOUND));

        // 기존 결과 전체 삭제 후 재저장
        competitionResultRepository.deleteByCompetitionId(competitionId);

        List<CompetitionResult> entities = results.stream()
            .map(dto -> CompetitionResult.builder()
                .competition(competition)
                .userId(dto.getUserId())
                .userName(dto.getUserName())
                .rank(dto.getRank())
                .score(dto.getScore())
                .notes(dto.getNotes())
                .build())
            .toList();

        return competitionResultRepository.saveAll(entities)
            .stream()
            .map(CompetitionResultDto::from)
            .toList();
    }
}
