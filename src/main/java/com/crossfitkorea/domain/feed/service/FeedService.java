package com.crossfitkorea.domain.feed.service;

import com.crossfitkorea.domain.badge.repository.UserBadgeRepository;
import com.crossfitkorea.domain.competition.repository.CompetitionRegistrationRepository;
import com.crossfitkorea.domain.community.repository.PostRepository;
import com.crossfitkorea.domain.feed.dto.FeedItemDto;
import com.crossfitkorea.domain.follow.entity.Follow;
import com.crossfitkorea.domain.follow.repository.FollowRepository;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.service.UserService;
import com.crossfitkorea.domain.wod.repository.WodRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedService {

    private final FollowRepository followRepository;
    private final WodRecordRepository wodRecordRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final CompetitionRegistrationRepository competitionRegistrationRepository;
    private final PostRepository postRepository;
    private final UserService userService;

    public Page<FeedItemDto> getFeed(String email, Pageable pageable) {
        User me = userService.getUserByEmail(email);

        // 내가 팔로우하는 유저 목록
        List<User> following = followRepository.findByFollowerOrderByCreatedAtDesc(me)
            .stream().map(Follow::getFollowing).collect(Collectors.toList());

        if (following.isEmpty()) {
            return Page.empty(pageable);
        }

        List<FeedItemDto> items = new ArrayList<>();

        // WOD 기록
        wodRecordRepository.findByUserInOrderByCreatedAtDesc(following)
            .forEach(r -> items.add(FeedItemDto.builder()
                .type("WOD_RECORD")
                .actorId(r.getUser().getId())
                .actorName(r.getUser().getName())
                .actorProfileImageUrl(r.getUser().getProfileImageUrl())
                .title(r.getUser().getName() + "님이 WOD를 완료했습니다!")
                .description(r.getScore() != null ? "기록: " + r.getScore() : "오늘 WOD 완료")
                .link("/wod/records")
                .createdAt(r.getCreatedAt())
                .build()));

        // 배지 획득
        userBadgeRepository.findByUserInOrderByAwardedAtDesc(following)
            .forEach(b -> items.add(FeedItemDto.builder()
                .type("BADGE")
                .actorId(b.getUser().getId())
                .actorName(b.getUser().getName())
                .actorProfileImageUrl(b.getUser().getProfileImageUrl())
                .title(b.getUser().getName() + "님이 배지를 획득했습니다!")
                .description(b.getType().getName())
                .link("/users/" + b.getUser().getId())
                .createdAt(b.getAwardedAt())
                .build()));

        // 대회 신청
        competitionRegistrationRepository.findByUserInAndCancelledFalseOrderByCreatedAtDesc(following)
            .forEach(cr -> items.add(FeedItemDto.builder()
                .type("COMPETITION")
                .actorId(cr.getUser().getId())
                .actorName(cr.getUser().getName())
                .actorProfileImageUrl(cr.getUser().getProfileImageUrl())
                .title(cr.getUser().getName() + "님이 대회에 참가 신청했습니다!")
                .description(cr.getCompetition().getName())
                .link("/competitions/" + cr.getCompetition().getId())
                .createdAt(cr.getCreatedAt())
                .build()));

        // 게시글 작성
        postRepository.findByUserInAndActiveTrueOrderByCreatedAtDesc(following)
            .forEach(p -> items.add(FeedItemDto.builder()
                .type("POST")
                .actorId(p.getUser().getId())
                .actorName(p.getUser().getName())
                .actorProfileImageUrl(p.getUser().getProfileImageUrl())
                .title(p.getUser().getName() + "님이 게시글을 작성했습니다.")
                .description(p.getTitle())
                .link("/community/" + p.getId())
                .imageUrl(p.getImageUrls() != null && !p.getImageUrls().isEmpty() ? p.getImageUrls().get(0) : null)
                .createdAt(p.getCreatedAt())
                .build()));

        // 시간순 정렬 (최신순)
        items.sort(Comparator.comparing(FeedItemDto::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));

        // 메모리 페이지네이션
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), items.size());
        List<FeedItemDto> pageContent = start >= items.size() ? List.of() : items.subList(start, end);

        return new PageImpl<>(pageContent, pageable, items.size());
    }
}
