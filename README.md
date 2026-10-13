# GitHub Analytics Dashboard

A full-stack dashboard for monitoring GitHub repository health, pull requests, and developer activity. The Next.js client displays the metrics; an Express API syncs GitHub data into MongoDB and serves it to the dashboard.

> The project is split into independently installable `client` and `server` applications. Start both to use the complete dashboard.

## At a glance

| Area | Stack |
| --- | --- |
| Web client | Next.js 16, React 19, Tailwind CSS 4 |
| API | Node.js, Express 5 |
| Database | MongoDB with Mongoose |
| GitHub integration | GitHub REST API through Octokit |
| UI icons | Phosphor Icons |

## What it does

- Shows repository totals, inactive repository totals, open and stuck PR totals, and active developer totals.
- Lists developer PR activity, avatars, and repositories.
- Lists stuck pull requests with authors and direct links to GitHub.
- Syncs repositories and pull requests on demand using the **Sync Data** button.
- Offers a persistent light/dark theme toggle, defaulting to light mode.
- Provides API routes for repository lists, pull requests, analytics, and a health check.
- Uses a responsive dashboard layout that supports mobile screens through ultrawide displays.

## Get started

### Requirements

- Node.js and npm versions compatible with the dependencies in each package manifest.
- A reachable MongoDB database.
- A GitHub token with read access to the repositories and GitHub API data you intend to sync. Keep it private; never put it in the client environment.

### 1. Configure the server

Open a terminal in `server/`, install dependencies, and create a `server/.env` file:

```powershell
cd server
npm install
```

```dotenv
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/github-analytics
GITHUB_TOKEN=replace-with-a-read-only-github-token
GITHUB_TARGET_OWNER=fastify
CLIENT_URL=http://localhost:3000
```

`MONGO_URI` and `GITHUB_TOKEN` are needed for a working sync. `PORT`, `NODE_ENV`, `GITHUB_TARGET_OWNER`, and `CLIENT_URL` have code-level defaults or fallbacks; see [server/README.md](./server/README.md) for details.

Start the API in this terminal:

```powershell
npm run dev
```

The API listens on port `5000` by default. Check `http://localhost:5000/health`.

### 2. Configure and start the client

Open a second terminal in `client/`:

```powershell
cd client
npm install
```

Optionally create `client/.env.local` if the API is not at its default URL:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

Start the Next.js development server:

```powershell
npm run dev
```

Open `http://localhost:3000`, then select **Sync Data** to load GitHub data. The client defaults to `http://localhost:5000/api` when `NEXT_PUBLIC_API_BASE_URL` is not set.

## Run checks

From `client/`:

```powershell
npm run lint
npm run build
```

The server package does not currently define an automated test suite; its `npm test` script is a placeholder.

## How the data flows

1. The dashboard requests overview metrics, developer analytics, and stuck PRs from the API.
2. Clicking **Sync Data** sends `POST /api/sync/trigger`.
3. The server asks GitHub for repositories, contributor information, and pull requests.
4. Mongoose upserts repository, pull request, and developer activity records in MongoDB.
5. After sync finishes, the client reloads the dashboard data.

The dashboard button currently sends the owner `fastify`. The sync API itself accepts an `owner` in the request body; if omitted, it uses `GITHUB_TARGET_OWNER`.

## API overview

The API base URL is `http://localhost:5000` by default.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | API process health and uptime |
| `POST` | `/api/sync/trigger` | Sync a GitHub owner; optional JSON body: `{"owner":"fastify"}` |
| `GET` | `/api/analytics/overview` | Dashboard summary metrics |
| `GET` | `/api/analytics/developers` | Developer activity; supports `includeBots` and `sortBy` query parameters |
| `GET` | `/api/repos` | Repositories; supports `search`, `isInactive`, and `team` query parameters |
| `GET` | `/api/repos/inactive` | Inactive repositories |
| `GET` | `/api/prs` | Pull requests; supports `repoId` and `state` query parameters |
| `GET` | `/api/prs/stuck` | Open pull requests marked stuck |

Successful collection endpoints return JSON with `success`, `count`, and `data` fields. See [server/README.md](./server/README.md) for endpoint behavior, sync details, and data models.

## Project layout

```text
client/
  src/app/           Next.js dashboard page, layout, and global styles
  src/components/    Navbar, metric cards, and data tables
  src/lib/api.js     Axios API client and dashboard requests
server/
  index.js           Loads environment variables, connects MongoDB, starts Express
  src/app.js         Express middleware and route registration
  src/config/        MongoDB connection
  src/controllers/   API request handlers
  src/models/        Mongoose schemas
  src/routes/        Express route definitions
  src/services/      GitHub sync service
```

## Current behavior and limitations

- Sync currently processes only the first **5 repositories** returned for an owner. This is a testing limit in the sync service.
- Repository listing requests up to 100 repositories, and each PR request retrieves up to 50 PRs. Pagination beyond those first pages is not implemented.
- A PR is marked stuck when it is open and its creation time is more than 5 days old. The current rule does not check the time of its latest activity.
- A repository is marked inactive if it has no push timestamp or its last push was more than 90 days ago.
- Several repository health checks are placeholders: CI, branch protection, and CODEOWNERS are not queried. The `hasReadme` field is also currently initialized from whether the repository is archived, not from a README lookup.
- Developer review counts are based on newly requested reviewers observed during sync; the service does not import a complete GitHub review-event history.
- There is no user sign-in or role-based access control in the current dashboard/API.

## More documentation

- [Client setup and UI](./client/README.md)
- [Server setup, API, sync, and models](./server/README.md)

## Security notes

- Keep `GITHUB_TOKEN`, MongoDB credentials, and other secrets in the server's ignored `.env` file or a secret manager.
- Never use a `NEXT_PUBLIC_` variable for a secret: values with that prefix are exposed to browser code.
- The client only needs the API base URL. GitHub credentials belong on the server.
