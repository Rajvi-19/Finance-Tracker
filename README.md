# Finance Tracker

A personal expense management application built with React, Vite, Express, Prisma, and SQLite.

## Implemented features

- Email/password registration and login with protected pages and user-scoped data.
- Dashboard with spending summaries and recent transactions.
- Expense History: add, edit, delete, search, category filters, date presets/custom ranges, amount ranges, sorting, pagination, and matching spending totals.
- Custom categories with icons, colors, and spending statistics.
- Monthly calendar with daily transaction details and normal/medium/high spending classifications.
- Analytics with spending charts, monthly comparisons, and rule-based insights.
- Settings for profile, password, theme, currency, spending thresholds, account deletion, and CSV/JSON exports.
- Monthly and category budget API endpoints.

Themes support light, dark, and system preferences. Currency preferences support INR, USD, EUR, and GBP; these change display formatting, not exchange-rate conversion. Google Sign-In is not implemented in the current routes or dependencies. Profile editing lives in Settings.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, React Router 7, Vite 8, Recharts, CSS variables |
| Backend | Node.js, Express 4, Zod |
| Storage | SQLite, Prisma 6 |
| Authentication | JWT in HTTP-only cookies, bcrypt password hashing |
| Tooling | concurrently, Oxlint, Vitest, Supertest |

## Getting started

Use Node.js compatible with Vite 8 (Node 22.12 or newer is a suitable choice) and npm. Run commands from the project root.

1. Install root dependencies:

   ```powershell
   npm install
   ```

2. Create environment files only if they do not already exist. Preserve existing configuration:

   ```powershell
   Copy-Item .env.example .env
   Copy-Item .env.example server/.env
   ```

   The server loads `server/.env` when started through the project scripts. Vite reads the root environment directory. Replace the example `JWT_SECRET` with a long random secret.

3. Install application dependencies, generate Prisma, and apply development migrations:

   ```powershell
   npm run setup
   ```

4. Optionally generate sample data:

   ```powershell
   npm run seed
   ```

   Demo login: `demo@financetracker.com` / `Demo1234`.

   **Seeding replaces the demo user's existing expenses** with generated data for the past 60 days. Use it only against a development database.

5. Start both services:

   ```powershell
   npm run dev
   ```

Open [http://localhost:5173](http://localhost:5173). Keep the terminal running. The API runs on port 3000; Vite proxies `/api` requests to it. You can also run `npm run dev:server` and `npm run dev:client` in separate terminals from the root.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | API port; default 3000 |
| `NODE_ENV` | Use development for local startup |
| `DATABASE_URL` | Prisma URL; `file:./dev.db` points to SQLite relative to the Prisma schema |
| `JWT_SECRET` | Authentication signing secret |
| `JWT_EXPIRES_IN` | JWT lifetime, such as 7d |
| `CLIENT_URL` | Frontend origin allowed by CORS |
| `RESET_TOKEN_EXPIRES_HOURS` | Password reset token lifetime |

Do not commit real secrets or local databases; the repository includes ignore rules for them.

## Project structure

```text
client/
  src/components/    Shared controls, navigation, layout, and states
  src/context/       Authentication, theme, and currency providers
  src/pages/         Main pages and authentication screens
  src/services/      API request helper
  src/styles/        Shared styles and theme tokens
  vite.config.js     Development server and API proxy
server/
  prisma/            Database schema and migrations
  src/middleware/    Authentication, validation, rate limiting, errors
  src/modules/       Auth, expenses, categories, analytics, budgets,
                     settings, profile, and export
  src/app.js         Express application
  src/index.js       Development listener / serverless export
  seed.js            Demo data generator
```

## Pages and API

Public pages are `/login` and `/register`. Protected pages are `/` (Dashboard), `/expenses`, `/categories`, `/calendar`, `/analytics`, and `/settings`.

API route groups are `/api/auth`, `/api/expenses`, `/api/categories`, `/api/analytics`, `/api/budget`, `/api/settings`, `/api/profile`, and `/api/export`. Protected requests use the authentication cookie set at login. The health endpoint is [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Development commands

```powershell
npm run dev                    # Start frontend and backend
npm run build                  # Build frontend into client/dist
npm --prefix client run lint   # Frontend lint checks
npm test                       # Backend Vitest runner
npm --prefix server run test:watch
```

Vitest and Supertest are installed, but no application test files were found during this documentation review. Test scripts alone do not imply automated coverage.

## Troubleshooting

- **Connection refused on port 5173:** start `npm run dev` and keep the terminal open. Check Vite's printed URL if the port is busy.
- **Network error inside the app:** confirm the API health endpoint responds. If you change the API port, update the proxy target in `client/vite.config.js` too.
- **Database errors:** check `server/.env`, then run Prisma generation/migrations from the server directory.
- **Missing older expenses:** Expense History initially filters to this month. Choose All time or another date range.
- **Missing demo account:** run the optional development seed command.

## Deployment and limitations

- The build command produces frontend assets only. Configure hosting for SPA route fallback and API routing.
- In production, `server/src/index.js` exports Express without starting a listener. A compatible deployment adapter or production listener is required.
- SQLite needs persistent storage; an ephemeral serverless filesystem cannot reliably retain user data.
- Configure HTTPS, CORS, secrets, and cookie settings for the deployment.
- Password reset currently logs tokens to the server console rather than sending email. Email delivery is needed before production use.
- Helmet and rate limiting are present, but Express Content Security Policy is disabled. Production deployment requires a security review.
