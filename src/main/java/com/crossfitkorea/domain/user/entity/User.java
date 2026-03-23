package com.crossfitkorea.domain.user.entity;

import com.crossfitkorea.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    private String password; // OAuth2 사용자는 null

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20) default 'LOCAL'")
    @Builder.Default
    private AuthProvider provider = AuthProvider.LOCAL;

    private String providerId;

    @Column(nullable = false)
    private String name;

    private String phone;

    private String profileImageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserRole role = UserRole.ROLE_USER;

    @Builder.Default
    private boolean active = true;
}
