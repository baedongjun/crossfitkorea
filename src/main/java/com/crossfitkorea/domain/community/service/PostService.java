package com.crossfitkorea.domain.community.service;

import com.crossfitkorea.common.exception.BusinessException;
import com.crossfitkorea.common.exception.ErrorCode;
import com.crossfitkorea.domain.community.dto.CommentDto;
import com.crossfitkorea.domain.community.dto.PostCreateRequest;
import com.crossfitkorea.domain.community.dto.PostDto;
import com.crossfitkorea.domain.community.entity.Comment;
import com.crossfitkorea.domain.community.entity.Post;
import com.crossfitkorea.domain.community.entity.PostCategory;
import com.crossfitkorea.domain.community.repository.CommentRepository;
import com.crossfitkorea.domain.community.repository.PostRepository;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserService userService;

    public Page<PostDto> getMyPosts(String userEmail, Pageable pageable) {
        return postRepository.findByUserEmailAndActiveTrueOrderByCreatedAtDesc(userEmail, pageable)
            .map(PostDto::from);
    }

    public List<PostDto> getHotPosts() {
        return postRepository.findTop5ByActiveTrueOrderByLikeCountDesc()
            .stream().map(PostDto::from).toList();
    }

    public Page<PostDto> getPosts(PostCategory category, String keyword, Pageable pageable) {
        if (keyword != null && !keyword.isBlank()) {
            return postRepository.searchPosts(category, keyword, pageable).map(PostDto::from);
        }
        if (category != null) {
            return postRepository.findByCategoryAndActiveTrueOrderByCreatedAtDesc(category, pageable)
                .map(PostDto::from);
        }
        return postRepository.findByActiveTrueOrderByCreatedAtDesc(pageable).map(PostDto::from);
    }

    @Transactional
    public PostDto getPost(Long id) {
        Post post = findActivePost(id);
        post.setViewCount(post.getViewCount() + 1);
        return PostDto.from(post);
    }

    @Transactional
    public PostDto createPost(PostCreateRequest request, String userEmail) {
        User user = userService.getUserByEmail(userEmail);

        Post post = Post.builder()
            .user(user)
            .title(request.getTitle())
            .content(request.getContent())
            .category(request.getCategory())
            .imageUrls(request.getImageUrls() != null ? request.getImageUrls() : List.of())
            .build();

        return PostDto.from(postRepository.save(post));
    }

    @Transactional
    public PostDto updatePost(Long id, PostCreateRequest request, String userEmail) {
        Post post = findActivePost(id);

        if (!post.getUser().getEmail().equals(userEmail)) {
            throw new BusinessException(ErrorCode.POST_NOT_AUTHORIZED);
        }

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setCategory(request.getCategory());

        return PostDto.from(post);
    }

    @Transactional
    public void deletePost(Long id, String userEmail) {
        Post post = findActivePost(id);

        if (!post.getUser().getEmail().equals(userEmail)) {
            throw new BusinessException(ErrorCode.POST_NOT_AUTHORIZED);
        }

        post.setActive(false);
    }

    public List<CommentDto> getComments(Long postId) {
        List<Comment> roots = commentRepository.findByPostIdAndParentIsNullAndActiveTrueOrderByCreatedAtAsc(postId);
        return roots.stream().map(c -> {
            CommentDto dto = CommentDto.from(c);
            List<CommentDto> replies = commentRepository
                .findByParentIdAndActiveTrueOrderByCreatedAtAsc(c.getId())
                .stream().map(CommentDto::from).toList();
            return CommentDto.builder()
                .id(dto.getId())
                .postId(dto.getPostId())
                .content(dto.getContent())
                .userName(dto.getUserName())
                .userProfileImageUrl(dto.getUserProfileImageUrl())
                .createdAt(dto.getCreatedAt())
                .replies(replies)
                .build();
        }).toList();
    }

    @Transactional
    public CommentDto createComment(Long postId, String content, Long parentId, String userEmail) {
        Post post = findActivePost(postId);
        User user = userService.getUserByEmail(userEmail);

        Comment parent = null;
        if (parentId != null) {
            parent = commentRepository.findById(parentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        }

        Comment comment = Comment.builder()
            .post(post)
            .user(user)
            .content(content)
            .parent(parent)
            .build();

        commentRepository.save(comment);
        post.setCommentCount(post.getCommentCount() + 1);

        return CommentDto.from(comment);
    }

    @Transactional
    public void adminDeletePost(Long id) {
        Post post = postRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        post.setActive(false);
    }

    @Transactional
    public void deleteMyComment(Long commentId, String userEmail) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        if (!comment.getUser().getEmail().equals(userEmail)) {
            throw new BusinessException(ErrorCode.COMMENT_NOT_AUTHORIZED);
        }
        comment.setActive(false);
    }

    @Transactional
    public void adminDeleteComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));
        comment.setActive(false);
    }

    @Transactional
    public PostDto likePost(Long id) {
        Post post = findActivePost(id);
        post.setLikeCount(post.getLikeCount() + 1);
        return PostDto.from(post);
    }

    private Post findActivePost(Long id) {
        Post post = postRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.POST_NOT_FOUND));
        if (!post.isActive()) {
            throw new BusinessException(ErrorCode.POST_NOT_FOUND);
        }
        return post;
    }
}
