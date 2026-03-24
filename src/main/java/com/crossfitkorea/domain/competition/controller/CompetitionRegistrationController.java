package com.crossfitkorea.domain.competition.controller;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.competition.dto.CompetitionDto;
import com.crossfitkorea.domain.competition.entity.CompetitionRegistration;
import com.crossfitkorea.domain.competition.repository.CompetitionRegistrationRepository;
import com.crossfitkorea.domain.competition.service.CompetitionRegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/competitions")
@RequiredArgsConstructor
@Tag(name = "Competition Registration", description = "대회 참가 신청 API")
public class CompetitionRegistrationController {

    private final CompetitionRegistrationService registrationService;
    private final CompetitionRegistrationRepository registrationRepository;

    @Operation(summary = "내 대회 신청 목록")
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CompetitionDto>>> getMyRegistrations(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(registrationService.getMyRegistrations(userDetails.getUsername())));
    }

    @Operation(summary = "참가 신청 상태 조회")
    @GetMapping("/{id}/registration-status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(ApiResponse.success(registrationService.getRegistrationStatus(id, email)));
    }

    @Operation(summary = "대회 참가 신청")
    @PostMapping("/{id}/register")
    public ResponseEntity<ApiResponse<Void>> register(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        registrationService.register(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Operation(summary = "대회 참가 신청 취소")
    @DeleteMapping("/{id}/register")
    public ResponseEntity<ApiResponse<Void>> cancel(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        registrationService.cancel(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Operation(summary = "대회 참가자 목록 [ADMIN]")
    @GetMapping("/{id}/participants")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getParticipants(@PathVariable Long id) {
        List<CompetitionRegistration> registrations = registrationRepository.findActiveRegistrationsByCompetitionId(id);
        List<Map<String, Object>> result = registrations.stream()
            .map(r -> Map.<String, Object>of(
                "id", r.getId(),
                "userId", r.getUser().getId(),
                "userName", r.getUser().getName(),
                "email", r.getUser().getEmail(),
                "registeredAt", r.getCreatedAt().toString()
            ))
            .toList();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @Operation(summary = "대회 참가자 수 및 목록 [PUBLIC]")
    @GetMapping("/{id}/participants/public")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPublicParticipants(@PathVariable Long id) {
        List<CompetitionRegistration> registrations = registrationRepository.findActiveRegistrationsByCompetitionId(id);
        List<Map<String, Object>> result = registrations.stream()
            .map(r -> {
                java.util.Map<String, Object> item = new java.util.LinkedHashMap<>();
                item.put("userId", r.getUser().getId());
                item.put("userName", r.getUser().getName());
                item.put("profileImageUrl", r.getUser().getProfileImageUrl());
                item.put("registeredAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : "");
                return item;
            })
            .toList();
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
