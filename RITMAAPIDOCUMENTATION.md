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
- `/best-efforts`
  Authenticated web section for best efforts.
- `/profile`
  Authenticated web section reserved for profile.
- `/settings`
  Authenticated web section reserved for settings.
- `/future-goals`
  Public product/roadmap page linked from the login screen.
- `/admin-area/ritma-overview`
  Admin-only web placeholder for the RITMA overview area.
- `/admin-area/user-list`
  Admin-only web placeholder for the future user list area.
- `/admin-area/pending-approvals`
  Admin-only web placeholder for the future pending approvals area.
- `/admin/account-requests`
  Temporary admin frontend page used to review pending accounts.

Authenticated client shell status:

- web now uses a fixed left sidebar with admin-aware menu rendering, an `Admin Area` dropdown group for admins, `Races`, `Best Efforts`, account actions, and active route highlighting
- mobile now uses a fixed top bar, fixed bottom navigation, and a fullscreen menu page opened from the hamburger button, including the same admin-only dropdown group and account actions near the end of the menu
- `Admin Area` is currently a grouped navigation label in both clients, not a standalone page or backend endpoint
- both clients currently keep `Races`, `Best Efforts`, `Profile`, `Settings`, `Overview`, `Users`, and `Pending Approvals` as lightweight placeholders while the navigation structure is being established

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

### `GET /api/admin/account-requests`

Lists all users currently waiting for admin approval.

Postman:

- Method: `GET`
- URL: `{{baseUrl}}/api/admin/account-requests`
- Auth: `Bearer Token`
- Token: admin token

Expected response example:

```json
[
  {
    "id": "uuid",
    "email": "new.user@example.com",
    "accountStatus": "PENDING",
    "createdAt": "2026-03-13T12:00:00Z"
  }
]
```

### `POST /api/admin/account-requests/{userId}/approve`

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
- URL: `{{baseUrl}}/api/admin/account-requests/{{userId}}/approve`
- Auth: `Bearer Token`
- Token: admin token
- Body: none

Expected response:

- `204 No Content`

Practical flow:

1. call `GET /api/admin/account-requests`
2. copy the pending `id`
3. store it in `{{userId}}`
4. call approve

### `DELETE /api/admin/account-requests/{userId}`

Rejects a pending account request by deleting the pending user.

Postman:

- Method: `DELETE`
- URL: `{{baseUrl}}/api/admin/account-requests/{{userId}}`
- Auth: `Bearer Token`
- Token: admin token

Expected response:

- `204 No Content`

## Suggested Postman Test Order

1. `GET /api/health`
2. `POST /api/auth/request-account`
3. `POST /api/auth/login` as admin
4. `GET /api/admin/account-requests`
5. `POST /api/admin/account-requests/{userId}/approve`
6. login with the approved user credentials received by email
7. `GET /api/auth/me`
8. `POST /api/auth/change-password`
9. `GET /api/admin/system-health`
10. `GET /api/db-check`

## Notes

- `Request Account` creates a pending account, not an active account.
- Approval is required before login.
- Temporary credentials are only sent on admin approval.
- Request-account submissions also trigger an internal notification email to the configured RITMA mailbox.
- Forced password change is part of the first-login security flow.
- `/api/races` is still a technical preview endpoint and should later be restricted by authenticated user context.
- The login and account-request frontend now use more user-friendly validation and error messages than the raw HTTP responses.
