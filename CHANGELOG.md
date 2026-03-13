# Changelog

This file keeps a short, slightly more detailed record of what was done in each relevant commit.

## Format

- One entry per relevant commit
- English only
- Keep it concise
- Focus on what changed and why it matters

## Entries

### `dfd386c` - Add mobile app foundation and refine request account UX

- Added a separate Expo-based `mobile` app foundation with a clean structure for navigation, auth-related services, shared UI components, and theme tokens.
- Implemented the first two mobile screens: a RITMA-aligned login screen and a public `Future Goals` screen adapted for mobile navigation and scrolling.
- Added mobile request-account support against the existing backend, including local API base URL configuration through `EXPO_PUBLIC_API_BASE_URL`.
- Improved the mobile request-account UX with clearer feedback, visible timeout notifications, and safer handling when an email already exists in `PENDING` state.
- Tightened backend request-account behavior so an existing pending account now returns a specific wait-for-admin-approval message instead of a generic duplicate-account error.

### `1530786` - Refine frontend account flows and public product pages

- Improved the request-account and forced-password-change frontend flows with cleaner validation feedback and less duplicated messaging.
- Refined the login experience by switching feature icons to Font Awesome, tightening the right-hand messaging, and adding a development notice that links to a new public roadmap page.
- Added a public `/future-goals` page with tabs for product overview and future plans, and iterated on its layout to use the full page more effectively.
- Expanded the manual test checklist with current frontend scenarios for request account, pending approvals, and forced password change behavior without overwriting existing tested states.
- Added and aligned `RITMAAPIDOCUMENTATION.md` as a working reference for the current API endpoints and request flows.

### `3aa17ea` - Add pending account approval flow and first-login password reset

- Added a request-account flow that creates new users in `PENDING` state, stores a temporary encoded password, and keeps them blocked from sign-in until admin approval.
- Added a temporary admin review page and protected backend endpoints to list pending accounts, approve them into `ACTIVE`, or reject them by deleting the pending record.
- Moved temporary password email delivery to the admin approval step so credentials are only sent after the account has been accepted.
- Added forced password change handling on first login, including a blocking frontend modal, stronger password validation, and automatic logout when an invalid session or deleted user is detected.
- Refined auth-related frontend behavior with request-account modal feedback, protected root routing, and cleanup of session/error handling around password changes.

### `3ec32b0` - Harden health visibility and refine auth testing

- Reduced the public `/api/health` payload to a minimal status response and moved the health probe logic into a dedicated backend component.
- Kept technical diagnostics in protected admin-only endpoints and restricted `/api/db-check` to `ADMIN`.
- Updated Spring Security exception handling so missing or invalid tokens return `401` while authenticated access without the required role returns `403`.
- Refined frontend health handling to work with the reduced public health payload.
- Replaced raw `HTTP 401` login feedback with a user-friendly invalid-credentials message and added a temporary logout button for testing.
- Added and updated an Excel-based test checklist covering current API, auth, authorization, race preview, and frontend validation scenarios.

### `93fcedb` - Improve frontend styling and feature organization

- Migrated page and layout styling from shared global CSS into CSS Modules while keeping the current visual behavior intact.
- Moved page files into per-page folders so each page now colocates its component and styles.
- Consolidated authentication context, hook, and types under `features/auth` to make the auth feature more cohesive.
- Moved the backend health request into a small `features/system` area so domain-specific services no longer live in global `src/services`.
- Kept `services/apiClient.ts` as the shared infrastructure layer for API access across features.

### `5b078bd` - Refine login experience and remove embedded Postman assets

- Removed leftover Postman project folders from the repository and kept them ignored through `.gitignore`.
- Simplified the application shell by removing the global navbar and allowing the login route to use a full-screen layout.
- Reworked the login page into a split-screen experience with a stronger visual hierarchy, persistent branding, and non-functional UI placeholders for remember-password and account request.
- Added a new frontend base font and reused public assets for the login experience, including the updated logo and check icon.
- Replaced the diagnostics-focused login copy with product-oriented messaging about race organization, history tracking, and best performances.

### `1cd6ef8` - Restructure frontend into scalable application architecture

- Reorganized the frontend into `app`, `routes`, `pages`, `components`, `layouts`, `features`, `services`, `hooks`, `contexts`, `types`, `utils`, `constants`, and `assets`.
- Moved the existing authentication, session handling, admin diagnostics access, and protected routing into the new frontend architecture instead of duplicating them.
- Centralized route constants, token storage helpers, shared API access, and shared frontend types for cleaner growth.
- Added feature-oriented foundations for `auth`, `admin`, `races`, `profile`, and `best-efforts`, with real services where needed and placeholders elsewhere.
- Kept the frontend build working while preparing the project to grow by functionality in a cleaner structure.

### `dcd1842` - Restructure backend into modular domain packages

- Reorganized backend packages into domain-focused modules with layered internal structure for auth, security, race, and shared concerns.
- Moved the existing auth and security foundation into dedicated `controller`, `service`, `repository`, `entity`, `dto`, `config`, `jwt`, and `filter` packages.
- Introduced shared backend primitives for exceptions, API error responses, security utilities, and shared enums under `common`.
- Added lightweight service placeholders for planned modules such as user, user settings, race result, race analysis, shoe, team, circuit, race type, profile, and best effort.
- Kept the existing backend functional while preparing the package architecture for incremental business implementation.

### `b95616a` - Add authentication and authorization foundation

- Added JWT-based authentication in the backend with stateless Spring Security configuration.
- Added role-aware access control for `ADMIN` and `USER`, including an admin-only diagnostics endpoint.
- Added backend auth endpoints for login and current-user retrieval using the existing PostgreSQL users table.
- Added frontend authentication state, login page, protected routes, and admin-only diagnostics page visibility.
- Seeded temporary `admin@ritma.com` and `user@ritma.com` accounts through Flyway instead of hardcoding runtime admin creation.

### `316de55` - Add initial PostgreSQL schema integration

- Enabled backend datasource configuration through PostgreSQL environment variables.
- Added Flyway to manage database schema changes from versioned SQL migrations.
- Created the initial PostgreSQL schema for users, settings, races, results, analysis, shoes, teams, circuits, and race types.
- Added primary keys, foreign keys, uniqueness rules, indexes, enum types, and consistency checks in the initial migration.
- Isolated backend tests from the datasource so the Spring context can still be validated without a live database.

### `bfd5311` - Set up separate frontend and backend foundations

- Created a dedicated `frontend` project with Vite, React, and TypeScript.
- Added Ant Design and Font Awesome to match the intended UI stack.
- Replaced the default frontend screen with a project-specific landing page.
- Created a dedicated `backend` Spring Boot project as the initial API base.
- Added Maven Wrapper support so the backend can run without a global Maven installation.
- Aligned the backend with Java 17 to match the current local environment.
- Set the backend default port to `8081` to avoid the existing local conflict on `8080`.
- Added a temporary `GET /api/health` endpoint for frontend-to-backend connectivity checks.
- Connected the frontend to the backend health endpoint and surfaced the result in the UI.
- Added onboarding and run instructions to the project documentation.

### `b2719fe` - Initial commit

- Added the initial repository with the base `README.md`.
