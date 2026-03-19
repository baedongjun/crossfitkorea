package com.crossfitkorea.domain.wod.service;

import com.crossfitkorea.common.exception.BusinessException;
import com.crossfitkorea.common.exception.ErrorCode;
import com.crossfitkorea.domain.badge.service.BadgeService;
import com.crossfitkorea.domain.box.entity.BoxMembership;
import com.crossfitkorea.domain.box.repository.BoxMembershipRepository;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.service.UserService;
import com.crossfitkorea.domain.wod.dto.BoxRankingDto;
import com.crossfitkorea.domain.wod.dto.WodRecordDto;
import com.crossfitkorea.domain.wod.dto.WodRecordRequest;
import com.crossfitkorea.domain.wod.entity.Wod;
import com.crossfitkorea.domain.wod.entity.WodRecord;
import com.crossfitkorea.domain.wod.repository.WodRecordRepository;
import com.crossfitkorea.domain.wod.repository.WodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WodRecordService {

    private final WodRecordRepository wodRecordRepository;
    private final WodRepository wodRepository;
    private final BoxMembershipRepository membershipRepository;
    private final UserService userService;
    private final BadgeService badgeService;

    public Page<WodRecordDto> getMyRecords(String email, Pageable pageable) {
        return wodRecordRepository.findByUserEmailOrderByWodDateDesc(email, pageable)
            .map(r -> toDto(r));
    }

    public List<WodRecordDto> getRecentRecords(String email, int days) {
        LocalDate from = LocalDate.now().minusDays(days);
        return wodRecordRepository
            .findByUserEmailAndWodDateBetweenOrderByWodDateDesc(email, from, LocalDate.now())
            .stream().map(r -> toDto(r)).toList();
    }

    public WodRecordDto getTodayRecord(String email) {
        User user = userService.getUserByEmail(email);
        return wodRecordRepository.findByUserIdAndWodDate(user.getId(), LocalDate.now())
            .map(r -> toDto(r))
            .orElse(null);
    }

    @Transactional
    public WodRecordDto saveRecord(WodRecordRequest request, String email) {
        User user = userService.getUserByEmail(email);
        LocalDate date = request.getWodDate() != null ? request.getWodDate() : LocalDate.now();

        WodRecord record = wodRecordRepository.findByUserIdAndWodDate(user.getId(), date)
            .orElse(WodRecord.builder().user(user).wodDate(date).build());

        record.setScore(request.getScore());
        record.setNotes(request.getNotes());
        record.setRx(request.isRx());

        WodRecord saved = wodRecordRepository.save(record);

        // 배지 체크 (신규 기록인 경우만)
        long totalCount = wodRecordRepository.countByUserEmail(email);
        String wodTitle = wodRepository.findByWodDateAndBoxIdIsNull(date)
            .map(Wod::getTitle).orElse(null);
        badgeService.checkWodBadges(user, totalCount, wodTitle);

        // 박스 멤버십 기간 배지 체크
        membershipRepository.findByUserAndActiveTrue(user).ifPresent(m -> {
            long days = ChronoUnit.DAYS.between(m.getJoinedAt(), LocalDate.now());
            badgeService.checkMembershipBadges(user, days);
        });

        return toDto(saved);
    }

    public List<WodRecordDto> getLeaderboard(LocalDate date) {
        return wodRecordRepository.findByWodDateOrderByScoreAsc(date)
            .stream().map(r -> toDto(r)).toList();
    }

    /** 박스별 WOD 랭킹 - 특정 날짜에 기록을 남긴 회원들을 박스 단위로 집계 */
    public List<BoxRankingDto> getBoxRanking(LocalDate date) {
        List<WodRecord> records = wodRecordRepository.findByWodDate(date);

        // boxId → records 그룹핑
        Map<Long, List<WodRecord>> byBox = new LinkedHashMap<>();
        Map<Long, BoxMembership> boxMap = new LinkedHashMap<>();

        for (WodRecord r : records) {
            membershipRepository.findByUserAndActiveTrue(r.getUser()).ifPresent(m -> {
                Long boxId = m.getBox().getId();
                byBox.computeIfAbsent(boxId, k -> new ArrayList<>()).add(r);
                boxMap.put(boxId, m);
            });
        }

        return byBox.entrySet().stream()
            .map(entry -> {
                BoxMembership m = boxMap.get(entry.getKey());
                List<WodRecord> boxRecords = entry.getValue();
                int rxCount = (int) boxRecords.stream().filter(WodRecord::isRx).count();
                List<String> topScores = boxRecords.stream()
                    .filter(r -> r.getScore() != null && !r.getScore().isBlank())
                    .limit(3)
                    .map(WodRecord::getScore)
                    .toList();
                return BoxRankingDto.builder()
                    .boxId(m.getBox().getId())
                    .boxName(m.getBox().getName())
                    .boxCity(m.getBox().getCity())
                    .participantCount(boxRecords.size())
                    .rxCount(rxCount)
                    .topScores(topScores)
                    .build();
            })
            .sorted(Comparator.comparingInt(BoxRankingDto::getParticipantCount).reversed())
            .toList();
    }

    @Transactional
    public void deleteRecord(Long recordId, String email) {
        WodRecord record = wodRecordRepository.findById(recordId)
            .orElseThrow(() -> new BusinessException(ErrorCode.WOD_NOT_FOUND));
        if (!record.getUser().getEmail().equals(email)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        wodRecordRepository.delete(record);
    }

    // WodRecordDto 변환 + 박스명 + WOD 제목 포함
    private WodRecordDto toDto(WodRecord r) {
        WodRecordDto dto = WodRecordDto.from(r);
        membershipRepository.findByUserAndActiveTrue(r.getUser())
            .ifPresent(m -> dto.setBoxName(m.getBox().getName()));
        wodRepository.findByWodDateAndBoxIdIsNull(r.getWodDate())
            .ifPresent(wod -> dto.setWodTitle(wod.getTitle()));
        return dto;
    }
}
