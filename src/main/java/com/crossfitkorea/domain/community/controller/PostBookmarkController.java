package com.crossfitkorea.domain.community.controller;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.community.dto.PostDto;
import com.crossfitkorea.domain.community.service.PostBookmarkService;
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

import java.util.Map;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
@Tag(name = "Post Bookmark", description = "커뮤니티 게시글 북마크 API")
public class PostBookmarkController {

    private final PostBookmarkService postBookmarkService;

    @Operation(summary = "게시글 북마크 토글 (로그인 필요)")
    @PostMapping("/posts/{id}/bookmark")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggleBookmark(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        boolean bookmarked = postBookmarkService.toggleBookmark(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(Map.of("bookmarked", bookmarked)));
    }

    @Operation(summary = "게시글 북마크 여부 조회 (로그인 필요)")
    @GetMapping("/posts/{id}/bookmark")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> isBookmarked(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        boolean bookmarked = postBookmarkService.isBookmarked(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(Map.of("bookmarked", bookmarked)));
    }

    @Operation(summary = "내 북마크 게시글 목록 (로그인 필요)")
    @GetMapping("/posts/bookmarks")
    public ResponseEntity<ApiResponse<Page<PostDto>>> getMyBookmarks(
        @PageableDefault(size = 15) Pageable pageable,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            postBookmarkService.getMyBookmarks(userDetails.getUsername(), pageable)
        ));
    }
}
