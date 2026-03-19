package com.crossfitkorea.domain.goal.entity;

import com.crossfitkorea.common.BaseEntity;
import com.crossfitkorea.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "user_goals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserGoal extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String exerciseType;

    @Column(nullable = false)
    private Double targetValue;

    private Double currentValue;

    @Column(nullable = false)
    private String unit;

    private LocalDate targetDate;

    @Builder.Default
    private boolean achieved = false;

    @Column(length = 1000)
    private String notes;
}
