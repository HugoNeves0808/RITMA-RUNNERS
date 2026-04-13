package com.ritma.runners.race.controller;

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
import com.ritma.runners.race.dto.CreateRaceRequest;
import com.ritma.runners.race.dto.CreateRaceResponse;
import com.ritma.runners.race.dto.ManageRaceOptionRequest;
import com.ritma.runners.race.dto.RaceCreateOptionsResponse;
import com.ritma.runners.race.dto.RaceDetailResponse;
import com.ritma.runners.race.dto.RaceFilterOptionsResponse;
import com.ritma.runners.race.dto.RaceOptionType;
import com.ritma.runners.race.dto.RaceOptionUsageResponse;
import com.ritma.runners.race.dto.RaceQueryFilters;
import com.ritma.runners.race.dto.RaceTableItemResponse;
import com.ritma.runners.race.dto.RaceTableResponse;
import com.ritma.runners.race.dto.RaceTypeOptionResponse;
import com.ritma.runners.race.service.RaceService;

@RestController
@RequestMapping("/api/races")
public class RaceTableController {

    private final RaceService raceService;

    public RaceTableController(RaceService raceService) {
        this.raceService = raceService;
    }

    @GetMapping("/table")
    public RaceTableResponse getTableRaces(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                           @RequestParam(required = false) String search,
                                           @RequestParam(required = false) List<String> statuses,
                                           @RequestParam(required = false) List<Integer> years,
                                           @RequestParam(required = false) List<UUID> raceTypeIds) {
        RaceQueryFilters filters = raceService.normalizeFilters(search, statuses, years, raceTypeIds);
        return raceService.getTableRaces(requireAuthenticatedUserId(user), filters);
    }

    @GetMapping("/types")
    public java.util.List<RaceTypeOptionResponse> getRaceTypes(@AuthenticationPrincipal JwtAuthenticatedUser user) {
        return raceService.getRaceTypes(requireAuthenticatedUserId(user));
    }

    @GetMapping("/create/options")
    public RaceCreateOptionsResponse getCreateOptions(@AuthenticationPrincipal JwtAuthenticatedUser user) {
        return raceService.getCreateOptions(requireAuthenticatedUserId(user));
    }

    @GetMapping("/{raceId:[0-9a-fA-F\\-]{36}}")
    public RaceDetailResponse getRaceDetail(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                            @PathVariable UUID raceId) {
        return raceService.getRaceDetail(requireAuthenticatedUserId(user), raceId);
    }

    @GetMapping("/filters/options")
    public RaceFilterOptionsResponse getFilterOptions(@AuthenticationPrincipal JwtAuthenticatedUser user) {
        return raceService.getFilterOptions(requireAuthenticatedUserId(user));
    }

    @GetMapping("/options/{optionType}")
    public List<RaceTypeOptionResponse> getManagedOptions(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                                          @PathVariable String optionType,
                                                          @RequestParam(defaultValue = "false") boolean includeArchived) {
        return raceService.getManagedOptions(
                requireAuthenticatedUserId(user),
                RaceOptionType.fromPathValue(optionType),
                includeArchived
        );
    }

    @PostMapping("/options/{optionType}")
    @ResponseStatus(HttpStatus.CREATED)
    public RaceTypeOptionResponse createManagedOption(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                                      @PathVariable String optionType,
                                                      @RequestBody ManageRaceOptionRequest request) {
        return raceService.createManagedOption(requireAuthenticatedUserId(user), RaceOptionType.fromPathValue(optionType), request);
    }

    @PutMapping("/options/{optionType}/{optionId:[0-9a-fA-F\\-]{36}}")
    public RaceTypeOptionResponse updateManagedOption(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                                      @PathVariable String optionType,
                                                      @PathVariable UUID optionId,
                                                      @RequestBody ManageRaceOptionRequest request) {
        return raceService.updateManagedOption(requireAuthenticatedUserId(user), RaceOptionType.fromPathValue(optionType), optionId, request);
    }

    @PutMapping("/options/{optionType}/{optionId:[0-9a-fA-F\\-]{36}}/archive")
    public RaceTypeOptionResponse updateManagedOptionArchived(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                                              @PathVariable String optionType,
                                                              @PathVariable UUID optionId,
                                                              @RequestParam boolean archived) {
        return raceService.updateManagedOptionArchived(
                requireAuthenticatedUserId(user),
                RaceOptionType.fromPathValue(optionType),
                optionId,
                archived
        );
    }

    @GetMapping("/options/{optionType}/{optionId:[0-9a-fA-F\\-]{36}}/usage")
    public RaceOptionUsageResponse getManagedOptionUsage(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                                         @PathVariable String optionType,
                                                         @PathVariable UUID optionId) {
        return raceService.getManagedOptionUsage(requireAuthenticatedUserId(user), RaceOptionType.fromPathValue(optionType), optionId);
    }

    @DeleteMapping("/options/{optionType}/{optionId:[0-9a-fA-F\\-]{36}}/detach")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void detachManagedOptionUsage(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                         @PathVariable String optionType,
                                         @PathVariable UUID optionId) {
        raceService.detachManagedOptionUsage(requireAuthenticatedUserId(user), RaceOptionType.fromPathValue(optionType), optionId);
    }

    @DeleteMapping("/options/{optionType}/{optionId:[0-9a-fA-F\\-]{36}}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteManagedOption(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                    @PathVariable String optionType,
                                    @PathVariable UUID optionId) {
        raceService.deleteManagedOption(requireAuthenticatedUserId(user), RaceOptionType.fromPathValue(optionType), optionId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreateRaceResponse createRace(@AuthenticationPrincipal JwtAuthenticatedUser user,
                                         @RequestBody CreateRaceRequest request) {
        return raceService.createRace(requireAuthenticatedUserId(user), request);
    }

    @PutMapping("/{raceId:[0-9a-fA-F\\-]{36}}")
    public RaceTableItemResponse updateRace(
            @AuthenticationPrincipal JwtAuthenticatedUser user,
            @PathVariable UUID raceId,
            @RequestBody CreateRaceRequest request
    ) {
        return raceService.updateRace(requireAuthenticatedUserId(user), raceId, request);
    }

    @DeleteMapping("/{raceId:[0-9a-fA-F\\-]{36}}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRace(@AuthenticationPrincipal JwtAuthenticatedUser user,
                           @PathVariable UUID raceId) {
        raceService.deleteRace(requireAuthenticatedUserId(user), raceId);
    }

    private UUID requireAuthenticatedUserId(JwtAuthenticatedUser user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
        }

        return user.id();
    }
}
