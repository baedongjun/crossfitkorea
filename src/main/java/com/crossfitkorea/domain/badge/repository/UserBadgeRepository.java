package com.crossfitkorea.domain.badge.repository;

import com.crossfitkorea.domain.badge.BadgeType;
import com.crossfitkorea.domain.badge.entity.UserBadge;
import com.crossfitkorea.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

    List<UserBadge> findByUserOrderByAwardedAtDesc(User user);

    boolean existsByUserAndType(User user, BadgeType type);

    List<UserBadge> findByUserInOrderByAwardedAtDesc(List<User> users);
}
