package com.crossfitkorea.domain.user.service;

import com.crossfitkorea.common.exception.BusinessException;
import com.crossfitkorea.common.exception.ErrorCode;
import com.crossfitkorea.common.service.EmailService;
import com.crossfitkorea.domain.user.dto.AuthResponse;
import com.crossfitkorea.domain.user.dto.LoginRequest;
import com.crossfitkorea.domain.user.dto.SignupRequest;
import com.crossfitkorea.domain.user.dto.UserDto;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.entity.UserRole;
import com.crossfitkorea.domain.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.crossfitkorea.domain.user.entity.AuthProvider;
import com.crossfitkorea.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        UserRole role = Boolean.TRUE.equals(request.getBoxOwner())
            ? UserRole.ROLE_BOX_OWNER
            : UserRole.ROLE_USER;

        User user = User.builder()
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .name(request.getName())
            .phone(request.getPhone())
            .role(role)
            .build();

        userRepository.save(user);

        emailService.sendWelcomeEmail(user.getEmail(), user.getName());

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD);
        }

        if (!user.isActive()) {
            throw new BusinessException(ErrorCode.USER_DEACTIVATED);
        }

        return buildAuthResponse(user);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    public UserDto getMyInfo(String email) {
        return UserDto.from(getUserByEmail(email));
    }

    public Page<UserDto> searchUsers(String keyword, Pageable pageable) {
        return userRepository.searchUsers(keyword, pageable)
            .map(u -> UserDto.builder()
                .id(u.getId())
                .name(u.getName())
                .profileImageUrl(u.getProfileImageUrl())
                .role(u.getRole().name())
                .build());
    }

    @Transactional
    public UserDto updateMyInfo(String email,
            com.crossfitkorea.domain.user.dto.UserUpdateRequest request) {
        User user = getUserByEmail(email);
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl());
        }
        return UserDto.from(user);
    }

    @Transactional
    public void changePassword(String email, com.crossfitkorea.domain.user.dto.PasswordChangeRequest request) {
        User user = getUserByEmail(email);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_PASSWORD);
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
    }

    @Transactional
    public void deleteMyAccount(String email) {
        User user = getUserByEmail(email);
        user.setActive(false);
        // 탈퇴 처리: 이메일을 고유값으로 유지하면서 개인정보 최소화
        user.setName("탈퇴한 회원");
        user.setPhone(null);
        user.setProfileImageUrl(null);
    }

    @Transactional
    public void resetPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        String tempPassword = generateTempPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));
        emailService.sendPasswordResetEmail(email, tempPassword);
    }

    private String generateTempPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        StringBuilder sb = new StringBuilder();
        java.util.Random random = new java.util.Random();
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        String email = jwtTokenProvider.getEmail(refreshToken);
        User user = getUserByEmail(email);
        if (!user.isActive()) {
            throw new BusinessException(ErrorCode.USER_DEACTIVATED);
        }
        String newAccessToken = jwtTokenProvider.createAccessToken(user.getEmail(), user.getRole().name());
        String newRefreshToken = jwtTokenProvider.createRefreshToken(user.getEmail());
        return new AuthResponse(newAccessToken, newRefreshToken, user.getEmail(), user.getName(), user.getRole().name());
    }

    @Transactional
    public AuthResponse registerOAuth2User(String tempToken, String requestedName) {
        Claims claims;
        try {
            claims = jwtTokenProvider.parseOAuth2TempToken(tempToken);
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
        }

        String provider = claims.get("provider", String.class);
        String providerId = claims.get("providerId", String.class);
        String name = (requestedName != null && !requestedName.isBlank())
            ? requestedName.trim()
            : claims.get("name", String.class);
        String email = claims.get("email", String.class);
        String imageUrl = claims.get("imageUrl", String.class);

        // 이미 가입된 경우 바로 로그인
        AuthProvider authProvider = AuthProvider.valueOf(provider);
        var existing = userRepository.findByProviderAndProviderId(authProvider, providerId);
        if (existing.isPresent()) {
            return buildAuthResponse(existing.get());
        }

        if (email != null && !email.isBlank()) {
            var byEmail = userRepository.findByEmail(email);
            if (byEmail.isPresent()) {
                User user = byEmail.get();
                user.setProvider(authProvider);
                user.setProviderId(providerId);
                userRepository.save(user);
                return buildAuthResponse(user);
            }
        }

        String finalEmail = (email != null && !email.isBlank())
            ? email
            : provider.toLowerCase() + "_" + providerId + "@oauth.crossfitkorea.com";

        if (userRepository.existsByEmail(finalEmail)) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        if (name == null || name.isBlank()) name = "회원";

        User user = User.builder()
            .email(finalEmail)
            .password(null)
            .name(name)
            .profileImageUrl(imageUrl != null && !imageUrl.isBlank() ? imageUrl : null)
            .provider(authProvider)
            .providerId(providerId)
            .role(UserRole.ROLE_USER)
            .active(true)
            .build();

        userRepository.save(user);
        emailService.sendWelcomeEmail(user.getEmail(), user.getName());
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtTokenProvider.createAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getEmail());
        return new AuthResponse(accessToken, refreshToken, user.getEmail(), user.getName(), user.getRole().name());
    }
}
