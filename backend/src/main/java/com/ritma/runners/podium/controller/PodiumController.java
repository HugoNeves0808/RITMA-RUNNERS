package com.ritma.runners.podium.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.ritma.runners.auth.dto.JwtAuthenticatedUser;
import com.ritma.runners.podium.dto.PodiumHistoryResponse;
import com.ritma.runners.podium.service.PodiumService;

@RestController
@RequestMapping("/api/podiums")
public class PodiumController {

    private final PodiumService podiumService;

    public PodiumController(PodiumService podiumService) {
        this.podiumService = podiumService;
    }

    @GetMapping
    public PodiumHistoryResponse getPodiumHistory(@AuthenticationPrincipal JwtAuthenticatedUser user) {
        return podiumService.getPodiumHistory(requireAuthenticatedUserId(user));
    }

    private UUID requireAuthenticatedUserId(JwtAuthenticatedUser user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
        }

        return user.id();
    }
}
