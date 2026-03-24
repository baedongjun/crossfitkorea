package com.crossfitkorea.domain.follow.service;

import com.crossfitkorea.common.exception.BusinessException;
import com.crossfitkorea.common.exception.ErrorCode;
import com.crossfitkorea.domain.follow.dto.FollowDto;
import com.crossfitkorea.domain.follow.entity.Follow;
import com.crossfitkorea.domain.follow.repository.FollowRepository;
import com.crossfitkorea.domain.notification.entity.NotificationType;
import com.crossfitkorea.domain.notification.service.NotificationService;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FollowService {

    private final FollowRepository followRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    @Transactional
    public Map<String, Object> toggle(Long targetUserId, String myEmail) {
        User me = userService.getUserByEmail(myEmail);
        User target = userService.getUserById(targetUserId);

        if (me.getId().equals(targetUserId)) {
            throw new BusinessException(ErrorCode.CANNOT_FOLLOW_SELF);
        }

        return followRepository.findByFollowerAndFollowing(me, target)
            .map(follow -> {
                followRepository.delete(follow);
                return Map.<String, Object>of("following", false,
                    "followerCount", followRepository.countByFollowing(target));
            })
            .orElseGet(() -> {
                followRepository.save(Follow.builder().follower(me).following(target).build());
                try {
                    notificationService.createNotification(target, NotificationType.FOLLOW,
                        me.getName() + "님이 팔로우했습니다.", "/users/" + me.getId());
                } catch (Exception e) {
                    log.warn("Failed to send follow notification: {}", e.getMessage());
                }
                return Map.<String, Object>of("following", true,
                    "followerCount", followRepository.countByFollowing(target));
            });
    }

    public boolean isFollowing(Long targetUserId, String myEmail) {
        try {
            User me = userService.getUserByEmail(myEmail);
            User target = userService.getUserById(targetUserId);
            return followRepository.existsByFollowerAndFollowing(me, target);
        } catch (Exception e) {
            return false;
        }
    }

    public List<FollowDto> getFollowers(Long userId, String myEmail) {
        User target = userService.getUserById(userId);
        User me = myEmail != null ? userService.getUserByEmail(myEmail) : null;
        return followRepository.findByFollowingOrderByCreatedAtDesc(target)
            .stream()
            .map(f -> FollowDto.from(f.getFollower(),
                me != null && followRepository.existsByFollowerAndFollowing(me, f.getFollower())))
            .toList();
    }

    public List<FollowDto> getFollowing(Long userId, String myEmail) {
        User user = userService.getUserById(userId);
        User me = myEmail != null ? userService.getUserByEmail(myEmail) : null;
        return followRepository.findByFollowerOrderByCreatedAtDesc(user)
            .stream()
            .map(f -> FollowDto.from(f.getFollowing(),
                me != null && followRepository.existsByFollowerAndFollowing(me, f.getFollowing())))
            .toList();
    }

    public Map<String, Long> getCounts(Long userId) {
        User user = userService.getUserById(userId);
        return Map.of(
            "followerCount", followRepository.countByFollowing(user),
            "followingCount", followRepository.countByFollower(user)
        );
    }
}
