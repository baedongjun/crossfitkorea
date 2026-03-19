package com.crossfitkorea.domain.community.dto;

import com.crossfitkorea.domain.community.entity.Post;
import com.crossfitkorea.domain.community.entity.PostCategory;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class PostDto {

    private Long id;
    private Long userId;
    private String title;
    private String content;
    private PostCategory category;
    private int viewCount;
    private int likeCount;
    private int commentCount;
    private List<String> imageUrls;
    private String userName;
    private String userProfileImageUrl;
    private LocalDateTime createdAt;
    private boolean pinned;
    private int reportCount;

    public static PostDto from(Post post) {
        return PostDto.builder()
            .id(post.getId())
            .userId(post.getUser().getId())
            .title(post.getTitle())
            .content(post.getContent())
            .category(post.getCategory())
            .viewCount(post.getViewCount())
            .likeCount(post.getLikeCount())
            .commentCount(post.getCommentCount())
            .imageUrls(post.getImageUrls())
            .userName(post.getUser().getName())
            .userProfileImageUrl(post.getUser().getProfileImageUrl())
            .createdAt(post.getCreatedAt())
            .pinned(post.isPinned())
            .reportCount(post.getReportCount())
            .build();
    }
}
