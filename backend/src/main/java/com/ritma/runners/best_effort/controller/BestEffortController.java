package com.ritma.runners.best_effort.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.ritma.runners.auth.dto.JwtAuthenticatedUser;
import com.ritma.runners.best_effort.dto.BestEffortResponse;
import com.ritma.runners.best_effort.service.BestEffortService;

@RestController
@RequestMapping("/api/best-efforts")
@CrossOrigin(origins = "http://localhost:5173")
public class BestEffortController {

    private final BestEffortService bestEffortService;

    public BestEffortController(BestEffortService bestEffortService) {
        this.bestEffortService = bestEffortService;
    }

    @GetMapping
    public BestEffortResponse getBestEfforts(@AuthenticationPrincipal JwtAuthenticatedUser user) {
        return bestEffortService.getBestEfforts(requireAuthenticatedUserId(user));
    }

    private UUID requireAuthenticatedUserId(JwtAuthenticatedUser user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
        }

        return user.id();
    }
}
