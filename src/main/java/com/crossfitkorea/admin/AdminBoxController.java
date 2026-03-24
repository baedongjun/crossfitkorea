package com.crossfitkorea.admin;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.box.dto.BoxClaimDto;
import com.crossfitkorea.domain.box.dto.BoxCreateRequest;
import com.crossfitkorea.domain.box.dto.BoxDto;
import com.crossfitkorea.domain.box.entity.Box;
import com.crossfitkorea.domain.box.repository.BoxRepository;
import com.crossfitkorea.domain.box.service.BoxClaimService;
import com.crossfitkorea.domain.box.service.BoxService;
import com.crossfitkorea.domain.competition.dto.CompetitionCreateRequest;
import com.crossfitkorea.domain.competition.dto.CompetitionDto;
import com.crossfitkorea.domain.competition.entity.CompetitionStatus;
import com.crossfitkorea.domain.competition.service.CompetitionService;
import com.crossfitkorea.domain.wod.dto.WodCreateRequest;
import com.crossfitkorea.domain.wod.dto.WodDto;
import com.crossfitkorea.domain.wod.service.WodService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "어드민 API")
public class AdminBoxController {

    private final BoxRepository boxRepository;
    private final BoxService boxService;
    private final BoxClaimService boxClaimService;
    private final CompetitionService competitionService;
    private final WodService wodService;

    @Operation(summary = "[어드민] 전체 박스 목록")
    @GetMapping("/boxes")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Page<BoxDto>>> getAllBoxes(
        @PageableDefault(size = 20) Pageable pageable
    ) {
        Page<BoxDto> boxes = boxRepository.findAll(pageable).map(BoxDto::from);
        return ResponseEntity.ok(ApiResponse.success(boxes));
    }

    @Operation(summary = "[어드민] 박스 등록 (오너 없이)")
    @PostMapping("/boxes")
    public ResponseEntity<ApiResponse<BoxDto>> createBox(
        @Valid @RequestBody BoxCreateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(boxService.createBoxAdmin(request)));
    }

    @Operation(summary = "[어드민] 박스 오너 지정")
    @PatchMapping("/boxes/{id}/owner")
    public ResponseEntity<ApiResponse<BoxDto>> assignOwner(
        @PathVariable Long id,
        @RequestParam Long userId
    ) {
        return ResponseEntity.ok(ApiResponse.success(boxClaimService.assignOwner(id, userId)));
    }

    @Operation(summary = "[어드민] 박스 인증 처리")
    @PatchMapping("/boxes/{id}/verify")
    @Transactional
    public ResponseEntity<ApiResponse<BoxDto>> verifyBox(
        @PathVariable Long id,
        @RequestParam boolean verified
    ) {
        Box box = boxRepository.findById(id)
            .orElseThrow(() -> new com.crossfitkorea.common.exception.BusinessException(
                com.crossfitkorea.common.exception.ErrorCode.BOX_NOT_FOUND));
        box.setVerified(verified);
        return ResponseEntity.ok(ApiResponse.success(BoxDto.from(boxRepository.save(box))));
    }

    @Operation(summary = "[어드민] 박스 프리미엄 설정")
    @PatchMapping("/boxes/{id}/premium")
    @Transactional
    public ResponseEntity<ApiResponse<BoxDto>> setPremium(
        @PathVariable Long id,
        @RequestParam boolean premium
    ) {
        Box box = boxRepository.findById(id)
            .orElseThrow(() -> new com.crossfitkorea.common.exception.BusinessException(
                com.crossfitkorea.common.exception.ErrorCode.BOX_NOT_FOUND));
        box.setPremium(premium);
        return ResponseEntity.ok(ApiResponse.success(BoxDto.from(boxRepository.save(box))));
    }

    @Operation(summary = "[어드민] 소유권 신청 목록")
    @GetMapping("/boxes/claims")
    public ResponseEntity<ApiResponse<Page<BoxClaimDto>>> getClaims(
        @PageableDefault(size = 20) Pageable pageable
    ) {
        return ResponseEntity.ok(ApiResponse.success(boxClaimService.getAllClaims(pageable)));
    }

    @Operation(summary = "[어드민] 소유권 신청 승인")
    @PatchMapping("/boxes/claims/{id}/approve")
    public ResponseEntity<ApiResponse<BoxClaimDto>> approveClaim(
        @PathVariable Long id,
        @RequestParam(required = false) String adminNote
    ) {
        return ResponseEntity.ok(ApiResponse.success(boxClaimService.approveClaim(id, adminNote)));
    }

    @Operation(summary = "[어드민] 소유권 신청 거절")
    @PatchMapping("/boxes/claims/{id}/reject")
    public ResponseEntity<ApiResponse<BoxClaimDto>> rejectClaim(
        @PathVariable Long id,
        @RequestParam(required = false) String adminNote
    ) {
        return ResponseEntity.ok(ApiResponse.success(boxClaimService.rejectClaim(id, adminNote)));
    }

    @Operation(summary = "[어드민] 대회 등록")
    @PostMapping("/competitions")
    public ResponseEntity<ApiResponse<CompetitionDto>> createCompetition(
        @Valid @RequestBody CompetitionCreateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(competitionService.createCompetition(request)));
    }

    @Operation(summary = "[어드민] 대회 수정")
    @PutMapping("/competitions/{id}")
    public ResponseEntity<ApiResponse<CompetitionDto>> updateCompetition(
        @PathVariable Long id,
        @Valid @RequestBody CompetitionCreateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(competitionService.updateCompetition(id, request)));
    }

    @Operation(summary = "[어드민] 대회 상태 변경")
    @PatchMapping("/competitions/{id}/status")
    public ResponseEntity<ApiResponse<CompetitionDto>> updateCompetitionStatus(
        @PathVariable Long id,
        @RequestParam CompetitionStatus status
    ) {
        return ResponseEntity.ok(ApiResponse.success(competitionService.updateStatus(id, status)));
    }

    @Operation(summary = "[어드민] 공통 WOD 등록")
    @PostMapping("/wod")
    public ResponseEntity<ApiResponse<WodDto>> createCommonWod(
        @Valid @RequestBody WodCreateRequest request,
        @org.springframework.security.core.annotation.AuthenticationPrincipal
        org.springframework.security.core.userdetails.UserDetails userDetails
    ) {
        return ResponseEntity.ok(ApiResponse.success(wodService.createWod(null, request, userDetails.getUsername())));
    }

    @Operation(summary = "[어드민] WOD 수정")
    @PutMapping("/wod/{id}")
    public ResponseEntity<ApiResponse<WodDto>> updateWod(
        @PathVariable Long id,
        @Valid @RequestBody WodCreateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(wodService.updateWod(id, request)));
    }

    @Operation(summary = "[어드민] WOD 삭제")
    @DeleteMapping("/wod/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWod(@PathVariable Long id) {
        wodService.deleteWod(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Operation(summary = "[어드민] 대회 삭제")
    @DeleteMapping("/competitions/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCompetition(@PathVariable Long id) {
        competitionService.deleteCompetition(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
