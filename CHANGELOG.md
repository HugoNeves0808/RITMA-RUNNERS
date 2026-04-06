# Changelog

This file keeps a short, slightly more detailed record of what was done in each relevant commit.

## Format

- One entry per relevant commit
- English only
- Keep it concise
- Focus on what changed and why it matters

## Entries

### `current` - Improve web races performance and document the latest races flow

- Improved perceived performance in the web `Races` experience by stopping hidden list-mode work while `Calendar` is active, avoiding unnecessary table polling, and only mounting the sidebar race-type management drawer when it is actually opened.
- Reduced modal and drawer close/open latency in web `Races` by destroying heavy drawer content when hidden, removing synchronous React `flushSync` commits from race-detail open flows, and isolating race-detail state changes from the heavier list rendering path.
- Reduced repeated list-mode backend work in web `Races` by separating the `Bucket List` fetch from the normal table-filter fetches, so search and filter changes no longer re-request the in-list dataset every time.
- Lowered list-mode render cost in web `Races` by replacing per-row overflow observers with on-demand overflow checks, memoizing the main derived race collections, and lazy-loading route pages so the `Races` screen and related pages are no longer bundled into the initial route payload.

- Refined the web `Races` filters so the page now opens with a truly neutral filter state, showing all races without auto-selecting existing `race status` values while still preserving the same refresh-only filter persistence and clear-on-leave behavior.
- Completed the web `Bucket List` modal actions by adding the same per-race `Edit` and `Delete` menu used in the main `Races` cards, so in-list races now support the full management flow directly from the grouped modal.
- Updated the web `Best Efforts` podium rendering so every category keeps a visible `Top 3` / `Top 5` podium layout even when there are not enough valid races yet, filling missing slots with informative empty-state cards instead of collapsing the board.
- Reworked the web `Races` list around a dedicated `Bucket List` flow by moving `IN_LIST` races out of the main status filters and yearly list, adding a header-level `Bucket List` action with a modal, grouping bucket-list races by `race type` inside collapsible sections, and aligning the add-race status copy so `IN_LIST` now reads as `Add to Bucket List` in the creation flow.
- Refined the web `Races` post-create refresh behavior so saving a race now reloads the table and filter sources immediately, clears stale name search, keeps the new race visible by widening only already-active filters, and avoids unexpectedly narrowing the page to the newly created `race type`.
- Polished the web `Races` yearly headers with lighter centered year labels, click-anywhere collapse toggles, and subtle orange fade lines that frame each year without competing with the race cards below.
- Refined the web `Races` creation and edit flows so `race type` is now mandatory for every race status, its selector shows a required marker, and the managed `race type`, `team`, `circuit`, and `shoe` pickers are all searchable for faster selection in large option lists.
- Fixed managed `race type` loading so both the web `Races` drawer and the `Best Efforts` race-type manager now receive and display the real saved `targetKm`, while the race-type lists always show a second metadata row and the `Best Efforts` modal now uses the same illustrated empty state as the other managed-option dialogs.
- Reworked the web `Races` list presentation so `In List (with date)` and `In List (without date)` now share the same top `In List` section, undated entries are hidden when a specific year is selected, the `In List` rows use a lighter two-line layout with status badges and full short dates, and each yearly section can be collapsed independently while starting open by default.
- Reworked the web `Races` filters into collapsible checkbox sections for `Years`, `Race status`, and `Race types`, replaced the old calendar-mode dropdown with a real switcher, moved undated `In List` races into a top collapsed section, and aligned the `In List (without date)` visibility strictly with the selected status filter.
- Added direct race-type management from the web `Races` filters by wiring the `Race types` edit icon to the same create/edit/delete modal used in the race drawer, while moving that managed-options modal outside the drawer so it also opens correctly from the filters sidebar.
- Refined web filter persistence and sidebar behavior so `Races`, `Best Efforts`, `Users`, and `Pending approvals` now keep their current filters only across browser refresh, clear them when the user leaves and returns later, and auto-open / auto-collapse each filter section based on whether it currently has any active selections.
- Unified the web filter design across `Races`, `Best Efforts`, `Users`, and `Pending approvals` with the same sticky sidebar card, search-field icon treatment, orange checkbox styling, section counters, collapsible filter groups, and tighter spacing around inline management actions.
- Added backend support for `targetKm` on user-owned `race types`, including a new Flyway migration, create/update validation, response payload support, and Best Efforts ranking now reading the saved race-type target directly instead of inferring distance from the race-type name.
- Updated the web managed-option flows so race-type modals now expose `target km`, all option-management modals show the same illustrated empty state when no entries exist yet, and the option lists stay visually aligned with the richer Best Efforts management flow.
- Reworked the web add/edit race drawer around a status-first experience: creation now starts with a highlighted `Race status` step, the rest of the form stays hidden until a status is chosen, and `DNS` / `DNF` / `Completed` each reveal only the fields that make sense for that state while hidden sections are also cleared from the submitted payload.
- Refined the web `Race status` dropdown ordering and presentation so the options now follow the intended lifecycle (`In list` -> `Not registered` -> `Registered` -> `Completed` -> `Did not start` / `Did not finish` / `Cancelled`), include visual separators between groups, and use lighter product-aligned hover/selected styling instead of the default blue Ant state.
- Added a real authenticated `Best Efforts` backend flow through `/api/best-efforts`, including category grouping, target-distance inference from race-type names, rank ordering by chip time / pace / official time / oldest race date, and per-race status notes such as `Valid for ranking`, `Below category distance`, and `Excluded from category ranking`.
- Reworked the web `Best Efforts` page into a richer race-performance dashboard with a header-level `Top 3` / `Top 5` / `All races` view switcher, a right-side `Race Type` filter, podium cards for the leading efforts, expandable ranking tables, category counters for `valid`, `below target`, `excluded`, and `total`, and tooltips that explain the ranking logic and minimum accepted distance.
- Added drill-down flows from the web `Best Efforts` page so each category counter opens a filtered race list modal, clicking a race from that list opens the shared race-details drawer, and `Edit` / `Delete` actions continue to work from that drawer while refreshing the underlying Best Efforts lists in place.
- Added lightweight race-type management redundancy to the web `Best Efforts` filters by letting users create, rename, and delete their own `race types` directly from the `Race Type` filter area, reusing the same managed-option backend endpoints and confirmation flow as the race create/edit drawer.
- Tightened race-result validation so web and backend race creation/editing now require `Real KM`, `Chip time`, and `Pace per KM` whenever the selected `raceStatus` is `COMPLETED`, while keeping those fields optional for the other statuses.
- Refined the web `Races` header and filtering layout by renaming the main switcher entry from `Table` to `List`, moving the `List` / `Calendar` switcher out of the filters sidebar and into the page header beside `Add Race`, and tightening the search-field/icon treatment plus header action spacing.
- Polished the web `Races` cards and drawers by removing the visible eye action from cards, making ellipsis tooltips appear only when text is actually truncated, simplifying the three-dot action button chrome, removing the overview-card border inside the race-details drawer, and adding direct month picking from the monthly calendar title.
- Expanded the web calendar interaction model so clicking a day in monthly or yearly mode now opens race details directly for single-race days or a right-side day panel for multi-race days, with a return path back to that day panel after closing race details.
- Reworked the web admin `Users` and `Pending Approvals` pages so their titles and filters now match the `Races` page structure, with standalone table cards, separate sticky filter cards, shared broom reset icons, and the same centered empty-state presentation used in `Races`.
- Aligned the web admin `Overview` page title sizing with the other main pages so the admin landing page now uses the same top-level heading scale as `Races`, `Users`, and `Pending approvals`.
- Merged the old `user_race_results` and `user_race_analysis` data into `user_races` through a new Flyway migration, so race result and analysis fields now live directly on the base race row and no longer depend on per-race child tables.
- Updated backend race reads and writes to use the flattened `user_races` structure for race tables, race details, race creation, race updates, shoe usage lookups, and managed-option detach flows, while keeping the public API payloads stable for the clients.
- Expanded the authenticated `PUT /api/races/{raceId}` flow so race editing now accepts the same full payload as race creation, including `race`, `results`, and `analysis`, instead of the older table-only subset of fields.
- Reworked the web race-edit experience to reuse the same multi-tab drawer used by `Add race`, prefilled with the selected race data and available from both the card three-dot menu and the race-details drawer header.
- Refined the web edit-navigation flow so closing the edit drawer reopens the race-details drawer when the edit was launched from the race view, keeping the user in the same context.
- Added a defensive fallback for preloaded race dates in the web edit flow so an already saved date is not lost if the form momentarily clears the date field during submission.
- Restored authenticated single-race deletion through `DELETE /api/races/{raceId}` in the backend, with ownership checks and a `404` response when the requested race does not exist.
- Reintroduced the web race-deletion flow in the `Races` table, including a `Delete race` option in the three-dot card menu, a matching delete action in the race-details drawer, and a confirmation modal before the request is sent.
- Kept the web `races` feature on local unauthorized-error handling instead of automatic logout, so an expired session now surfaces as an in-page error state instead of kicking the user out while they are working.
- Increased the local JWT lifetime in the tracked development `.env` from `120` minutes to `10080` minutes so local sessions stay alive for 7 days during development and testing.
- Hardened local database startup after the Flyway-history reset scenario by forcing both the datasource and Flyway to use the `public` schema explicitly in backend configuration.
- Reworked the web `Races` page filters into a right-side `Filters` panel with active chips above the page content, a text `Add Race` action aligned to the header right edge, and default `All years` scope instead of opening the table on the current year.
- Refined the web `Races` filter behavior so `All years` and individual years are mutually exclusive inside the multi-select, the default year chip stays hidden when it is only the implicit scope, and removing the last selected year while other filters remain active now falls back to `All years`.
- Split `IN_LIST` handling in the web `Races` status filter into `In List (with date)` and `In List (without date)`, kept the undated variant unavailable in `Calendar` view, and rendered undated `In List` rows as a separate section between `Coming Up` and the remaining yearly groups.
- Polished the web `Races` presentation with compact filter chips, a centered inline loader in the table container, orange loading indicators, section-level info tooltips for `Coming Up` and `In List`, lighter status-copy updates such as `Did not start` / `Did not finish`, and cleaner filter-select presentation.

### `previous` - Expand race creation and in-list handling across backend, web, and mobile

- Extended the authenticated `POST /api/races` backend flow so race creation now supports optional `team`, `circuit`, and `shoe` relations, validates ownership for those linked entities, and allows `raceDate` to stay empty only when the selected `raceStatus` is `IN_LIST`.
- Added a new authenticated `GET /api/races/create/options` backend endpoint that returns the race-creation selectors needed by the clients in a single response, including available `raceTypes`, `teams`, `circuits`, and `shoes`.
- Added a new authenticated `GET /api/races/{raceId}` backend endpoint that returns the full race detail payload from the base race, results, and analysis tables for the new web race-details drawer.
- Refined the web add-race drawer with stronger create-time validation, automatic time formatting and pace calculation, status-aware required indicators, field-level validation feedback, inline podium checkbox placement, contextual help for ambiguous fields, and richer filtering/display rules for `IN_LIST` races.
- Refined the web add-race time input so the race start time picker no longer exposes seconds and now uses a clearer `AM/PM` presentation while still storing the backend-compatible value.
- Brought the same creation parity to mobile by extending the add-race modal with the same three-tab flow, linked selectors for `team`, `circuit`, and `shoe`, guided date/time input, info helpers, automatic time formatting, and `IN_LIST` behavior aligned with the web client.
- Updated both web and mobile race-table views so undated `IN_LIST` races no longer behave like missing data, remain hidden by default unless filtered by `IN_LIST`, and use more user-friendly date-badge copy when no race date exists yet.
- Added authenticated option-management endpoints for user-owned `race types`, `teams`, `circuits`, and `shoes`, including inline create, rename, delete, usage inspection, and detach-then-delete flows when an option is already linked to race records.
- Reworked the web create-race option pickers so each managed selector now opens lightweight in-context management modals, uses product-native confirmation modals instead of browser dialogs, and keeps the option lists synchronized immediately after changes.
- Extended the web `Races` experience so clicking a race card opens the same right-side detail drawer as the eye action, and refined that drawer with tabbed race information, visible header-level edit/delete actions, tooltip-backed ellipsis handling, and `AM/PM` time formatting for existing races.
- Brought the same managed-option flow to mobile by adding inline management actions beside the `race type`, `team`, `circuit`, and `shoe` selectors, native app modals for create/edit/delete confirmation, and live refresh of local create options and race-type filters.
- Refined both web and mobile `Races` table presentation by removing leftover timer noise from `Coming Up`, improving section hierarchy between `Coming Up`, yearly groups, and `In List`, and simplifying card chrome by dropping borders and relying more on status-driven fills.
- Updated the mobile `Races` filters sheet so `Race status` and `Race types` now use dropdown-based selection instead of chip walls, while keeping `Scope` as the existing switcher and preserving multi-select behavior for both dropdown filters.
- Refined the web `Races` table visuals with tighter title overflow handling, lighter `REGISTERED` status coloring, black-and-white `Coming Up` cards, and closer alignment between the filters button and the calendar/table switcher.
- Updated the mobile `Races` table styling to match the latest web direction by keeping status color in badges instead of card backgrounds, tightening switcher sizing, and applying the same lighter `REGISTERED` accent across filters, tables, and calendars.
- Added a native mobile race-details modal backed by the existing authenticated race-detail endpoint, including `Race data`, `Results`, and `Analysis` tabs, card-tap opening, a three-dot dropdown for `Edit` / `Delete`, and scroll-safe detail browsing.

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
