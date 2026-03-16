package com.crossfitkorea.domain.community.repository;

import com.crossfitkorea.domain.community.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostIdAndParentIsNullAndActiveTrueOrderByCreatedAtAsc(Long postId);

    List<Comment> findByParentIdAndActiveTrueOrderByCreatedAtAsc(Long parentId);

    Page<Comment> findByUserEmailAndActiveTrueOrderByCreatedAtDesc(String email, Pageable pageable);
}
