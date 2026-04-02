# RITMA API Documentation

This document describes the API endpoints currently available in the `RITMA RUNNERS` project, what each one does, and how to test them in Postman.

It also includes a short summary of the current account-access flow because the frontend now combines login, request-account, admin approval, and forced password change in a single user journey.

## Base URL

Use this base URL locally:

```text
http://localhost:8081
```

Current backend note:

- the local datasource and Flyway configuration now explicitly target the `public` schema to avoid PostgreSQL `search_path` issues during startup or after recreating Flyway history

## Postman Setup

Create an environment with:

```text
baseUrl = http://localhost:8081
token = 
adminToken = 
userId = 
```

You can then use requests such as:

```text
{{baseUrl}}/api/health
```

For protected endpoints, send:

```text
Authorization: Bearer {{token}}
```

## Seed Accounts

Current seeded accounts:

- `admin@ritma.com` / `pass1234`
- `user@ritma.com` / `pass1234`

## Current Access Flow

The current access flow is:

1. a new user submits `Request Account`
2. the backend creates the user with `account_status = PENDING`
3. an admin reviews the request in the admin area
4. the admin approves or rejects the request
5. approval sends the temporary password by email and changes the account to `ACTIVE`
6. on first login, the approved user must change password before using the app

## Related Client Navigation

These are not backend API endpoints, but they are relevant to the current user flow and the way the authenticated clients are now structured:

- `/login`
  Main login page, request-account modal, and entry point for authentication.
  In the web client, `Remember me` now keeps the token in persistent browser storage; when unchecked, the session uses session-only storage and ends when the browser is closed.
  After a successful login, `USER` accounts now always enter through `Races`, while `ADMIN` accounts are redirected to the admin overview.
- `/`
  Authenticated `Races` entry route in the web app.
- `/races`
  Alias route that opens the same authenticated `Races` page in the web app.
  The page now opens in `List` mode by default, keeps the `List` / `Calendar` switcher in the page header beside `Add Race`, includes a header-level `Bucket List` action, uses a right-side `Filters` panel with collapsible checkbox groups for `Years`, `Race status`, and `Race types`, lets the user manage `race types` directly from the filter title, uses a switcher for `Monthly` / `Yearly` calendar mode, and keeps filter state only across refresh of the same page.
- `/best-efforts`
  Authenticated web section for best efforts.
  The page now uses a header-level `Top 3` / `Top 5` / `All races` view switcher, a right-side collapsible `Race types` filter with inline race-type management, category counters for `valid`, `below target`, `excluded`, and `total`, filtered race-list modals, and the shared race-details drawer with working `Edit` / `Delete` actions.
- `/profile`
  Authenticated web section reserved for profile.
- `/settings`
  Authenticated web section reserved for settings.
- `/future-goals`
  Public product/roadmap page linked from the login screen.
- `/admin-area/ritma-overview`
  Admin-only web overview dashboard with admin metrics and a pending-approvals preview.
- `/admin-area/user-list`
  Admin-only web area for reviewing the active user list with a separate table card and sticky filters card.
- `/admin-area/pending-approvals`
  Admin-only web area for reviewing pending account approvals with a separate table card and sticky filters card.
- `/admin/account-requests`
  Temporary admin frontend page used to review pending accounts.

Authenticated client shell status:

- web now uses a fixed left sidebar with admin-aware menu rendering, an `Admin Area` dropdown group for admins, `Races`, `Best Efforts`, account actions, and active route highlighting
- mobile now uses a fixed top bar, fixed bottom navigation, and a fullscreen menu page opened from the hamburger button, including the same admin-only dropdown group and account actions near the end of the menu
- `Admin Area` is currently a grouped navigation label in both clients, not a standalone page or backend endpoint
- web `Races` now uses a header-level `List` / `Calendar` switcher beside `Add Race` instead of keeping that view switch inside the filters panel
- web `Races` now renders real monthly and yearly calendar views backed by authenticated race data, with compact monthly day cards, a yearly 12-month overview that uses race-status color cues on the day numbers, direct month picking from the monthly title, and click-through day handling that opens race details directly or a same-day side panel when multiple races exist
- web `Races` also includes a real card-based list mode grouped by year, with a sticky right-side filters panel, independent collapse controls for each year, a `Coming Up` card for registered races, and a dedicated `Bucket List` modal opened from the page header instead of mixing in-list races into the main yearly list
- web `Races` now also includes an add-race drawer with three tabs for `Race data`, `Race results`, and `Race analysis`, but creation now starts in a status-first state where only `Race status` is shown until the user chooses it
- web `Races` creation and edit now require `race type` for every status, mark that selector as required in the form, rename the `IN_LIST` status copy to `Add to Bucket List`, and let the managed `race type`, `team`, `circuit`, and `shoe` selectors be searched directly inside the dropdowns
- web `Races` now reuses that same three-tab drawer for editing, with prefilled values, full-field editing parity with create, and access from both the card menu and the race-details drawer
- web `Races` now also includes a dedicated race-details drawer opened from the row itself, from calendar day interactions, or from the same-day side panel, with the same three tabs plus direct `Edit` and `Delete` actions in the header
- web `Races` create flows now also let the user manage `race types`, `teams`, `circuits`, and `shoes` directly inside the creation UI, including inline create, edit, delete, usage inspection, product-native confirmation modals, illustrated empty states when no options exist yet, and visible race-type target distances in the managed race-type lists
- web `Races` now refreshes its list and filter sources immediately after a race is created so the new row appears without a manual browser refresh, while only widening already-active filters instead of unexpectedly narrowing the page to the new race type
- web `Races` time presentation now hides seconds and uses `AM/PM` where race start time is shown in the creation flow and in the race-details drawer
- web `Best Efforts` now shows ranked race-type categories backed by authenticated best-effort data, keeps `Race types` as a sticky collapsible filter with inline management, surfaces per-category `valid` / `below target` / `excluded` / `total` counters with explanatory tooltips, supports `Top 3`, `Top 5`, and `All races` modes, reuses the shared race-details drawer plus edit/delete flows from the races feature, and shows managed race-type target distances in the same way as the races drawer
- mobile `Races` now mirrors the same top-level switcher pattern and renders real monthly and yearly calendars backed by the same authenticated race data, with a compact per-day monthly summary and a single-column yearly overview adapted for smaller screens
- mobile `Races` also includes a real table mode with a compact card layout, the same `Coming Up` weekly logic for registered races, a shared race-filters sheet for both table and calendar, and a three-dot action menu on each race card
- mobile `Races` filters now keep `Scope` as a switcher but use dropdowns for `Race status` and `Race types`, with multi-select behavior for both backend-backed filters
- mobile `Races` now also includes an add-race modal with the same three functional tabs, required-field indicators, guided date/time selection, and the same optional `team`, `circuit`, and `shoe` selectors used in the web drawer
- mobile `Races` now also mirrors the managed-option flows for `race types`, `teams`, `circuits`, and `shoes`, including in-place create/edit/delete, linked-record usage previews, and native confirmation modals instead of system dialogs
- web `Pending Approvals`, `Users`, and `Overview` now all use the same page-title hierarchy, standalone content-card layout, and current admin data instead of the older placeholder structure, while `Pending Approvals` and `Users` also share the same collapsible filter-card treatment introduced in `Races`
- mobile `Pending Approvals`, `Users`, and `Overview` now also show real admin data with actions and pagination

## System

## Best Efforts

### `GET /api/best-efforts`

Authenticated endpoint that returns the current user's best-effort categories grouped by race type.

Current behavior:

- groups races by normalized race-type name
- infers the category target distance from the race-type label when possible
- orders races inside each category by:
  1. chip time
  2. shortest pace
  3. official time
  4. oldest race date
- marks each race with a ranking note such as:
  - `Valid for ranking`
  - `Below category distance`
  - `Excluded from category ranking`
- counts valid races per category and returns the full ranked list so the clients can show top cards and longer rankings from the same payload

Current ranking note rules:

- `Excluded from category ranking` when `is_valid_for_category_ranking = false`
- `Below category distance` when the race is still category-valid but its `realKm` is below the minimum accepted distance
- `Valid for ranking` when the race is category-valid, has chip time, and meets the inferred minimum accepted distance

Current minimum accepted distance rule:

- the backend currently uses `target distance - 0.20 km`

Response shape:

```json
{
  "categories": [
    {
      "categoryKey": "10k",
      "categoryName": "10K",
      "expectedDistanceKm": 10.0,
      "validEffortCount": 6,
      "totalEffortCount": 8,
      "efforts": [
        {
          "raceId": "0f5f0c4f-8e61-4d32-9c0d-5f7e2b0c0d11",
          "raceName": "City 10K",
          "raceDate": "2024-04-07",
          "raceTypeName": "10K",
          "realKm": 10.0,
          "chipTimeSeconds": 2525,
          "officialTimeSeconds": 2532,
          "pacePerKmSeconds": 253,
          "generalClassification": null,
          "isGeneralClassificationPodium": false,
          "ageGroupClassification": null,
          "isAgeGroupClassificationPodium": false,
          "teamClassification": null,
          "isTeamClassificationPodium": false,
          "validForBestEffortRanking": true,
          "rankingNote": "Valid for ranking",
          "classificationPodium": false,
          "classificationGoodPosition": false,
          "overallRank": 1
        }
      ]
    }
  ]
}
```

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/best-efforts`
- Auth: Bearer token required

Notes:

- the current web client hides `excluded` races from the main podium/table ranking views, but still exposes their count and a filtered modal list
- clicking a best-effort race in the web modal reuses the same race-details drawer, edit drawer, and delete flow used in `Races`

### `GET /api/health`

Public endpoint that checks if the backend is alive.

Expected response:

```json
{
  "status": "ok"
}
```

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/health`
- Auth: none

### `GET /api/db-check`

Admin-only technical endpoint that confirms database access and returns basic database details.

Expected response example:

```json
{
  "database": "ritmarunners",
  "raceCount": 0
}
```

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/db-check`
- Auth: `Bearer Token`
- Token: admin token only

## Auth

### `POST /api/auth/login`

Authenticates a user and returns a JWT token plus the current user profile.

Postman:

- Method: `POST`
- URL: `{{baseUrl}}/api/auth/login`
- Header: `Content-Type: application/json`
- Auth: none
- Body:

```json
{
  "email": "admin@ritma.com",
  "password": "pass1234"
}
```

Expected response example:

```json
{
  "token": "jwt-token",
  "expiresInMinutes": 120,
  "user": {
    "id": "uuid",
    "email": "admin@ritma.com",
    "role": "ADMIN",
    "forcePasswordChange": false
  }
}
```

Practical Postman use:

- log in
- copy the returned token
- store it in `{{token}}`

### `POST /api/auth/request-account`

Creates a new user request with `account_status = PENDING`.

This endpoint:

- validates the email
- creates a pending `USER`
- stores an encoded temporary password placeholder
- sets `force_password_change = true`
- sends a notification email to the configured RITMA mailbox
- does not allow login yet
- does not send credentials yet

The account must be approved by an admin before it becomes active.

Notification email behavior:

- subject: `RITMA ACCOUNT REQUEST - user_email`
- recipient: `app.mail.notification-to`
- fallback recipient: `SMTP_USER` when no explicit notification mailbox is configured
- body includes the new user's email and asks for review in the administration area

Postman:

- Method: `POST`
- URL: `{{baseUrl}}/api/auth/request-account`
- Header: `Content-Type: application/json`
- Auth: none
- Body:

```json
{
  "email": "new.user@example.com"
}
```

Expected response example:

```json
{
  "message": "Your request has been submitted. An admin must approve the account before sign-in."
}
```

Possible existing-account response:

- if the email already exists and is still `PENDING`, the API returns:

```text
This account is still pending administrator approval. Please wait.
```

### `GET /api/auth/me`

Returns the authenticated user profile for the current token.

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/auth/me`
- Auth: `Bearer Token`
- Token: `{{token}}`

Expected response example:

```json
{
  "id": "uuid",
  "email": "user@ritma.com",
  "role": "USER",
  "forcePasswordChange": false
}
```

### `POST /api/auth/change-password`

Changes the current authenticated user's password.

Used mainly for the forced password change flow after first login.

This endpoint:

- validates current password
- validates strong password rules
- updates the encoded password
- sets `force_password_change = false`

Strong password rule:

- at least 8 characters
- uppercase
- lowercase
- number
- symbol

Postman:

- Method: `POST`
- URL: `{{baseUrl}}/api/auth/change-password`
- Header: `Content-Type: application/json`
- Auth: `Bearer Token`
- Token: `{{token}}`
- Body:

```json
{
  "currentPassword": "TempPass123!",
  "newPassword": "NewStrongPass123!"
}
```

Expected response:

- `204 No Content`

### `POST /api/auth/logout`

Ends the current authenticated session from the client point of view.

Current note:

- the backend keeps this endpoint available so web and mobile can close the session consistently
- it does not currently persist any extra logout activity or audit history

Postman:

- Method: `POST`
- URL: `{{baseUrl}}/api/auth/logout`
- Header: `Content-Type: application/json`
- Auth: `Bearer Token`
- Token: `{{token}}`
- Body:

```json
{}
```

Expected response:

- `204 No Content`

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
    "analysisNotes": "Solid pacing and good race management overall.",
    "wouldRepeatThisRace": true
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
    "analysisNotes": "Solid pacing and good race management overall.",
    "wouldRepeatThisRace": true
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
    "analysisNotes": "Weather and terrain made the race tougher than expected.",
    "wouldRepeatThisRace": false
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

## Admin

All endpoints below are `ADMIN` only.

### `GET /api/admin/overview`

Returns the current admin overview metrics used by the web and mobile admin dashboards.

This endpoint currently returns:

- total active users
- total active admins
- total active non-admin users
- distinct website accesses for the current day
- active users today
- weekly average of distinct website accesses
- new registrations created in the last 7 days

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/admin/overview`
- Auth: `Bearer Token`
- Token: admin token

Expected response example:

```json
{
  "totalUsers": 16,
  "totalAdmins": 2,
  "totalNonAdmins": 14,
  "dailyWebsiteAccesses": 1,
  "activeUsersToday": 1,
  "weeklyAverageWebsiteAccesses": 0.14285714285714285,
  "newRegistrationsLast7Days": 16
}
```

Current client usage:

- web `Overview` consumes `/api/admin/overview`, highlights `Pending approvals`, shows the top-level admin metrics, and renders a preview of up to 5 pending approvals with inline approve/reject actions
- mobile `Overview` consumes `/api/admin/overview`, shows the same top metrics, and renders a compact preview of up to 5 pending approvals with inline approve/reject actions
- both clients refresh the dashboard after approve/reject actions so the counters and pending preview stay aligned

### `GET /api/admin/account-requests`

Legacy-compatible endpoint for the temporary admin page.

### `GET /api/admin/pending-approvals`

Lists all users currently waiting for admin approval.

Optional query params:

- `search`
  filters pending rows by partial email match, case-insensitive
- `olderThanThreeDays`
  when `true`, only returns pending requests whose `created_at` is older than 3 days

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/admin/pending-approvals`
- Auth: `Bearer Token`
- Token: admin token

Example with filters:

```text
{{baseUrl}}/api/admin/pending-approvals?search=pending11&olderThanThreeDays=true
```

Expected response example for `/api/admin/pending-approvals`:

```json
[
  {
    "id": "uuid",
    "email": "new.user@example.com",
    "accountStatus": "PENDING",
    "requestedAt": "2026-03-13T12:00:00Z"
  }
]
```

Compatibility note:

- `GET /api/admin/account-requests` returns the same pending rows using the existing `createdAt` field name
- `GET /api/admin/pending-approvals` returns the same pending rows using the page-oriented `requestedAt` field name
- both `GET /api/admin/account-requests` and `GET /api/admin/pending-approvals` now accept the same `search` and `olderThanThreeDays` filters

Current client usage:

- web `Pending Approvals` currently consumes the stable `/api/admin/account-requests` endpoint, formats `createdAt` into a relative time label such as `15h 4min ago`, exposes a `Races`-style filters panel with the same search icon and a collapsible `Request age` toggle group, and keeps those filters only across refresh of the same page
- mobile `Pending Approvals` consumes the same stable `/api/admin/account-requests` endpoint, applies the same relative-time formatting, and exposes a compact filter panel with email search and an `older than 3 days` toggle
- both clients paginate the rendered list locally with a maximum of 10 pending users per page
- both clients show a warning indicator when the pending request is older than three days

### `GET /api/admin/users`

Lists active users for the admin user-list area.

This endpoint:

- returns users whose `account_status` is `ACTIVE`
- includes the user's email
- includes the user's role
- includes `lastLoginAt`
- returns `lastLoginAt = null` for users who have never logged in after this tracking field was introduced

Backend note:

- successful `POST /api/auth/login` now updates `last_login_at` for the authenticated user

Optional query params:

- `search`
  filters active users by partial email match, case-insensitive
- `onlyAdmins`
  when `true`, only returns rows whose role is `ADMIN`
- `staleOnly`
  when `true`, only returns rows whose `last_login_at` is older than 1 year

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/admin/users`
- Auth: `Bearer Token`
- Token: admin token

Example with filters:

```text
{{baseUrl}}/api/admin/users?search=admin&onlyAdmins=true&staleOnly=true
```

Expected response example:

```json
[
  {
    "id": "uuid",
    "email": "admin@ritma.com",
    "role": "ADMIN",
    "lastLoginAt": "2026-03-17T17:20:00Z"
  },
  {
    "id": "uuid",
    "email": "user@ritma.com",
    "role": "USER",
    "lastLoginAt": null
  }
]
```

Current client usage:

- web `Users` consumes `/api/admin/users`, formats `lastLoginAt` into relative labels such as `2 days ago`, exposes a `Races`-style filters panel with the same search icon plus collapsible `Role` and `Activity` groups, and keeps those filters only across refresh of the same page
- mobile `Users` consumes `/api/admin/users`, applies the same relative-time formatting, and exposes a compact filter panel with email search, `Only admins`, and `Inactive for over 1 year`
- both clients paginate the rendered list locally with a maximum of 10 active users per page
- both clients show a warning indicator when the last login is older than one year

### `POST /api/admin/account-requests/{userId}/approve`

Legacy-compatible endpoint for the temporary admin page.

### `POST /api/admin/pending-approvals/{userId}/approve`

Approves a pending account.

This endpoint:

- validates that the account is still pending
- generates a temporary password
- sends the approval email with the temporary password and the approved user's email in the greeting
- changes `account_status` to `ACTIVE`
- keeps `force_password_change = true`

Approval email behavior:

- subject: `RITMA account access`
- recipient: approved user's email
- body confirms approval, includes the generated temporary password, and instructs the user to change password as soon as possible

Postman:

- Method: `POST`
- URL: `{{baseUrl}}/api/admin/pending-approvals/{{userId}}/approve`
- Auth: `Bearer Token`
- Token: admin token
- Body: none

Expected response:

- `204 No Content`

Practical flow:

1. call `GET /api/admin/pending-approvals`
2. copy the pending `id`
3. store it in `{{userId}}`
4. call approve

### `DELETE /api/admin/account-requests/{userId}`

Legacy-compatible endpoint for the temporary admin page.

### `DELETE /api/admin/pending-approvals/{userId}`

Rejects a pending account request by deleting the pending user.

Postman:

- Method: `DELETE`
- URL: `{{baseUrl}}/api/admin/pending-approvals/{{userId}}`
- Auth: `Bearer Token`
- Token: admin token

Expected response:

- `204 No Content`

## Suggested Postman Test Order

1. `GET /api/health`
2. `POST /api/auth/request-account`
3. `POST /api/auth/login` as admin
4. `GET /api/admin/pending-approvals`
5. `POST /api/admin/pending-approvals/{userId}/approve`
6. login with the approved user credentials received by email
7. `GET /api/auth/me`
8. `POST /api/auth/change-password`
9. `GET /api/admin/users`
10. `GET /api/db-check`

## Notes

- `Request Account` creates a pending account, not an active account.
- Approval is required before login.
- Temporary credentials are only sent on admin approval.
- Request-account submissions also trigger an internal notification email to the configured RITMA mailbox.
- Forced password change is part of the first-login security flow.
- `last_login_at` is now updated on successful login and is used by the admin `Users` screens in both clients.
- the admin `Overview` is now focused on metrics and pending approvals only; it no longer includes embedded technical diagnostics or recent-activity tracking
- the older admin diagnostics page and backend system-health endpoint have been removed from the product
- `/api/races` is still a technical preview endpoint and should later be restricted by authenticated user context.
- `/api/races/create/options` now exists to keep create-race dropdown data aligned between backend, web, and mobile.
- The login and account-request frontend now use more user-friendly validation and error messages than the raw HTTP responses.
