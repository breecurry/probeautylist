# Pro Beauty List

Pro Beauty List is a self-hosted marketplace and online booking application for beauty professionals and clients. The rebuilt application is a native React web app backed by an Express API, PostgreSQL persistence, server-managed sessions, and a clean modular feature structure. It is designed so beauty professionals can publish profiles, services, availability, portfolio work, and booking workflows, while clients can discover providers and request services online.

The project is intentionally structured as a single deployable full-stack application that can run on infrastructure you control. The client is built with React and Vite, the server runs on Express, and persistent application data is stored in PostgreSQL through Drizzle ORM. React is a component-based JavaScript UI library, Vite is a modern frontend build tool, Express is a Node.js web framework, PostgreSQL is an open-source relational database, and Drizzle ORM provides TypeScript-first database modeling and migrations.[1] [2] [3] [4] [5]

## What the app does

| Area | Current rebuilt capability |
|---|---|
| Public discovery | Clients can browse approved beauty professionals and search by category, city, state, and keyword. |
| Professional profiles | Professionals can create and edit a public profile with category, specialties, location, bio, images, and visibility. |
| Services | Professionals can create services with category, description, duration, price, deposit, and active or disabled status. |
| Availability | Professionals can define weekly working-hour rules so booking requests are constrained to available time windows. |
| Bookings | Clients can request bookings; the backend enforces ownership, role checks, future dates, availability windows, and double-booking protection. |
| Notifications | Users receive in-app notifications for booking events and admin/profile workflow events. |
| Portfolio | Professionals can publish portfolio images and captions for client confidence and profile depth. |
| Admin review | Admin users can review pending professional profiles and approve them before public listing. |
| Security baseline | Passwords are hashed with Argon2id, sessions are server-managed, security headers are enabled, input is validated with Zod, and production secrets fail fast when missing. |

## Project structure

| Path | Purpose |
|---|---|
| `client/src` | Native React application, route definitions, screens, layout, and API helpers. |
| `server/src` | Express API, authentication middleware, feature modules, database client, and admin script. |
| `server/src/db/schema.ts` | Fresh database schema for users, professionals, services, availability, bookings, reviews, portfolio, notifications, and sessions. |
| `shared/types.ts` | Shared domain constants and TypeScript types used by the client. |
| `REBUILD_ARCHITECTURE.md` | Architecture contract that guided the clean rebuild. |
| `DEPLOYMENT.md` | Self-hosting instructions for running the rebuilt application on your own server. |

## Local development

Create a PostgreSQL database, copy `.env.example` to `.env`, and replace every placeholder value with real local settings. `SESSION_SECRET` must be a long random value and must not be committed.

```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

For frontend-only development against the API, run this in a second terminal:

```bash
npm run dev:client
```

## Quality commands

The rebuilt app includes scripts for type checking, linting, production build validation, database migration generation, migration execution, and admin bootstrapping.

| Command | Purpose |
|---|---|
| `npm run check` | Runs TypeScript validation for the client and server. |
| `npm run lint` | Runs ESLint against TypeScript and React source files. |
| `npm run build` | Validates types, builds the React client, and compiles the Express server. |
| `npm run start` | Starts the compiled production server from `dist/server/index.js`. |
| `npm run db:generate` | Generates Drizzle migration files from the schema. |
| `npm run db:migrate` | Applies pending database migrations. |
| `npm run admin:create` | Creates or updates the initial admin account using environment variables. |

## Validation status

The rebuilt application has been validated with linting, TypeScript checks, production build generation, and a high-severity production dependency audit. At the time this README was written, those checks passed successfully.

| Check | Result |
|---|---|
| `npm run lint` | Passed. |
| `npm run check` | Passed. |
| `npm run build` | Passed. |
| `npm audit --omit=dev --audit-level=high` | Passed with zero high-severity production vulnerabilities. |

## References

[1]: https://react.dev/ "React Documentation"
[2]: https://vite.dev/ "Vite Documentation"
[3]: https://expressjs.com/ "Express Documentation"
[4]: https://www.postgresql.org/ "PostgreSQL"
[5]: https://orm.drizzle.team/ "Drizzle ORM"
