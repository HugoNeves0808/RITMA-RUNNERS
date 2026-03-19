package com.ritma.runners.race.service;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.ritma.runners.race.dto.RaceCalendarDayResponse;
import com.ritma.runners.race.dto.RaceCalendarItemResponse;
import com.ritma.runners.race.dto.RaceCalendarMonthResponse;
import com.ritma.runners.race.repository.RaceRepository;

@Service
public class RaceService {

    private final RaceRepository raceRepository;

    public RaceService(RaceRepository raceRepository) {
        this.raceRepository = raceRepository;
    }

    public RaceCalendarMonthResponse getMonthlyCalendar(UUID userId, YearMonth month) {
        List<RaceCalendarItemResponse> races = raceRepository.findCalendarRacesForMonth(
                userId,
                month.atDay(1),
                month.atEndOfMonth()
        );

        Map<java.time.LocalDate, List<RaceCalendarItemResponse>> racesByDay = races.stream()
                .collect(Collectors.groupingBy(
                        RaceCalendarItemResponse::raceDate,
                        java.util.LinkedHashMap::new,
                        Collectors.toList()
                ));

        List<RaceCalendarDayResponse> days = racesByDay.entrySet().stream()
                .map(entry -> new RaceCalendarDayResponse(entry.getKey(), entry.getValue()))
                .toList();

        return new RaceCalendarMonthResponse(month.getYear(), month.getMonthValue(), days);
    }
}
