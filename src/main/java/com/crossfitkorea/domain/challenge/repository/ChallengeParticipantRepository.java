package com.crossfitkorea.domain.challenge.repository;

import com.crossfitkorea.domain.challenge.entity.Challenge;
import com.crossfitkorea.domain.challenge.entity.ChallengeParticipant;
import com.crossfitkorea.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChallengeParticipantRepository extends JpaRepository<ChallengeParticipant, Long> {

    Optional<ChallengeParticipant> findByChallengeAndUser(Challenge challenge, User user);

    long countByChallenge(Challenge challenge);

    List<ChallengeParticipant> findByChallengeOrderByCompletedDaysDesc(Challenge challenge);

    List<ChallengeParticipant> findByUserOrderByCreatedAtDesc(User user);

    boolean existsByChallengeAndUser(Challenge challenge, User user);
}
