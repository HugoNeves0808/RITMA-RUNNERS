package com.ritma.runners.race.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.IntStream;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.ritma.runners.race.dto.DeleteRacesRequest;
import com.ritma.runners.race.dto.RaceCalendarDayResponse;
import com.ritma.runners.race.dto.RaceCalendarItemResponse;
import com.ritma.runners.race.dto.RaceCalendarMonthResponse;
import com.ritma.runners.race.dto.RaceTableItemResponse;
import com.ritma.runners.race.dto.RaceTableResponse;
import com.ritma.runners.race.dto.RaceTableYearResponse;
import com.ritma.runners.race.dto.RaceTypeOptionResponse;
import com.ritma.runners.race.dto.RaceCalendarYearMonthResponse;
import com.ritma.runners.race.dto.RaceCalendarYearResponse;
import com.ritma.runners.race.dto.UpdateRaceTableItemRequest;
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

    public RaceTableResponse getTableRaces(UUID userId) {
        List<RaceTableYearResponse> years = raceRepository.findTableRaces(userId).stream()
                .collect(Collectors.groupingBy(
                        race -> race.raceDate().getYear(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<Integer, List<RaceTableItemResponse>>comparingByKey(Comparator.reverseOrder()))
                .map(entry -> new RaceTableYearResponse(entry.getKey(), entry.getValue()))
                .toList();

        return new RaceTableResponse(years);
    }

    public List<RaceTypeOptionResponse> getRaceTypes(UUID userId) {
        return raceRepository.findRaceTypes(userId);
    }

    @Transactional
    public RaceTableItemResponse updateTableRace(UUID userId, UUID raceId, UpdateRaceTableItemRequest request) {
        validateUpdateRequest(request);

        if (!raceRepository.raceExists(userId, raceId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found.");
        }

        if (request.raceTypeId() != null && !raceRepository.raceTypeExists(userId, request.raceTypeId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid race type.");
        }

        raceRepository.updateRace(
                userId,
                raceId,
                request.raceDate(),
                request.name().trim(),
                request.location() != null ? request.location().trim() : null,
                request.raceTypeId()
        );
        raceRepository.upsertRaceResult(
                raceId,
                request.officialTimeSeconds(),
                request.chipTimeSeconds(),
                request.pacePerKmSeconds()
        );

        return raceRepository.findTableRaces(userId).stream()
                .filter(race -> race.id().equals(raceId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found."));
    }

    @Transactional
    public void deleteRaces(UUID userId, DeleteRacesRequest request) {
        List<UUID> raceIds = request == null || request.raceIds() == null
                ? List.of()
                : request.raceIds().stream().filter(Objects::nonNull).distinct().toList();

        if (raceIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one race.");
        }

        int existingCount = raceRepository.countExistingRaces(userId, raceIds);
        if (existingCount != raceIds.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "One or more races could not be found.");
        }

        raceRepository.deleteRaces(userId, raceIds);
    }

    private void validateUpdateRequest(UpdateRaceTableItemRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race data is required.");
        }

        LocalDate raceDate = request.raceDate();
        if (raceDate == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race date is required.");
        }

        if (request.name() == null || request.name().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race name is required.");
        }

        if (request.location() != null && request.location().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location cannot be blank.");
        }

        if (request.officialTimeSeconds() != null && request.officialTimeSeconds() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Official time must be zero or greater.");
        }

        if (request.chipTimeSeconds() != null && request.chipTimeSeconds() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chip time must be zero or greater.");
        }

        if (request.pacePerKmSeconds() != null && request.pacePerKmSeconds() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pace per km must be zero or greater.");
        }
    }
}
