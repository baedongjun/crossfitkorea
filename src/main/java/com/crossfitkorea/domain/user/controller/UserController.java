package com.crossfitkorea.domain.user.controller;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.badge.dto.BadgeDto;
import com.crossfitkorea.domain.badge.service.BadgeService;
import com.crossfitkorea.domain.box.dto.BoxDto;
import com.crossfitkorea.domain.box.dto.BoxMembershipDto;
import com.crossfitkorea.domain.box.service.BoxFavoriteService;
import com.crossfitkorea.domain.box.service.BoxMembershipService;
import com.crossfitkorea.domain.badge.repository.UserBadgeRepository;
import com.crossfitkorea.domain.community.dto.PostDto;
import com.crossfitkorea.domain.community.entity.Comment;
import com.crossfitkorea.domain.wod.dto.WodRecordDto;
import com.crossfitkorea.domain.community.repository.CommentRepository;
import com.crossfitkorea.domain.community.repository.PostRepository;
import com.crossfitkorea.domain.follow.repository.FollowRepository;
import com.crossfitkorea.domain.wod.repository.WodRecordRepository;
import com.crossfitkorea.domain.review.dto.ReviewDto;
import com.crossfitkorea.domain.review.service.ReviewService;
import com.crossfitkorea.domain.user.dto.PasswordChangeRequest;
import com.crossfitkorea.domain.user.dto.UserDto;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.dto.UserUpdateRequest;
import com.crossfitkorea.domain.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "사용자 API")
public class UserController {

    private final UserService userService;
    private final ReviewService reviewService;
    private final BoxFavoriteService boxFavoriteService;
    private final BoxMembershipService boxMembershipService;
    private final BadgeService badgeService;
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final FollowRepository followRepository;
    private final WodRecordRepository wodRecordRepository;
    private final UserBadgeRepository userBadgeRepository;

    @Operation(summary = "내 정보 조회")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getMyInfo(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.getMyInfo(userDetails.getUsername())));
    }

    @Operation(summary = "내 정보 수정")
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> updateMyInfo(
        @Valid @RequestBody UserUpdateRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(userService.updateMyInfo(userDetails.getUsername(), request)));
    }

    @Operation(summary = "비밀번호 변경")
    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
        @Valid @RequestBody PasswordChangeRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        userService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Operation(summary = "내 후기 목록")
    @GetMapping("/me/reviews")
    public ResponseEntity<ApiResponse<Page<ReviewDto>>> getMyReviews(
        @RequestParam(defaultValue = "0") int page,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        PageRequest pageable = PageRequest.of(page, 10, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(reviewService.getMyReviews(userDetails.getUsername(), pageable)));
    }

    @Operation(summary = "내 즐겨찾기 박스 목록")
    @GetMapping("/me/favorites")
    public ResponseEntity<ApiResponse<Page<BoxDto>>> getMyFavorites(
        @PageableDefault(size = 12) Pageable pageable,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            boxFavoriteService.getMyFavorites(userDetails.getUsername(), pageable)));
    }

    @Operation(summary = "회원 탈퇴")
    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteMyAccount(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        userService.deleteMyAccount(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Operation(summary = "내 댓글 목록")
    @GetMapping("/me/comments")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getMyComments(
        @RequestParam(defaultValue = "0") int page,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        PageRequest pageable = PageRequest.of(page, 20, Sort.by("createdAt").descending());
        Page<Comment> comments = commentRepository.findByUserEmailAndActiveTrueOrderByCreatedAtDesc(
            userDetails.getUsername(), pageable);
        Page<Map<String, Object>> result = comments.map(c -> Map.of(
            "id", c.getId(),
            "content", c.getContent(),
            "postId", c.getPost().getId(),
            "postTitle", c.getPost().getTitle(),
            "createdAt", c.getCreatedAt().toString()
        ));
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @Operation(summary = "내 박스 (가입된 박스)")
    @GetMapping("/me/box")
    public ResponseEntity<ApiResponse<BoxMembershipDto>> getMyBox(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            boxMembershipService.getMyBox(userDetails.getUsername()).orElse(null)));
    }

    @Operation(summary = "내 배지 목록")
    @GetMapping("/me/badges")
    public ResponseEntity<ApiResponse<List<BadgeDto>>> getMyBadges(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            badgeService.getMyBadges(userDetails.getUsername())));
    }

    @Operation(summary = "공개 프로필 조회")
    @GetMapping("/{id}/profile")
    public ResponseEntity<ApiResponse<UserDto>> getPublicProfile(@PathVariable Long id) {
        User user = userService.getUserById(id);
        long followerCount = followRepository.countByFollowing(user);
        long followingCount = followRepository.countByFollower(user);
        long badgeCount = userBadgeRepository.findByUserOrderByAwardedAtDesc(user).size();
        long wodCount = wodRecordRepository.countByUserEmail(user.getEmail());
        long postCount = postRepository.countByUserEmailAndActiveTrue(user.getEmail());

        UserDto dto = UserDto.builder()
            .id(user.getId())
            .name(user.getName())
            .profileImageUrl(user.getProfileImageUrl())
            .role(user.getRole().name())
            .followerCount(followerCount)
            .followingCount(followingCount)
            .badgeCount(badgeCount)
            .wodCount(wodCount)
            .postCount(postCount)
            .build();
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @Operation(summary = "사용자 검색")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<UserDto>>> searchUsers(
            @RequestParam String keyword,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<UserDto> result = userService.searchUsers(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @Operation(summary = "사용자 공개 게시글 목록")
    @GetMapping("/{id}/posts")
    public ResponseEntity<ApiResponse<Page<PostDto>>> getUserPosts(
            @PathVariable Long id,
            @PageableDefault(size = 10) Pageable pageable) {
        User user = userService.getUserById(id);
        Page<PostDto> posts = postRepository.findByUserEmailAndActiveTrueOrderByCreatedAtDesc(user.getEmail(), pageable)
                .map(PostDto::from);
        return ResponseEntity.ok(ApiResponse.success(posts));
    }

    @Operation(summary = "사용자 WOD 기록 목록 (공개)")
    @GetMapping("/{id}/wod-records")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<WodRecordDto>>> getUserWodRecords(
            @PathVariable Long id,
            @PageableDefault(size = 20) Pageable pageable) {
        User user = userService.getUserById(id);
        Page<WodRecordDto> records = wodRecordRepository
            .findByUserEmailOrderByWodDateDesc(user.getEmail(), pageable)
            .map(WodRecordDto::from);
        return ResponseEntity.ok(ApiResponse.success(records));
    }
}
