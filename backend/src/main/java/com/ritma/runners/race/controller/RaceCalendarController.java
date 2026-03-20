package com.ritma.runners.race.controller;

import java.time.YearMonth;
import java.time.Year;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.ritma.runners.common.util.SecurityUtils;
import com.ritma.runners.race.dto.RaceCalendarMonthResponse;
import com.ritma.runners.race.dto.RaceCalendarYearResponse;
import com.ritma.runners.race.dto.RaceQueryFilters;
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
                                                        @RequestParam(required = false) Integer month,
                                                        @RequestParam(required = false) String search,
                                                        @RequestParam(required = false) List<String> statuses,
                                                        @RequestParam(required = false) List<Integer> years,
                                                        @RequestParam(required = false) List<UUID> raceTypeIds) {
        YearMonth selectedMonth = resolveYearMonth(year, month);
        RaceQueryFilters filters = raceService.normalizeFilters(search, statuses, years, raceTypeIds);
        return raceService.getMonthlyCalendar(requireAuthenticatedUserId(), selectedMonth, filters);
    }

    @GetMapping("/yearly")
    public RaceCalendarYearResponse getYearlyCalendar(@RequestParam(required = false) Integer year,
                                                      @RequestParam(required = false) String search,
                                                      @RequestParam(required = false) List<String> statuses,
                                                      @RequestParam(required = false) List<Integer> years,
                                                      @RequestParam(required = false) List<UUID> raceTypeIds) {
        RaceQueryFilters filters = raceService.normalizeFilters(search, statuses, years, raceTypeIds);
        return raceService.getYearlyCalendar(requireAuthenticatedUserId(), resolveYear(year), filters);
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

    private int resolveYear(Integer year) {
        int resolvedYear = year != null ? year : Year.now().getValue();
        try {
            return Year.of(resolvedYear).getValue();
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid year.");
        }
    }

    private java.util.UUID requireAuthenticatedUserId() {
        return SecurityUtils.currentUser()
                .map(com.ritma.runners.auth.dto.JwtAuthenticatedUser::id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required."));
    }
}
