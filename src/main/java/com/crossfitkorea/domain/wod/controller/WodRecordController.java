package com.crossfitkorea.domain.wod.controller;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.wod.dto.BoxRankingDto;
import com.crossfitkorea.domain.wod.dto.WodRecordDto;
import com.crossfitkorea.domain.wod.dto.WodRecordRequest;
import com.crossfitkorea.domain.wod.service.WodRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/wod/records")
@RequiredArgsConstructor
@Tag(name = "WOD Record", description = "개인 WOD 기록 API")
public class WodRecordController {

    private final WodRecordService wodRecordService;

    @Operation(summary = "내 WOD 기록 목록")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<WodRecordDto>>> getMyRecords(
        @PageableDefault(size = 30) Pageable pageable,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            wodRecordService.getMyRecords(userDetails.getUsername(), pageable)));
    }

    @Operation(summary = "최근 N일 기록 (기본 30일)")
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<WodRecordDto>>> getRecentRecords(
        @RequestParam(defaultValue = "30") int days,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            wodRecordService.getRecentRecords(userDetails.getUsername(), days)));
    }

    @Operation(summary = "오늘 내 기록 조회")
    @GetMapping("/today")
    public ResponseEntity<ApiResponse<WodRecordDto>> getTodayRecord(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            wodRecordService.getTodayRecord(userDetails.getUsername())));
    }

    @Operation(summary = "WOD 기록 저장 (없으면 생성, 있으면 수정)")
    @PostMapping
    public ResponseEntity<ApiResponse<WodRecordDto>> saveRecord(
        @RequestBody WodRecordRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            wodRecordService.saveRecord(request, userDetails.getUsername())));
    }

    @Operation(summary = "특정 날짜 WOD 리더보드 (공개)")
    @GetMapping("/leaderboard")
    public ResponseEntity<ApiResponse<List<WodRecordDto>>> getLeaderboard(
        @RequestParam(required = false) String date
    ) {
        LocalDate d = date != null ? LocalDate.parse(date) : LocalDate.now();
        return ResponseEntity.ok(ApiResponse.success(wodRecordService.getLeaderboard(d)));
    }

    @Operation(summary = "박스별 WOD 랭킹 (공개) - 박스끼리 경쟁")
    @GetMapping("/box-ranking")
    public ResponseEntity<ApiResponse<List<BoxRankingDto>>> getBoxRanking(
        @RequestParam(required = false) String date
    ) {
        LocalDate d = date != null ? LocalDate.parse(date) : LocalDate.now();
        return ResponseEntity.ok(ApiResponse.success(wodRecordService.getBoxRanking(d)));
    }

    @Operation(summary = "내 WOD 스트릭 정보 (연속 기록 + 총 횟수)")
    @GetMapping("/streak")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStreak(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            wodRecordService.getStreakInfo(userDetails.getUsername())));
    }

    @Operation(summary = "WOD 기록 삭제")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRecord(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        wodRecordService.deleteRecord(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
