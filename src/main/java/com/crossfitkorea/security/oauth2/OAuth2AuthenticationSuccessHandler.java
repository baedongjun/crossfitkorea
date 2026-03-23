package com.crossfitkorea.security.oauth2;

import com.crossfitkorea.domain.user.entity.AuthProvider;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.repository.UserRepository;
import com.crossfitkorea.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Value("${app.frontend-url:https://crossfitkorea.com}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String registrationId = resolveRegistrationId(request);

        OAuth2UserInfo userInfo = resolveUserInfo(oAuth2User, registrationId);
        if (userInfo == null) {
            getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/login?error=oauth2");
            return;
        }

        AuthProvider provider = AuthProvider.valueOf(registrationId.toUpperCase());
        Optional<User> userOpt = userRepository.findByProviderAndProviderId(provider, userInfo.getId());
        if (userOpt.isEmpty() && userInfo.getEmail() != null) {
            userOpt = userRepository.findByEmail(userInfo.getEmail());
        }

        if (userOpt.isPresent()) {
            // 기존 회원 → JWT 발급 후 로그인
            User user = userOpt.get();
            if (!user.isActive()) {
                getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/login?error=inactive");
                return;
            }
            String accessToken = jwtTokenProvider.createAccessToken(user.getEmail(), user.getRole().name());
            String refreshToken = jwtTokenProvider.createRefreshToken(user.getEmail());
            String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/callback")
                .queryParam("accessToken", accessToken)
                .queryParam("refreshToken", refreshToken)
                .build().toUriString();
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
        } else {
            // 신규 회원 → 임시 토큰 발급 후 회원가입 페이지로
            String tempToken = jwtTokenProvider.createOAuth2TempToken(
                registrationId.toUpperCase(),
                userInfo.getId(),
                userInfo.getName(),
                userInfo.getEmail(),
                userInfo.getImageUrl()
            );
            String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/oauth2/register")
                .queryParam("token", tempToken)
                .build().toUriString();
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
        }
    }

    private String resolveRegistrationId(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri.contains("kakao")) return "kakao";
        if (uri.contains("google")) return "google";
        return "";
    }

    private OAuth2UserInfo resolveUserInfo(OAuth2User oAuth2User, String registrationId) {
        return switch (registrationId.toLowerCase()) {
            case "kakao" -> new KakaoOAuth2UserInfo(oAuth2User.getAttributes());
            case "google" -> new GoogleOAuth2UserInfo(oAuth2User.getAttributes());
            default -> null;
        };
    }
}
