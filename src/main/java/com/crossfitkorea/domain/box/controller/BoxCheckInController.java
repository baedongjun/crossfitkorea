package com.crossfitkorea.domain.box.controller;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.box.entity.Box;
import com.crossfitkorea.domain.box.entity.BoxCheckIn;
import com.crossfitkorea.domain.box.repository.BoxCheckInRepository;
import com.crossfitkorea.domain.box.repository.BoxRepository;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class BoxCheckInController {

    private final BoxCheckInRepository checkInRepository;
    private final BoxRepository boxRepository;
    private final UserService userService;

    /** POST /api/v1/boxes/{id}/checkin — 출석 체크인 [AUTH] */
    @PostMapping("/boxes/{id}/checkin")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkIn(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.getUserByEmail(userDetails.getUsername());
        Box box = boxRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 박스입니다."));

        // 중복 체크인 방지: 1시간 이내 동일 박스 체크인 금지
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        Optional<BoxCheckIn> recent = checkInRepository
                .findLatestByUserAndBoxSince(user.getId(), id, oneHourAgo);

        if (recent.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success(
                    "이미 체크인했습니다.",
                    Map.of(
                            "alreadyCheckedIn", true,
                            "checkedInAt", recent.get().getCheckedInAt().toString(),
                            "boxName", box.getName()
                    )
            ));
        }

        BoxCheckIn checkIn = checkInRepository.save(
                BoxCheckIn.builder()
                        .box(box)
                        .user(user)
                        .build()
        );

        return ResponseEntity.ok(ApiResponse.success(
                "체크인 완료!",
                Map.of(
                        "alreadyCheckedIn", false,
                        "checkedInAt", checkIn.getCheckedInAt().toString(),
                        "boxName", box.getName()
                )
        ));
    }

    /** GET /api/v1/boxes/{id}/checkins — 박스 체크인 목록 [BOX_OWNER/ADMIN] */
    @GetMapping("/boxes/{id}/checkins")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getBoxCheckIns(
            @PathVariable Long id,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<BoxCheckIn> page = checkInRepository.findByBoxIdOrderByCheckedInAtDesc(id, pageable);
        Page<Map<String, Object>> result = page.map(c -> Map.of(
                "id", c.getId(),
                "userId", c.getUser().getId(),
                "userName", c.getUser().getName(),
                "checkedInAt", c.getCheckedInAt().toString()
        ));
        return ResponseEntity.ok(ApiResponse.success("조회 성공", result));
    }

    /** GET /api/v1/users/me/checkins — 내 체크인 기록 [AUTH] */
    @GetMapping("/users/me/checkins")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getMyCheckIns(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 20) Pageable pageable) {

        User user = userService.getUserByEmail(userDetails.getUsername());
        Page<BoxCheckIn> page = checkInRepository.findByUserIdOrderByCheckedInAtDesc(user.getId(), pageable);
        Page<Map<String, Object>> result = page.map(c -> Map.of(
                "id", c.getId(),
                "boxId", c.getBox().getId(),
                "boxName", c.getBox().getName(),
                "checkedInAt", c.getCheckedInAt().toString()
        ));
        return ResponseEntity.ok(ApiResponse.success("조회 성공", result));
    }
}
