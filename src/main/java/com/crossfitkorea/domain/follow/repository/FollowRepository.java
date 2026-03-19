package com.crossfitkorea.domain.follow.repository;

import com.crossfitkorea.domain.follow.entity.Follow;
import com.crossfitkorea.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    Optional<Follow> findByFollowerAndFollowing(User follower, User following);
    boolean existsByFollowerAndFollowing(User follower, User following);
    long countByFollowing(User following);  // 팔로워 수
    long countByFollower(User follower);    // 팔로잉 수
    List<Follow> findByFollowerOrderByCreatedAtDesc(User follower);   // 내가 팔로우하는 사람들
    List<Follow> findByFollowingOrderByCreatedAtDesc(User following); // 나를 팔로우하는 사람들
}
