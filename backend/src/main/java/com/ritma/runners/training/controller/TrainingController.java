package com.ritma.runners.training.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.ritma.runners.auth.dto.JwtAuthenticatedUser;
import com.ritma.runners.training.dto.TrainingCreateOptionsResponse;
import com.ritma.runners.training.dto.TrainingFilterOptionsResponse;
import com.ritma.runners.training.dto.TrainingFilters;
import com.ritma.runners.training.dto.TrainingRequest;
import com.ritma.runners.training.dto.TrainingTableItemResponse;
import com.ritma.runners.training.dto.TrainingTableResponse;
import com.ritma.runners.training.dto.TrainingTypeOptionResponse;
import com.ritma.runners.training.dto.TrainingTypeRequest;
import com.ritma.runners.training.service.TrainingService;

@RestController
@RequestMapping("/api/trainings")
public class TrainingController {
    private final TrainingService trainingService;

    public TrainingController(TrainingService trainingService) {
        this.trainingService = trainingService;
    }

    @GetMapping("/table")
    public TrainingTableResponse getTrainings(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                              @RequestParam(required = false) String search,
                                              @RequestParam(required = false) List<String> statuses,
                                              @RequestParam(required = false) List<UUID> trainingTypeIds,
                                              @RequestParam(required = false) List<String> associations) {
        TrainingFilters filters = trainingService.normalizeFilters(search, statuses, trainingTypeIds, associations);
        return trainingService.getTrainings(requireAuthenticatedUserId(user), filters);
    }

    @GetMapping("/create/options")
    public TrainingCreateOptionsResponse getCreateOptions(@AuthenticationPrincipal JwtAuthenticatedUser user) {
        return trainingService.getCreateOptions(requireAuthenticatedUserId(user));
    }

    @GetMapping("/filters/options")
    public TrainingFilterOptionsResponse getFilterOptions(@AuthenticationPrincipal JwtAuthenticatedUser user) {
        return trainingService.getFilterOptions(requireAuthenticatedUserId(user));
    }

    @GetMapping("/{trainingId:[0-9a-fA-F\\-]{36}}")
    public TrainingTableItemResponse getTraining(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                                 @PathVariable UUID trainingId) {
        return trainingService.getTraining(requireAuthenticatedUserId(user), trainingId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public List<TrainingTableItemResponse> createTraining(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                                          @RequestBody TrainingRequest request) {
        return trainingService.createTraining(requireAuthenticatedUserId(user), request);
    }

    @PutMapping("/{trainingId:[0-9a-fA-F\\-]{36}}")
    public TrainingTableItemResponse updateTraining(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                                    @PathVariable UUID trainingId,
                                                    @RequestBody TrainingRequest request) {
        return trainingService.updateTraining(requireAuthenticatedUserId(user), trainingId, request);
    }

    @PutMapping("/{trainingId:[0-9a-fA-F\\-]{36}}/completion")
    public TrainingTableItemResponse updateCompleted(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                                     @PathVariable UUID trainingId,
                                                     @RequestParam boolean completed) {
        return trainingService.updateCompleted(requireAuthenticatedUserId(user), trainingId, completed);
    }

    @DeleteMapping("/{trainingId:[0-9a-fA-F\\-]{36}}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTraining(@AuthenticationPrincipal JwtAuthenticatedUser user,
                               @PathVariable UUID trainingId,
                               @RequestParam(defaultValue = "single") String scope) {
        trainingService.deleteTraining(requireAuthenticatedUserId(user), trainingId, scope);
    }

    @GetMapping("/types")
    public List<TrainingTypeOptionResponse> getTrainingTypes(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                                             @RequestParam(defaultValue = "false") boolean includeArchived) {
        return trainingService.getTrainingTypes(requireAuthenticatedUserId(user), includeArchived);
    }

    @PostMapping("/types")
    @ResponseStatus(HttpStatus.CREATED)
    public TrainingTypeOptionResponse createTrainingType(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                                         @RequestBody TrainingTypeRequest request) {
        return trainingService.createTrainingType(requireAuthenticatedUserId(user), request);
    }

    @PutMapping("/types/{trainingTypeId:[0-9a-fA-F\\-]{36}}")
    public TrainingTypeOptionResponse updateTrainingType(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                                         @PathVariable UUID trainingTypeId,
                                                         @RequestBody TrainingTypeRequest request) {
        return trainingService.updateTrainingType(requireAuthenticatedUserId(user), trainingTypeId, request);
    }

    @DeleteMapping("/types/{trainingTypeId:[0-9a-fA-F\\-]{36}}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTrainingType(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                   @PathVariable UUID trainingTypeId) {
        trainingService.deleteTrainingType(requireAuthenticatedUserId(user), trainingTypeId);
    }

    private UUID requireAuthenticatedUserId(JwtAuthenticatedUser user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
        }

        return user.id();
    }
}
