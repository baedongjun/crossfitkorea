package com.crossfitkorea.domain.box.repository;

import com.crossfitkorea.domain.box.entity.BoxCheckIn;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface BoxCheckInRepository extends JpaRepository<BoxCheckIn, Long> {

    Page<BoxCheckIn> findByBoxIdOrderByCheckedInAtDesc(Long boxId, Pageable pageable);

    Page<BoxCheckIn> findByUserIdOrderByCheckedInAtDesc(Long userId, Pageable pageable);

    @Query("SELECT c FROM BoxCheckIn c WHERE c.user.id = :userId AND c.box.id = :boxId AND c.checkedInAt >= :since ORDER BY c.checkedInAt DESC")
    Optional<BoxCheckIn> findLatestByUserAndBoxSince(@Param("userId") Long userId, @Param("boxId") Long boxId, @Param("since") LocalDateTime since);

    long countByBoxId(Long boxId);

    long countByUserId(Long userId);
}
