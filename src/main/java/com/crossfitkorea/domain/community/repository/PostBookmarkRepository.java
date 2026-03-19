package com.crossfitkorea.domain.community.repository;

import com.crossfitkorea.domain.community.entity.Post;
import com.crossfitkorea.domain.community.entity.PostBookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface PostBookmarkRepository extends JpaRepository<PostBookmark, Long> {

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    @Transactional
    void deleteByUserIdAndPostId(Long userId, Long postId);

    Optional<PostBookmark> findByUserIdAndPostId(Long userId, Long postId);

    @Query("SELECT pb.post FROM PostBookmark pb WHERE pb.user.id = :userId ORDER BY pb.createdAt DESC")
    Page<Post> findBookmarkedPostsByUserId(@Param("userId") Long userId, Pageable pageable);
}
