package com.crossfitkorea.domain.performance.controller;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.performance.dto.PersonalRecordDto;
import com.crossfitkorea.domain.performance.entity.ExerciseType;
import com.crossfitkorea.domain.performance.service.PersonalRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/performance")
@RequiredArgsConstructor
@Tag(name = "Performance", description = "개인 퍼포먼스 트래킹 API")
public class PersonalRecordController {

    private final PersonalRecordService service;

    @Operation(summary = "내 전체 기록")
    @GetMapping
    public ResponseEntity<ApiResponse<List<PersonalRecordDto>>> getAll(
        @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(ApiResponse.success(service.getMyRecords(u.getUsername())));
    }

    @Operation(summary = "종목별 최고 기록 (PR 맵)")
    @GetMapping("/prs")
    public ResponseEntity<ApiResponse<Map<String, PersonalRecordDto>>> getPRs(
        @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(ApiResponse.success(service.getPRs(u.getUsername())));
    }

    @Operation(summary = "종목별 기록")
    @GetMapping("/{type}")
    public ResponseEntity<ApiResponse<List<PersonalRecordDto>>> getByType(
        @PathVariable ExerciseType type,
        @AuthenticationPrincipal UserDetails u) {
        return ResponseEntity.ok(ApiResponse.success(service.getRecordsByType(u.getUsername(), type)));
    }

    @Operation(summary = "기록 저장")
    @PostMapping
    public ResponseEntity<ApiResponse<PersonalRecordDto>> save(
        @RequestBody Map<String, Object> body,
        @AuthenticationPrincipal UserDetails u) {
        ExerciseType type = ExerciseType.valueOf((String) body.get("exerciseType"));
        Double value = Double.valueOf(body.get("value").toString());
        String unit = (String) body.get("unit");
        String notes = (String) body.get("notes");
        LocalDate recordedAt = body.get("recordedAt") != null ? LocalDate.parse((String) body.get("recordedAt")) : null;
        return ResponseEntity.ok(ApiResponse.success(service.save(u.getUsername(), type, value, unit, notes, recordedAt)));
    }

    @Operation(summary = "기록 수정")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PersonalRecordDto>> update(
        @PathVariable Long id,
        @RequestBody Map<String, Object> body,
        @AuthenticationPrincipal UserDetails u) {
        Double value = Double.valueOf(body.get("value").toString());
        String notes = (String) body.get("notes");
        return ResponseEntity.ok(ApiResponse.success(service.update(id, u.getUsername(), value, notes)));
    }

    @Operation(summary = "기록 삭제")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails u) {
        service.delete(id, u.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
