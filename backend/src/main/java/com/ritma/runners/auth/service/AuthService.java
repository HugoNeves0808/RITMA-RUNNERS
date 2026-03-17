package com.ritma.runners.auth.service;

import java.security.SecureRandom;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.ritma.runners.auth.dto.ChangePasswordRequest;
import com.ritma.runners.auth.dto.AuthResponse;
import com.ritma.runners.auth.dto.JwtAuthenticatedUser;
import com.ritma.runners.auth.dto.LoginRequest;
import com.ritma.runners.auth.dto.RequestAccountRequest;
import com.ritma.runners.auth.dto.RequestAccountResponse;
import com.ritma.runners.auth.dto.UserProfileResponse;
import com.ritma.runners.auth.entity.AppUser;
import com.ritma.runners.auth.repository.AppUserRepository;
import com.ritma.runners.mail.config.MailProperties;
import com.ritma.runners.mail.service.AccountMailService;
import com.ritma.runners.security.jwt.JwtService;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class AuthService {

    private static final String REQUEST_ACCOUNT_SUCCESS_MESSAGE =
            "Your request has been submitted. An admin must approve the account before sign-in.";
    private static final String ACCOUNT_EXISTS_MESSAGE =
            "An account with that email already exists.";
    private static final String ACCOUNT_PENDING_MESSAGE =
            "This account is still pending administrator approval. Please wait.";
    private static final String STRONG_PASSWORD_MESSAGE = "Choose a stronger password.";
    private static final String ACCOUNT_ACTIVE = "ACTIVE";
    private static final String ACCOUNT_PENDING = "PENDING";

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MailProperties mailProperties;
    private final AccountMailService accountMailService;

    public AuthService(AppUserRepository appUserRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       MailProperties mailProperties,
                       AccountMailService accountMailService) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mailProperties = mailProperties;
        this.accountMailService = accountMailService;
    }

    public AuthResponse login(LoginRequest request) {
        AppUser user = appUserRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!ACCOUNT_ACTIVE.equals(user.accountStatus())) {
            throw new ResponseStatusException(BAD_REQUEST, "Account setup is still pending.");
        }

        if (!passwordEncoder.matches(request.password(), user.passwordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        appUserRepository.updateLastLogin(user.id());

        String token = jwtService.generateToken(
                user.id(),
                user.email(),
                user.role(),
                Map.of("forcePasswordChange", user.forcePasswordChange())
        );

        return new AuthResponse(
                token,
                jwtService.getExpirationMinutes(),
                new UserProfileResponse(user.id(), user.email(), user.role(), user.forcePasswordChange())
        );
    }

    public UserProfileResponse me(JwtAuthenticatedUser user) {
        AppUser currentUser = appUserRepository.findById(user.id())
                .orElseThrow(() -> new BadCredentialsException("Invalid user"));

        if (!ACCOUNT_ACTIVE.equals(currentUser.accountStatus())) {
            throw new BadCredentialsException("Invalid user");
        }

        return new UserProfileResponse(
                currentUser.id(),
                currentUser.email(),
                currentUser.role(),
                currentUser.forcePasswordChange()
        );
    }

    @Transactional
    public RequestAccountResponse requestAccount(RequestAccountRequest request) {
        validateInviteDomain(request.email());

        AppUser existingUser = appUserRepository.findByEmail(request.email()).orElse(null);
        if (existingUser != null) {
            if (ACCOUNT_PENDING.equals(existingUser.accountStatus())) {
                throw new ResponseStatusException(BAD_REQUEST, ACCOUNT_PENDING_MESSAGE);
            }

            throw new ResponseStatusException(BAD_REQUEST, ACCOUNT_EXISTS_MESSAGE);
        }

        AppUser user = appUserRepository.createUser(
                request.email(),
                passwordEncoder.encode(generatePlaceholderPassword()),
                "USER",
                true,
                ACCOUNT_PENDING
        );
        appUserRepository.createDefaultUserSettings(user.id());
        accountMailService.sendAccountRequestNotification(user.email());

        return new RequestAccountResponse(REQUEST_ACCOUNT_SUCCESS_MESSAGE);
    }

    @Transactional
    public void changePassword(JwtAuthenticatedUser authenticatedUser, ChangePasswordRequest request) {
        AppUser user = appUserRepository.findById(authenticatedUser.id())
                .orElseThrow(() -> new BadCredentialsException("Invalid user"));

        if (!passwordEncoder.matches(request.currentPassword(), user.passwordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        if (!isStrongPassword(request.newPassword())) {
            throw new ResponseStatusException(BAD_REQUEST, STRONG_PASSWORD_MESSAGE);
        }

        String encodedPassword = passwordEncoder.encode(request.newPassword());
        appUserRepository.updatePassword(user.id(), encodedPassword, false);
    }

    private void validateInviteDomain(String email) {
        String allowedDomains = mailProperties.getInviteAllowedDomains();
        if (allowedDomains == null || allowedDomains.isBlank()) {
            return;
        }

        int atIndex = email.lastIndexOf('@');
        if (atIndex < 0 || atIndex == email.length() - 1) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid email domain");
        }

        String domain = email.substring(atIndex + 1).toLowerCase();
        Set<String> allowedDomainSet = Set.of(allowedDomains.split(","))
                .stream()
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        if (!allowedDomainSet.isEmpty() && !allowedDomainSet.contains(domain)) {
            throw new ResponseStatusException(BAD_REQUEST, "Email domain is not allowed");
        }
    }

    private String generatePlaceholderPassword() {
        return "PendingAccount#" + SecureRandomHolder.nextInt();
    }

    private boolean isStrongPassword(String password) {
        boolean hasLowercase = password.chars().anyMatch(Character::isLowerCase);
        boolean hasUppercase = password.chars().anyMatch(Character::isUpperCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = password.chars().anyMatch(character -> !Character.isLetterOrDigit(character));

        return password.length() >= 8 && hasLowercase && hasUppercase && hasDigit && hasSpecial;
    }

    private static final class SecureRandomHolder {
        private static final SecureRandom RANDOM = new SecureRandom();

        private static int nextInt() {
            return RANDOM.nextInt(1_000_000);
        }
    }
}
