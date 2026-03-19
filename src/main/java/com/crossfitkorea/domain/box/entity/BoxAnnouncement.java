package com.crossfitkorea.domain.box.entity;

import com.crossfitkorea.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "box_announcements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoxAnnouncement extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "box_id", nullable = false)
    private Box box;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Builder.Default
    private boolean pinned = false;

    @Builder.Default
    private boolean active = true;
}
