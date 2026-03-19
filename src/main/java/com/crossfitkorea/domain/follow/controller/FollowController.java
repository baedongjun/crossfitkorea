package com.crossfitkorea.domain.follow.controller;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.follow.dto.FollowDto;
import com.crossfitkorea.domain.follow.service.FollowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Follow", description = "팔로우 API")
public class FollowController {

    private final FollowService followService;

    @Operation(summary = "팔로우/언팔로우 토글")
    @PostMapping("/users/{id}/follow")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggle(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
            followService.toggle(id, userDetails.getUsername())));
    }

    @Operation(summary = "팔로우 여부 확인")
    @GetMapping("/users/{id}/follow")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> isFollowing(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails) {
        boolean following = userDetails != null &&
            followService.isFollowing(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(Map.of("following", following)));
    }

    @Operation(summary = "팔로워 목록")
    @GetMapping("/users/{id}/followers")
    public ResponseEntity<ApiResponse<List<FollowDto>>> getFollowers(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(ApiResponse.success(followService.getFollowers(id, email)));
    }

    @Operation(summary = "팔로잉 목록")
    @GetMapping("/users/{id}/following")
    public ResponseEntity<ApiResponse<List<FollowDto>>> getFollowing(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(ApiResponse.success(followService.getFollowing(id, email)));
    }

    @Operation(summary = "팔로워/팔로잉 수")
    @GetMapping("/users/{id}/follow/counts")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getCounts(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(followService.getCounts(id)));
    }
}
