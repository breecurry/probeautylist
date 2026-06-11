# Publication Readiness Pass 3

## Purpose

This third pass continues the repeated whole-app quality review on the clean rebuild branch. The goal is not to add new product surface area. The goal is to close remaining publication-readiness gaps found after the first two passes: public route data hygiene, repeated backend lookup logic, and editor/admin pages that still lack consistent loading and guarded action states.

## Current Baseline

The branch entered this pass clean and synced with `origin/clean-self-hosted-rebuild` at commit `2a64775`. The previous pass validated successfully with lint, type checking, production build, and high-severity production dependency audit.

## Selected Fix Set

| Area | Finding | Decision | Rationale |
|---|---|---|---|
| Public availability API | `GET /api/availability/professional/:professionalId` returns active rules and blocked exceptions for any professional ID without first confirming the profile is approved and visible. | Add a shared visible-profile gate before returning availability. | Availability exceptions can reveal blocked dates or time ranges, so the public endpoint should match the same visibility expectations as the public profile surface. |
| Public services API | `GET /api/services/professional/:professionalId` returns active services for any professional ID without confirming profile visibility. | Add the same visible-profile gate. | Public service inventory should not be discoverable for hidden, pending, or suspended professionals. |
| Public portfolio API | `GET /api/portfolio/professional/:professionalId` returns visible portfolio items for any professional ID without confirming profile visibility. | Add the same visible-profile gate and deduplicate own-profile lookup in the portfolio router. | This closes the route-level visibility gap and removes repeated query code. |
| Availability editor | The page is functional but still dense, has no explicit loading state, and async actions do not consistently surface errors. | Refactor into named sections with loading, empty states, and guarded mutations while preserving endpoints and submitted fields. | This improves reliability without changing product behavior. |
| Services editor | The page is compact but lacks loading state and action-level error handling. | Refactor lightly into clearer form/list sections with guarded service toggles. | This aligns editor UX with the recently cleaned settings and bookings pages. |
| Admin page | The moderation surface has no explicit loading/error handling for the initial load and renders one large component. | Refactor into small named sections with a clear loading path and preserved moderation endpoints. | Admin review is publication-critical and should fail clearly instead of silently. |

## Explicit Non-Goals

This pass will not add new search features, booking workflows, payments, upload flows, or notification delivery integrations. It will not rename routes or alter database schema. Any broader product work should remain a separate planned pass after this hygiene cycle is clean.

## Implementation Results

This pass completed the selected backend visibility and frontend maintainability work without changing database schema, route names, authentication requirements, or submitted field names.

| Area | Completed change | Behavior preserved |
|---|---|---|
| Public availability | Added an approved-and-visible profile gate before returning public availability rules or blocked exceptions. | Existing authenticated `/me` availability editing remains unchanged. |
| Public services | Added an approved-and-visible profile gate before returning public active service lists. | Existing professional service creation and activation toggles remain unchanged. |
| Public portfolio | Added an approved-and-visible profile gate before returning public visible portfolio items. | Existing self-portfolio list still returns an empty list when a professional profile does not exist, preserving the previous editor behavior. |
| Portfolio router internals | Centralized own-profile lookup into helper functions. | Create and delete ownership checks still require the authenticated professional profile. |
| Availability editor | Split the page into weekly-hours, blocked-time, weekly-schedule, and blocked-dates sections with explicit loading and action states. | The same endpoints and payload fields are still used. |
| Services editor | Split the page into form, service-card, and list sections with explicit loading and action states. | Service add and activation toggle behavior remains the same. |
| Admin page | Split dashboard stats, pending profiles, and recent admin actions into named sections with initial load and action error handling. | Moderation endpoints and note submission behavior remain the same. |

## Validation Evidence

The full validation suite completed successfully after the third-pass changes.

| Check | Result |
|---|---|
| `npm run lint` | Passed with zero warnings under the configured maximum-warning threshold. |
| `npm run check` | Passed for both client and server TypeScript projects. |
| `npm run build` | Passed; Vite produced the production client bundle and the server TypeScript build completed. |
| `npm audit --omit=dev --audit-level=high` | Passed with `0 vulnerabilities`. |
| Disallowed platform-reference scan | No matches in project-owned files. |
| Public exact-address scan | Exact-address fields remain limited to private editor types, professional settings, schema, and database definitions; the public profile contract remains separated. |
| Duplicate pending-route scan | The canonical admin pending-professional endpoint remains; previously duplicated route surfaces are still absent. |
| Secret-pattern scan | No committed source matches for the bounded high-risk key patterns scanned. |

## Remaining Risk Assessment

The branch is clean under the available automated checks and this pass closed the most important remaining public-route visibility gap. The next worthwhile pass, if continued, should review smaller components and utility functions for naming consistency, pagination opportunities in admin list endpoints, and end-to-end workflow checks once a seeded local database is available.
