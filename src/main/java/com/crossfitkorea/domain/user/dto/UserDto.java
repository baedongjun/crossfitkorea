package com.crossfitkorea.domain.user.dto;

import com.crossfitkorea.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserDto {

    private Long id;
    private String email;
    private String name;
    private String phone;
    private String profileImageUrl;
    private String role;
    private boolean active;

    // 공개 프로필용 추가 필드
    private Long followerCount;
    private Long followingCount;
    private Long badgeCount;
    private Long wodCount;
    private Long postCount;

    public static UserDto from(User user) {
        return UserDto.builder()
            .id(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .phone(user.getPhone())
            .profileImageUrl(user.getProfileImageUrl())
            .role(user.getRole().name())
            .active(user.isActive())
            .build();
    }
}
