# RITMA API Documentation

This document describes the API endpoints currently available in the `RITMA RUNNERS` project, what each one does, and how to test them in Postman.

It also includes a short summary of the current account-access flow because the frontend now combines login, request-account, admin approval, and forced password change in a single user journey.

## Base URL

Use this base URL locally:

```text
http://localhost:8081
```

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
- `/`
  Authenticated `Races` entry route in the web app.
- `/races`
  Alias route that opens the same authenticated `Races` page in the web app.
  The page now opens in `Table` mode by default, includes a top view switcher for `Calendar` and `Table`, a calendar-mode dropdown for `Monthly` and `Yearly`, and a table-scope dropdown for `Current year` and `All years`.
- `/best-efforts`
  Authenticated web section for best efforts.
- `/profile`
  Authenticated web section reserved for profile.
- `/settings`
  Authenticated web section reserved for settings.
- `/future-goals`
  Public product/roadmap page linked from the login screen.
- `/admin-area/ritma-overview`
  Admin-only web overview dashboard with admin metrics and a pending-approvals preview.
- `/admin-area/user-list`
  Admin-only web area for reviewing the active user list.
- `/admin-area/pending-approvals`
  Admin-only web area for reviewing pending account approvals.
- `/admin/account-requests`
  Temporary admin frontend page used to review pending accounts.

Authenticated client shell status:

- web now uses a fixed left sidebar with admin-aware menu rendering, an `Admin Area` dropdown group for admins, `Races`, `Best Efforts`, account actions, and active route highlighting
- mobile now uses a fixed top bar, fixed bottom navigation, and a fullscreen menu page opened from the hamburger button, including the same admin-only dropdown group and account actions near the end of the menu
- `Admin Area` is currently a grouped navigation label in both clients, not a standalone page or backend endpoint
- web `Races` now has an icon-only switcher that swaps between separate placeholder `Calendar` and `Table` view components
- web `Races` now renders real monthly and yearly calendar views backed by authenticated race data, with compact monthly day cards and a yearly 12-month overview that uses race-status color cues on the day numbers
- web `Races` also includes a real card-based table mode grouped by year, with inline per-race edit/delete actions, a `Coming Up` section for registered races, and header-level `Current year` / `All years` filtering
- mobile `Races` now mirrors the same top-level switcher pattern and renders real monthly and yearly calendars backed by the same authenticated race data, with a compact per-day monthly summary and a single-column yearly overview adapted for smaller screens
- mobile `Races` also includes a real table mode with a compact card layout, the same `Coming Up` weekly logic for registered races, and a filter-sheet icon that exposes `Monthly` / `Yearly` and `Current year` / `All years` switchers depending on the active view
- web `Pending Approvals` and `Users` now show real admin data with actions and pagination, while the admin overview section is still a placeholder
- mobile `Pending Approvals`, `Users`, and `Overview` now also show real admin data with actions and pagination

## System

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

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/races/calendar?year=2026&month=3`
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
- the response now includes `raceTypeName` so the compact day cards can show race type instead of race status
- mobile `Races` monthly calendar also consumes `/api/races/calendar`, requests the visible month from its centered month controls, and uses the returned races to derive each day's compact race-count and status-priority summary

### `GET /api/races/calendar/yearly`

Returns the authenticated user's races for a selected year, grouped by month and day for the yearly calendar experience shared by web and mobile.

Optional query params:

- `year`
  target year for the calendar; defaults to the current year when omitted

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/races/calendar/yearly?year=2026`
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

### `GET /api/races/table`

Returns the authenticated user's races grouped by year for the `Table` experience shared by web and mobile.

Optional query params:

- `scope`
  accepts `current` or `all`
  defaults to `current` when omitted

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/races/table?scope=current`
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
  ]
}
```

Client usage notes:

- web `Races` table consumes `/api/races/table`, opens in `Current year` by default, and renders a card-style list grouped by year instead of a classic spreadsheet layout
- mobile `Races` table consumes the same endpoint, also opens in `Current year` by default, and renders a simplified compact card layout for smaller screens
- both clients use `raceStatus` and `raceTime` to drive the `Coming Up` section, which only considers `REGISTERED` races in the current Monday-to-Sunday week or, when none exist, the next future registered race

### `GET /api/races/types`

Returns the authenticated user's available race types for table editing.

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

### `PUT /api/races/table/{raceId}`

Updates a single race from the table editing flow.

Postman:

- Method: `PUT`
- URL: `{{baseUrl}}/api/races/table/{{raceId}}`
- Header: `Content-Type: application/json`
- Auth: `Bearer Token`
- Token: `{{token}}`

Example body:

```json
{
  "raceDate": "2026-03-20",
  "raceTime": "09:45:00",
  "name": "Corrida de Hoje 2026",
  "location": "Coimbra, Portugal",
  "raceTypeId": "uuid",
  "officialTimeSeconds": 2405,
  "chipTimeSeconds": 2398,
  "pacePerKmSeconds": 240
}
```

### `DELETE /api/races/table`

Deletes one or more races from the table flow.

Postman:

- Method: `DELETE`
- URL: `{{baseUrl}}/api/races/table`
- Header: `Content-Type: application/json`
- Auth: `Bearer Token`
- Token: `{{token}}`

Example body:

```json
{
  "raceIds": [
    "uuid-1",
    "uuid-2"
  ]
}
```

## Admin

All endpoints below are `ADMIN` only.

### `GET /api/admin/system-health`

Protected diagnostics endpoint with technical system information.

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/admin/system-health`
- Auth: `Bearer Token`
- Token: admin token

Expected response example:

```json
{
  "status": "ok",
  "application": "ritma-runners-backend",
  "database": "ritmarunners",
  "serverTime": "2026-03-13T12:00:00Z",
  "currentUser": {
    "email": "admin@ritma.com",
    "role": "ADMIN"
  }
}
```

Current note:

- this endpoint still exists as a standalone technical admin endpoint
- it is no longer embedded in the `Overview` dashboard

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

- web `Pending Approvals` currently consumes the stable `/api/admin/account-requests` endpoint, formats `createdAt` into a relative time label such as `15h 4min ago`, and exposes a filters panel with email search and an `older than 3 days` toggle
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

- web `Users` consumes `/api/admin/users`, formats `lastLoginAt` into relative labels such as `2 days ago`, and exposes a filters panel with email search, `Only admins`, and `Inactive for over 1 year`
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
10. `GET /api/admin/system-health`
11. `GET /api/db-check`

## Notes

- `Request Account` creates a pending account, not an active account.
- Approval is required before login.
- Temporary credentials are only sent on admin approval.
- Request-account submissions also trigger an internal notification email to the configured RITMA mailbox.
- Forced password change is part of the first-login security flow.
- `last_login_at` is now updated on successful login and is used by the admin `Users` screens in both clients.
- the admin `Overview` is now focused on metrics and pending approvals only; it no longer includes embedded system diagnostics or recent-activity tracking
- `/api/races` is still a technical preview endpoint and should later be restricted by authenticated user context.
- The login and account-request frontend now use more user-friendly validation and error messages than the raw HTTP responses.
