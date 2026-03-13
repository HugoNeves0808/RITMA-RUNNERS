package com.ritma.runners.mail.service;

import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.ritma.runners.mail.config.MailProperties;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Service
public class AccountMailService {

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;

    public AccountMailService(JavaMailSender mailSender, MailProperties mailProperties) {
        this.mailSender = mailSender;
        this.mailProperties = mailProperties;
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

    private String buildTemporaryPasswordMail(String email, String temporaryPassword) {
        return """
                Hello,

                Your RITMA account has been approved.

                Email: %s
                Temporary password: %s

                Please sign in and change your password as soon as possible.

                RITMA RUNNERS
                """.formatted(email, temporaryPassword);
    }
}
