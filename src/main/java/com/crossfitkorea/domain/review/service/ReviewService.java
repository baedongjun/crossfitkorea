package com.crossfitkorea.domain.review.service;

import com.crossfitkorea.common.exception.BusinessException;
import com.crossfitkorea.common.exception.ErrorCode;
import com.crossfitkorea.domain.box.entity.Box;
import com.crossfitkorea.domain.box.repository.BoxRepository;
import com.crossfitkorea.domain.box.service.BoxService;
import com.crossfitkorea.domain.review.dto.ReviewCreateRequest;
import com.crossfitkorea.domain.review.dto.ReviewDto;
import com.crossfitkorea.domain.review.entity.Review;
import com.crossfitkorea.domain.review.repository.ReviewRepository;
import com.crossfitkorea.domain.notification.entity.NotificationType;
import com.crossfitkorea.domain.notification.service.NotificationService;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BoxService boxService;
    private final BoxRepository boxRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    public Page<ReviewDto> getReviewsByBox(Long boxId, Pageable pageable) {
        return reviewRepository.findByBoxIdAndActiveTrueOrderByCreatedAtDesc(boxId, pageable)
            .map(ReviewDto::from);
    }

    public Page<ReviewDto> getMyReviews(String userEmail, Pageable pageable) {
        return reviewRepository.findByUserEmailAndActiveTrueOrderByCreatedAtDesc(userEmail, pageable)
            .map(ReviewDto::from);
    }

    @Transactional
    public ReviewDto createReview(Long boxId, ReviewCreateRequest request, String userEmail) {
        Box box = boxService.findActiveBox(boxId);
        User user = userService.getUserByEmail(userEmail);

        if (reviewRepository.existsByBoxIdAndUserIdAndActiveTrue(boxId, user.getId())) {
            throw new BusinessException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        Review review = Review.builder()
            .box(box)
            .user(user)
            .rating(request.getRating())
            .content(request.getContent())
            .build();

        reviewRepository.save(review);
        updateBoxRating(box);

        // 박스 오너에게 후기 알림
        if (box.getOwner() != null && !box.getOwner().getEmail().equals(userEmail)) {
            notificationService.createNotification(
                box.getOwner(),
                NotificationType.REVIEW,
                user.getName() + "님이 " + box.getName() + "에 " + request.getRating() + "점 후기를 남겼습니다.",
                "/boxes/" + boxId
            );
        }

        return ReviewDto.from(review);
    }

    @Transactional
    public ReviewDto updateReview(Long reviewId, ReviewCreateRequest request, String userEmail) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));

        if (!review.getUser().getEmail().equals(userEmail)) {
            throw new BusinessException(ErrorCode.REVIEW_NOT_AUTHORIZED);
        }

        review.setRating(request.getRating());
        review.setContent(request.getContent());
        updateBoxRating(review.getBox());

        return ReviewDto.from(review);
    }

    @Transactional
    public void deleteReview(Long reviewId, String userEmail) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new BusinessException(ErrorCode.REVIEW_NOT_FOUND));

        if (!review.getUser().getEmail().equals(userEmail)) {
            throw new BusinessException(ErrorCode.REVIEW_NOT_AUTHORIZED);
        }

        review.setActive(false);
        updateBoxRating(review.getBox());
    }

    private void updateBoxRating(Box box) {
        Double avg = reviewRepository.getAverageRatingByBoxId(box.getId());
        long count = reviewRepository.countByBoxIdAndActiveTrue(box.getId());

        box.setRating(avg != null
            ? BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP)
            : BigDecimal.ZERO
        );
        box.setReviewCount((int) count);
        boxRepository.save(box);
    }
}
