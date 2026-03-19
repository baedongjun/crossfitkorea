package com.crossfitkorea.domain.box.repository;

import com.crossfitkorea.domain.box.entity.BoxNotice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoxNoticeRepository extends JpaRepository<BoxNotice, Long> {
    Page<BoxNotice> findByBoxIdOrderByPinnedDescCreatedAtDesc(Long boxId, Pageable pageable);
}
