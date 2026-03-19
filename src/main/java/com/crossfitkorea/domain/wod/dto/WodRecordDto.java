package com.crossfitkorea.domain.wod.dto;

import com.crossfitkorea.domain.wod.entity.WodRecord;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Builder
public class WodRecordDto {

    private Long id;
    private LocalDate wodDate;
    private String score;
    private String notes;
    private boolean rx;
    private String userName;
    private String boxName;   // 유저의 소속 박스명 (없으면 null)
    private String wodTitle;  // 해당 날짜 WOD 제목 (없으면 null, WodRecordService에서 별도 설정)
    private Integer currentStreak; // 연속 기록 일수 (saveRecord 응답에만 포함)
    private Long totalWodCount;    // 누적 WOD 기록 수 (saveRecord 응답에만 포함)

    public static WodRecordDto from(WodRecord record) {
        return WodRecordDto.builder()
            .id(record.getId())
            .wodDate(record.getWodDate())
            .score(record.getScore())
            .notes(record.getNotes())
            .rx(record.isRx())
            .userName(record.getUser().getName())
            .boxName(null)   // WodRecordService에서 별도 설정
            .wodTitle(null)  // WodRecordService에서 별도 설정
            .build();
    }
}
