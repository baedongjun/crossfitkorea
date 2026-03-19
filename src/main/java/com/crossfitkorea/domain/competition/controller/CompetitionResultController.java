package com.crossfitkorea.domain.competition.controller;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.competition.dto.CompetitionResultDto;
import com.crossfitkorea.domain.competition.service.CompetitionResultService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/competitions")
@RequiredArgsConstructor
@Tag(name = "Competition Result", description = "대회 결과 API")
public class CompetitionResultController {

    private final CompetitionResultService competitionResultService;

    @Operation(summary = "대회 결과 조회")
    @GetMapping("/{id}/results")
    public ResponseEntity<ApiResponse<List<CompetitionResultDto>>> getResults(
        @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(competitionResultService.getResults(id)));
    }

    @Operation(summary = "대회 결과 일괄 입력 (어드민 전용)")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/results")
    public ResponseEntity<ApiResponse<List<CompetitionResultDto>>> saveResults(
        @PathVariable Long id,
        @RequestBody List<CompetitionResultDto> results
    ) {
        return ResponseEntity.ok(ApiResponse.success(competitionResultService.saveResults(id, results)));
    }
}
