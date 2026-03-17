package com.ritma.runners.admin.pendingapproval.service;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.ritma.runners.admin.pendingapproval.dto.PendingApprovalResponse;
import com.ritma.runners.auth.entity.AppUser;
import com.ritma.runners.auth.repository.AppUserRepository;
import com.ritma.runners.mail.service.AccountMailService;

@Service
public class PendingApprovalAdminService {

    private static final String ACCOUNT_PENDING = "PENDING";
    private static final String ACCOUNT_ACTIVE = "ACTIVE";
    private static final String TEMPORARY_PASSWORD_CHARSET =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    private static final int TEMPORARY_PASSWORD_LENGTH = 12;

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccountMailService accountMailService;
    private final SecureRandom secureRandom = new SecureRandom();

    public PendingApprovalAdminService(AppUserRepository appUserRepository,
                                       PasswordEncoder passwordEncoder,
                                       AccountMailService accountMailService) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.accountMailService = accountMailService;
    }

    public List<PendingApprovalResponse> listPendingApprovals() {
        return appUserRepository.findPendingApprovals();
    }

    @Transactional
    public void approvePendingApproval(UUID userId) {
        AppUser user = validatePendingAccount(userId);
        String temporaryPassword = generateTemporaryPassword();

        accountMailService.sendTemporaryPassword(user.email(), temporaryPassword);
        appUserRepository.updatePasswordAndStatus(
                user.id(),
                passwordEncoder.encode(temporaryPassword),
                true,
                ACCOUNT_ACTIVE
        );
    }

    @Transactional
    public void rejectPendingApproval(UUID userId) {
        validatePendingAccount(userId);
        appUserRepository.deleteUser(userId);
    }

    private AppUser validatePendingAccount(UUID userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account request not found"));

        if (!ACCOUNT_PENDING.equals(user.accountStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Account request is no longer pending");
        }

        return user;
    }

    private String generateTemporaryPassword() {
        StringBuilder builder = new StringBuilder(TEMPORARY_PASSWORD_LENGTH);
        for (int i = 0; i < TEMPORARY_PASSWORD_LENGTH; i++) {
            int index = secureRandom.nextInt(TEMPORARY_PASSWORD_CHARSET.length());
            builder.append(TEMPORARY_PASSWORD_CHARSET.charAt(index));
        }
        return builder.toString();
    }
}
