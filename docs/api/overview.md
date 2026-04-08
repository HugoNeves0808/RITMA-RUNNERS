# RITMA API Documentation

This document describes the API endpoints currently available in the `RITMA RUNNERS` project, what each one does, and how to test them in Postman.

It also includes a short summary of the current account-access flow because the frontend now combines login, request-account, admin approval, and forced password change in a single user journey.

## Release Context

- Latest completed release: `1.0.0`
- Current milestone in preparation: `2.0.0`
- Latest completed release date: `2026-04-07`
- Current milestone target date: `2026-04-08`
- Phase status: release 1 completed, release 2 in preparation
- API scope: authenticated race management, best efforts, authentication, and admin flows used by both the web and mobile clients

## Base URL

Use this base URL locally:

```text
http://localhost:8081
```

Current backend note:

- the local datasource and Flyway configuration now explicitly target the `public` schema to avoid PostgreSQL `search_path` issues during startup or after recreating Flyway history
- the tracked local `.env` currently sets `JWT_EXPIRATION_MINUTES=10080`, while `application.yml` still keeps `120` as the fallback default when no environment override is provided

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

## Current Access Flow

The current access flow is:

1. a new user submits `Request Account`
2. the backend creates the user with `account_status = PENDING`
3. an admin reviews the request in the admin area
4. the admin approves or rejects the request
5. approval generates a temporary password for the admin to share securely and changes the account to `ACTIVE`
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
  The page now opens in `List` mode by default, keeps the `List` / `Calendar` switcher in the page header beside `Add Race`, includes a header-level `Bucket List` action, uses a right-side `Filters` panel with collapsible checkbox groups for `Years`, `Race status`, and `Race types`, starts from a neutral "show everything" filter state instead of auto-selecting matching statuses, lets the user manage `race types` directly from the filter title, uses a switcher for `Monthly` / `Yearly` calendar mode, and keeps filter state only across refresh of the same page.
  Recent web performance refinements also keep hidden list-mode work from running while `Calendar` is active, split `Bucket List` loading away from normal list-filter refreshes, destroy heavy race drawers when hidden, and lazy-load the page route so `Races` no longer inflates the initial web bundle.
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

Authenticated client shell status:

- web now uses a fixed left sidebar with admin-aware menu rendering, an `Admin Area` dropdown group for admins, `Races`, `Best Efforts`, account actions, and active route highlighting
- mobile now uses a fixed top bar, fixed bottom navigation, and a fullscreen menu page opened from the hamburger button, including the same admin-only dropdown group and account actions near the end of the menu
- `Admin Area` is currently a grouped navigation label in both clients, not a standalone page or backend endpoint
- web `Races` now uses a header-level `List` / `Calendar` switcher beside `Add Race` instead of keeping that view switch inside the filters panel
- web `Races` now renders real monthly and yearly calendar views backed by authenticated race data, with compact monthly day cards, a yearly 12-month overview that uses race-status color cues on the day numbers, direct month picking from the monthly title, and click-through day handling that opens race details directly or a same-day side panel when multiple races exist
- web `Races` also includes a real card-based list mode grouped by year, with a sticky right-side filters panel, independent collapse controls for each year, a `Coming Up` card for registered races, and a dedicated `Bucket List` modal opened from the page header instead of mixing in-list races into the main yearly list
- the web `Races` filters now start unselected so the first load shows all races naturally, while the same session-storage persistence still survives browser refresh and is cleared when the user leaves the page and comes back later
- the web `Bucket List` modal now exposes the same per-race `Edit` and `Delete` action menu as the main `Races` cards, in addition to opening the shared race-details drawer on row click
- web `Races` now also includes an add-race drawer with three tabs for `Race data`, `Race results`, and `Race analysis`, but creation now starts in a status-first state where only `Race status` is shown until the user chooses it
- web `Races` creation and edit now require `race type` for every status, mark that selector as required in the form, rename the `IN_LIST` status copy to `Add to Bucket List`, and let the managed `race type`, `team`, `circuit`, and `shoe` selectors be searched directly inside the dropdowns
- web `Races` now reuses that same three-tab drawer for editing, with prefilled values, full-field editing parity with create, and access from both the card menu and the race-details drawer
- web `Races` now also includes a dedicated race-details drawer opened from the row itself, from calendar day interactions, or from the same-day side panel, with the same three tabs plus direct `Edit` and `Delete` actions in the header
- web `Races` detail opening and closing now avoid the earlier synchronous React commit path, so the shared race-details drawer no longer forces the full list view to do as much blocking work during row clicks and close actions
- web `Races` create flows now also let the user manage `race types`, `teams`, `circuits`, and `shoes` directly inside the creation UI, including inline create, edit, delete, usage inspection, product-native confirmation modals, illustrated empty states when no options exist yet, and visible race-type target distances in the managed race-type lists
- web `Races` now refreshes its list and filter sources immediately after a race is created so the new row appears without a manual browser refresh, while only widening already-active filters instead of unexpectedly narrowing the page to the new race type
- web `Races` time presentation now hides seconds and uses `AM/PM` where race start time is shown in the creation flow and in the race-details drawer
- web route loading now lazy-loads the `Races`, `Best Efforts`, login, profile, settings, and admin pages so those screens are split out of the initial bundle instead of shipping all page code up front
- web `Best Efforts` now shows ranked race-type categories backed by authenticated best-effort data, keeps `Race types` as a sticky collapsible filter with inline management, surfaces per-category `valid` / `below target` / `excluded` / `total` counters with explanatory tooltips, supports `Top 3`, `Top 5`, and `All races` modes, keeps the podium board visible with informative empty slots when a category still lacks enough valid races, reuses the shared race-details drawer plus edit/delete flows from the races feature, and shows managed race-type target distances in the same way as the races drawer
- mobile `Races` now mirrors the same top-level switcher pattern and renders real monthly and yearly calendars backed by the same authenticated race data, with a compact per-day monthly summary and a single-column yearly overview adapted for smaller screens
- mobile `Races` also includes a real table mode with a compact card layout, the same `Coming Up` weekly logic for registered races, a shared race-filters sheet for both table and calendar, and a three-dot action menu on each race card
- mobile `Races` filters now keep `Scope` as a switcher but use dropdowns for `Race status` and `Race types`, with multi-select behavior for both backend-backed filters
- mobile `Races` now also includes an add-race modal with the same three functional tabs, required-field indicators, guided date/time selection, and the same optional `team`, `circuit`, and `shoe` selectors used in the web drawer
- mobile `Races` now also mirrors the managed-option flows for `race types`, `teams`, `circuits`, and `shoes`, including in-place create/edit/delete, linked-record usage previews, and native confirmation modals instead of system dialogs
- web `Pending Approvals`, `Users`, and `Overview` now all use the same page-title hierarchy, standalone content-card layout, and current admin data instead of the older placeholder structure, while `Pending Approvals` and `Users` also share the same collapsible filter-card treatment introduced in `Races`
- mobile `Pending Approvals`, `Users`, and `Overview` now also show real admin data with actions and pagination
