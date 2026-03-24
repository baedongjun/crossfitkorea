package com.crossfitkorea.domain.box.repository;

import com.crossfitkorea.domain.box.entity.BoxClaimRequest;
import com.crossfitkorea.domain.box.entity.BoxClaimStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoxClaimRepository extends JpaRepository<BoxClaimRequest, Long> {

    List<BoxClaimRequest> findByRequesterEmailOrderByCreatedAtDesc(String email);

    Page<BoxClaimRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<BoxClaimRequest> findByBoxIdAndStatus(Long boxId, BoxClaimStatus status);

    boolean existsByBoxIdAndRequesterEmailAndStatus(Long boxId, String email, BoxClaimStatus status);
}
