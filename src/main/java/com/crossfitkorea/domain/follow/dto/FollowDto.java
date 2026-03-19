package com.crossfitkorea.domain.follow.dto;

import com.crossfitkorea.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FollowDto {
    private Long id;
    private String name;
    private String profileImageUrl;
    private String role;
    private boolean following; // 내가 이 사람을 팔로우하는지 여부

    public static FollowDto from(User user, boolean following) {
        return FollowDto.builder()
            .id(user.getId())
            .name(user.getName())
            .profileImageUrl(user.getProfileImageUrl())
            .role(user.getRole().name())
            .following(following)
            .build();
    }
}
