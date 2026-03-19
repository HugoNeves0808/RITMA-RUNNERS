package com.ritma.runners.race.service;

import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.IntStream;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.ritma.runners.race.dto.RaceCalendarDayResponse;
import com.ritma.runners.race.dto.RaceCalendarItemResponse;
import com.ritma.runners.race.dto.RaceCalendarMonthResponse;
import com.ritma.runners.race.dto.RaceCalendarYearMonthResponse;
import com.ritma.runners.race.dto.RaceCalendarYearResponse;
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

    public RaceCalendarYearResponse getYearlyCalendar(UUID userId, int year) {
        List<RaceCalendarItemResponse> races = raceRepository.findCalendarRacesForRange(
                userId,
                java.time.LocalDate.of(year, 1, 1),
                java.time.LocalDate.of(year, 12, 31)
        );

        Map<Integer, Map<java.time.LocalDate, List<RaceCalendarItemResponse>>> racesByMonthAndDay = races.stream()
                .collect(Collectors.groupingBy(
                        race -> race.raceDate().getMonthValue(),
                        LinkedHashMap::new,
                        Collectors.groupingBy(
                                RaceCalendarItemResponse::raceDate,
                                LinkedHashMap::new,
                                Collectors.toList()
                        )
                ));

        List<RaceCalendarYearMonthResponse> months = IntStream.rangeClosed(1, 12)
                .mapToObj(monthValue -> {
                    Map<java.time.LocalDate, List<RaceCalendarItemResponse>> monthDays = racesByMonthAndDay
                            .getOrDefault(monthValue, java.util.Map.of());

                    List<RaceCalendarDayResponse> days = monthDays.entrySet().stream()
                            .map(entry -> new RaceCalendarDayResponse(entry.getKey(), entry.getValue()))
                            .toList();

                    return new RaceCalendarYearMonthResponse(monthValue, days);
                })
                .toList();

        return new RaceCalendarYearResponse(year, months);
    }
}
