# Third-Pass Production Readiness Audit

This third pass treats the current `clean-self-hosted-rebuild` branch as the baseline after the second-pass marketplace improvements. The purpose is not to add random scope; it is to look for areas that are still too thin for a real client-to-professional booking marketplace and then fix the highest-value gaps cleanly.

## Findings

| Area | Current State | Third-Pass Gap | Planned Fix |
|---|---|---|---|
| Request security | Session cookies are `httpOnly`, same-site, and secured in production. Mutating API routes rely on same-origin cookies and validation. | There is no explicit CSRF token check for mutating requests. SameSite helps, but a self-hosted session-cookie app should have a server-issued token for POST/PATCH/DELETE actions. | Add a first-party CSRF token endpoint, store the token in the session, require `X-CSRF-Token` on mutating API calls, and update the React API helper to attach the token automatically. |
| Profile moderation | Admins can approve professional profiles and view pending profiles/action logs. | Moderation only supports approval. There is no clean way to request changes or suspend a profile from the admin UI. | Add explicit admin moderation endpoints for `request changes` and `suspend`, record action logs, notify the professional, and expose these actions in the admin page. |
| Profile lifecycle | Professionals can create and edit profiles; edits move profiles back to pending review. | The frontend does not clearly explain to professionals that edits will be hidden until re-approved, which can feel like a bug. | Add explanatory status copy to professional settings and clearer admin status handling. |
| Booking UX | Clients can request bookings; professionals can confirm, decline, complete, cancel, and message; clients can review completed bookings. | Completed booking cards still show a review form every time, even when the backend would reject a duplicate review. There is also no clear same-day operational signal for upcoming bookings. | Add review-submitted state in the client, hide submitted forms immediately, and improve booking card status/context copy. |
| Account operations | Authentication works, sessions regenerate on login, and passwords are hashed with Argon2id. | Users cannot update basic account details or password from the app after registration. That is a practical production gap for a real marketplace. | Add authenticated account settings endpoints and a simple account settings page for profile basics and password change. |

## Scope Control

This pass will not add payment processing, email/SMS delivery, native mobile wrappers, or external hosting automation. Those require separate product decisions and service credentials. The planned work stays inside the self-hosted React/Express/PostgreSQL application and improves the foundation without creating external dependencies.

## Third-Pass Implementation Completed

The third pass produced a focused production-readiness improvement set rather than another cosmetic rewrite. The backend now includes centralized CSRF protection for mutating API requests, a CSRF issuance endpoint, account update endpoints, password rotation, safer session regeneration on login, and richer admin-owned professional moderation actions. Moderation now supports approval, requested changes, and suspension from the admin module, records admin action notes, toggles profile visibility deliberately, and notifies the affected professional.

The frontend now attaches CSRF tokens centrally through the API client, exposes an account settings page for profile basics and password changes, adds account navigation to the app shell, improves professional profile lifecycle messaging for pending and suspended states, and replaces the thin approve-only admin screen with a fuller moderation workflow that includes notes, requested changes, suspension, and clearer action history.

Validation after these changes passed successfully with `npm run lint`, `npm run check`, `npm run build`, and `npm audit --omit=dev --audit-level=high`. A source hygiene scan showed no prohibited platform references in the rebuilt source and no real environment file present beyond `.env.example`.
