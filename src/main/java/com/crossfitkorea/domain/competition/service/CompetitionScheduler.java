package com.crossfitkorea.domain.competition.service;

import com.crossfitkorea.domain.competition.entity.Competition;
import com.crossfitkorea.domain.competition.entity.CompetitionStatus;
import com.crossfitkorea.domain.competition.repository.CompetitionRegistrationRepository;
import com.crossfitkorea.domain.competition.repository.CompetitionRepository;
import com.crossfitkorea.domain.notification.entity.NotificationType;
import com.crossfitkorea.domain.notification.service.NotificationService;
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
    private final CompetitionRegistrationRepository registrationRepository;
    private final NotificationService notificationService;

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

    /**
     * 매일 오전 9시 — 대회 D-7, D-1 알림
     */
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void sendCompetitionReminders() {
        LocalDate today = LocalDate.now();
        LocalDate d7 = today.plusDays(7);
        LocalDate d1 = today.plusDays(1);

        List<Competition> upcoming = competitionRepository.findByActiveTrueAndStatusNot(CompetitionStatus.COMPLETED);
        for (Competition comp : upcoming) {
            boolean isD7 = comp.getStartDate().equals(d7);
            boolean isD1 = comp.getStartDate().equals(d1);
            if (!isD7 && !isD1) continue;

            String dLabel = isD1 ? "내일" : "7일 후";
            String message = "[대회] " + comp.getName() + " " + dLabel + " 시작합니다!";
            String link = "/competitions/" + comp.getId();

            registrationRepository.findActiveRegistrationsByCompetitionId(comp.getId())
                .forEach(reg -> notificationService.createNotification(
                    reg.getUser(), NotificationType.COMPETITION, message, link
                ));
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
