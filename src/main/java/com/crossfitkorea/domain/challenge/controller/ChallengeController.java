package com.crossfitkorea.domain.challenge.controller;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.challenge.dto.*;
import com.crossfitkorea.domain.challenge.service.ChallengeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeService challengeService;

    /** 활성 챌린지 목록 [PUBLIC] */
    @GetMapping("/challenges")
    public ResponseEntity<ApiResponse<List<ChallengeDto>>> getAll(
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(ApiResponse.success(challengeService.getActiveChallenges(email)));
    }

    /** 챌린지 상세 [PUBLIC+AUTH] */
    @GetMapping("/challenges/{id}")
    public ResponseEntity<ApiResponse<ChallengeDetailDto>> getOne(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(ApiResponse.success(challengeService.getDetail(id, email)));
    }

    /** 내 참여 챌린지 [AUTH] */
    @GetMapping("/challenges/my")
    public ResponseEntity<ApiResponse<List<ChallengeDto>>> getMy(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(challengeService.getMyChallenges(userDetails.getUsername())));
    }

    /** 참가 [AUTH] */
    @PostMapping("/challenges/{id}/join")
    public ResponseEntity<ApiResponse<Void>> join(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        challengeService.join(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("챌린지에 참가했습니다.", null));
    }

    /** 참가 취소 [AUTH] */
    @DeleteMapping("/challenges/{id}/join")
    public ResponseEntity<ApiResponse<Void>> leave(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        challengeService.leave(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("챌린지 참가를 취소했습니다.", null));
    }

    /** 오늘 인증 [AUTH] */
    @PostMapping("/challenges/{id}/verify")
    public ResponseEntity<ApiResponse<Void>> verify(
            @PathVariable Long id,
            @RequestBody ChallengeVerifyRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        challengeService.verify(id, userDetails.getUsername(), req.getContent(), req.getImageUrl(), req.getVideoUrl());
        return ResponseEntity.ok(ApiResponse.success("인증이 완료됐습니다.", null));
    }

    /** 챌린지 랭킹 [PUBLIC] */
    @GetMapping("/challenges/{id}/leaderboard")
    public ResponseEntity<ApiResponse<List<ChallengeDetailDto.LeaderboardEntryDto>>> getLeaderboard(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(challengeService.getLeaderboard(id)));
    }

    /** 챌린지 전체 인증 목록 [PUBLIC] */
    @GetMapping("/challenges/{id}/verifications")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getVerifications(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(challengeService.getPublicVerifications(id)));
    }

    // ===== Admin =====

    /** 챌린지 등록 [ADMIN] */
    @PostMapping("/admin/challenges")
    public ResponseEntity<ApiResponse<ChallengeDto>> create(
            @RequestBody ChallengeCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.success(challengeService.create(req)));
    }

    /** 챌린지 수정 [ADMIN] */
    @PutMapping("/admin/challenges/{id}")
    public ResponseEntity<ApiResponse<ChallengeDto>> update(
            @PathVariable Long id,
            @RequestBody ChallengeCreateRequest req) {
        return ResponseEntity.ok(ApiResponse.success(challengeService.update(id, req)));
    }

    /** 활성화/비활성화 [ADMIN] */
    @PatchMapping("/admin/challenges/{id}/active")
    public ResponseEntity<ApiResponse<Void>> toggleActive(
            @PathVariable Long id,
            @RequestParam boolean active) {
        challengeService.toggleActive(id, active);
        return ResponseEntity.ok(ApiResponse.success("상태가 변경됐습니다.", null));
    }
}
