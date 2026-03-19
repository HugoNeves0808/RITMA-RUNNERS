package com.ritma.runners.race.controller;

import java.time.YearMonth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.ritma.runners.common.util.SecurityUtils;
import com.ritma.runners.race.dto.RaceCalendarMonthResponse;
import com.ritma.runners.race.service.RaceService;

@RestController
@RequestMapping("/api/races/calendar")
@CrossOrigin(origins = "http://localhost:5173")
public class RaceCalendarController {

    private final RaceService raceService;

    public RaceCalendarController(RaceService raceService) {
        this.raceService = raceService;
    }

    @GetMapping
    public RaceCalendarMonthResponse getMonthlyCalendar(@RequestParam(required = false) Integer year,
                                                        @RequestParam(required = false) Integer month) {
        YearMonth selectedMonth = resolveYearMonth(year, month);
        return raceService.getMonthlyCalendar(requireAuthenticatedUserId(), selectedMonth);
    }

    private YearMonth resolveYearMonth(Integer year, Integer month) {
        YearMonth currentMonth = YearMonth.now();
        int resolvedYear = year != null ? year : currentMonth.getYear();
        int resolvedMonth = month != null ? month : currentMonth.getMonthValue();
        try {
            return YearMonth.of(resolvedYear, resolvedMonth);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid year or month.");
        }
    }

    private java.util.UUID requireAuthenticatedUserId() {
        return SecurityUtils.currentUser()
                .map(com.ritma.runners.auth.dto.JwtAuthenticatedUser::id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required."));
    }
}
