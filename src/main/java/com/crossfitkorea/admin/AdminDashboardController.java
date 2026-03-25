package com.crossfitkorea.admin;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.box.entity.Box;
import com.crossfitkorea.domain.badge.repository.UserBadgeRepository;
import com.crossfitkorea.domain.box.repository.BoxMembershipRepository;
import com.crossfitkorea.domain.box.repository.BoxRepository;
import com.crossfitkorea.domain.community.entity.Post;
import com.crossfitkorea.domain.community.repository.PostRepository;
import com.crossfitkorea.domain.competition.repository.CompetitionRepository;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.repository.UserRepository;
import com.crossfitkorea.domain.wod.repository.WodRecordRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
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
    private final BoxMembershipRepository boxMembershipRepository;
    private final PostRepository postRepository;
    private final CompetitionRepository competitionRepository;
    private final WodRecordRepository wodRecordRepository;
    private final UserBadgeRepository userBadgeRepository;

    @Operation(summary = "대시보드 통계")
    @GetMapping("/dashboard")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard(
            @RequestParam(defaultValue = "6") int months) {
        PageRequest recent5 = PageRequest.of(0, 5, Sort.by("createdAt").descending());

        List<User> recentUsers = userRepository.findAll(recent5).getContent();
        List<Box> pendingBoxes = boxRepository.findAll(
            PageRequest.of(0, 5, Sort.by("createdAt").descending())
        ).getContent().stream()
            .filter(b -> b.isActive() && !b.isVerified())
            .limit(5)
            .collect(Collectors.toList());

        List<Post> recentPosts = postRepository.findByActiveTrueOrderByCreatedAtDesc(recent5).getContent();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalBoxes", boxRepository.countByActiveTrue());
        stats.put("totalPosts", postRepository.count());
        stats.put("totalCompetitions", competitionRepository.countByActiveTrue());
        stats.put("pendingBoxCount", boxRepository.countByActiveTrueAndVerifiedFalse());
        stats.put("totalWodRecords", wodRecordRepository.count());
        stats.put("totalBadgesAwarded", userBadgeRepository.count());
        stats.put("recentUsers", recentUsers.stream().map(u -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", u.getId());
            item.put("name", u.getName());
            item.put("email", u.getEmail());
            item.put("role", u.getRole().name());
            item.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
            return item;
        }).collect(Collectors.toList()));
        stats.put("recentPosts", recentPosts.stream().map(p -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", p.getId());
            item.put("title", p.getTitle());
            item.put("userName", p.getUser() != null ? p.getUser().getName() : "알 수 없음");
            item.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : "");
            return item;
        }).collect(Collectors.toList()));
        stats.put("pendingBoxes", pendingBoxes.stream().map(b -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", b.getId());
            item.put("name", b.getName());
            item.put("city", b.getCity() != null ? b.getCity() : "");
            item.put("createdAt", b.getCreatedAt() != null ? b.getCreatedAt().toString() : "");
            return item;
        }).collect(Collectors.toList()));

        // Monthly user signups for last N months
        List<Map<String, Object>> monthlySignups = new ArrayList<>();
        List<User> allUsers = userRepository.findAll();
        for (int i = months - 1; i >= 0; i--) {
            LocalDateTime monthStart = LocalDateTime.now().minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            LocalDateTime monthEnd = monthStart.plusMonths(1);
            long count = allUsers.stream()
                .filter(u -> u.getCreatedAt() != null && !u.getCreatedAt().isBefore(monthStart) && u.getCreatedAt().isBefore(monthEnd))
                .count();
            monthlySignups.add(Map.of("month", monthStart.getMonthValue() + "월", "count", count));
        }
        stats.put("monthlySignups", monthlySignups);

        // 도시별 박스 수
        List<Box> allActiveBoxes = boxRepository.findAll().stream()
            .filter(Box::isActive)
            .collect(Collectors.toList());
        Map<String, Long> cityGrouped = allActiveBoxes.stream()
            .filter(b -> b.getCity() != null && !b.getCity().isBlank())
            .collect(Collectors.groupingBy(Box::getCity, Collectors.counting()));
        List<Map<String, Object>> boxesByCity = cityGrouped.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .map(e -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("city", e.getKey());
                item.put("count", e.getValue());
                return item;
            })
            .collect(Collectors.toList());
        stats.put("boxesByCity", boxesByCity);

        // 멤버 수 기준 상위 5개 박스
        List<Map<String, Object>> topBoxesByMembers = allActiveBoxes.stream()
            .map(b -> {
                long memberCount = boxMembershipRepository.countByBoxIdAndActiveTrue(b.getId());
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", b.getId());
                item.put("name", b.getName());
                item.put("memberCount", memberCount);
                return item;
            })
            .sorted(Comparator.<Map<String, Object>, Long>comparing(
                m -> (Long) m.get("memberCount")).reversed())
            .limit(5)
            .collect(Collectors.toList());
        stats.put("topBoxesByMembers", topBoxesByMembers);

        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
