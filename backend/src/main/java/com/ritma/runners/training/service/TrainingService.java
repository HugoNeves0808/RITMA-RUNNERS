package com.ritma.runners.training.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.ritma.runners.training.dto.TrainingCreateOptionsResponse;
import com.ritma.runners.training.dto.TrainingFilterOptionsResponse;
import com.ritma.runners.training.dto.TrainingFilters;
import com.ritma.runners.training.dto.TrainingRequest;
import com.ritma.runners.training.dto.TrainingTableItemResponse;
import com.ritma.runners.training.dto.TrainingTableResponse;
import com.ritma.runners.training.dto.TrainingTypeOptionResponse;
import com.ritma.runners.training.dto.TrainingTypeRequest;
import com.ritma.runners.training.repository.TrainingRepository;

@Service
public class TrainingService {
    private static final int MAX_NAME_LENGTH = 50;
    private static final int MAX_TYPE_NAME_LENGTH = 100;
    private static final Set<String> ALLOWED_STATUSES = Set.of("AGENDADO", "PLANEADO", "REALIZADO");
    private static final Set<String> ALLOWED_ASSOCIATIONS = Set.of("associated", "individual");

    private final TrainingRepository trainingRepository;

    public TrainingService(TrainingRepository trainingRepository) {
        this.trainingRepository = trainingRepository;
    }

    public TrainingTableResponse getTrainings(UUID userId, TrainingFilters filters) {
        return new TrainingTableResponse(trainingRepository.findTrainings(userId, filters));
    }

    public TrainingCreateOptionsResponse getCreateOptions(UUID userId) {
        return new TrainingCreateOptionsResponse(
                trainingRepository.findTrainingTypes(userId, false),
                trainingRepository.findAssociatedRaceOptions(userId)
        );
    }

    public TrainingFilterOptionsResponse getFilterOptions(UUID userId) {
        return new TrainingFilterOptionsResponse(trainingRepository.findTrainingTypes(userId, false));
    }

    public TrainingTableItemResponse getTraining(UUID userId, UUID trainingId) {
        TrainingTableItemResponse training = trainingRepository.findTraining(userId, trainingId);
        if (training == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Training not found.");
        }
        return training;
    }

    public TrainingFilters normalizeFilters(String search,
                                            List<String> statuses,
                                            List<UUID> trainingTypeIds,
                                            List<String> associations) {
        String normalizedSearch = search == null || search.trim().isEmpty() ? null : search.trim();

        List<String> normalizedStatuses = statuses == null
                ? List.of()
                : statuses.stream()
                        .filter(Objects::nonNull)
                        .map(value -> value.trim().toUpperCase(Locale.ROOT))
                        .filter(value -> !value.isEmpty())
                        .distinct()
                        .toList();

        if (normalizedStatuses.stream().anyMatch(status -> !ALLOWED_STATUSES.contains(status))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid training status filter.");
        }

        List<UUID> normalizedTrainingTypeIds = trainingTypeIds == null
                ? List.of()
                : trainingTypeIds.stream().filter(Objects::nonNull).distinct().toList();

        List<String> normalizedAssociations = associations == null
                ? List.of()
                : associations.stream()
                        .filter(Objects::nonNull)
                        .map(value -> value.trim().toLowerCase(Locale.ROOT))
                        .filter(value -> !value.isEmpty())
                        .distinct()
                        .toList();

        if (normalizedAssociations.stream().anyMatch(value -> !ALLOWED_ASSOCIATIONS.contains(value))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid association filter.");
        }

        return new TrainingFilters(normalizedSearch, normalizedStatuses, normalizedTrainingTypeIds, normalizedAssociations);
    }

    @Transactional
    public List<TrainingTableItemResponse> createTraining(UUID userId, TrainingRequest request) {
        ValidatedTraining validatedTraining = validateTraining(userId, request);
        List<UUID> createdIds = new ArrayList<>();

        if (validatedTraining.recurrenceEnabled()) {
            UUID seriesId = UUID.randomUUID();
            List<LocalDate> recurrenceDates = buildRecurrenceDates(validatedTraining);
            for (LocalDate date : recurrenceDates) {
                createdIds.add(trainingRepository.createTraining(
                        userId,
                        date,
                        validatedTraining.trainingTime(),
                        validatedTraining.name(),
                        validatedTraining.trainingTypeId(),
                        validatedTraining.notes(),
                        validatedTraining.associatedRaceId(),
                        seriesId,
                        validatedTraining.seriesIntervalWeeks(),
                        validatedTraining.seriesUntilDate(),
                        validatedTraining.seriesDaysOfWeek()
                ));
            }
        } else {
            createdIds.add(trainingRepository.createTraining(
                    userId,
                    validatedTraining.trainingDate(),
                    validatedTraining.trainingTime(),
                    validatedTraining.name(),
                    validatedTraining.trainingTypeId(),
                    validatedTraining.notes(),
                    validatedTraining.associatedRaceId(),
                    null,
                    null,
                    null,
                    List.of()
            ));
        }

        return createdIds.stream()
                .map(trainingId -> trainingRepository.findTraining(userId, trainingId))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(TrainingTableItemResponse::trainingDate)
                        .thenComparing(item -> item.trainingTime() == null ? LocalTime.MAX : item.trainingTime())
                        .thenComparing(TrainingTableItemResponse::createdAt, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(TrainingTableItemResponse::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional
    public TrainingTableItemResponse updateTraining(UUID userId, UUID trainingId, TrainingRequest request) {
        if (!trainingRepository.trainingExists(userId, trainingId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Training not found.");
        }

        ValidatedTraining validatedTraining = validateTraining(userId, request);
        trainingRepository.updateTraining(
                userId,
                trainingId,
                validatedTraining.trainingDate(),
                validatedTraining.trainingTime(),
                validatedTraining.name(),
                validatedTraining.trainingTypeId(),
                validatedTraining.notes(),
                validatedTraining.associatedRaceId(),
                validatedTraining.recurrenceEnabled() ? UUID.randomUUID() : null,
                validatedTraining.recurrenceEnabled() ? validatedTraining.seriesIntervalWeeks() : null,
                validatedTraining.recurrenceEnabled() ? validatedTraining.seriesUntilDate() : null,
                validatedTraining.recurrenceEnabled() ? validatedTraining.seriesDaysOfWeek() : List.of()
        );

        TrainingTableItemResponse training = trainingRepository.findTraining(userId, trainingId);
        if (training == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Training not found.");
        }
        return training;
    }

    @Transactional
    public TrainingTableItemResponse updateCompleted(UUID userId, UUID trainingId, boolean completed) {
        TrainingTableItemResponse existingTraining = trainingRepository.findTraining(userId, trainingId);
        if (existingTraining == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Training not found.");
        }

        if (completed && existingTraining.trainingDate().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Future trainings cannot be marked as completed.");
        }

        trainingRepository.updateTrainingCompleted(userId, trainingId, completed);
        TrainingTableItemResponse training = trainingRepository.findTraining(userId, trainingId);
        if (training == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Training not found.");
        }
        return training;
    }

    @Transactional
    public void deleteTraining(UUID userId, UUID trainingId, String scope) {
        TrainingTableItemResponse training = trainingRepository.findTraining(userId, trainingId);
        if (training == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Training not found.");
        }

        String normalizedScope = scope == null || scope.isBlank()
                ? "single"
                : scope.trim().toLowerCase(Locale.ROOT);

        if (!Set.of("single", "series").contains(normalizedScope)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid delete scope.");
        }

        if ("series".equals(normalizedScope)) {
            if (training.seriesId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Training does not belong to a series.");
            }

            trainingRepository.deleteTrainingSeries(userId, training.seriesId());
            return;
        }

        trainingRepository.deleteTraining(userId, trainingId);
    }

    public List<TrainingTypeOptionResponse> getTrainingTypes(UUID userId, boolean includeArchived) {
        return trainingRepository.findTrainingTypes(userId, includeArchived);
    }

    @Transactional
    public TrainingTypeOptionResponse createTrainingType(UUID userId, TrainingTypeRequest request) {
        String name = validateTrainingTypeName(request);
        try {
            return trainingRepository.createTrainingType(userId, name);
        } catch (DuplicateKeyException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Training type already exists.");
        }
    }

    @Transactional
    public TrainingTypeOptionResponse updateTrainingType(UUID userId, UUID trainingTypeId, TrainingTypeRequest request) {
        if (!trainingRepository.trainingTypeExists(userId, trainingTypeId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Training type not found.");
        }

        String name = validateTrainingTypeName(request);
        try {
            return trainingRepository.updateTrainingType(userId, trainingTypeId, name);
        } catch (DuplicateKeyException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Training type already exists.");
        }
    }

    @Transactional
    public void deleteTrainingType(UUID userId, UUID trainingTypeId) {
        if (!trainingRepository.trainingTypeExists(userId, trainingTypeId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Training type not found.");
        }

        if (trainingRepository.countTrainingTypeUsage(userId, trainingTypeId) > 0) {
            trainingRepository.updateTrainingTypeArchived(userId, trainingTypeId, true);
            return;
        }

        try {
            trainingRepository.deleteTrainingType(userId, trainingTypeId);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Training type cannot be deleted right now.");
        }
    }

    private ValidatedTraining validateTraining(UUID userId, TrainingRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Training data is required.");
        }

        if (request.trainingDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Training date is required.");
        }

        if (request.name() == null || request.name().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Training name is required.");
        }

        String normalizedName = request.name().trim();
        if (normalizedName.length() > MAX_NAME_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Training name must have 50 characters or fewer.");
        }

        if (request.trainingTypeId() != null && !trainingRepository.trainingTypeExists(userId, request.trainingTypeId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid training type.");
        }

        if (request.associatedRaceId() != null && !trainingRepository.associatedRaceExists(userId, request.associatedRaceId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid associated race.");
        }

        String normalizedNotes = normalizeOptionalText(request.notes());
        boolean recurrenceEnabled = request.recurrence() != null && Boolean.TRUE.equals(request.recurrence().enabled());

        if (!recurrenceEnabled) {
            return new ValidatedTraining(
                    request.trainingDate(),
                    request.trainingTime(),
                    normalizedName,
                    request.trainingTypeId(),
                    normalizedNotes,
                    request.associatedRaceId(),
                    false,
                    null,
                    null,
                    List.of()
            );
        }

        TrainingRequest.Recurrence recurrence = request.recurrence();
        if (recurrence.intervalWeeks() == null || recurrence.intervalWeeks() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recurrence interval must be greater than zero.");
        }

        if (recurrence.untilDate() == null || recurrence.untilDate().isBefore(request.trainingDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recurrence end date must be on or after the training date.");
        }

        List<Integer> normalizedDaysOfWeek = recurrence.daysOfWeek() == null
                ? List.of()
                : recurrence.daysOfWeek().stream()
                        .filter(Objects::nonNull)
                        .distinct()
                        .sorted()
                        .toList();

        if (normalizedDaysOfWeek.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose at least one weekday for the series.");
        }

        if (normalizedDaysOfWeek.stream().anyMatch(day -> day < 1 || day > 7)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid recurrence weekday.");
        }

        return new ValidatedTraining(
                request.trainingDate(),
                request.trainingTime(),
                normalizedName,
                request.trainingTypeId(),
                normalizedNotes,
                request.associatedRaceId(),
                true,
                recurrence.intervalWeeks(),
                recurrence.untilDate(),
                normalizedDaysOfWeek
        );
    }

    private List<LocalDate> buildRecurrenceDates(ValidatedTraining training) {
        Set<LocalDate> dates = new LinkedHashSet<>();
        LocalDate startDate = training.trainingDate();
        LocalDate untilDate = training.seriesUntilDate();
        LocalDate seriesStartWeek = startDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        for (LocalDate date = startDate; !date.isAfter(untilDate); date = date.plusDays(1)) {
            int dayOfWeek = date.getDayOfWeek().getValue();
            if (!training.seriesDaysOfWeek().contains(dayOfWeek)) {
                continue;
            }

            LocalDate candidateWeekStart = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            long weekDistance = ChronoUnit.WEEKS.between(seriesStartWeek, candidateWeekStart);
            if (weekDistance % training.seriesIntervalWeeks() == 0) {
                dates.add(date);
            }
        }

        if (dates.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected recurrence does not generate any training dates.");
        }

        return new ArrayList<>(dates);
    }

    private String validateTrainingTypeName(TrainingTypeRequest request) {
        if (request == null || request.name() == null || request.name().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Training type name is required.");
        }

        String normalizedName = request.name().trim();
        if (normalizedName.length() > MAX_TYPE_NAME_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Training type name must have 100 characters or fewer.");
        }
        return normalizedName;
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    private record ValidatedTraining(
            LocalDate trainingDate,
            java.time.LocalTime trainingTime,
            String name,
            UUID trainingTypeId,
            String notes,
            UUID associatedRaceId,
            boolean recurrenceEnabled,
            Integer seriesIntervalWeeks,
            LocalDate seriesUntilDate,
            List<Integer> seriesDaysOfWeek
    ) {
    }
}
