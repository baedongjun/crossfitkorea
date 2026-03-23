package com.crossfitkorea.security.oauth2;

import com.crossfitkorea.domain.user.entity.AuthProvider;
import com.crossfitkorea.domain.user.entity.User;
import com.crossfitkorea.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String userNameAttributeName = userRequest.getClientRegistration()
            .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        OAuth2UserInfo userInfo = switch (registrationId.toLowerCase()) {
            case "kakao" -> new KakaoOAuth2UserInfo(oAuth2User.getAttributes());
            case "google" -> new GoogleOAuth2UserInfo(oAuth2User.getAttributes());
            default -> throw new OAuth2AuthenticationException("지원하지 않는 OAuth2 공급자입니다: " + registrationId);
        };

        AuthProvider provider = AuthProvider.valueOf(registrationId.toUpperCase());
        updateExistingUser(userInfo, provider);

        return new DefaultOAuth2User(
            Collections.singleton(() -> "ROLE_USER"),
            oAuth2User.getAttributes(),
            userNameAttributeName
        );
    }

    // 기존 유저만 업데이트 (신규 유저 생성은 OAuth2AuthenticationSuccessHandler에서 처리)
    private void updateExistingUser(OAuth2UserInfo userInfo, AuthProvider provider) {
        Optional<User> existingByProvider = userRepository.findByProviderAndProviderId(provider, userInfo.getId());
        if (existingByProvider.isPresent()) {
            User user = existingByProvider.get();
            if (userInfo.getName() != null) user.setName(userInfo.getName());
            if (userInfo.getImageUrl() != null) user.setProfileImageUrl(userInfo.getImageUrl());
            userRepository.save(user);
            return;
        }

        // 같은 이메일로 기존 LOCAL 계정이 있으면 provider 연동
        String email = userInfo.getEmail();
        if (email != null) {
            userRepository.findByEmail(email).ifPresent(user -> {
                user.setProvider(provider);
                user.setProviderId(userInfo.getId());
                if (userInfo.getImageUrl() != null && user.getProfileImageUrl() == null) {
                    user.setProfileImageUrl(userInfo.getImageUrl());
                }
                userRepository.save(user);
            });
        }
    }
}
