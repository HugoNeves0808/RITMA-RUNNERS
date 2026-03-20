package com.ritma.runners.race.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.ritma.runners.common.util.SecurityUtils;
import com.ritma.runners.race.dto.DeleteRacesRequest;
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
    public RaceTableResponse getTableRaces() {
        return raceService.getTableRaces(requireAuthenticatedUserId());
    }

    @GetMapping("/types")
    public java.util.List<RaceTypeOptionResponse> getRaceTypes() {
        return raceService.getRaceTypes(requireAuthenticatedUserId());
    }

    @PutMapping("/{raceId}")
    public RaceTableItemResponse updateRace(
            @PathVariable UUID raceId,
            @RequestBody UpdateRaceTableItemRequest request
    ) {
        return raceService.updateTableRace(requireAuthenticatedUserId(), raceId, request);
    }

    @DeleteMapping("/bulk")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRaces(@RequestBody DeleteRacesRequest request) {
        raceService.deleteRaces(requireAuthenticatedUserId(), request);
    }

    private UUID requireAuthenticatedUserId() {
        return SecurityUtils.currentUser()
                .map(com.ritma.runners.auth.dto.JwtAuthenticatedUser::id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required."));
    }
}
