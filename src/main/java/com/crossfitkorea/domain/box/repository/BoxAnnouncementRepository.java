package com.crossfitkorea.domain.box.repository;

import com.crossfitkorea.domain.box.entity.BoxAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoxAnnouncementRepository extends JpaRepository<BoxAnnouncement, Long> {

    List<BoxAnnouncement> findByBoxIdAndActiveOrderByPinnedDescCreatedAtDesc(Long boxId, boolean active);
}
