package com.crossfitkorea.domain.box.service;

import com.crossfitkorea.common.exception.BusinessException;
import com.crossfitkorea.common.exception.ErrorCode;
import com.crossfitkorea.domain.box.dto.BoxAnnouncementDto;
import com.crossfitkorea.domain.box.entity.Box;
import com.crossfitkorea.domain.box.entity.BoxAnnouncement;
import com.crossfitkorea.domain.box.entity.BoxMembership;
import com.crossfitkorea.domain.box.repository.BoxAnnouncementRepository;
import com.crossfitkorea.domain.box.repository.BoxMembershipRepository;
import com.crossfitkorea.domain.notification.entity.NotificationType;
import com.crossfitkorea.domain.notification.service.NotificationService;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.entity.UserRole;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoxAnnouncementService {

    private final BoxAnnouncementRepository boxAnnouncementRepository;
    private final BoxService boxService;
    private final BoxMembershipRepository boxMembershipRepository;
    private final NotificationService notificationService;

    public List<BoxAnnouncementDto> getAnnouncements(Long boxId) {
        return boxAnnouncementRepository.findByBoxIdAndActiveOrderByPinnedDescCreatedAtDesc(boxId, true)
            .stream()
            .map(BoxAnnouncementDto::from)
            .toList();
    }

    @Transactional
    public BoxAnnouncementDto create(Long boxId, String title, String content, boolean pinned, User user) {
        Box box = boxService.findActiveBox(boxId);

        boolean isAdmin = user.getRole() == UserRole.ROLE_ADMIN;
        boolean isOwner = box.getOwner() != null && box.getOwner().getId().equals(user.getId());

        if (!isAdmin && !isOwner) {
            throw new BusinessException(ErrorCode.BOX_NOT_AUTHORIZED);
        }

        BoxAnnouncement announcement = BoxAnnouncement.builder()
            .box(box)
            .title(title)
            .content(content)
            .pinned(pinned)
            .build();

        BoxAnnouncementDto result = BoxAnnouncementDto.from(boxAnnouncementRepository.save(announcement));

        // 박스 활성 멤버 전체에게 공지 알림 발송
        List<BoxMembership> members = boxMembershipRepository.findByBoxIdAndActiveTrueOrderByJoinedAtAsc(boxId);
        String notifMessage = "[" + box.getName() + "] 새 공지: " + title;
        String link = "/boxes/" + boxId;
        for (BoxMembership membership : members) {
            notificationService.createNotification(membership.getUser(), NotificationType.SYSTEM, notifMessage, link);
        }

        return result;
    }

    @Transactional
    public void delete(Long announcementId, User user) {
        BoxAnnouncement announcement = boxAnnouncementRepository.findById(announcementId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ANNOUNCEMENT_NOT_FOUND));

        Box box = announcement.getBox();

        boolean isAdmin = user.getRole() == UserRole.ROLE_ADMIN;
        boolean isOwner = box.getOwner() != null && box.getOwner().getId().equals(user.getId());

        if (!isAdmin && !isOwner) {
            throw new BusinessException(ErrorCode.BOX_NOT_AUTHORIZED);
        }

        announcement.setActive(false);
    }
}
