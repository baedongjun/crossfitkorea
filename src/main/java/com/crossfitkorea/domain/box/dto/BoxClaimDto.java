package com.crossfitkorea.domain.box.dto;

import com.crossfitkorea.domain.box.entity.BoxClaimRequest;
import com.crossfitkorea.domain.box.entity.BoxClaimStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class BoxClaimDto {

    private Long id;
    private Long boxId;
    private String boxName;
    private String boxAddress;
    private String boxCity;
    private Long requesterId;
    private String requesterName;
    private String requesterEmail;
    private BoxClaimStatus status;
    private String message;
    private String adminNote;
    private LocalDateTime createdAt;

    public static BoxClaimDto from(BoxClaimRequest r) {
        return BoxClaimDto.builder()
            .id(r.getId())
            .boxId(r.getBox().getId())
            .boxName(r.getBox().getName())
            .boxAddress(r.getBox().getAddress())
            .boxCity(r.getBox().getCity())
            .requesterId(r.getRequester().getId())
            .requesterName(r.getRequester().getName())
            .requesterEmail(r.getRequester().getEmail())
            .status(r.getStatus())
            .message(r.getMessage())
            .adminNote(r.getAdminNote())
            .createdAt(r.getCreatedAt())
            .build();
    }
}
