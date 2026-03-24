package com.crossfitkorea.domain.box.service;

import com.crossfitkorea.common.exception.BusinessException;
import com.crossfitkorea.common.exception.ErrorCode;
import com.crossfitkorea.domain.box.dto.BoxCreateRequest;
import com.crossfitkorea.domain.box.dto.BoxDto;
import com.crossfitkorea.domain.box.dto.BoxSearchRequest;
import com.crossfitkorea.domain.box.entity.Box;
import com.crossfitkorea.domain.box.repository.BoxFavoriteRepository;
import com.crossfitkorea.domain.box.repository.BoxMembershipRepository;
import com.crossfitkorea.domain.box.repository.BoxRepository;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoxService {

    private final BoxRepository boxRepository;
    private final UserService userService;
    private final BoxMembershipRepository membershipRepository;
    private final BoxFavoriteRepository favoriteRepository;

    public Page<BoxDto> searchBoxes(BoxSearchRequest request, Pageable pageable) {
        BigDecimal minRating = request.getMinRating() != null
            ? BigDecimal.valueOf(request.getMinRating()) : null;
        return boxRepository.searchBoxes(
            request.getCity(),
            request.getDistrict(),
            request.getKeyword(),
            request.getVerified(),
            request.getPremium(),
            request.getMaxFee(),
            minRating,
            pageable
        ).map(BoxDto::from);
    }

    public BoxDto getBox(Long id) {
        Box box = findActiveBox(id);
        BoxDto dto = BoxDto.from(box);
        return BoxDto.builder()
            .id(dto.getId())
            .name(dto.getName())
            .address(dto.getAddress())
            .city(dto.getCity())
            .district(dto.getDistrict())
            .latitude(dto.getLatitude())
            .longitude(dto.getLongitude())
            .phone(dto.getPhone())
            .website(dto.getWebsite())
            .instagram(dto.getInstagram())
            .youtube(dto.getYoutube())
            .description(dto.getDescription())
            .monthlyFee(dto.getMonthlyFee())
            .openTime(dto.getOpenTime())
            .closeTime(dto.getCloseTime())
            .imageUrls(dto.getImageUrls())
            .rating(dto.getRating())
            .reviewCount(dto.getReviewCount())
            .verified(dto.isVerified())
            .premium(dto.isPremium())
            .ownerName(dto.getOwnerName())
            .memberCount(membershipRepository.countByBoxIdAndActiveTrue(id))
            .favoriteCount(favoriteRepository.countByBoxId(id))
            .build();
    }

    public Page<BoxDto> getMyBoxes(String ownerEmail, Pageable pageable) {
        return boxRepository.findByOwnerEmailAndActiveTrue(ownerEmail, pageable).map(BoxDto::from);
    }

    public List<BoxDto> getPremiumBoxes() {
        return boxRepository.findByPremiumTrueAndActiveTrueOrderByCreatedAtDesc()
            .stream().map(BoxDto::from).toList();
    }

    @Transactional
    public BoxDto createBox(BoxCreateRequest request, String ownerEmail) {
        User owner = userService.getUserByEmail(ownerEmail);

        Box box = Box.builder()
            .name(request.getName())
            .address(request.getAddress())
            .city(request.getCity())
            .district(request.getDistrict())
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .phone(request.getPhone())
            .website(request.getWebsite())
            .instagram(request.getInstagram())
            .youtube(request.getYoutube())
            .description(request.getDescription())
            .monthlyFee(request.getMonthlyFee())
            .openTime(request.getOpenTime())
            .closeTime(request.getCloseTime())
            .imageUrls(request.getImageUrls() != null ? request.getImageUrls() : new java.util.ArrayList<>())
            .owner(owner)
            .build();

        return BoxDto.from(boxRepository.save(box));
    }

    @Transactional
    public BoxDto updateBox(Long id, BoxCreateRequest request, String ownerEmail, boolean isAdmin) {
        Box box = findActiveBox(id);
        validateOwner(box, ownerEmail, isAdmin);

        box.setName(request.getName());
        box.setAddress(request.getAddress());
        box.setCity(request.getCity());
        box.setDistrict(request.getDistrict());
        box.setLatitude(request.getLatitude());
        box.setLongitude(request.getLongitude());
        box.setPhone(request.getPhone());
        box.setWebsite(request.getWebsite());
        box.setInstagram(request.getInstagram());
        box.setYoutube(request.getYoutube());
        box.setDescription(request.getDescription());
        box.setMonthlyFee(request.getMonthlyFee());
        box.setOpenTime(request.getOpenTime());
        box.setCloseTime(request.getCloseTime());
        if (request.getImageUrls() != null) {
            box.getImageUrls().clear();
            box.getImageUrls().addAll(request.getImageUrls());
        }

        return BoxDto.from(box);
    }

    @Transactional
    public void deleteBox(Long id, String ownerEmail, boolean isAdmin) {
        Box box = findActiveBox(id);
        validateOwner(box, ownerEmail, isAdmin);
        box.setActive(false);
    }

    @Transactional
    public BoxDto createBoxAdmin(BoxCreateRequest request) {
        Box box = Box.builder()
            .name(request.getName())
            .address(request.getAddress())
            .city(request.getCity())
            .district(request.getDistrict())
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .phone(request.getPhone())
            .website(request.getWebsite())
            .instagram(request.getInstagram())
            .youtube(request.getYoutube())
            .description(request.getDescription())
            .monthlyFee(request.getMonthlyFee())
            .openTime(request.getOpenTime())
            .closeTime(request.getCloseTime())
            .imageUrls(request.getImageUrls() != null ? request.getImageUrls() : new java.util.ArrayList<>())
            .build();
        return BoxDto.from(boxRepository.save(box));
    }

    public Page<BoxDto> getUnclaimedBoxes(Pageable pageable) {
        return boxRepository.findByOwnerIsNullAndActiveTrue(pageable).map(BoxDto::from);
    }

    public Box findActiveBox(Long id) {
        Box box = boxRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.BOX_NOT_FOUND));
        if (!box.isActive()) {
            throw new BusinessException(ErrorCode.BOX_NOT_FOUND);
        }
        return box;
    }

    private void validateOwner(Box box, String email, boolean isAdmin) {
        if (isAdmin) return;
        if (box.getOwner() == null || !box.getOwner().getEmail().equals(email)) {
            throw new BusinessException(ErrorCode.BOX_NOT_AUTHORIZED);
        }
    }
}
