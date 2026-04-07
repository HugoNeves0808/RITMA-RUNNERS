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
  "email": "admin@example.com",
  "password": "StrongPassword123!"
}
```

Expected response example:

```json
{
  "token": "jwt-token",
  "expiresInMinutes": 10080,
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
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
- does not allow login yet
- does not send credentials yet

The account must be approved by an admin before it becomes active.

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
  "email": "runner@example.com",
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
