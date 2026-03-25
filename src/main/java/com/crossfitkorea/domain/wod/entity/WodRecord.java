package com.crossfitkorea.domain.wod.entity;

import com.crossfitkorea.common.BaseEntity;
import com.crossfitkorea.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "wod_records",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "wod_date"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WodRecord extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate wodDate;

    private String score;       // "5:30", "150 reps", "100 kg" 등 자유 입력

    @Column(length = 1000)
    private String notes;       // 메모

    @Builder.Default
    private boolean rx = false; // Rx 수행 여부

    private String videoUrl;    // 유튜브 영상 URL
}
