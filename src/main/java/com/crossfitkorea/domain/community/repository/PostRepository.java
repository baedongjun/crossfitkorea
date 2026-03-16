package com.crossfitkorea.domain.community.repository;

import com.crossfitkorea.domain.community.entity.Post;
import com.crossfitkorea.domain.community.entity.PostCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    Page<Post> findByActiveTrueOrderByCreatedAtDesc(Pageable pageable);

    Page<Post> findByCategoryAndActiveTrueOrderByCreatedAtDesc(PostCategory category, Pageable pageable);

    Page<Post> findByUserEmailAndActiveTrueOrderByCreatedAtDesc(String email, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.active = true " +
        "AND (:category IS NULL OR p.category = :category) " +
        "AND (:keyword IS NULL OR p.title LIKE %:keyword% OR p.content LIKE %:keyword%) " +
        "ORDER BY p.createdAt DESC")
    Page<Post> searchPosts(
        @Param("category") PostCategory category,
        @Param("keyword") String keyword,
        Pageable pageable
    );

    List<Post> findTop5ByActiveTrueOrderByLikeCountDesc();
}
