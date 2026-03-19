package com.crossfitkorea.domain.goal.service;

import com.crossfitkorea.common.exception.BusinessException;
import com.crossfitkorea.common.exception.ErrorCode;
import com.crossfitkorea.domain.goal.dto.UserGoalDto;
import com.crossfitkorea.domain.goal.entity.UserGoal;
import com.crossfitkorea.domain.goal.repository.UserGoalRepository;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserGoalService {

    private final UserGoalRepository userGoalRepository;
    private final UserService userService;

    public List<UserGoalDto> getMyGoals(Long userId) {
        return userGoalRepository.findByUserIdOrderByAchievedAscCreatedAtDesc(userId)
            .stream()
            .map(UserGoalDto::from)
            .toList();
    }

    @Transactional
    public UserGoalDto create(Long userId, UserGoalDto req) {
        User user = userService.getUserById(userId);

        UserGoal goal = UserGoal.builder()
            .user(user)
            .exerciseType(req.getExerciseType())
            .targetValue(req.getTargetValue())
            .currentValue(req.getCurrentValue())
            .unit(req.getUnit())
            .targetDate(req.getTargetDate())
            .notes(req.getNotes())
            .build();

        return UserGoalDto.from(userGoalRepository.save(goal));
    }

    @Transactional
    public UserGoalDto update(Long goalId, Long userId, UserGoalDto req) {
        UserGoal goal = userGoalRepository.findById(goalId)
            .orElseThrow(() -> new BusinessException(ErrorCode.GOAL_NOT_FOUND));

        if (!goal.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.GOAL_NOT_AUTHORIZED);
        }

        goal.setExerciseType(req.getExerciseType());
        goal.setTargetValue(req.getTargetValue());
        goal.setCurrentValue(req.getCurrentValue());
        goal.setUnit(req.getUnit());
        goal.setTargetDate(req.getTargetDate());
        goal.setNotes(req.getNotes());

        return UserGoalDto.from(goal);
    }

    @Transactional
    public void delete(Long goalId, Long userId) {
        UserGoal goal = userGoalRepository.findById(goalId)
            .orElseThrow(() -> new BusinessException(ErrorCode.GOAL_NOT_FOUND));

        if (!goal.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.GOAL_NOT_AUTHORIZED);
        }

        userGoalRepository.delete(goal);
    }

    @Transactional
    public UserGoalDto achieve(Long goalId, Long userId) {
        UserGoal goal = userGoalRepository.findById(goalId)
            .orElseThrow(() -> new BusinessException(ErrorCode.GOAL_NOT_FOUND));

        if (!goal.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.GOAL_NOT_AUTHORIZED);
        }

        goal.setAchieved(true);

        return UserGoalDto.from(goal);
    }
}
