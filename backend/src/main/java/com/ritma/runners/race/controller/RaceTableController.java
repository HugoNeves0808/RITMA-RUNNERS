package com.ritma.runners.race.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
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
import com.ritma.runners.race.dto.DeleteRacesRequest;
import com.ritma.runners.race.dto.RaceFilterOptionsResponse;
import com.ritma.runners.race.dto.RaceQueryFilters;
import com.ritma.runners.race.dto.RaceTableItemResponse;
import com.ritma.runners.race.dto.RaceTableResponse;
import com.ritma.runners.race.dto.RaceTypeOptionResponse;
import com.ritma.runners.race.dto.UpdateRaceTableItemRequest;
import com.ritma.runners.race.service.RaceService;

@RestController
@RequestMapping("/api/races")
@CrossOrigin(origins = "http://localhost:5173")
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

    @GetMapping("/filters/options")
    public RaceFilterOptionsResponse getFilterOptions(@AuthenticationPrincipal JwtAuthenticatedUser user) {
        return raceService.getFilterOptions(requireAuthenticatedUserId(user));
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
            @RequestBody UpdateRaceTableItemRequest request
    ) {
        return raceService.updateTableRace(requireAuthenticatedUserId(user), raceId, request);
    }

    @DeleteMapping("/bulk")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRaces(@AuthenticationPrincipal JwtAuthenticatedUser user,
                            @RequestBody DeleteRacesRequest request) {
        raceService.deleteRaces(requireAuthenticatedUserId(user), request);
    }

    private UUID requireAuthenticatedUserId(JwtAuthenticatedUser user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
        }

        return user.id();
    }
}
