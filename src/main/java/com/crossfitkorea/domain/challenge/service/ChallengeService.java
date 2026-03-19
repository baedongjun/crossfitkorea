package com.crossfitkorea.domain.challenge.service;

import com.crossfitkorea.common.exception.BusinessException;
import com.crossfitkorea.common.exception.ErrorCode;
import com.crossfitkorea.domain.challenge.dto.*;
import com.crossfitkorea.domain.challenge.entity.*;
import com.crossfitkorea.domain.challenge.repository.*;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final ChallengeParticipantRepository participantRepository;
    private final ChallengeVerificationRepository verificationRepository;
    private final UserRepository userRepository;

    /** 활성 챌린지 목록 */
    public List<ChallengeDto> getActiveChallenges(String email) {
        User user = email != null ? userRepository.findByEmail(email).orElse(null) : null;
        List<Challenge> challenges = challengeRepository.findByActiveTrueOrderByStartDateDesc();

        return challenges.stream().map(c -> {
            long count = participantRepository.countByChallenge(c);
            Integer myDays = null;
            boolean participating = false;
            boolean verifiedToday = false;
            if (user != null) {
                Optional<ChallengeParticipant> p = participantRepository.findByChallengeAndUser(c, user);
                if (p.isPresent()) {
                    participating = true;
                    myDays = p.get().getCompletedDays();
                    verifiedToday = verificationRepository.existsByChallengeAndUserAndVerifiedDate(c, user, LocalDate.now());
                }
            }
            return ChallengeDto.from(c, count, myDays, participating, verifiedToday);
        }).collect(Collectors.toList());
    }

    /** 챌린지 상세 */
    public ChallengeDetailDto getDetail(Long id, String email) {
        Challenge challenge = challengeRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHALLENGE_NOT_FOUND));

        User user = email != null ? userRepository.findByEmail(email).orElse(null) : null;

        long count = participantRepository.countByChallenge(challenge);
        Integer myDays = null;
        boolean participating = false;
        boolean verifiedToday = false;
        List<ChallengeDetailDto.VerificationDto> myVerifications = List.of();

        if (user != null) {
            Optional<ChallengeParticipant> p = participantRepository.findByChallengeAndUser(challenge, user);
            if (p.isPresent()) {
                participating = true;
                myDays = p.get().getCompletedDays();
                verifiedToday = verificationRepository.existsByChallengeAndUserAndVerifiedDate(challenge, user, LocalDate.now());
                myVerifications = verificationRepository.findByChallengeAndUserOrderByVerifiedDateAsc(challenge, user)
                        .stream().map(ChallengeDetailDto.VerificationDto::from).collect(Collectors.toList());
            }
        }

        List<ChallengeDetailDto.LeaderboardEntryDto> leaderboard = buildLeaderboard(challenge);

        return ChallengeDetailDto.from(challenge, count, myDays, participating, verifiedToday, myVerifications, leaderboard);
    }

    /** 챌린지 참가 */
    @Transactional
    public void join(Long id, String email) {
        Challenge challenge = challengeRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHALLENGE_NOT_FOUND));
        User user = getUser(email);

        if (participantRepository.existsByChallengeAndUser(challenge, user)) {
            throw new BusinessException(ErrorCode.CHALLENGE_ALREADY_JOINED);
        }

        participantRepository.save(ChallengeParticipant.builder()
                .challenge(challenge)
                .user(user)
                .build());
    }

    /** 챌린지 참가 취소 */
    @Transactional
    public void leave(Long id, String email) {
        Challenge challenge = challengeRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHALLENGE_NOT_FOUND));
        User user = getUser(email);

        ChallengeParticipant participant = participantRepository.findByChallengeAndUser(challenge, user)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHALLENGE_NOT_JOINED));

        participantRepository.delete(participant);
    }

    /** 오늘 인증 (하루 1회) */
    @Transactional
    public void verify(Long id, String email, String content, String imageUrl) {
        Challenge challenge = challengeRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHALLENGE_NOT_FOUND));
        User user = getUser(email);

        ChallengeParticipant participant = participantRepository.findByChallengeAndUser(challenge, user)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHALLENGE_NOT_JOINED));

        LocalDate today = LocalDate.now();
        if (verificationRepository.existsByChallengeAndUserAndVerifiedDate(challenge, user, today)) {
            throw new BusinessException(ErrorCode.CHALLENGE_ALREADY_VERIFIED);
        }

        verificationRepository.save(ChallengeVerification.builder()
                .challenge(challenge)
                .user(user)
                .content(content)
                .imageUrl(imageUrl)
                .verifiedDate(today)
                .build());

        participant.incrementDay();
    }

    /** 챌린지 랭킹 */
    public List<ChallengeDetailDto.LeaderboardEntryDto> getLeaderboard(Long id) {
        Challenge challenge = challengeRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHALLENGE_NOT_FOUND));
        return buildLeaderboard(challenge);
    }

    /** 내 참여 챌린지 목록 */
    public List<ChallengeDto> getMyChallenges(String email) {
        User user = getUser(email);
        List<ChallengeParticipant> myParticipations = participantRepository.findByUserOrderByCreatedAtDesc(user);

        return myParticipations.stream().map(p -> {
            Challenge c = p.getChallenge();
            long count = participantRepository.countByChallenge(c);
            boolean verifiedToday = verificationRepository.existsByChallengeAndUserAndVerifiedDate(c, user, LocalDate.now());
            return ChallengeDto.from(c, count, p.getCompletedDays(), true, verifiedToday);
        }).collect(Collectors.toList());
    }

    // ===== Admin =====

    @Transactional
    public ChallengeDto create(ChallengeCreateRequest req) {
        Challenge challenge = challengeRepository.save(Challenge.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .imageUrl(req.getImageUrl())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .targetDays(req.getTargetDays())
                .type(req.getType() != null ? req.getType() : com.crossfitkorea.domain.challenge.entity.ChallengeType.WOD)
                .build());
        return ChallengeDto.from(challenge, 0, null, false, false);
    }

    @Transactional
    public ChallengeDto update(Long id, ChallengeCreateRequest req) {
        Challenge challenge = challengeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHALLENGE_NOT_FOUND));
        challenge.update(req.getTitle(), req.getDescription(), req.getImageUrl(),
                req.getStartDate(), req.getEndDate(), req.getTargetDays());
        long count = participantRepository.countByChallenge(challenge);
        return ChallengeDto.from(challenge, count, null, false, false);
    }

    @Transactional
    public void toggleActive(Long id, boolean active) {
        Challenge challenge = challengeRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHALLENGE_NOT_FOUND));
        challenge.setActive(active);
    }

    // ===== private helpers =====

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    private List<ChallengeDetailDto.LeaderboardEntryDto> buildLeaderboard(Challenge challenge) {
        List<ChallengeParticipant> participants = participantRepository.findByChallengeOrderByCompletedDaysDesc(challenge);
        AtomicInteger rank = new AtomicInteger(1);
        return participants.stream().map(p -> ChallengeDetailDto.LeaderboardEntryDto.builder()
                .userId(p.getUser().getId())
                .userName(p.getUser().getName())
                .profileImageUrl(p.getUser().getProfileImageUrl())
                .completedDays(p.getCompletedDays())
                .rank(rank.getAndIncrement())
                .build()).collect(Collectors.toList());
    }
}
