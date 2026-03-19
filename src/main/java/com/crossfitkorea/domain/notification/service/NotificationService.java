package com.crossfitkorea.domain.notification.service;

import com.crossfitkorea.common.exception.BusinessException;
import com.crossfitkorea.common.exception.ErrorCode;
import com.crossfitkorea.domain.notification.dto.NotificationDto;
import com.crossfitkorea.domain.notification.entity.Notification;
import com.crossfitkorea.domain.notification.entity.NotificationType;
import com.crossfitkorea.domain.notification.repository.NotificationRepository;
import com.crossfitkorea.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationSseService sseService;

    public List<NotificationDto> getMyNotifications(String email) {
        return notificationRepository.findByUserEmailOrderByCreatedAtDesc(email)
            .stream().map(NotificationDto::from).toList();
    }

    public long getUnreadCount(String email) {
        return notificationRepository.countByUserEmailAndReadFalse(email);
    }

    @Transactional
    public void markAsRead(Long id, String email) {
        Notification n = notificationRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.COMMON_NOT_FOUND));
        if (!n.getUser().getEmail().equals(email)) {
            throw new BusinessException(ErrorCode.COMMON_FORBIDDEN);
        }
        n.setRead(true);
    }

    @Transactional
    public void markAllAsRead(String email) {
        notificationRepository.markAllReadByEmail(email);
    }

    @Transactional
    public void deleteNotification(Long id, String email) {
        Notification n = notificationRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.COMMON_NOT_FOUND));
        if (!n.getUser().getEmail().equals(email)) {
            throw new BusinessException(ErrorCode.COMMON_FORBIDDEN);
        }
        notificationRepository.delete(n);
    }

    @Transactional
    public void deleteReadNotifications(String email) {
        notificationRepository.deleteReadByEmail(email);
    }

    @Transactional
    public void createNotification(User user, NotificationType type, String message, String link) {
        Notification notification = notificationRepository.save(Notification.builder()
            .user(user)
            .type(type)
            .message(message)
            .link(link)
            .build());

        sseService.sendNotification(user.getId(), Map.of(
            "id", notification.getId(),
            "message", notification.getMessage(),
            "type", notification.getType().name(),
            "link", notification.getLink() != null ? notification.getLink() : ""
        ));
    }
}
