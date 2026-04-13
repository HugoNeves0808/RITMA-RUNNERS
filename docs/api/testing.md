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
10. `GET /api/best-efforts`
11. `GET /api/podiums`
12. `GET /api/db-check`

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
- `docs/sql/podium-history-test-data.sql` can be used locally to validate podium history for both the regular and admin seeded accounts.
- The login and account-request frontend now use more user-friendly validation and error messages than the raw HTTP responses.
