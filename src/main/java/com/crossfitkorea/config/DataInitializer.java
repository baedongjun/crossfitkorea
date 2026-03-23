package com.crossfitkorea.config;

import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.entity.UserRole;
import com.crossfitkorea.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@Profile("!test")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        // OAuth2 소셜 로그인 지원: password 컬럼 nullable 마이그레이션
        try {
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN password DROP NOT NULL");
            log.info("✅ users.password column: NOT NULL constraint removed");
        } catch (Exception e) {
            // 이미 nullable이거나 컬럼 없으면 무시
        }
        String adminEmail = "admin@crossfitkorea.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                .email(adminEmail)
                .password(passwordEncoder.encode("Admin1234!"))
                .name("관리자")
                .role(UserRole.ROLE_ADMIN)
                .build();
            userRepository.save(admin);
            log.info("✅ Admin account created: {}", adminEmail);
        }
    }
}
