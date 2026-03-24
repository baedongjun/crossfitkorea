package com.crossfitkorea.domain.box.dto;

import com.crossfitkorea.domain.box.entity.Box;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class BoxDto {

    private Long id;
    private String name;
    private String address;
    private String city;
    private String district;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String phone;
    private String website;
    private String instagram;
    private String youtube;
    private String description;
    private Integer monthlyFee;
    private String openTime;
    private String closeTime;
    private List<String> imageUrls;
    private BigDecimal rating;
    private Integer reviewCount;
    private boolean verified;
    private boolean premium;
    private Long ownerId;
    private String ownerName;
    private Long memberCount;
    private Long favoriteCount;

    public static BoxDto from(Box box) {
        return BoxDto.builder()
            .id(box.getId())
            .name(box.getName())
            .address(box.getAddress())
            .city(box.getCity())
            .district(box.getDistrict())
            .latitude(box.getLatitude())
            .longitude(box.getLongitude())
            .phone(box.getPhone())
            .website(box.getWebsite())
            .instagram(box.getInstagram())
            .youtube(box.getYoutube())
            .description(box.getDescription())
            .monthlyFee(box.getMonthlyFee())
            .openTime(box.getOpenTime())
            .closeTime(box.getCloseTime())
            .imageUrls(box.getImageUrls())
            .rating(box.getRating())
            .reviewCount(box.getReviewCount())
            .verified(box.isVerified())
            .premium(box.isPremium())
            .ownerId(box.getOwner() != null ? box.getOwner().getId() : null)
            .ownerName(box.getOwner() != null ? box.getOwner().getName() : null)
            .build();
    }
}
