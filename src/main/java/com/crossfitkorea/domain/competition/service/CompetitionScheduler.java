package com.crossfitkorea.domain.competition.service;

import com.crossfitkorea.domain.competition.entity.Competition;
import com.crossfitkorea.domain.competition.entity.CompetitionStatus;
import com.crossfitkorea.domain.competition.repository.CompetitionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CompetitionScheduler {

    private final CompetitionRepository competitionRepository;

    /**
     * 매일 자정 대회 상태 자동 업데이트
     * - registrationDeadline 지나면 OPEN → CLOSED
     * - startDate 지났고 endDate 지나면 CLOSED/OPEN → COMPLETED
     * - startDate 됐고 deadline 안 지났으면 UPCOMING → OPEN
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void autoUpdateCompetitionStatus() {
        LocalDate today = LocalDate.now();
        List<Competition> competitions = competitionRepository.findByActiveTrueAndStatusNot(CompetitionStatus.COMPLETED);

        int updated = 0;
        for (Competition comp : competitions) {
            CompetitionStatus newStatus = resolveStatus(comp, today);
            if (newStatus != comp.getStatus()) {
                comp.setStatus(newStatus);
                updated++;
            }
        }
        if (updated > 0) {
            log.info("[CompetitionScheduler] 대회 상태 자동 업데이트: {}건", updated);
        }
    }

    private CompetitionStatus resolveStatus(Competition comp, LocalDate today) {
        LocalDate end = comp.getEndDate() != null ? comp.getEndDate() : comp.getStartDate();

        // 종료일 지난 경우
        if (today.isAfter(end)) {
            return CompetitionStatus.COMPLETED;
        }

        // 접수 마감일 지난 경우
        if (comp.getRegistrationDeadline() != null && today.isAfter(comp.getRegistrationDeadline())) {
            return CompetitionStatus.CLOSED;
        }

        // 시작일이 됐고 마감 전
        if (!today.isBefore(comp.getStartDate())) {
            return CompetitionStatus.OPEN;
        }

        // 접수 기간 중 (startDate 전이라도 registrationUrl 있으면 OPEN)
        if (comp.getRegistrationUrl() != null && !comp.getRegistrationUrl().isBlank()
                && comp.getStatus() == CompetitionStatus.UPCOMING) {
            return CompetitionStatus.OPEN;
        }

        return comp.getStatus();
    }
}
