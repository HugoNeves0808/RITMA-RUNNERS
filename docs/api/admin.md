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
