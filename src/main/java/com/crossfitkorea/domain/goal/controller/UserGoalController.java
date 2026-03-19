package com.crossfitkorea.domain.goal.controller;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.goal.dto.UserGoalDto;
import com.crossfitkorea.domain.goal.service.UserGoalService;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/goals")
@RequiredArgsConstructor
@Tag(name = "User Goal", description = "개인 목표 설정 API")
public class UserGoalController {

    private final UserGoalService userGoalService;
    private final UserService userService;

    @Operation(summary = "내 목표 목록 조회 (로그인 필요)")
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserGoalDto>>> getMyGoals(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(userGoalService.getMyGoals(user.getId())));
    }

    @Operation(summary = "목표 등록 (로그인 필요)")
    @PostMapping
    public ResponseEntity<ApiResponse<UserGoalDto>> createGoal(
        @RequestBody UserGoalDto request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(userGoalService.create(user.getId(), request)));
    }

    @Operation(summary = "목표 수정 (본인만)")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserGoalDto>> updateGoal(
        @PathVariable Long id,
        @RequestBody UserGoalDto request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(userGoalService.update(id, user.getId(), request)));
    }

    @Operation(summary = "목표 삭제 (본인만)")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGoal(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        userGoalService.delete(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Operation(summary = "목표 달성 처리 (본인만)")
    @PatchMapping("/{id}/achieve")
    public ResponseEntity<ApiResponse<UserGoalDto>> achieveGoal(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(userGoalService.achieve(id, user.getId())));
    }
}
