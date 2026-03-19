package com.crossfitkorea.domain.box.controller;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.box.repository.BoxRepository;
import com.crossfitkorea.domain.challenge.repository.ChallengeRepository;
import com.crossfitkorea.domain.community.repository.PostRepository;
import com.crossfitkorea.domain.competition.repository.CompetitionRepository;
import com.crossfitkorea.domain.user.repository.UserRepository;
import com.crossfitkorea.domain.wod.repository.WodRecordRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/stats")
@RequiredArgsConstructor
@Tag(name = "Stats", description = "공개 통계 API")
public class StatsController {

    private final BoxRepository boxRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CompetitionRepository competitionRepository;
    private final WodRecordRepository wodRecordRepository;
    private final ChallengeRepository challengeRepository;

    @Operation(summary = "플랫폼 공개 통계")
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStats() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "totalBoxes", boxRepository.countByActiveTrue(),
            "totalUsers", userRepository.count(),
            "totalPosts", postRepository.count(),
            "totalCompetitions", competitionRepository.countByActiveTrue(),
            "totalWodRecords", wodRecordRepository.count(),
            "totalChallenges", challengeRepository.count()
        )));
    }
}
