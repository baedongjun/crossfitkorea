package com.crossfitkorea.domain.box.controller;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.box.dto.BoxCreateRequest;
import com.crossfitkorea.domain.box.dto.BoxDto;
import com.crossfitkorea.domain.box.dto.BoxMembershipDto;
import com.crossfitkorea.domain.box.dto.BoxNoticeDto;
import com.crossfitkorea.domain.box.dto.BoxNoticeRequest;
import com.crossfitkorea.domain.box.dto.BoxSearchRequest;
import com.crossfitkorea.domain.box.service.BoxFavoriteService;
import com.crossfitkorea.domain.box.service.BoxMembershipService;
import com.crossfitkorea.domain.box.service.BoxNoticeService;
import com.crossfitkorea.domain.box.service.BoxService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/boxes")
@RequiredArgsConstructor
@Tag(name = "Box", description = "크로스핏 박스 API")
public class BoxController {

    private final BoxService boxService;
    private final BoxFavoriteService boxFavoriteService;
    private final BoxMembershipService boxMembershipService;
    private final BoxNoticeService boxNoticeService;

    @Operation(summary = "박스 검색 (지역/키워드 필터)")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<BoxDto>>> searchBoxes(
        BoxSearchRequest request,
        @PageableDefault(size = 12) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(boxService.searchBoxes(request, pageable)));
    }

    @Operation(summary = "박스 상세 조회")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BoxDto>> getBox(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(boxService.getBox(id)));
    }

    @Operation(summary = "프리미엄 박스 목록")
    @GetMapping("/premium")
    public ResponseEntity<ApiResponse<List<BoxDto>>> getPremiumBoxes() {
        return ResponseEntity.ok(ApiResponse.success(boxService.getPremiumBoxes()));
    }

    @Operation(summary = "내 박스 목록 (박스 오너)")
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('BOX_OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<BoxDto>>> getMyBoxes(
        @PageableDefault(size = 20) Pageable pageable,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(boxService.getMyBoxes(userDetails.getUsername(), pageable)));
    }

    @Operation(summary = "박스 등록 (박스 오너/관리자)")
    @PostMapping
    @PreAuthorize("hasAnyRole('BOX_OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<BoxDto>> createBox(
        @Valid @RequestBody BoxCreateRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(boxService.createBox(request, userDetails.getUsername())));
    }

    @Operation(summary = "박스 수정")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('BOX_OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<BoxDto>> updateBox(
        @PathVariable Long id,
        @Valid @RequestBody BoxCreateRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        boolean isAdmin = userDetails.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(ApiResponse.success(boxService.updateBox(id, request, userDetails.getUsername(), isAdmin)));
    }

    @Operation(summary = "박스 삭제 (비활성화)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('BOX_OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteBox(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        boolean isAdmin = userDetails.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boxService.deleteBox(id, userDetails.getUsername(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Operation(summary = "즐겨찾기 토글 (추가/해제)")
    @PostMapping("/{id}/favorite")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> toggleFavorite(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        boolean favorited = boxFavoriteService.toggleFavorite(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(Map.of("favorited", favorited)));
    }

    @Operation(summary = "즐겨찾기 여부 확인")
    @GetMapping("/{id}/favorite")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkFavorite(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        boolean favorited = boxFavoriteService.isFavorited(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(Map.of("favorited", favorited)));
    }

    // ── 박스 멤버십 ─────────────────────────────────────────────

    @Operation(summary = "박스 가입")
    @PostMapping("/{id}/join")
    public ResponseEntity<ApiResponse<BoxMembershipDto>> joinBox(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            boxMembershipService.join(id, userDetails.getUsername())));
    }

    @Operation(summary = "박스 탈퇴")
    @DeleteMapping("/{id}/join")
    public ResponseEntity<ApiResponse<Void>> leaveBox(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        boxMembershipService.leave(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Operation(summary = "박스 멤버 수")
    @GetMapping("/{id}/members/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getMemberCount(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
            Map.of("count", boxMembershipService.getMemberCount(id))));
    }

    @Operation(summary = "박스 멤버 목록")
    @GetMapping("/{id}/members")
    public ResponseEntity<ApiResponse<java.util.List<BoxMembershipDto>>> getBoxMembers(
        @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(boxMembershipService.getBoxMembers(id)));
    }

    @Operation(summary = "내 가입 여부 확인")
    @GetMapping("/{id}/membership")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkMembership(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        boolean member = userDetails != null &&
            boxMembershipService.isMember(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(Map.of("member", member)));
    }

    // ── 박스 공지사항 ─────────────────────────────────────────────

    @Operation(summary = "공지 목록 (멤버/오너/ADMIN)")
    @GetMapping("/{id}/notices")
    public ResponseEntity<ApiResponse<Page<BoxNoticeDto>>> getNotices(
        @PathVariable Long id,
        @PageableDefault(size = 10) Pageable pageable,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            boxNoticeService.getNotices(id, userDetails.getUsername(), pageable)));
    }

    @Operation(summary = "공지 등록 (오너/ADMIN)")
    @PostMapping("/{id}/notices")
    @PreAuthorize("hasAnyRole('BOX_OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<BoxNoticeDto>> createNotice(
        @PathVariable Long id,
        @RequestBody BoxNoticeRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            boxNoticeService.createNotice(id, request.getTitle(), request.getContent(),
                request.isPinned(), userDetails.getUsername())));
    }

    @Operation(summary = "공지 수정 (오너/ADMIN)")
    @PutMapping("/{id}/notices/{nid}")
    @PreAuthorize("hasAnyRole('BOX_OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<BoxNoticeDto>> updateNotice(
        @PathVariable Long id,
        @PathVariable Long nid,
        @RequestBody BoxNoticeRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(
            boxNoticeService.updateNotice(id, nid, request.getTitle(), request.getContent(),
                request.isPinned(), userDetails.getUsername())));
    }

    @Operation(summary = "공지 삭제 (오너/ADMIN)")
    @DeleteMapping("/{id}/notices/{nid}")
    @PreAuthorize("hasAnyRole('BOX_OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteNotice(
        @PathVariable Long id,
        @PathVariable Long nid,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        boxNoticeService.deleteNotice(id, nid, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
