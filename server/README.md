# Dashboard API Server

The server is an Express API backed by MongoDB. It uses Octokit to retrieve repository, contributor, and pull request data from GitHub, stores the results with Mongoose, and serves dashboard metrics to the Next.js client.

## Requirements

- Node.js and npm versions compatible with the server dependencies.
- A reachable MongoDB deployment.
- A GitHub token with read access to the repositories and GitHub endpoints that will be synced. Use the minimum permissions required for the target repositories.

## Install and configure

From this directory:

```powershell
npm install
```

Create a `.env` file in `server/`:

```dotenv
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/github-analytics
GITHUB_TOKEN=replace-with-a-read-only-github-token
GITHUB_TARGET_OWNER=fastify
# Optional positive integer; unset to process all fetched repositories
# GITHUB_REPO_LIMIT=5
CLIENT_URL=http://localhost:3000
```

| Variable              | Required        | Purpose                                                                                              |
| --------------------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| `MONGO_URI`           | Yes             | MongoDB connection string                                                                            |
| `GITHUB_TOKEN`        | For GitHub sync | Octokit authentication token; keep server-side                                                       |
| `PORT`                | No              | HTTP port; defaults to `5000`                                                                        |
| `NODE_ENV`            | No              | Runtime mode displayed in the startup log; defaults to `development`                                 |
| `GITHUB_TARGET_OWNER` | Yes, for sync   | Organization or username whose repositories are synced                                               |
| `GITHUB_REPO_LIMIT`   | No              | Positive integer limit for repositories processed; unset or blank processes all fetched repositories |
| `CLIENT_URL`          | No              | Allowed CORS origin; defaults to `http://localhost:3000`                                             |

Start in development mode:

```powershell
npm run dev
```

The server connects to MongoDB before listening. Check its health at [http://localhost:5000/health](http://localhost:5000/health).

## Scripts

| Command       | Description                                                      |
| ------------- | ---------------------------------------------------------------- |
| `npm run dev` | Start `index.js` with Nodemon                                    |
| `npm test`    | Placeholder script; no automated server tests are configured yet |

## API

The default API origin is `http://localhost:5000`. JSON API routes use the `/api` prefix.

### Health

`GET /health`

Returns a simple process check:

```json
{
  "status": "ok",
  "uptime": 123.45
}
```

### Trigger a sync

`POST /api/sync/trigger`

The endpoint uses `GITHUB_TARGET_OWNER` from the server environment; the dashboard does not send an owner. A successful response includes a message and counts for repositories processed, repositories available, and PRs synced.

The sync service:

1. Fetches all organization repositories across pages of up to 100, falling back to paginated user repositories when the owner is not an organization.
2. Processes all fetched repositories by default, or up to `GITHUB_REPO_LIMIT` when it is set to a positive integer.
3. Fetches every selected repository's contributors across pages, stores the roster on the repository, and updates each developer's per-repository commit counts.
4. Fetches all pull requests across pages of up to 100 per selected repository with `state=all`, then upserts PR records and developer activity.

GitHub API rate limits and permissions apply. `GITHUB_REPO_LIMIT` limits repositories upserted and processed, but repository listing still fetches all pages to report the total available count.

### Analytics

| Endpoint                        | Query parameters                            | Result                                                                                                |
| ------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `GET /api/analytics/overview`   | —                                           | Totals for repositories, inactive repositories, open PRs, stuck PRs, and developers                   |
| `GET /api/analytics/developers` | `includeBots=true`, `sortBy=prsOpenedCount` | All developers, sorted descending by the selected field; bots are excluded unless explicitly included |

### Repositories

| Endpoint                  | Query parameters                                                            | Result                                               |
| ------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------- |
| `GET /api/repos`          | `page=1`, `limit=100`, `search`, `isInactive=true\|false`, `team`, `sortBy` | Paginated repositories matching the supplied filters |
| `GET /api/repos/inactive` | `page=1`, `limit=100`, `search`, `sortBy`                                   | Paginated inactive repositories                      |
| `GET /api/repos/:repoName` | —                                                                          | Repository details and all pull requests for that repository |

Repository endpoints return `pagination` metadata (`page`, `limit`, `totalPages`, and `totalCount`). The dashboard requests up to 100 saved repositories per page; changing pages reads the next page from MongoDB and does not trigger a GitHub sync.

### Pull requests

| Endpoint             | Query parameters  | Result                                                                                   |
| -------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `GET /api/prs`       | `repoId`, `state` | Pull requests matching the optional repository and state filters                         |
| `GET /api/prs/stuck` | —                 | Open PRs marked as stuck, with repository `name`, `fullName`, and `isInactive` populated |

Collection responses use a common shape:

```json
{
  "success": true,
  "count": 1,
  "data": []
}
```

On request errors, handlers return `success: false` and a `message`; sync errors are also logged by the server.

## Data models

- **Repository:** GitHub repository ID, name/full name, visibility, team, all contributors and their commit counts, top contributor, open PR count, last push time, inactivity status, and health-check flags.
- **PullRequest:** PR number, repository reference, title, GitHub URL, author GitHub login, requested reviewers, state, stuck status, and opened/merged/closed timestamps.
- **DeveloperActivity:** developer username, avatar, total commits and per-repository contribution counts, PR-opened and PR-reviewed counts, active repositories, and last active time.
- **User:** GitHub ID, username, avatar, role, team, and active status. The current dashboard API does not implement user authentication or role-based access.

## Current calculation and implementation notes

- Repositories are inactive when their last push is more than 90 days old, or when no push timestamp is available.
- A pull request is stuck when it is open and was created more than 5 days ago. The current calculation uses the PR creation timestamp; it does not assess the last activity timestamp.
- `hasCi`, `hasBranchProtection`, and `hasCodeowners` are not yet populated from GitHub. `hasReadme` currently uses a placeholder based on the repository's archived state.
- Developer PR-review counts track newly requested reviewers observed by the sync service, not all submitted review events.
- `openPrsCount` and developer activity are based on all PR pages returned by GitHub for each selected repository.

## Security

- Keep `.env` private and do not commit or log token values.
- Never send `GITHUB_TOKEN` or MongoDB credentials to the browser. The client only needs the public API base URL.
- Configure `CLIENT_URL` to the intended frontend origin outside local development.
- The API currently has no authentication middleware; deploy it only in a network environment appropriate for unauthenticated read/sync endpoints.

See the [root README](../README.md) for the complete local startup flow and the [client README](../client/README.md) for UI configuration.
