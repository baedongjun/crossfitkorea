package com.crossfitkorea.domain.competition.entity;

import com.crossfitkorea.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "competition_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompetitionResult extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competition_id", nullable = false)
    private Competition competition;

    private Long userId;

    @Column(nullable = false)
    private String userName;

    private int rank;

    private String score;

    @Column(length = 1000)
    private String notes;
}
