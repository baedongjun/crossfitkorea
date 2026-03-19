package com.crossfitkorea.config;

import com.crossfitkorea.security.JwtAuthenticationFilter;
import com.crossfitkorea.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 인증 불필요
                .requestMatchers("/api/v1/auth/**").permitAll()
                // 박스 공지 - 인증 필요 (멤버/오너만 조회 가능)
                .requestMatchers(HttpMethod.GET, "/api/v1/boxes/*/notices").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/v1/boxes/*/notices/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/v1/boxes/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/wod/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/competitions/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/community/posts/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/coaches/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/schedules/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/badges/users/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/users/search").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/users/*/profile").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/users/*/posts").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/users/*/followers").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/users/*/following").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/users/*/follow/counts").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/wod/records/box-ranking").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/stats").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/advertisements").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/challenges").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/challenges/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/competitions/*/results").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/boxes/*/announcements").permitAll()
                // Swagger
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                // Actuator
                .requestMatchers("/actuator/health").permitAll()
                // 파일 업로드 (로그인 필요)
                .requestMatchers("/api/v1/upload/**").authenticated()
                // 어드민 전용
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                // 나머지 인증 필요
                .anyRequest().authenticated()
            )
            .addFilterBefore(
                new JwtAuthenticationFilter(jwtTokenProvider),
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:3000",
            "https://crossfitkorea.com",
            "https://www.crossfitkorea.com"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
