package com.ritma.runners.mail.service;

import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.ritma.runners.mail.config.MailProperties;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class AccountMailService {

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;
    private final String smtpUsername;

    public AccountMailService(JavaMailSender mailSender,
                              MailProperties mailProperties,
                              @Value("${spring.mail.username:}") String smtpUsername) {
        this.mailSender = mailSender;
        this.mailProperties = mailProperties;
        this.smtpUsername = smtpUsername;
    }

    public void sendTemporaryPassword(String email, String temporaryPassword) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setTo(email);
            helper.setFrom(mailProperties.getFrom());
            helper.setSubject("RITMA account access");
            helper.setText(buildTemporaryPasswordMail(email, temporaryPassword), false);
            mailSender.send(message);
        } catch (MessagingException | MailException exception) {
            throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Unable to send account email");
        }
    }

    public void sendAccountRequestNotification(String userEmail) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setTo(resolveNotificationRecipient());
            helper.setFrom(mailProperties.getFrom());
            helper.setSubject("RITMA ACCOUNT REQUEST - " + userEmail);
            helper.setText(buildAccountRequestNotificationMail(userEmail), false);
            mailSender.send(message);
        } catch (MessagingException | MailException exception) {
            throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Unable to send account email");
        }
    }

    private String buildTemporaryPasswordMail(String email, String temporaryPassword) {
        return """
                Hello %s,

                Your RITMA account has been approved.

                Temporary password: %s

                Please sign in and change your password as soon as possible.

                RITMA RUNNERS \u00AE
                """.formatted(email, temporaryPassword);
    }

    private String buildAccountRequestNotificationMail(String userEmail) {
        return """
                Hello,

                A new user has registered on RITMA RUNNERS and is awaiting approval.

                User email: %s

                Please review and approve this account in the administration area.

                RITMA RUNNERS \u00AE
                """.formatted(userEmail);
    }

    private String resolveNotificationRecipient() {
        String configuredRecipient = mailProperties.getNotificationTo();
        if (configuredRecipient != null && !configuredRecipient.isBlank()) {
            return configuredRecipient;
        }

        if (smtpUsername != null && !smtpUsername.isBlank()) {
            return smtpUsername;
        }

        throw new ResponseStatusException(SERVICE_UNAVAILABLE, "Notification email recipient is not configured");
    }
}
