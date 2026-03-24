package com.crossfitkorea.domain.box.repository;

import com.crossfitkorea.domain.box.entity.Box;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface BoxRepository extends JpaRepository<Box, Long> {

    @Query(value = "SELECT b FROM Box b LEFT JOIN FETCH b.owner WHERE b.active = true " +
           "AND (:city IS NULL OR b.city = :city) " +
           "AND (:district IS NULL OR b.district = :district) " +
           "AND (:keyword IS NULL OR b.name LIKE %:keyword% OR b.address LIKE %:keyword%) " +
           "AND (:verified IS NULL OR b.verified = :verified) " +
           "AND (:premium IS NULL OR b.premium = :premium) " +
           "AND (:maxFee IS NULL OR b.monthlyFee IS NULL OR b.monthlyFee <= :maxFee) " +
           "AND (:minRating IS NULL OR b.rating >= :minRating) " +
           "ORDER BY b.premium DESC, b.rating DESC",
           countQuery = "SELECT COUNT(b) FROM Box b WHERE b.active = true " +
           "AND (:city IS NULL OR b.city = :city) " +
           "AND (:district IS NULL OR b.district = :district) " +
           "AND (:keyword IS NULL OR b.name LIKE %:keyword% OR b.address LIKE %:keyword%) " +
           "AND (:verified IS NULL OR b.verified = :verified) " +
           "AND (:premium IS NULL OR b.premium = :premium) " +
           "AND (:maxFee IS NULL OR b.monthlyFee IS NULL OR b.monthlyFee <= :maxFee) " +
           "AND (:minRating IS NULL OR b.rating >= :minRating)")
    Page<Box> searchBoxes(
        @Param("city") String city,
        @Param("district") String district,
        @Param("keyword") String keyword,
        @Param("verified") Boolean verified,
        @Param("premium") Boolean premium,
        @Param("maxFee") Integer maxFee,
        @Param("minRating") BigDecimal minRating,
        Pageable pageable
    );

    List<Box> findByPremiumTrueAndActiveTrueOrderByCreatedAtDesc();

    Page<Box> findByOwnerEmailAndActiveTrue(String email, Pageable pageable);

    long countByActiveTrue();

    long countByActiveTrueAndVerifiedFalse();

    Page<Box> findByOwnerIsNullAndActiveTrue(Pageable pageable);
}
