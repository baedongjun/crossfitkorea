package com.crossfitkorea.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long expiration;
    private final long refreshExpiration;

    public JwtTokenProvider(
        @Value("${jwt.secret}") String secret,
        @Value("${jwt.expiration}") long expiration,
        @Value("${jwt.refresh-expiration}") long refreshExpiration
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
        this.refreshExpiration = refreshExpiration;
    }

    public String createAccessToken(String email, String role) {
        return Jwts.builder()
            .subject(email)
            .claim("role", role)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(secretKey)
            .compact();
    }

    // OAuth2 신규 회원가입용 임시 토큰 (5분)
    public String createOAuth2TempToken(String provider, String providerId, String name, String email, String imageUrl) {
        return Jwts.builder()
            .subject("oauth2_register")
            .claim("provider", provider)
            .claim("providerId", providerId)
            .claim("name", name != null ? name : "")
            .claim("email", email != null ? email : "")
            .claim("imageUrl", imageUrl != null ? imageUrl : "")
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + 5 * 60 * 1000)) // 5분
            .signWith(secretKey)
            .compact();
    }

    public Claims parseOAuth2TempToken(String token) {
        Claims claims = parseClaims(token);
        if (!"oauth2_register".equals(claims.getSubject())) {
            throw new JwtException("Invalid OAuth2 temp token");
        }
        return claims;
    }

    public String createRefreshToken(String email) {
        return Jwts.builder()
            .subject(email)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
            .signWith(secretKey)
            .compact();
    }

    public Authentication getAuthentication(String token) {
        Claims claims = parseClaims(token);
        String role = claims.get("role", String.class);
        return new UsernamePasswordAuthenticationToken(
            claims.getSubject(),
            "",
            List.of(new SimpleGrantedAuthority(role))
        );
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public String getEmail(String token) {
        return parseClaims(token).getSubject();
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
