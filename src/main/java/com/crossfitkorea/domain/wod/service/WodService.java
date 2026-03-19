package com.crossfitkorea.domain.wod.service;

import com.crossfitkorea.common.exception.BusinessException;
import com.crossfitkorea.common.exception.ErrorCode;
import com.crossfitkorea.domain.box.entity.Box;
import com.crossfitkorea.domain.box.service.BoxService;
import com.crossfitkorea.domain.wod.dto.WodCreateRequest;
import com.crossfitkorea.domain.wod.dto.WodDto;
import com.crossfitkorea.domain.wod.entity.Wod;
import com.crossfitkorea.domain.wod.repository.WodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WodService {

    private final WodRepository wodRepository;
    private final BoxService boxService;

    public WodDto getTodayWod(Long boxId) {
        LocalDate today = LocalDate.now();

        if (boxId != null) {
            return wodRepository.findByBoxIdAndWodDateAndActiveTrue(boxId, today)
                .or(() -> wodRepository.findByBoxIsNullAndWodDateAndActiveTrue(today))
                .map(WodDto::from)
                .orElse(null);
        } else {
            return wodRepository.findByBoxIsNullAndWodDateAndActiveTrue(today)
                .map(WodDto::from)
                .orElse(null);
        }
    }

    public List<WodDto> getWodRange(Long boxId, LocalDate start, LocalDate end) {
        return wodRepository.findByBoxIdAndWodDateBetweenOrderByWodDateAsc(boxId, start, end)
            .stream()
            .map(WodDto::from)
            .collect(Collectors.toList());
    }

    public Page<WodDto> getWodHistory(Pageable pageable) {
        return wodRepository.findByBoxIsNullAndActiveTrueOrderByWodDateDesc(pageable)
            .map(WodDto::from);
    }

    @Transactional
    public WodDto updateWod(Long id, WodCreateRequest request) {
        Wod wod = wodRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.WOD_NOT_FOUND));
        wod.setWodDate(request.getWodDate());
        wod.setTitle(request.getTitle());
        wod.setType(request.getType());
        wod.setContent(request.getContent());
        wod.setScoreType(request.getScoreType());
        if (request.getImageUrl() != null) wod.setImageUrl(request.getImageUrl());
        return WodDto.from(wodRepository.save(wod));
    }

    @Transactional
    public void deleteWod(Long id) {
        Wod wod = wodRepository.findById(id)
            .orElseThrow(() -> new com.crossfitkorea.common.exception.BusinessException(
                com.crossfitkorea.common.exception.ErrorCode.WOD_NOT_FOUND));
        wod.setActive(false);
    }

    @Transactional
    public WodDto createWod(Long boxId, WodCreateRequest request, String ownerEmail) {
        return createWod(boxId, request, ownerEmail, false);
    }

    @Transactional
    public WodDto createWod(Long boxId, WodCreateRequest request, String ownerEmail, boolean isAdmin) {
        Box box = null;
        if (boxId != null) {
            box = boxService.findActiveBox(boxId);
            if (!isAdmin && (box.getOwner() == null || !box.getOwner().getEmail().equals(ownerEmail))) {
                throw new BusinessException(ErrorCode.BOX_NOT_AUTHORIZED);
            }
        }

        Wod wod = Wod.builder()
            .box(box)
            .wodDate(request.getWodDate())
            .title(request.getTitle())
            .type(request.getType())
            .content(request.getContent())
            .scoreType(request.getScoreType())
            .imageUrl(request.getImageUrl())
            .build();

        return WodDto.from(wodRepository.save(wod));
    }
}
