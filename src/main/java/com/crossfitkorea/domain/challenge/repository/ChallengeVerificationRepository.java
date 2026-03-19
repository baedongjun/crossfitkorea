package com.crossfitkorea.domain.challenge.repository;

import com.crossfitkorea.domain.challenge.entity.Challenge;
import com.crossfitkorea.domain.challenge.entity.ChallengeVerification;
import com.crossfitkorea.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ChallengeVerificationRepository extends JpaRepository<ChallengeVerification, Long> {

    boolean existsByChallengeAndUserAndVerifiedDate(Challenge challenge, User user, LocalDate verifiedDate);

    List<ChallengeVerification> findByChallengeAndUserOrderByVerifiedDateAsc(Challenge challenge, User user);

    long countByChallengeAndUser(Challenge challenge, User user);
}
