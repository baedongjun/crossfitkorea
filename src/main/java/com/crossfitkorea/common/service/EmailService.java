package com.crossfitkorea.common.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@crossfitkorea.com}")
    private String fromEmail;

    @Value("${app.frontend-url:https://crossfitkorea.com}")
    private String frontendUrl;

    @Async
    public void sendPasswordResetEmail(String to, String tempPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("[CrossFit Korea] 임시 비밀번호 발급");
            helper.setText(buildPasswordResetHtml(tempPassword), true);
            mailSender.send(message);
            log.info("Password reset email sent to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send password reset email to: {}", to, e);
        }
    }

    @Async
    public void sendWelcomeEmail(String to, String name) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("[CrossFit Korea] 가입을 환영합니다!");
            helper.setText(buildWelcomeHtml(name), true);
            mailSender.send(message);
            log.info("Welcome email sent to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send welcome email to: {}", to, e);
        }
    }

    @Async
    public void sendCompetitionRegistrationEmail(String to, String name, String competitionName, String date) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("[CrossFit Korea] 대회 신청 완료 - " + competitionName);
            helper.setText(buildCompetitionRegistrationHtml(name, competitionName, date), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Failed to send competition registration email", e);
        }
    }

    private String buildPasswordResetHtml(String tempPassword) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: 'Noto Sans KR', sans-serif; background: #f5f5f5; padding: 40px 0;">
              <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #f5f0e8;">
                <div style="background: #e8220a; padding: 20px 32px;">
                  <h1 style="font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: #f5f0e8; margin: 0;">
                    CROSSFIT KOREA
                  </h1>
                </div>
                <div style="padding: 32px;">
                  <h2 style="font-size: 20px; margin-bottom: 16px;">임시 비밀번호 발급</h2>
                  <p style="color: #aaa; margin-bottom: 24px;">아래의 임시 비밀번호로 로그인 후 반드시 비밀번호를 변경해주세요.</p>
                  <div style="background: #2a2a2a; border-left: 4px solid #e8220a; padding: 16px 24px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin-bottom: 24px;">
                    %s
                  </div>
                  <a href="%s/login" style="display: inline-block; background: #e8220a; color: #f5f0e8; padding: 12px 28px; text-decoration: none; font-weight: bold;">
                    로그인하기
                  </a>
                </div>
                <div style="padding: 16px 32px; color: #666; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.08);">
                  © 2026 CrossFit Korea. All rights reserved.
                </div>
              </div>
            </body>
            </html>
            """.formatted(tempPassword, frontendUrl);
    }

    private String buildWelcomeHtml(String name) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: 'Noto Sans KR', sans-serif; background: #f5f5f5; padding: 40px 0;">
              <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #f5f0e8;">
                <div style="background: #e8220a; padding: 20px 32px;">
                  <h1 style="font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: #f5f0e8; margin: 0;">
                    CROSSFIT KOREA
                  </h1>
                </div>
                <div style="padding: 32px;">
                  <h2 style="font-size: 20px; margin-bottom: 16px;">%s님, 환영합니다!</h2>
                  <p style="color: #aaa; line-height: 1.8;">
                    CrossFit Korea에 가입해 주셔서 감사합니다.<br>
                    전국 크로스핏 박스를 찾고, WOD 기록을 관리하고, 대회에 참가해보세요!
                  </p>
                  <a href="%s" style="display: inline-block; background: #e8220a; color: #f5f0e8; padding: 12px 28px; text-decoration: none; font-weight: bold; margin-top: 24px;">
                    시작하기
                  </a>
                </div>
                <div style="padding: 16px 32px; color: #666; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.08);">
                  © 2026 CrossFit Korea. All rights reserved.
                </div>
              </div>
            </body>
            </html>
            """.formatted(name, frontendUrl);
    }

    private String buildCompetitionRegistrationHtml(String name, String competitionName, String date) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: 'Noto Sans KR', sans-serif; background: #f5f5f5; padding: 40px 0;">
              <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #f5f0e8;">
                <div style="background: #e8220a; padding: 20px 32px;">
                  <h1 style="font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: #f5f0e8; margin: 0;">
                    CROSSFIT KOREA
                  </h1>
                </div>
                <div style="padding: 32px;">
                  <h2 style="font-size: 20px; margin-bottom: 16px;">대회 신청 완료</h2>
                  <p style="color: #aaa; margin-bottom: 16px;">%s님의 대회 신청이 완료되었습니다.</p>
                  <div style="background: #2a2a2a; padding: 16px 24px; margin-bottom: 24px;">
                    <p style="margin: 0 0 8px; font-weight: bold;">%s</p>
                    <p style="margin: 0; color: #aaa;">%s</p>
                  </div>
                  <a href="%s/competitions" style="display: inline-block; background: #e8220a; color: #f5f0e8; padding: 12px 28px; text-decoration: none; font-weight: bold;">
                    대회 상세 보기
                  </a>
                </div>
                <div style="padding: 16px 32px; color: #666; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.08);">
                  © 2026 CrossFit Korea. All rights reserved.
                </div>
              </div>
            </body>
            </html>
            """.formatted(name, competitionName, date, frontendUrl);
    }
}
