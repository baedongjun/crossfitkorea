package com.crossfitkorea.domain.box.controller;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.box.dto.BoxAnnouncementDto;
import com.crossfitkorea.domain.box.service.BoxAnnouncementService;
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
import java.util.Map;

@RestController
@RequestMapping("/api/v1/boxes")
@RequiredArgsConstructor
@Tag(name = "Box Announcement", description = "박스 공지사항 API")
public class BoxAnnouncementController {

    private final BoxAnnouncementService boxAnnouncementService;
    private final UserService userService;

    @Operation(summary = "박스 공지사항 목록 조회")
    @GetMapping("/{id}/announcements")
    public ResponseEntity<ApiResponse<List<BoxAnnouncementDto>>> getAnnouncements(
        @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.success(boxAnnouncementService.getAnnouncements(id)));
    }

    @Operation(summary = "박스 공지사항 등록 (박스 오너/어드민)")
    @PostMapping("/{id}/announcements")
    public ResponseEntity<ApiResponse<BoxAnnouncementDto>> createAnnouncement(
        @PathVariable Long id,
        @RequestBody Map<String, Object> body,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        String title = (String) body.get("title");
        String content = (String) body.get("content");
        boolean pinned = body.get("pinned") != null && Boolean.parseBoolean(body.get("pinned").toString());

        return ResponseEntity.ok(ApiResponse.success(
            boxAnnouncementService.create(id, title, content, pinned, user)
        ));
    }

    @Operation(summary = "박스 공지사항 삭제 (박스 오너/어드민)")
    @DeleteMapping("/{id}/announcements/{announcementId}")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(
        @PathVariable Long id,
        @PathVariable Long announcementId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = userService.getUserByEmail(userDetails.getUsername());
        boxAnnouncementService.delete(announcementId, user);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
