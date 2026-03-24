# Changelog

This file keeps a short, slightly more detailed record of what was done in each relevant commit.

## Format

- One entry per relevant commit
- English only
- Keep it concise
- Focus on what changed and why it matters

## Entries

### `current` - Expand race creation and in-list handling across backend, web, and mobile

- Extended the authenticated `POST /api/races` backend flow so race creation now supports optional `team`, `circuit`, and `shoe` relations, validates ownership for those linked entities, and allows `raceDate` to stay empty only when the selected `raceStatus` is `IN_LIST`.
- Added a new authenticated `GET /api/races/create/options` backend endpoint that returns the race-creation selectors needed by the clients in a single response, including available `raceTypes`, `teams`, `circuits`, and `shoes`.
- Refined the web add-race drawer with stronger create-time validation, automatic time formatting and pace calculation, status-aware required indicators, field-level validation feedback, inline podium checkbox placement, contextual help for ambiguous fields, and richer filtering/display rules for `IN_LIST` races.
- Brought the same creation parity to mobile by extending the add-race modal with the same three-tab flow, linked selectors for `team`, `circuit`, and `shoe`, guided date/time input, info helpers, automatic time formatting, and `IN_LIST` behavior aligned with the web client.
- Updated both web and mobile race-table views so undated `IN_LIST` races no longer behave like missing data, remain hidden by default unless filtered by `IN_LIST`, and use more user-friendly date-badge copy when no race date exists yet.

### `c447603` - Refine races filters, actions, and admin entry cleanup across web and mobile

- Removed the leftover admin diagnostics flow from the product by deleting the web `/admin/diagnostics` route, the diagnostics page and service, and the backend technical diagnostics controller that exposed the old admin-only system-health endpoint.
- Corrected authenticated entry behavior so regular users now always land on `Races` after login, while admins land on the admin overview using the authenticated role returned by the login response instead of stale in-memory state.
- Extended backend race querying so both `/api/races/table` and the calendar endpoints now support shared race filters for `raceStatus` and `raceTypeId`, keeping the dedicated `Current year` / `All years` and `Monthly` / `Yearly` mode controls separate from those reusable filters.
- Reworked the web `Races` header to use a dedicated search field plus an icon-only filters drawer, added removable active-filter chips, and moved row management to a lighter action model with visible `view` plus a three-dot menu for `edit` and `delete`.
- Brought the same filtering model to mobile `Races` with a shared filter sheet for table and calendar, local name search in table mode, compact action handling through a three-dot menu, and tighter race-card presentation without duplicated month labels or extra race-type styling.

### `2ef36b0` - Add races table mode across backend, web, and mobile

- Added an authenticated `/api/races/table` flow in the backend, including grouped yearly responses, race-type option loading, single-row updates, batch deletion support, and extra table fields such as `location`, `officialTimeSeconds`, `raceTime`, and `raceStatus`.
- Reworked the web `Races` area so it now opens by default in `Table` mode, shows a card-based yearly list instead of a classic grid, keeps a header-level `Current year` / `All years` scope selector, and lets each race be managed directly with icon actions for view, edit, and delete.
- Added a `Coming Up` section on the web table view that prioritizes `REGISTERED` races in the current Monday-to-Sunday week and otherwise falls back to the next upcoming registered race, with a live `starts in ...` countdown and status-aware presentation.
- Implemented the same real `Table` mode on mobile, made it the default `Races` entry state, mirrored the weekly `Coming Up` logic, and added a filter-sheet experience with switcher-style controls for calendar mode and table scope.
- Simplified the mobile table cards into a more compact layout by trimming secondary metrics from the main card body, tightening spacing, shortening long race names with ellipsis, and moving filtering into a shared header icon for both `Calendar` and `Table`.

### `f257c49` - Add yearly races calendar on the web client

- Added an authenticated `GET /api/races/calendar/yearly` endpoint that returns the logged-in user's races for a selected year, grouped by month and day so the web client can render a full-year calendar without extra client-side reshaping.
- Implemented a separate web `Yearly` calendar mode with its own components, year navigation, a 12-month overview grid, and per-day circular markers that use the prioritized race status color when that day has races.
- Aligned yearly calendar behavior with the monthly mode by reusing shared race-priority rules, keeping the current month highlighted, and marking the current day inside the yearly overview with the same orange accent treatment.

### `258d09f` - Add mobile yearly races calendar and refine calendar highlights

- Extended the yearly calendar flow to mobile with real year loading, single-column month cards, compact status-colored day markers, and spacing refinements so the full-year view remains readable on smaller screens.
- Refined shared calendar highlighting so current-day and status-priority cues stay visually aligned between the web and mobile yearly experiences.

### `3a4146e` - Refine races calendar across web and mobile

- Refined the web monthly `Races` calendar into a tighter, cleaner layout with smaller month navigation controls, a top-row calendar-mode dropdown, fixed-height day cells, single-race summarization, status-colored cards, race-type display, and overflow handling for crowded days.
- Added the first real mobile monthly `Races` calendar flow backed by the same authenticated `/api/races/calendar` endpoint, including shared month loading, top-level `Calendar` / `Table` switching, and a `Monthly` / `Yearly` mode selector.
- Adapted the mobile monthly calendar for a compact touch-first presentation with centered month navigation, smaller controls, stable day-card sizing, softened current-day highlighting, and day summaries that prioritize the earliest or most relevant race status while showing only the race count indicator.

### `b82b3e3` - Add monthly races calendar on the web client

- Added a new authenticated `GET /api/races/calendar` endpoint that returns the logged-in user's races for a selected month, grouped by day and enriched for calendar rendering.
- Reworked the web `Races` calendar mode from a placeholder into a real monthly calendar with month navigation, a `Monthly` / `Yearly` mode dropdown prepared for future growth, and compact day cells that summarize the day's races.
- Refined the web calendar presentation with tighter sizing, single-card-per-day summarization, race-type display instead of race status, ellipsis handling for long labels, and a more stable fallback when the calendar request fails.

### `cf65b13` - Prepare races view switching on web and mobile

- Reworked the web `Races` page into a structured base with a page-level view state, an icon-only top switcher, and separate `Calendar` and `Table` view components so the feature can evolve without concentrating everything in one file.
- Added the same base `Races` view-switching structure to mobile, including an icon-only switcher aligned to the page title and separate placeholder components for the future calendar and table experiences.
- Refined mobile page spacing by giving the main screen titles more top breathing room and by reducing the visual weight of the `Users` and `Pending Approvals` counters.

### `3de0665` - Refine admin overview across web and mobile

- Reworked the admin `Overview` in the web client into a real dashboard with key account metrics, a pending-approvals preview, inline approve/reject actions, a compact icon-only refresh control, and direct navigation to the full pending-approvals page.
- Brought the mobile admin `Overview` in line with the web version by showing the same top metrics, a pending-approvals preview, inline approve/reject actions, and a shortcut into the full mobile pending-approvals screen.
- Simplified the admin dashboard scope by removing the temporary `Recent activity` and `System status` sections from the overview experience in both clients and by cleaning up the temporary backend activity-tracking table with a follow-up database migration.
- Kept the authenticated logout flow available in both clients through a backend `POST /api/auth/logout` endpoint so session handling remains consistent without exposing technical behavior in the UI.

### `0929d52` - Add admin filters across web and mobile

- Added backend filtering support for admin `Users` and `Pending Approvals`, including email search, `onlyAdmins`, stale-login filtering for users inactive for more than one year, and pending-request filtering for requests older than three days.
- Reworked the web `Users` and `Pending Approvals` pages to use a dedicated filters panel, backend-backed filter params, local fallback filtering, and warning indicators for stale rows directly in the tables.
- Added mobile-first filter panels to the `Users` and `Pending Approvals` screens with compact toggles, reset actions, search by email, role and stale-login filters for users, and older-than-three-days filtering for pending approvals.

### `c1d89e5` - Add admin users list across backend web and mobile

- Added backend tracking for `last_login_at`, updated successful login to persist the latest login time, and introduced an admin-only `/api/admin/users` endpoint that lists active users with email, role, and last login.
- Replaced the web `Users` placeholder with a real admin table showing active users, relative last-login formatting, 10-row pagination, green count styling, role-specific badges, and a stale-login warning icon for users inactive for more than one year.
- Added the same real `Users` admin flow to mobile with active-user loading, relative last-login formatting, 10-row pagination, matching pagination button states, role-specific badges, and a stale-login warning icon for users inactive for more than one year.

### `7c0e01d` - Add admin pending approvals across backend web and mobile

- Added a dedicated backend admin module for `Pending Approvals` with a new `/api/admin/pending-approvals` endpoint family while keeping the older `/api/admin/account-requests` endpoints working for compatibility.
- Covered the new pending-approval admin service with unit tests for listing, approving, rejecting, and invalid-state validation so the new admin page can be wired with more confidence.
- Replaced the web `Pending Approvals` placeholder with a real admin table, relative request-time formatting, 10-row pagination, approval and rejection actions, and the final styling now used in the admin area.
- Added the same `Pending Approvals` admin flow to mobile with live data loading, relative request-time formatting, 10-row pagination, refresh support, and approve/reject actions against the existing admin account-request endpoints.
- Fixed authenticated layout sizing in the web shell so admin and authenticated pages no longer create horizontal page scroll beside the fixed sidebar.

### `197c8a8` - Add authenticated web and mobile app shells

- Added persisted mobile authentication with session restore, authenticated navigation, forced password change handling, logout support, and local storage for the current session.
- Replaced the temporary authenticated web view with a real shell: fixed sidebar, active states, account actions, `Races` and `Best Efforts` navigation, and lightweight `Profile` and `Settings` placeholders.
- Added matching mobile authenticated navigation with a fixed top bar, fixed bottom navigation, fullscreen menu page, and route-driven switching between `Races`, `Best Efforts`, `Profile`, and `Settings`.

### `fb130ab` - Add admin navigation structure across web and mobile

- Added admin-only navigation structure to both clients with an `Admin Area` dropdown group and placeholder subpages for `RITMA Overview`, `User List`, and `Pending Approvals`.
- Refined the authenticated navigation polish across clients by tightening menu ordering, icon treatment, active states, logo sizing, and top-spacing behavior on public mobile screens.

### `e9e9183` - Refine admin labels and web session persistence

- Aligned frontend and mobile login, request-account, and forced-password-change flows so both clients now use the same messages, visual states, and first-login password-change behavior.
- Made the web `Remember me` checkbox effective by storing the auth token in `localStorage` only when requested and falling back to session-only persistence otherwise.
- Simplified admin submenu copy across clients to `Overview` and `Users`, and removed the extra logo from the mobile fullscreen hamburger menu.
- Reworked the public `Future Goals` presentation in frontend and mobile to center the RITMA logo more prominently and keep the public product overview visually consistent.
- Added account-request notification emails for the configured RITMA mailbox, updated approval email copy sent to approved users, and made the notification recipient fall back safely to `SMTP_USER`.
- Replaced the default Vite tab icon with the RITMA logo so the browser tab now matches the product branding.

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
- Moved the existing authentication, session handling, admin access, and protected routing into the new frontend architecture instead of duplicating them.
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
- Added role-aware access control for `ADMIN` and `USER`.
- Added backend auth endpoints for login and current-user retrieval using the existing PostgreSQL users table.
- Added frontend authentication state, login page, and protected routes.
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
