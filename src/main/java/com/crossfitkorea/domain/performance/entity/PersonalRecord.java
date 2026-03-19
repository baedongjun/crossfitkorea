package com.crossfitkorea.domain.performance.entity;

import com.crossfitkorea.common.BaseEntity;
import com.crossfitkorea.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "personal_records")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalRecord extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExerciseType exerciseType;

    @Column(nullable = false)
    private Double value;

    @Column(nullable = false)
    private String unit;

    @Column
    private String notes;

    @Column(nullable = false)
    private java.time.LocalDate recordedAt;

    public void update(Double value, String notes) {
        this.value = value;
        this.notes = notes;
    }
}
