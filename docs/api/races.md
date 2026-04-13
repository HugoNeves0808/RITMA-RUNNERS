## Race

### `GET /api/races`

Reads the latest race rows from `user_races`.

Current note:

- this endpoint is still being used as a technical preview endpoint
- it is not yet isolated by authenticated user

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/races`
- Auth: none in the current backend state

Expected response example:

```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "name": "Porto 10K Test",
    "raceStatus": "REGISTERED",
    "raceDate": "2026-04-20",
    "raceTime": "09:00:00",
    "realKm": 10.0,
    "elevation": 120,
    "archived": false,
    "isValidForCategoryRanking": true
  }
]
```

### `GET /api/races/calendar`

Returns the authenticated user's races for a selected month, grouped by day for the calendar experience shared by web and mobile.

Optional query params:

- `year`
  target year for the calendar month; defaults to the current year when omitted
- `month`
  target month from `1` to `12`; defaults to the current month when omitted
- `statuses`
  optional repeated filter for one or more race statuses
  example: `statuses=REGISTERED&statuses=COMPLETED`
- `raceTypeIds`
  optional repeated filter for one or more race-type ids
  example: `raceTypeIds=uuid-1&raceTypeIds=uuid-2`

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/races/calendar?year=2026&month=3&statuses=REGISTERED&raceTypeIds=uuid-1`
- Auth: `Bearer Token`
- Token: `{{token}}`

Expected response example:

```json
{
  "year": 2026,
  "month": 3,
  "days": [
    {
      "date": "2026-03-08",
      "races": [
        {
          "id": "uuid",
          "name": "Lisbon Spring 10K",
          "raceTypeName": "Road Race",
          "raceStatus": "COMPLETED",
          "raceDate": "2026-03-08",
          "raceTime": "09:00:00",
          "realKm": 10.0,
          "elevation": 90,
          "archived": false,
          "isValidForCategoryRanking": true
        }
      ]
    }
  ]
}
```

Current client usage:

- web `Races` monthly calendar consumes `/api/races/calendar`, requests the visible month from the top controls, and renders the returned races inside the correct day cells
- web applies race-name search locally in the client while using `statuses` and `raceTypeIds` as backend filters shared with the table experience
- the response now includes `raceTypeName` so the compact day cards can show race type instead of race status
- mobile `Races` monthly calendar also consumes `/api/races/calendar`, requests the visible month from its centered month controls, and uses the returned races to derive each day's compact race-count and status-priority summary while sharing the same status and race-type filters

### `GET /api/races/calendar/yearly`

Returns the authenticated user's races for a selected year, grouped by month and day for the yearly calendar experience shared by web and mobile.

Optional query params:

- `year`
  target year for the calendar; defaults to the current year when omitted
- `statuses`
  optional repeated filter for one or more race statuses
- `raceTypeIds`
  optional repeated filter for one or more race-type ids

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/races/calendar/yearly?year=2026&statuses=REGISTERED&raceTypeIds=uuid-1`
- Auth: `Bearer Token`
- Token: `{{token}}`

Expected response example:

```json
{
  "year": 2026,
  "months": [
    {
      "month": 3,
      "days": [
        {
          "date": "2026-03-08",
          "races": [
            {
              "id": "uuid",
              "name": "Lisbon Spring 10K",
              "raceTypeName": "Road Race",
              "raceStatus": "COMPLETED",
              "raceDate": "2026-03-08",
              "raceTime": "09:00:00",
              "realKm": 10.0,
              "elevation": 90,
              "archived": false,
              "isValidForCategoryRanking": true
            }
          ]
        }
      ]
    }
  ]
}
```

Current client usage:

- web `Races` yearly calendar consumes `/api/races/calendar/yearly`, requests the visible year from the top controls, and renders a 12-month overview
- mobile `Races` yearly calendar also consumes `/api/races/calendar/yearly`, requests the visible year from its own year controls, and renders the same year as stacked month cards for better mobile readability
- each day with races is marked by a circular number badge whose fill color comes from the prioritized race status for that day
- both clients share backend filters for `statuses` and `raceTypeIds`, while race-name search remains local in the UI

### `GET /api/races/table`

Returns the authenticated user's races grouped by year for the `Table` experience shared by web and mobile.

Optional query params:

- `scope`
  accepts `current` or `all`
  defaults to `current` when omitted
- `statuses`
  optional repeated filter for one or more race statuses
  example: `statuses=REGISTERED&statuses=COMPLETED`
- `raceTypeIds`
  optional repeated filter for one or more race-type ids
  example: `raceTypeIds=uuid-1&raceTypeIds=uuid-2`

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/races/table?scope=current&statuses=REGISTERED&raceTypeIds=uuid-1`
- Auth: `Bearer Token`
- Token: `{{token}}`

Expected response example:

```json
{
  "years": [
    {
      "year": 2026,
      "races": [
        {
          "id": "uuid",
          "raceNumber": 6,
          "raceDate": "2026-03-20",
          "raceTime": "09:45:00",
          "raceStatus": "REGISTERED",
          "name": "Corrida de Hoje 2026",
          "location": "Coimbra, Portugal",
          "raceTypeId": "uuid",
          "raceTypeName": "Corrida 10 km",
          "officialTimeSeconds": 2405,
          "chipTimeSeconds": 2398,
          "pacePerKmSeconds": 240
        }
      ]
    }
  ],
  "undatedRaces": [
    {
      "id": "uuid",
      "raceNumber": 9,
      "raceDate": null,
      "raceTime": null,
      "raceStatus": "IN_LIST",
      "name": "Possible Autumn Half Marathon",
      "location": "Lisbon, Portugal",
      "circuitId": null,
      "circuitName": null,
      "raceTypeId": "uuid",
      "raceTypeName": "Half Marathon",
      "officialTimeSeconds": null,
      "chipTimeSeconds": null,
      "pacePerKmSeconds": null
    }
  ]
}
```

Client usage notes:

- web `Races` table consumes `/api/races/table`, opens in `All years` by default, applies race-name search locally, and uses backend filters for selected statuses and race types while rendering a card-style list grouped by year instead of a classic spreadsheet layout
- mobile `Races` table consumes the same endpoint, also opens in `Current year` by default, applies race-name search locally in table mode, and uses the same backend-backed status and race-type filters in its compact card layout
- both clients use `raceStatus` and `raceTime` to drive the `Coming Up` section, which only considers `REGISTERED` races in the current Monday-to-Sunday week or, when none exist, the next future registered race
- both clients now keep `Coming Up` logically independent from local race-name search, so typing into search no longer redefines which race counts as upcoming; it only filters what is shown
- the response now includes `circuitId` and `circuitName` for each race row so clients can surface registered-race circuit context directly in list mode without opening race details first
- the web client now varies list density by race status, keeping cancelled / not-registered / DNS / DNF rows in a compact inline layout while preserving richer metrics for completed and registered races
- races whose status is `IN_LIST` and do not yet have a `raceDate` are returned in `undatedRaces`; the web client now exposes them through a dedicated `In List (without date)` status filter, renders them in a separate `In List` section after `Coming Up`, and keeps that undated status unavailable in `Calendar` view

### `GET /api/races/types`

Returns the authenticated user's available race types for table editing and race filtering.

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/races/types`
- Auth: `Bearer Token`
- Token: `{{token}}`

Expected response example:

```json
[
  {
    "id": "uuid",
    "name": "Corrida 10 km"
  }
]
```

### `GET /api/races/create/options`

Returns the authenticated user's available selector options for the create-race flows in web and mobile.

This endpoint bundles the options required by the creation UI:

- `raceTypes`
- `teams`
- `circuits`
- `shoes`

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/races/create/options`
- Auth: `Bearer Token`
- Token: `{{token}}`

Expected response example:

```json
{
  "raceTypes": [
    { "id": "uuid-race-type", "name": "Half Marathon", "targetKm": 21.1 }
  ],
  "teams": [
    { "id": "uuid-team", "name": "RITMA Runners" }
  ],
  "circuits": [
    { "id": "uuid-circuit", "name": "National Road Circuit" }
  ],
  "shoes": [
    { "id": "uuid-shoe", "name": "Nike Vaporfly 3" }
  ]
}
```

### `GET /api/races/{raceId}`

Returns the authenticated user's full detail for a single race, combining race data, race results, and race analysis for the race-details drawer.

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/races/{{raceId}}`
- Auth: `Bearer Token`
- Token: `{{token}}`

Expected response example:

```json
{
  "id": "uuid",
  "race": {
    "raceStatus": "COMPLETED",
    "raceDate": "2026-03-24",
    "raceTime": "07:45:30",
    "name": "Lisbon Spring 10K",
    "location": "Lisbon, Portugal",
    "teamId": "uuid-team",
    "teamName": "RITMA Runners",
    "circuitId": "uuid-circuit",
    "circuitName": "National Road Circuit",
    "raceTypeId": "uuid-race-type",
    "raceTypeName": "Road 10K",
    "realKm": 10.0,
    "elevation": 90,
    "isValidForCategoryRanking": true
  },
  "results": {
    "officialTimeSeconds": 2405,
    "chipTimeSeconds": 2398,
    "pacePerKmSeconds": 240,
    "shoeId": "uuid-shoe",
    "shoeName": "Nike Vaporfly 3",
    "generalClassification": 12,
    "isGeneralClassificationPodium": false,
    "ageGroupClassification": 4,
    "isAgeGroupClassificationPodium": false,
    "teamClassification": 2,
    "isTeamClassificationPodium": true
  },
  "analysis": {
    "preRaceConfidence": "HIGH",
    "raceDifficulty": "MEDIUM",
    "finalSatisfaction": "HIGH",
    "painInjuries": "Minor calf tightness in the last 3 km.",
    "analysisNotes": "Solid pacing and good race management overall."
  }
}
```

### `POST /api/races`

Creates a new race for the authenticated user and optionally persists race results and race analysis fields in the same base row.

Backend behavior:

- creates the base `user_races` row
- optionally fills the result-related columns in `user_races` when any result data is sent
- optionally fills the analysis-related columns in `user_races` when any analysis data is sent
- validates required race fields such as `raceStatus`, `name`, and `raceDate` when the status is not `IN_LIST`
- allows `raceDate = null` only when `raceStatus = IN_LIST`
- validates optional numeric values to prevent negative times, distances, elevations, or invalid classifications
- validates maximum lengths and ownership for optional linked `raceType`, `team`, `circuit`, and `shoe`

Postman:

- Method: `POST`
- URL: `{{baseUrl}}/api/races`
- Header: `Content-Type: application/json`
- Auth: `Bearer Token`
- Token: `{{token}}`

Example body:

```json
{
  "race": {
    "raceStatus": "REGISTERED",
    "raceDate": "2026-03-20",
    "raceTime": "09:45:00",
    "name": "Corrida de Hoje 2026",
    "location": "Coimbra, Portugal",
    "teamId": "uuid-team",
    "circuitId": "uuid-circuit",
    "raceTypeId": "uuid",
    "realKm": 10.0,
    "elevation": 90,
    "isValidForCategoryRanking": true
  },
  "results": {
    "officialTimeSeconds": 2405,
    "chipTimeSeconds": 2398,
    "pacePerKmSeconds": 240,
    "shoeId": "uuid-shoe",
    "generalClassification": 12,
    "isGeneralClassificationPodium": false,
    "ageGroupClassification": 4,
    "isAgeGroupClassificationPodium": false,
    "teamClassification": 2,
    "isTeamClassificationPodium": true
  },
  "analysis": {
    "preRaceConfidence": "HIGH",
    "raceDifficulty": "MEDIUM",
    "finalSatisfaction": "HIGH",
    "painInjuries": "Minor calf tightness in the last 3 km.",
    "analysisNotes": "Solid pacing and good race management overall."
  }
}
```

Expected response example:

```json
{
  "id": "uuid"
}
```

Client usage notes:

- web `Races` exposes this endpoint through a right-side creation drawer opened by the orange add button next to the page title
- mobile `Races` exposes the same endpoint through a dedicated add-race modal with the same three logical tabs
- on web, create mode now reveals the rest of the form only after the user selects `Race status`, while edit mode still opens prefilled
- on web, the selected `raceStatus` now controls which sections stay visible: `Completed` unlocks full results plus analysis, `Did not finish` keeps race context plus analysis without final results, and `Did not start` keeps base race data plus notes without results
- both clients auto-format manual duration and pace inputs while the user types, calculate `pacePerKm` from `chipTime` and `realKm` when possible, and automatically mark podium checkboxes when the corresponding classification is between `1` and `3`
- the web create-race drawer now presents `Race time` without seconds and in `AM/PM`, while still persisting the backend-compatible time value
- both clients now also expose optional selectors for `team`, `circuit`, and `shoe`
- both clients now also allow managing the underlying selector options in place from the same creation flows

### `GET /api/races/options/{optionType}`

Returns the authenticated user's current managed options for one selector family.

Supported `optionType` values:

- `race-types`
- `teams`
- `circuits`
- `shoes`

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/races/options/race-types`
- Auth: `Bearer Token`
- Token: `{{token}}`

Expected response example:

```json
[
  {
    "id": "uuid",
    "name": "Half Marathon",
    "targetKm": 21.1
  }
]
```

### `POST /api/races/options/{optionType}`

Creates a new authenticated user-owned option for the selected family.

For `race-types`, the payload may also include `targetKm`. The other option families ignore that field.

Postman:

- Method: `POST`
- URL: `{{baseUrl}}/api/races/options/teams`
- Header: `Content-Type: application/json`
- Auth: `Bearer Token`
- Token: `{{token}}`

Example body:

```json
{
  "name": "Half Marathon",
  "targetKm": 21.1
}
```

Expected response example:

```json
{
  "id": "uuid",
  "name": "Half Marathon",
  "targetKm": 21.1
}
```

### `PUT /api/races/options/{optionType}/{optionId}`

Renames an existing authenticated user-owned option.

For `race-types`, this same request can also update `targetKm`.

Postman:

- Method: `PUT`
- URL: `{{baseUrl}}/api/races/options/circuits/{{optionId}}`
- Header: `Content-Type: application/json`
- Auth: `Bearer Token`
- Token: `{{token}}`

Example body:

```json
{
  "name": "Half Marathon",
  "targetKm": 21.1
}
```

### `DELETE /api/races/options/{optionType}/{optionId}`

Deletes an existing authenticated user-owned option when it is not currently linked to race records.

If the option is still in use, the backend returns a validation error and the client can inspect usage first.

Postman:

- Method: `DELETE`
- URL: `{{baseUrl}}/api/races/options/shoes/{{optionId}}`
- Auth: `Bearer Token`
- Token: `{{token}}`

### `GET /api/races/options/{optionType}/{optionId}/usage`

Returns where a managed option is currently being used so the client can explain the dependency to the user before deletion.

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/races/options/teams/{{optionId}}/usage`
- Auth: `Bearer Token`
- Token: `{{token}}`

Expected response example:

```json
{
  "optionType": "teams",
  "usageCount": 2,
  "records": [
    {
      "raceId": "uuid-1",
      "raceName": "Lisbon Half Marathon",
      "raceDate": "2026-03-20",
      "contextLabel": "race"
    },
    {
      "raceId": "uuid-2",
      "raceName": "Porto 10K",
      "raceDate": "2026-04-15",
      "contextLabel": "result"
    }
  ]
}
```

### `DELETE /api/races/options/{optionType}/{optionId}/detach`

Removes the current option association from the authenticated user's linked records so the option can then be deleted safely.

Current behavior:

- detaches the option from the relevant race or race-result records
- does not delete the races themselves
- is typically called by the clients immediately before a follow-up delete

Postman:

- Method: `DELETE`
- URL: `{{baseUrl}}/api/races/options/race-types/{{optionId}}/detach`
- Auth: `Bearer Token`
- Token: `{{token}}`

### `PUT /api/races/{raceId}`

Updates a single authenticated user's race using the same full payload shape as race creation.

Backend behavior:

- validates that the race belongs to the authenticated user
- accepts the same `race`, `results`, and `analysis` payload sections used by `POST /api/races`
- applies the same validation rules as creation for required fields, ownership checks, numeric constraints, and optional linked `raceType`, `team`, `circuit`, and `shoe`
- updates the flattened `user_races` row in place, including race status, date/time, linked selectors, results, and analysis
- returns the refreshed table-row response for the updated race

Postman:

- Method: `PUT`
- URL: `{{baseUrl}}/api/races/{{raceId}}`
- Header: `Content-Type: application/json`
- Auth: `Bearer Token`
- Token: `{{token}}`

Example body:

```json
{
  "race": {
    "raceStatus": "CANCELLED",
    "raceDate": "2026-02-16",
    "raceTime": "08:45:00",
    "name": "Sintra Hills Trail 1234 Teste",
    "location": "Sintra 123",
    "teamId": "uuid-team",
    "circuitId": "uuid-circuit",
    "raceTypeId": "uuid-race-type",
    "realKm": 18.4,
    "elevation": 640,
    "isValidForCategoryRanking": false
  },
  "results": {
    "officialTimeSeconds": 7200,
    "chipTimeSeconds": 7150,
    "pacePerKmSeconds": 389,
    "shoeId": "uuid-shoe",
    "generalClassification": 20,
    "isGeneralClassificationPodium": false,
    "ageGroupClassification": 5,
    "isAgeGroupClassificationPodium": false,
    "teamClassification": 2,
    "isTeamClassificationPodium": true
  },
  "analysis": {
    "preRaceConfidence": "MEDIUM",
    "raceDifficulty": "HIGH",
    "finalSatisfaction": "LOW",
    "painInjuries": "Tight calves after km 12.",
    "analysisNotes": "Weather and terrain made the race tougher than expected."
  }
}
```

Current client usage:

- web `Races` uses this endpoint through the same right-side drawer used for creation, now opened in edit mode with the selected race prefilled
- the edit action is available from the card three-dot menu and from the race-details drawer header
- when edit is opened from the race-details drawer and the user closes the edit drawer without saving, the details drawer opens again so the previous context is preserved

### `DELETE /api/races/{raceId}`

Deletes a single authenticated user's race.

Backend behavior:

- validates that the race belongs to the authenticated user
- returns `404 Not Found` when the race does not exist for that user
- deletes the base `user_races` row, which also removes the flattened results and analysis data stored on that same row

Postman:

- Method: `DELETE`
- URL: `{{baseUrl}}/api/races/{{raceId}}`
- Auth: `Bearer Token`
- Token: `{{token}}`

Expected response:

- `204 No Content`

Current client usage:

- web `Races` exposes this endpoint through the three-dot card menu and the race-details drawer header
- both entry points use a confirmation modal before the delete request is sent
- after a successful deletion, the web table closes the details drawer if needed and refreshes the current race list
