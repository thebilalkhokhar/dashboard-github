# Dashboard Client

The client is a Next.js App Router application for the GitHub Analytics Dashboard. It reads analytics from the Express API and lets a user trigger a GitHub data sync.

## Requirements

- Node.js and npm versions compatible with the client dependencies.
- The dashboard API running locally or at a configured API URL.

## Install and run

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The client uses `http://localhost:5000/api` by default. To point it elsewhere, create `.env.local` in this directory:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

Restart the development server after changing environment variables. This value is public configuration and must not contain credentials or tokens.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build (run `npm run build` first) |
| `npm run lint` | Run ESLint |

## Dashboard features

- **Summary cards:** total repositories, inactive repositories, open PRs, stuck PRs, and active developers.
- **Developer activity table:** GitHub avatar, PRs opened, PRs reviewed, and active repositories.
- **Repository list:** filter all synced repositories or inactive repositories, with contributor, PR count, health-check badges, and last-push date.
- **Repository detail:** open a repository from the list to view its visibility, health checks, contributors, and pull requests, with client-side pagination and stuck-PR filtering.
- **Stuck PR table:** title, repository, author, and a link that opens the pull request on GitHub.
- **Search and sorting:** search developers by username and repositories by name/full name; sort developers by opened PRs, reviewed PRs, or commits, and repositories by recent push, open PR count, or name.
- **Sync Data:** requests a sync and refreshes the displayed metrics and tables when it completes.
- **Theme toggle:** switches between light and dark themes and saves the selection in browser `localStorage`; new users start in light mode.
- **Responsive layout:** cards and tables adapt to mobile, tablet, desktop, and ultrawide widths. Tables can scroll horizontally on narrow screens.

The UI is implemented in `src/app/page.jsx` and `src/components/`. API requests are centralized in `src/lib/api.js`.

## API requests made by the dashboard

The Axios client reads `NEXT_PUBLIC_API_BASE_URL` and falls back to `http://localhost:5000/api`.

| Method | Path | Usage |
| --- | --- | --- |
| `GET` | `/analytics/overview` | Populate the summary cards |
| `GET` | `/analytics/developers` | Populate the developer table |
| `GET` | `/repos/:repoName` | Populate the repository detail page |
| `GET` | `/prs/stuck` | Populate the stuck PR table |
| `POST` | `/sync/trigger` | Start a sync; currently sends `{"owner":"fastify"}` |

The sync button's owner is currently set in `src/lib/api.js`. The server also supports an owner configured through `GITHUB_TARGET_OWNER` when the request body does not include one.

## Browser push notifications

The service worker is served from `public/sw.js` at `/sw.js`. Browser subscription helpers are in `src/lib/pushManager.js` and use the shared authenticated Axios client for `GET /notifications/vapid-key` and `POST /notifications/subscribe`. Configure the public API base with `NEXT_PUBLIC_API_BASE_URL` as above; no VAPID key should be added to the client environment because the authenticated API returns the public key. Configure `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_MAILTO` in the server environment as described in the [server README](../server/README.md).

## Production

```powershell
npm run build
npm run start
```

Set `NEXT_PUBLIC_API_BASE_URL` to the deployed API's `/api` base before building the client. The API must allow requests from the deployed client origin using its `CLIENT_URL` setting.

For the complete local setup and server configuration, see the [root README](../README.md) and [server README](../server/README.md).
