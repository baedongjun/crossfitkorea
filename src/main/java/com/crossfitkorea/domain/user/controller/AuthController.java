package com.crossfitkorea.domain.user.controller;

import com.crossfitkorea.common.ApiResponse;
import com.crossfitkorea.domain.user.dto.AuthResponse;
import com.crossfitkorea.domain.user.dto.LoginRequest;
import com.crossfitkorea.domain.user.dto.SignupRequest;
import com.crossfitkorea.domain.user.service.UserService;
import io.jsonwebtoken.Claims;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "인증 API")
public class AuthController {

    private final UserService userService;
    private final com.crossfitkorea.security.JwtTokenProvider jwtTokenProvider;

    @Operation(summary = "회원가입")
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<AuthResponse>> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.ok(ApiResponse.success(userService.signup(request)));
    }

    @Operation(summary = "로그인")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(userService.login(request)));
    }

    @Operation(summary = "비밀번호 찾기 (임시 비밀번호 발급)")
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@RequestBody java.util.Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            throw new com.crossfitkorea.common.exception.BusinessException(
                    com.crossfitkorea.common.exception.ErrorCode.INVALID_INPUT_VALUE);
        }
        userService.resetPassword(email);
        return ResponseEntity.ok(ApiResponse.success("임시 비밀번호가 이메일로 발송되었습니다. 이메일을 확인해주세요."));
    }

    @Operation(summary = "OAuth2 신규 회원가입 정보 조회 (임시 토큰으로 미리 채우기)")
    @GetMapping("/oauth2/register-info")
    public ResponseEntity<ApiResponse<Map<String, String>>> getOAuth2RegisterInfo(@RequestParam String token) {
        try {
            Claims claims = jwtTokenProvider.parseOAuth2TempToken(token);
            Map<String, String> info = Map.of(
                "provider", claims.get("provider", String.class),
                "name", claims.get("name", String.class),
                "email", claims.get("email", String.class),
                "imageUrl", claims.get("imageUrl", String.class)
            );
            return ResponseEntity.ok(ApiResponse.success(info));
        } catch (Exception e) {
            throw new com.crossfitkorea.common.exception.BusinessException(
                com.crossfitkorea.common.exception.ErrorCode.INVALID_INPUT_VALUE);
        }
    }

    @Operation(summary = "OAuth2 신규 회원가입")
    @PostMapping("/oauth2/register")
    public ResponseEntity<ApiResponse<AuthResponse>> registerOAuth2User(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String name = body.get("name");
        if (token == null || token.isBlank()) {
            throw new com.crossfitkorea.common.exception.BusinessException(
                com.crossfitkorea.common.exception.ErrorCode.INVALID_INPUT_VALUE);
        }
        return ResponseEntity.ok(ApiResponse.success(userService.registerOAuth2User(token, name)));
    }

    @Operation(summary = "토큰 갱신 (Refresh Token)")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@RequestBody java.util.Map<String, String> body) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new com.crossfitkorea.common.exception.BusinessException(
                com.crossfitkorea.common.exception.ErrorCode.UNAUTHORIZED);
        }
        return ResponseEntity.ok(ApiResponse.success(userService.refreshToken(refreshToken)));
    }
}
