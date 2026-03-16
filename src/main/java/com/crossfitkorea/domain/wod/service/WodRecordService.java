package com.crossfitkorea.domain.wod.service;

import com.crossfitkorea.common.exception.BusinessException;
import com.crossfitkorea.common.exception.ErrorCode;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.service.UserService;
import com.crossfitkorea.domain.wod.dto.WodRecordDto;
import com.crossfitkorea.domain.wod.dto.WodRecordRequest;
import com.crossfitkorea.domain.wod.entity.WodRecord;
import com.crossfitkorea.domain.wod.repository.WodRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WodRecordService {

    private final WodRecordRepository wodRecordRepository;
    private final UserService userService;

    public Page<WodRecordDto> getMyRecords(String email, Pageable pageable) {
        return wodRecordRepository.findByUserEmailOrderByWodDateDesc(email, pageable)
            .map(WodRecordDto::from);
    }

    public List<WodRecordDto> getRecentRecords(String email, int days) {
        LocalDate from = LocalDate.now().minusDays(days);
        LocalDate to = LocalDate.now();
        return wodRecordRepository.findByUserEmailAndWodDateBetweenOrderByWodDateDesc(email, from, to)
            .stream().map(WodRecordDto::from).toList();
    }

    public WodRecordDto getTodayRecord(String email) {
        User user = userService.getUserByEmail(email);
        return wodRecordRepository.findByUserIdAndWodDate(user.getId(), LocalDate.now())
            .map(WodRecordDto::from)
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

        return WodRecordDto.from(wodRecordRepository.save(record));
    }

    public List<WodRecordDto> getLeaderboard(LocalDate date) {
        return wodRecordRepository.findByWodDateOrderByScoreAsc(date)
            .stream().map(WodRecordDto::from).toList();
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
}
