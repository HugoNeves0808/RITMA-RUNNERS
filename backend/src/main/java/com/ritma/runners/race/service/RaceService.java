package com.ritma.runners.race.service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.IntStream;
import java.util.stream.Collectors;
import java.math.BigDecimal;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.ritma.runners.race.dto.CreateRaceRequest;
import com.ritma.runners.race.dto.CreateRaceResponse;
import com.ritma.runners.race.dto.ManageRaceOptionRequest;
import com.ritma.runners.race.dto.RaceCreateOptionsResponse;
import com.ritma.runners.race.dto.RaceCalendarDayResponse;
import com.ritma.runners.race.dto.RaceDetailResponse;
import com.ritma.runners.race.dto.RaceFilterOptionsResponse;
import com.ritma.runners.race.dto.RaceCalendarItemResponse;
import com.ritma.runners.race.dto.RaceCalendarMonthResponse;
import com.ritma.runners.race.dto.RaceOptionType;
import com.ritma.runners.race.dto.RaceOptionUsageResponse;
import com.ritma.runners.race.dto.RaceQueryFilters;
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
    private static final int MAX_RACE_NAME_LENGTH = 150;
    private static final int MAX_LOCATION_LENGTH = 150;
    private static final int MAX_OPTION_NAME_LENGTH = 100;
    private static final BigDecimal MAX_REAL_KM = new BigDecimal("999.99");
    private static final int MAX_ANALYSIS_RATING_LENGTH = 30;

    private static final Set<String> ALLOWED_RACE_STATUSES = Set.of(
            "IN_LIST",
            "REGISTERED",
            "NOT_REGISTERED",
            "COMPLETED",
            "CANCELLED",
            "DID_NOT_START",
            "DID_NOT_FINISH"
    );

    private final RaceRepository raceRepository;

    public RaceService(RaceRepository raceRepository) {
        this.raceRepository = raceRepository;
    }

    public RaceCalendarMonthResponse getMonthlyCalendar(UUID userId, YearMonth month, RaceQueryFilters filters) {
        List<RaceCalendarItemResponse> races = raceRepository.findCalendarRacesForMonth(
                userId,
                month.atDay(1),
                month.atEndOfMonth(),
                filters
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

    public RaceCalendarYearResponse getYearlyCalendar(UUID userId, int year, RaceQueryFilters filters) {
        List<RaceCalendarItemResponse> races = raceRepository.findCalendarRacesForRange(
                userId,
                java.time.LocalDate.of(year, 1, 1),
                java.time.LocalDate.of(year, 12, 31),
                filters
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

    public RaceTableResponse getTableRaces(UUID userId, RaceQueryFilters filters) {
        List<RaceTableItemResponse> races = raceRepository.findTableRaces(userId, filters);

        List<RaceTableYearResponse> years = races.stream()
                .filter(race -> race.raceDate() != null)
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

        List<RaceTableItemResponse> undatedRaces = races.stream()
                .filter(race -> race.raceDate() == null)
                .toList();

        return new RaceTableResponse(years, undatedRaces);
    }

    public List<RaceTypeOptionResponse> getRaceTypes(UUID userId) {
        return raceRepository.findRaceTypes(userId);
    }

    public RaceCreateOptionsResponse getCreateOptions(UUID userId) {
        return new RaceCreateOptionsResponse(
                raceRepository.findRaceTypes(userId),
                raceRepository.findTeams(userId),
                raceRepository.findCircuits(userId),
                raceRepository.findShoes(userId)
        );
    }

    public RaceDetailResponse getRaceDetail(UUID userId, UUID raceId) {
        RaceDetailResponse raceDetail = raceRepository.findRaceDetail(userId, raceId);
        if (raceDetail == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found.");
        }

        return raceDetail;
    }

    public RaceFilterOptionsResponse getFilterOptions(UUID userId) {
        return new RaceFilterOptionsResponse(
                raceRepository.findAvailableYears(userId),
                raceRepository.findRaceTypes(userId)
        );
    }

    public List<RaceTypeOptionResponse> getManagedOptions(UUID userId, RaceOptionType optionType) {
        return raceRepository.findManagedOptions(userId, optionType);
    }

    public RaceOptionUsageResponse getManagedOptionUsage(UUID userId, RaceOptionType optionType, UUID optionId) {
        if (!raceRepository.managedOptionExists(userId, optionType, optionId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, optionType.label() + " not found.");
        }

        var records = raceRepository.findManagedOptionUsage(userId, optionType, optionId);
        return new RaceOptionUsageResponse(optionType.pathValue(), records.size(), records);
    }

    @Transactional
    public RaceTypeOptionResponse createManagedOption(UUID userId, RaceOptionType optionType, ManageRaceOptionRequest request) {
        String normalizedName = validateManagedOptionRequest(optionType, request);

        try {
            UUID optionId = raceRepository.createManagedOption(userId, optionType, normalizedName);
            return new RaceTypeOptionResponse(optionId, normalizedName);
        } catch (DuplicateKeyException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    optionType.label() + " already exists."
            );
        }
    }

    @Transactional
    public RaceTypeOptionResponse updateManagedOption(UUID userId,
                                                      RaceOptionType optionType,
                                                      UUID optionId,
                                                      ManageRaceOptionRequest request) {
        String normalizedName = validateManagedOptionRequest(optionType, request);

        if (!raceRepository.managedOptionExists(userId, optionType, optionId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, optionType.label() + " not found.");
        }

        try {
            raceRepository.updateManagedOption(userId, optionType, optionId, normalizedName);
            return new RaceTypeOptionResponse(optionId, normalizedName);
        } catch (DuplicateKeyException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    optionType.label() + " already exists."
            );
        }
    }

    @Transactional
    public void deleteManagedOption(UUID userId, RaceOptionType optionType, UUID optionId) {
        if (!raceRepository.managedOptionExists(userId, optionType, optionId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, optionType.label() + " not found.");
        }

        int usageCount = raceRepository.countManagedOptionUsage(userId, optionType, optionId);
        if (usageCount > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    optionType.label() + " cannot be deleted because it is already being used."
            );
        }

        raceRepository.deleteManagedOption(userId, optionType, optionId);
    }

    @Transactional
    public void deleteRace(UUID userId, UUID raceId) {
        if (!raceRepository.raceExists(userId, raceId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found.");
        }

        raceRepository.deleteRace(userId, raceId);
    }

    @Transactional
    public void detachManagedOptionUsage(UUID userId, RaceOptionType optionType, UUID optionId) {
        if (!raceRepository.managedOptionExists(userId, optionType, optionId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, optionType.label() + " not found.");
        }

        raceRepository.detachManagedOptionUsage(userId, optionType, optionId);
    }

    @Transactional
    public CreateRaceResponse createRace(UUID userId, CreateRaceRequest request) {
        validateCreateRequest(request);

        CreateRaceRequest.RaceData raceData = request.race();
        if (raceData.raceTypeId() != null && !raceRepository.raceTypeExists(userId, raceData.raceTypeId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid race type.");
        }
        if (raceData.teamId() != null && !raceRepository.teamExists(userId, raceData.teamId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid team.");
        }
        if (raceData.circuitId() != null && !raceRepository.circuitExists(userId, raceData.circuitId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid circuit.");
        }
        if (request.results() != null && request.results().shoeId() != null && !raceRepository.shoeExists(userId, request.results().shoeId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid shoe.");
        }

        UUID raceId = raceRepository.createRace(
                userId,
                raceData.raceStatus().trim().toUpperCase(Locale.ROOT),
                raceData.raceDate(),
                raceData.raceTime(),
                raceData.name().trim(),
                normalizeOptionalText(raceData.location()),
                raceData.teamId(),
                raceData.circuitId(),
                raceData.raceTypeId(),
                raceData.realKm(),
                raceData.elevation(),
                raceData.isValidForCategoryRanking() == null || raceData.isValidForCategoryRanking()
        );

        if (hasRaceResults(request.results())) {
            CreateRaceRequest.RaceResultData results = request.results();
            raceRepository.upsertRaceResultDetails(
                    raceId,
                    results.officialTimeSeconds(),
                    results.chipTimeSeconds(),
                    results.pacePerKmSeconds(),
                    results.shoeId(),
                    results.generalClassification(),
                    results.isGeneralClassificationPodium(),
                    results.ageGroupClassification(),
                    results.isAgeGroupClassificationPodium(),
                    results.teamClassification(),
                    results.isTeamClassificationPodium()
            );
        }

        if (hasRaceAnalysis(request.analysis())) {
            CreateRaceRequest.RaceAnalysisData analysis = request.analysis();
            raceRepository.upsertRaceAnalysis(
                    raceId,
                    normalizeOptionalText(analysis.preRaceConfidence()),
                    normalizeOptionalText(analysis.raceDifficulty()),
                    normalizeOptionalText(analysis.finalSatisfaction()),
                    normalizeOptionalText(analysis.painInjuries()),
                    normalizeOptionalText(analysis.analysisNotes()),
                    analysis.wouldRepeatThisRace()
            );
        }

        return new CreateRaceResponse(raceId);
    }

    public RaceQueryFilters normalizeFilters(String search,
                                             List<String> statuses,
                                             List<Integer> years,
                                             List<UUID> raceTypeIds) {
        String normalizedSearch = search == null || search.trim().isEmpty() ? null : search.trim();

        List<String> normalizedStatuses = statuses == null
                ? List.of()
                : statuses.stream()
                        .filter(Objects::nonNull)
                        .map(value -> value.trim().toUpperCase(Locale.ROOT))
                        .filter(value -> !value.isEmpty())
                        .distinct()
                        .toList();

        if (normalizedStatuses.stream().anyMatch(status -> !ALLOWED_RACE_STATUSES.contains(status))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid race status filter.");
        }

        List<Integer> normalizedYears = years == null
                ? List.of()
                : years.stream()
                        .filter(Objects::nonNull)
                        .distinct()
                        .sorted(Comparator.reverseOrder())
                        .toList();

        List<UUID> normalizedRaceTypeIds = raceTypeIds == null
                ? List.of()
                : raceTypeIds.stream()
                        .filter(Objects::nonNull)
                        .distinct()
                        .toList();

        return new RaceQueryFilters(normalizedSearch, normalizedStatuses, normalizedYears, normalizedRaceTypeIds);
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

        return raceRepository.findTableRaces(userId, RaceQueryFilters.empty()).stream()
                .filter(race -> race.id().equals(raceId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Race not found."));
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

    private void validateCreateRequest(CreateRaceRequest request) {
        if (request == null || request.race() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race data is required.");
        }

        CreateRaceRequest.RaceData race = request.race();
        if (race.raceStatus() == null || race.raceStatus().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race status is required.");
        }

        String normalizedStatus = race.raceStatus().trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_RACE_STATUSES.contains(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid race status.");
        }

        if (!"IN_LIST".equals(normalizedStatus) && race.raceDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race date is required.");
        }

        if (race.name() == null || race.name().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race name is required.");
        }

        if (race.name().trim().length() > MAX_RACE_NAME_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Race name must have 150 characters or fewer.");
        }

        if (race.location() != null && race.location().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location cannot be blank.");
        }

        if (hasText(race.location()) && race.location().trim().length() > MAX_LOCATION_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location must have 150 characters or fewer.");
        }

        BigDecimal realKm = race.realKm();
        if (realKm != null && realKm.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Distance must be zero or greater.");
        }

        if (realKm != null && realKm.compareTo(MAX_REAL_KM) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Distance must be 999.99 km or lower.");
        }

        if (realKm != null && realKm.scale() > 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Distance must use no more than 2 decimal places.");
        }

        if (race.elevation() != null && race.elevation() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Elevation must be zero or greater.");
        }

        validateCreateResults(request.results());
        validateCreateAnalysis(request.analysis());
    }

    private void validateCreateResults(CreateRaceRequest.RaceResultData results) {
        if (results == null) {
            return;
        }

        if (results.officialTimeSeconds() != null && results.officialTimeSeconds() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Official time must be zero or greater.");
        }

        if (results.chipTimeSeconds() != null && results.chipTimeSeconds() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chip time must be zero or greater.");
        }

        if (results.pacePerKmSeconds() != null && results.pacePerKmSeconds() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pace per km must be zero or greater.");
        }

        if (results.generalClassification() != null && results.generalClassification() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "General classification must be greater than zero.");
        }

        if (results.ageGroupClassification() != null && results.ageGroupClassification() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Age group classification must be greater than zero.");
        }

        if (results.teamClassification() != null && results.teamClassification() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Team classification must be greater than zero.");
        }
    }

    private void validateCreateAnalysis(CreateRaceRequest.RaceAnalysisData analysis) {
        if (analysis == null) {
            return;
        }

        validateMaxLength(analysis.preRaceConfidence(), MAX_ANALYSIS_RATING_LENGTH, "Pre-race confidence");
        validateMaxLength(analysis.raceDifficulty(), MAX_ANALYSIS_RATING_LENGTH, "Race difficulty");
        validateMaxLength(analysis.finalSatisfaction(), MAX_ANALYSIS_RATING_LENGTH, "Final satisfaction");
    }

    private void validateMaxLength(String value, int maxLength, String fieldLabel) {
        if (hasText(value) && value.trim().length() > maxLength) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    fieldLabel + " must have " + maxLength + " characters or fewer."
            );
        }
    }

    private boolean hasRaceResults(CreateRaceRequest.RaceResultData results) {
        return results != null
                && (results.officialTimeSeconds() != null
                || results.chipTimeSeconds() != null
                || results.pacePerKmSeconds() != null
                || results.shoeId() != null
                || results.generalClassification() != null
                || results.ageGroupClassification() != null
                || results.teamClassification() != null
                || Boolean.TRUE.equals(results.isGeneralClassificationPodium())
                || Boolean.TRUE.equals(results.isAgeGroupClassificationPodium())
                || Boolean.TRUE.equals(results.isTeamClassificationPodium()));
    }

    private boolean hasRaceAnalysis(CreateRaceRequest.RaceAnalysisData analysis) {
        return analysis != null
                && (hasText(analysis.preRaceConfidence())
                || hasText(analysis.raceDifficulty())
                || hasText(analysis.finalSatisfaction())
                || hasText(analysis.painInjuries())
                || hasText(analysis.analysisNotes())
                || analysis.wouldRepeatThisRace() != null);
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private String validateManagedOptionRequest(RaceOptionType optionType, ManageRaceOptionRequest request) {
        if (request == null || request.name() == null || request.name().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, optionType.label() + " name is required.");
        }

        String normalizedName = request.name().trim();
        if (normalizedName.length() > MAX_OPTION_NAME_LENGTH) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    optionType.label() + " name must have " + MAX_OPTION_NAME_LENGTH + " characters or fewer."
            );
        }

        return normalizedName;
    }

    private String normalizeOptionalText(String value) {
        return hasText(value) ? value.trim() : null;
    }
}
