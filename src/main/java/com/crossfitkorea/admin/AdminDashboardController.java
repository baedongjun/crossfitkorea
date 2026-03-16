package com.crossfitkorea.admin;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.box.entity.Box;
import com.crossfitkorea.domain.box.repository.BoxRepository;
import com.crossfitkorea.domain.community.entity.Post;
import com.crossfitkorea.domain.community.repository.PostRepository;
import com.crossfitkorea.domain.competition.repository.CompetitionRepository;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "어드민 API")
public class AdminDashboardController {

    private final UserRepository userRepository;
    private final BoxRepository boxRepository;
    private final PostRepository postRepository;
    private final CompetitionRepository competitionRepository;

    @Operation(summary = "대시보드 통계")
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard() {
        PageRequest recent5 = PageRequest.of(0, 5, Sort.by("createdAt").descending());

        List<User> recentUsers = userRepository.findAll(recent5).getContent();
        List<Box> pendingBoxes = boxRepository.findAll(
            PageRequest.of(0, 5, Sort.by("createdAt").descending())
        ).getContent().stream()
            .filter(b -> b.isActive() && !b.isVerified())
            .limit(5)
            .collect(Collectors.toList());

        List<Post> recentPosts = postRepository.findAll(recent5).getContent();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalBoxes", boxRepository.countByActiveTrue());
        stats.put("totalPosts", postRepository.count());
        stats.put("totalCompetitions", competitionRepository.countByActiveTrue());
        stats.put("pendingBoxCount", boxRepository.countByActiveTrueAndVerifiedFalse());
        stats.put("recentUsers", recentUsers.stream().map(u -> Map.of(
            "id", u.getId(),
            "name", u.getName(),
            "email", u.getEmail(),
            "role", u.getRole().name(),
            "createdAt", u.getCreatedAt().toString()
        )).collect(Collectors.toList()));
        stats.put("recentPosts", recentPosts.stream().map(p -> Map.of(
            "id", p.getId(),
            "title", p.getTitle(),
            "userName", p.getUser() != null ? p.getUser().getName() : "알 수 없음",
            "createdAt", p.getCreatedAt().toString()
        )).collect(Collectors.toList()));
        stats.put("pendingBoxes", pendingBoxes.stream().map(b -> Map.of(
            "id", b.getId(),
            "name", b.getName(),
            "city", b.getCity() != null ? b.getCity() : "",
            "createdAt", b.getCreatedAt().toString()
        )).collect(Collectors.toList()));

        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
