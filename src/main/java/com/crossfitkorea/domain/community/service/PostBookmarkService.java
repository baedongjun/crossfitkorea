package com.crossfitkorea.domain.community.service;

import com.crossfitkorea.common.exception.BusinessException;
import com.crossfitkorea.common.exception.ErrorCode;
import com.crossfitkorea.domain.community.dto.PostDto;
import com.crossfitkorea.domain.community.entity.Post;
import com.crossfitkorea.domain.community.entity.PostBookmark;
import com.crossfitkorea.domain.community.repository.PostBookmarkRepository;
import com.crossfitkorea.domain.community.repository.PostRepository;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostBookmarkService {

    private final PostBookmarkRepository postBookmarkRepository;
    private final PostRepository postRepository;
    private final UserService userService;

    public boolean isBookmarked(Long postId, String email) {
        User user = userService.getUserByEmail(email);
        return postBookmarkRepository.existsByUserIdAndPostId(user.getId(), postId);
    }

    public Page<PostDto> getMyBookmarks(String email, Pageable pageable) {
        User user = userService.getUserByEmail(email);
        return postBookmarkRepository.findBookmarkedPostsByUserId(user.getId(), pageable)
            .map(PostDto::from);
    }

    @Transactional
    public boolean toggleBookmark(Long postId, String email) {
        User user = userService.getUserByEmail(email);
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));

        return postBookmarkRepository.findByUserIdAndPostId(user.getId(), postId)
            .map(bookmark -> {
                postBookmarkRepository.delete(bookmark);
                return false;
            })
            .orElseGet(() -> {
                postBookmarkRepository.save(PostBookmark.builder()
                    .user(user)
                    .post(post)
                    .build());
                return true;
            });
    }
}
