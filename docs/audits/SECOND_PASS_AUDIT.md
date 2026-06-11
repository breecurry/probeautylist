# Second-pass automated inventory

## Source files

- client/src/App.tsx (49 lines)
- client/src/components/Layout.tsx (53 lines)
- client/src/components/RequireAuth.tsx (11 lines)
- client/src/components/StatusPill.tsx (5 lines)
- client/src/context/AuthContext.tsx (61 lines)
- client/src/lib/api.ts (36 lines)
- client/src/main.tsx (13 lines)
- client/src/pages/AdminPage.tsx (29 lines)
- client/src/pages/AuthPages.tsx (55 lines)
- client/src/pages/AvailabilityPage.tsx (86 lines)
- client/src/pages/BookingsPage.tsx (26 lines)
- client/src/pages/Dashboards.tsx (29 lines)
- client/src/pages/Home.tsx (64 lines)
- client/src/pages/NotificationsPage.tsx (13 lines)
- client/src/pages/PortfolioPage.tsx (80 lines)
- client/src/pages/ProfessionalProfilePage.tsx (56 lines)
- client/src/pages/ProfessionalSettings.tsx (49 lines)
- client/src/pages/SearchPage.tsx (41 lines)
- client/src/pages/ServicesPage.tsx (89 lines)
- client/src/types.ts (89 lines)
- server/src/config/env.ts (23 lines)
- server/src/db/client.ts (13 lines)
- server/src/db/schema.ts (256 lines)
- server/src/features/admin/routes.ts (43 lines)
- server/src/features/auth/routes.ts (70 lines)
- server/src/features/auth/schemas.ts (15 lines)
- server/src/features/availability/routes.ts (75 lines)
- server/src/features/availability/schemas.ts (29 lines)
- server/src/features/bookings/routes.ts (159 lines)
- server/src/features/bookings/schemas.ts (23 lines)
- server/src/features/notifications/routes.ts (43 lines)
- server/src/features/notifications/service.ts (7 lines)
- server/src/features/portfolio/routes.ts (55 lines)
- server/src/features/portfolio/schemas.ts (21 lines)
- server/src/features/professionals/routes.ts (145 lines)
- server/src/features/professionals/schemas.ts (38 lines)
- server/src/features/reviews/routes.ts (57 lines)
- server/src/features/reviews/schemas.ts (7 lines)
- server/src/features/services/routes.ts (60 lines)
- server/src/features/services/schemas.ts (24 lines)
- server/src/index.ts (59 lines)
- server/src/middleware/auth.ts (62 lines)
- server/src/middleware/validate.ts (13 lines)
- server/src/routes.ts (23 lines)
- server/src/scripts/create-admin.ts (30 lines)
- server/src/utils/http.ts (25 lines)
- server/src/utils/slug.ts (8 lines)
- shared/types.ts (33 lines)

## Server route handlers


### server/src/features/admin/routes.ts
- GET '/stats', requireRole('admin'), async (_req, res, next) => {
- GET '/users', requireRole('admin'), async (_req, res, next) => {
- GET '/professionals/pending', requireRole('admin'), async (_req, res, next) => {

### server/src/features/auth/routes.ts
- POST '/register', validateBody(registerSchema), async (req, res, next) => {
- POST '/login', validateBody(loginSchema), async (req, res, next) => {
- POST '/logout', requireAuth, (req, res, next) => {
- GET '/me', requireAuth, (req, res) => {

### server/src/features/availability/routes.ts
- GET '/professional/:professionalId', async (req, res, next) => {
- GET '/me', requireRole('professional', 'admin'), async (req, res, next) => {
- POST '/me', requireRole('professional', 'admin'), validateBody(availabilityRuleSchema), async (req, res, next) => {
- PUT '/me', requireRole('professional', 'admin'), validateBody(replaceAvailabilityRulesSchema), async (req, res, next) => {
- DELETE availabilityRules).where(eq(availabilityRules.professionalId, profile.id));
- PATCH '/:id', requireRole('professional', 'admin'), validateBody(updateAvailabilityRuleSchema), async (req, res, next) => {

### server/src/features/bookings/routes.ts
- GET '/', requireAuth, async (req, res, next) => {
- POST '/', requireAuth, validateBody(createBookingSchema), async (req, res, next) => {
- PATCH '/:id/status', requireAuth, validateBody(updateBookingStatusSchema), async (req, res, next) => {

### server/src/features/notifications/routes.ts
- GET '/', requireAuth, async (req, res, next) => {
- GET '/unread-count', requireAuth, async (req, res, next) => {
- PATCH '/:id/read', requireAuth, async (req, res, next) => {

### server/src/features/portfolio/routes.ts
- GET '/professional/:professionalId', async (req, res, next) => {
- GET '/me', requireRole('professional', 'admin'), async (req, res, next) => {
- POST '/me', requireRole('professional', 'admin'), validateBody(portfolioSchema), async (req, res, next) => {
- DELETE '/:id', requireRole('professional', 'admin'), async (req, res, next) => {
- DELETE portfolioItems).where(and(eq(portfolioItems.id, req.params.id), eq(portfolioItems.professionalId, profile.id))).returning();

### server/src/features/professionals/routes.ts
- GET '/', async (req, res, next) => {
- GET '/me', requireRole('professional', 'admin'), async (req, res, next) => {
- POST '/me', requireRole('professional', 'admin'), validateBody(professionalProfileSchema), async (req, res, next) => {
- PATCH '/me', requireRole('professional', 'admin'), validateBody(professionalProfileSchema.partial()), async (req, res, next) => {
- GET '/:slug', async (req, res, next) => {
- POST '/:id/approve', requireRole('admin'), async (req, res, next) => {
- GET '/admin/pending/list', requireRole('admin'), async (_req, res, next) => {

### server/src/features/reviews/routes.ts
- GET '/professional/:professionalId', async (req, res, next) => {
- POST '/', requireAuth, validateBody(reviewSchema), async (req, res, next) => {

### server/src/features/services/routes.ts
- GET '/professional/:professionalId', async (req, res, next) => {
- GET '/me', requireRole('professional', 'admin'), async (req, res, next) => {
- POST '/me', requireRole('professional', 'admin'), validateBody(serviceSchema), async (req, res, next) => {
- PATCH '/:id', requireRole('professional', 'admin'), validateBody(serviceSchema.partial()), async (req, res, next) => {

### server/src/routes.ts
- GET '/api/health', (_req, res) => res.json({ ok: true }));

## Client API calls


## Risk markers

- TODO: none
- FIXME: none
- mock: none
- placeholder: client/src/pages/AuthPages.tsx, client/src/pages/PortfolioPage.tsx, client/src/pages/ProfessionalProfilePage.tsx, client/src/pages/SearchPage.tsx, client/src/pages/ServicesPage.tsx
- any: client/src/pages/ProfessionalSettings.tsx, server/src/db/schema.ts
- console.log: server/src/index.ts, server/src/scripts/create-admin.ts
- alert\(: none
- window.confirm: none
- localStorage: none
- dangerouslySetInnerHTML: none

## Product behavior comparison

The automated inventory confirms that the rebuilt code is cleanly structured, but it also shows that several modeled domains are not yet surfaced as production-grade workflows. This is exactly the type of gap that a validation-only pass can miss: the code can compile while the application still feels incomplete for real clients and professionals.

| Area | Current State | Gap | Second-Pass Action |
| --- | --- | --- | --- |
| Professional profiles | Profiles can be created, reviewed, searched, and opened publicly. | Client type definitions omit address, postal code, and license fields; settings page uses `as any`; public profile trust/location details are thin. | Fix types, remove unsafe casts, improve public profile details. |
| Services | Professionals can create and toggle services. | Services cannot be edited after creation from the UI; real businesses need price, duration, deposit, and copy updates. | Add a proper edit workflow and keep validation strict. |
| Availability | Weekly availability exists and booking conflict checks work. | Date exceptions exist in the schema but are not exposed; professionals cannot block vacation, holidays, or one-off unavailable windows. | Add availability exception API and management UI, then include exceptions in booking checks. |
| Bookings | Clients can request bookings; professionals can accept, decline, complete, or cancel; notifications are generated. | Booking views display raw service IDs rather than human-readable service/client/pro context; booking notes are underused. | Return richer booking DTOs and display useful appointment context. |
| Notifications | Users can list notifications and mark individual items as read. | There is no unread badge in navigation, no bulk mark-read action, and the unread-count endpoint is unused. | Add unread count in the app shell and a mark-all-read workflow. |
| Favorites | The schema includes favorites. | No API or UI exists, despite the client dashboard saying favorites are part of the workflow. | Add favorites API and a client saved-professionals screen. |
| Messages | The schema includes messages and the notification enum includes message events. | No messaging API or UI exists for client/professional communication. | Add booking-scoped messaging with strict participant authorization. |
| Reviews | Review API and public review display exist. | The client booking journey does not expose a natural review action for completed bookings. | Add completed-booking review creation from client booking history. |
| Admin moderation | Admin can review pending profiles. | The admin action log table exists but moderation actions are not logged or displayed. | Log admin actions and show recent moderation history. |

The highest-value fixes for this pass are the ones that turn the app from a basic marketplace shell into a usable booking product: richer booking display, editable services, availability exceptions, saved professionals, notification polish, review prompts, and removal of unsafe typing. Messaging is also important, but it must be implemented with booking/participant authorization rather than as an unrestricted inbox.

## Second-pass implementation completed

After the coverage comparison, the follow-up pass added the missing workflows rather than only re-running build validation. The backend now includes booking-scoped messaging, client favorites, availability exceptions, notification bulk-read support, richer booking response objects, and admin action logging for profile approvals. Booking creation now considers date-specific availability exceptions in addition to weekly rules, future-time checks, role checks, and double-booking prevention.

The frontend was then updated so those workflows are actually usable. Clients can save professionals, view saved professionals, request bookings with clearer service and availability context, message professionals from booking history, cancel active requests, and review completed appointments. Professionals can define weekly hours, block one-off unavailable dates or time windows, message clients from booking history, and manage bookings with clearer appointment/client/service context. The app shell now shows unread notification counts, the notification center includes mark-all-read, the admin page displays recent moderation actions, and status presentation covers the full booking workflow.

| Area | Second-Pass Fix Completed |
| --- | --- |
| Booking context | Booking API responses now include service, professional, and client summary data so dashboards and booking pages do not show raw IDs. |
| Availability exceptions | Added API and UI for blocked full days or partial time windows; booking checks now reject blocked times. |
| Favorites | Added client-only favorites API, saved-professionals screen, dashboard summary, profile save action, and navigation link. |
| Messages | Added booking-scoped message API with strict participant authorization and in-booking message UI for clients and professionals. |
| Notifications | Added mark-all-read UI, unread count badge in the app shell, and message-related notifications. |
| Reviews | Added client review form on completed booking cards, while preserving the backend one-review-per-completed-booking rule. |
| Admin logging | Profile approvals are now recorded in admin action logs and displayed in the admin screen. |
| Unsafe frontend typing | Removed the known `as any` use in professional settings by expanding the professional profile type. |
| Status UI | Expanded status badge tones to cover completed, no-show, cancelled, declined, pending, approved, and suspended states. |

## Validation after second pass

The following checks passed after the backend and frontend second-pass changes:

```bash
npm run lint
npm run check
npm run build
npm audit --omit=dev --audit-level=high
```

The production build completed successfully and the high-severity production dependency audit reported **0 vulnerabilities**. A targeted repository scan for old platform/wrapper references returned no matches in tracked source outside excluded dependency and build directories.
