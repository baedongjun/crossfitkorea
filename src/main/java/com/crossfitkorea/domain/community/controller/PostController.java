package com.crossfitkorea.domain.community.controller;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.community.dto.CommentDto;
import com.crossfitkorea.domain.community.dto.PostCreateRequest;
import com.crossfitkorea.domain.community.dto.PostDto;
import com.crossfitkorea.domain.community.entity.PostCategory;
import com.crossfitkorea.domain.community.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
@Tag(name = "Community", description = "커뮤니티 게시판 API")
public class PostController {

    private final PostService postService;

    @Operation(summary = "인기 게시글 TOP5 (좋아요 순)")
    @GetMapping("/posts/hot")
    public ResponseEntity<ApiResponse<List<PostDto>>> getHotPosts() {
        return ResponseEntity.ok(ApiResponse.success(postService.getHotPosts()));
    }

    @Operation(summary = "내 게시글 목록 (로그인 필요)")
    @GetMapping("/posts/mine")
    public ResponseEntity<ApiResponse<Page<PostDto>>> getMyPosts(
        @PageableDefault(size = 15) Pageable pageable,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(postService.getMyPosts(userDetails.getUsername(), pageable)));
    }

    @Operation(summary = "게시글 목록 (카테고리/키워드 필터)")
    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<Page<PostDto>>> getPosts(
        @RequestParam(required = false) PostCategory category,
        @RequestParam(required = false) String keyword,
        @PageableDefault(size = 15) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(postService.getPosts(category, keyword, pageable)));
    }

    @Operation(summary = "게시글 상세 조회")
    @GetMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<PostDto>> getPost(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(postService.getPost(id)));
    }

    @Operation(summary = "게시글 작성 (로그인 필요)")
    @PostMapping("/posts")
    public ResponseEntity<ApiResponse<PostDto>> createPost(
        @Valid @RequestBody PostCreateRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(postService.createPost(request, userDetails.getUsername())));
    }

    @Operation(summary = "게시글 수정")
    @PutMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<PostDto>> updatePost(
        @PathVariable Long id,
        @Valid @RequestBody PostCreateRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(postService.updatePost(id, request, userDetails.getUsername())));
    }

    @Operation(summary = "게시글 삭제")
    @DeleteMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        postService.deletePost(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Operation(summary = "댓글 목록 조회")
    @GetMapping("/posts/{id}/comments")
    public ResponseEntity<ApiResponse<List<CommentDto>>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(postService.getComments(id)));
    }

    @Operation(summary = "게시글 좋아요 토글")
    @PostMapping("/posts/{id}/like")
    public ResponseEntity<ApiResponse<PostDto>> likePost(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(ApiResponse.success(postService.likePost(id, email)));
    }

    @Operation(summary = "댓글 수정 (본인만)")
    @PutMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<CommentDto>> updateMyComment(
        @PathVariable Long commentId,
        @RequestBody Map<String, String> body,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            postService.updateMyComment(commentId, body.get("content"), userDetails.getUsername())
        ));
    }

    @Operation(summary = "댓글 삭제 (본인만)")
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteMyComment(
        @PathVariable Long commentId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        postService.deleteMyComment(commentId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Operation(summary = "게시글 신고")
    @PostMapping("/posts/{id}/report")
    public ResponseEntity<ApiResponse<PostDto>> reportPost(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(postService.reportPost(id, userDetails.getUsername())));
    }

    @Operation(summary = "댓글 작성")
    @PostMapping("/posts/{id}/comments")
    public ResponseEntity<ApiResponse<CommentDto>> createComment(
        @PathVariable Long id,
        @RequestBody Map<String, Object> body,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        String content = (String) body.get("content");
        Long parentId = body.get("parentId") != null ? Long.valueOf(body.get("parentId").toString()) : null;
        return ResponseEntity.ok(ApiResponse.success(
            postService.createComment(id, content, parentId, userDetails.getUsername())
        ));
    }
}
