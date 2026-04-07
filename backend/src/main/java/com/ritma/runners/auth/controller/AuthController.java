package com.ritma.runners.auth.controller;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.ritma.runners.auth.dto.AuthResponse;
import com.ritma.runners.auth.dto.ChangePasswordRequest;
import com.ritma.runners.auth.dto.JwtAuthenticatedUser;
import com.ritma.runners.auth.dto.LoginRequest;
import com.ritma.runners.auth.dto.RequestAccountRequest;
import com.ritma.runners.auth.dto.RequestAccountResponse;
import com.ritma.runners.auth.dto.UserProfileResponse;
import com.ritma.runners.auth.service.AuthService;

@Validated
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request,
                              @RequestHeader(value = "X-Client-Platform", required = false) String clientPlatform) {
        return authService.login(request, clientPlatform);
    }

    @PostMapping("/request-account")
    public RequestAccountResponse requestAccount(@Valid @RequestBody RequestAccountRequest request) {
        return authService.requestAccount(request);
    }

    @GetMapping("/me")
    public UserProfileResponse me(@AuthenticationPrincipal JwtAuthenticatedUser user) {
        return authService.me(requireAuthenticatedUser(user));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@AuthenticationPrincipal JwtAuthenticatedUser user) {
        authService.logout(requireAuthenticatedUser(user));
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal JwtAuthenticatedUser user,
                               @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(requireAuthenticatedUser(user), request);
    }

    private JwtAuthenticatedUser requireAuthenticatedUser(JwtAuthenticatedUser user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
        }

        return user;
    }
}
