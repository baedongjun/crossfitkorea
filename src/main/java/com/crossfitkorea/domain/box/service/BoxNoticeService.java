package com.crossfitkorea.domain.box.service;

import com.crossfitkorea.common.exception.BusinessException;
import com.crossfitkorea.common.exception.ErrorCode;
import com.crossfitkorea.domain.box.dto.BoxNoticeDto;
import com.crossfitkorea.domain.box.entity.Box;
import com.crossfitkorea.domain.box.entity.BoxMembership;
import com.crossfitkorea.domain.box.entity.BoxNotice;
import com.crossfitkorea.domain.box.repository.BoxMembershipRepository;
import com.crossfitkorea.domain.box.repository.BoxNoticeRepository;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.entity.UserRole;
import com.crossfitkorea.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoxNoticeService {

    private final BoxNoticeRepository boxNoticeRepository;
    private final BoxMembershipRepository boxMembershipRepository;
    private final BoxService boxService;
    private final UserService userService;

    public Page<BoxNoticeDto> getNotices(Long boxId, String requestEmail, Pageable pageable) {
        User user = userService.getUserByEmail(requestEmail);
        Box box = boxService.findActiveBox(boxId);

        boolean isAdmin = user.getRole() == UserRole.ROLE_ADMIN;
        boolean isOwner = box.getOwner() != null && box.getOwner().getId().equals(user.getId());
        boolean isMember = boxMembershipRepository.findByUserAndBoxIdAndActiveTrue(user, boxId).isPresent();

        if (!isAdmin && !isOwner && !isMember) {
            throw new BusinessException(ErrorCode.BOX_NOT_AUTHORIZED);
        }

        return boxNoticeRepository.findByBoxIdOrderByPinnedDescCreatedAtDesc(boxId, pageable)
            .map(BoxNoticeDto::from);
    }

    @Transactional
    public BoxNoticeDto createNotice(Long boxId, String title, String content, boolean pinned, String authorEmail) {
        User author = userService.getUserByEmail(authorEmail);
        Box box = boxService.findActiveBox(boxId);

        boolean isAdmin = author.getRole().name().equals("ROLE_ADMIN");
        boolean isOwner = box.getOwner() != null && box.getOwner().getId().equals(author.getId());

        if (!isAdmin && !isOwner) {
            throw new BusinessException(ErrorCode.BOX_NOT_AUTHORIZED);
        }

        BoxNotice notice = BoxNotice.builder()
            .box(box)
            .author(author)
            .title(title)
            .content(content)
            .pinned(pinned)
            .build();

        return BoxNoticeDto.from(boxNoticeRepository.save(notice));
    }

    @Transactional
    public BoxNoticeDto updateNotice(Long boxId, Long noticeId, String title, String content, boolean pinned, String authorEmail) {
        User user = userService.getUserByEmail(authorEmail);
        Box box = boxService.findActiveBox(boxId);

        boolean isAdmin = user.getRole() == UserRole.ROLE_ADMIN;
        boolean isOwner = box.getOwner() != null && box.getOwner().getId().equals(user.getId());

        if (!isAdmin && !isOwner) {
            throw new BusinessException(ErrorCode.BOX_NOT_AUTHORIZED);
        }

        BoxNotice notice = boxNoticeRepository.findById(noticeId)
            .orElseThrow(() -> new BusinessException(ErrorCode.COMMON_NOT_FOUND));

        if (!notice.getBox().getId().equals(boxId)) {
            throw new BusinessException(ErrorCode.BOX_NOT_AUTHORIZED);
        }

        notice.update(title, content, pinned);
        return BoxNoticeDto.from(notice);
    }

    @Transactional
    public void deleteNotice(Long boxId, Long noticeId, String authorEmail) {
        User user = userService.getUserByEmail(authorEmail);
        Box box = boxService.findActiveBox(boxId);

        boolean isAdmin = user.getRole() == UserRole.ROLE_ADMIN;
        boolean isOwner = box.getOwner() != null && box.getOwner().getId().equals(user.getId());

        if (!isAdmin && !isOwner) {
            throw new BusinessException(ErrorCode.BOX_NOT_AUTHORIZED);
        }

        BoxNotice notice = boxNoticeRepository.findById(noticeId)
            .orElseThrow(() -> new BusinessException(ErrorCode.COMMON_NOT_FOUND));

        if (!notice.getBox().getId().equals(boxId)) {
            throw new BusinessException(ErrorCode.BOX_NOT_AUTHORIZED);
        }

        boxNoticeRepository.delete(notice);
    }
}
