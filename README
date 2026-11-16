# 🌟 STARPULSE

**Astronaut Health Monitoring & Early Warning System**  
NASA Space Apps Challenge 2026 — Create Health Monitoring Software for Astronauts on Space Missions

STARPULSE is a React-based demonstration dashboard for astronaut health tracking, daily check-ins, trends, alerts, crew participation, and rewards. The Health Tracking overview also presents historical environmental research telemetry.

> **Demonstration only.** Health measurements, astronaut status, radiation, alerts, and scores are simulated unless marked **User Logged**. Environmental graphs labeled **NASA Dataset** use historical RR-28 EDA telemetry, not live ISS monitoring. The app is not a medical device or an operational emergency-response system.

## Prerequisites

- **Node.js 22** recommended (matches the GitHub Actions deployment workflow).
- **npm** (included with Node.js).
- Git, to clone and collaborate on the repository.
- A current desktop or mobile browser.

No Firebase account, API keys, backend service, or `.env` file is required for this version.

## Install

Clone the repository and install the exact dependencies from the lockfile:

```bash
git clone https://github.com/dtaing01/NASA.git
cd NASA
npm ci
```

If you already have a local checkout, run `git pull` on your intended branch, then `npm ci`.

**For the in-review Health + Environment integration**, use the feature branch until its pull request is merged:

```bash
git fetch origin
git switch feature/health-environment-responsive
npm ci
```

## Run locally (development)

```bash
npm run dev
```

Open the local URL printed by Vite, normally **http://localhost:5173/**. Keep the terminal running while developing. Vite reloads the app as source files change. Stop with **Ctrl+C**.

To make the development server reachable by another device on the same network, use `npm run dev -- --host 0.0.0.0`. Only do this on a trusted network.

## Build and preview (production-like)

```bash
npm run build && npm run preview
```

The build runs TypeScript checks and creates the static site in **`dist/`**. If it fails, the `&&` prevents the preview command from running against an older build. The preview URL is normally **http://localhost:4173/**. Stop with **Ctrl+C**.

Run `npm run build` before opening a pull request. `npm run preview` serves the built files; it does **not** rebuild automatically when source files change.

## App navigation and workflows

| Screen | Route | What to try |
| --- | --- | --- |
| Health overview | `/health/overview` | View health summaries and the RR-28 environmental panel (feature branch) |
| Health areas | `/health/:area` | Switch between behavioral, cardiovascular, body, vision, and radiation views |
| Metric details | `/health/:area/:metric` | Inspect trends, change time range, and log available measurements |
| Daily check-in | Open from the header or a check-in prompt | Answer, skip, or return to check-in questions |
| Alerts | `/alerts` | Filter simulated alerts by category |
| Rewards | `/rewards` | Review points, badges, and demo redemptions |
| Crew | `/crew` | View participation and demo challenges |

On the feature branch, `/environment` redirects to `/health/overview` instead of showing a separate tab.

### Data sources and storage

- **NASA Dataset:** `public/rr28-telemetry-hourly.json` contains hourly aggregates derived from `RR-28_EDA_Telemetry_table.csv`. It provides historical temperature, relative humidity, and CO₂ measurements in ISS- and Ground-labeled channels. These are research data, not live astronaut vital signs or verified individual exposure readings.
- **Simulated:** `src/data/mockData.ts` seeds health metrics, astronaut/crew status, alerts, radiation, and rewards.
- **User Logged:** Measurements entered through the UI update the demo store and are saved to the **current browser's localStorage** via `src/data/store.tsx`. They do not synchronize across browsers or devices.

To clear your local demo changes, open the avatar menu and select **Reset demo data**. This restores the initial simulated state; it does not modify the historical telemetry JSON.

**Known demonstration limitations:** Crew cheers do not send real messages; challenge creation is unavailable; reward redemption is local only; alert settings are not operational notification controls; no flight medical team paging or medical treatment workflow is connected. The daily check-in does not automatically roll over to a new mission day.

## Team development workflow

1. Pull the latest `main` (or the active integration branch).
2. Create a feature branch for your work: `git switch -c feature/short-description`.
3. Make changes and verify them with `npm run build && npm run preview`.
4. Commit and push your feature branch.
5. Open a pull request to `main`; have a teammate review functionality, provenance labels, and any health-related claims before merging.

Avoid committing secrets, real personal health records, or unnecessary generated `dist/` files. The repository currently defines no automated test command; a successful build is **not** proof that every interaction works. Perform a manual browser walkthrough of affected pages.

## Deployment

The workflow at `.github/workflows/deploy.yml` runs on pushes to **`main`** (or manual workflow dispatch):

1. Checks out the source.
2. Installs Node.js 22 and runs `npm ci`.
3. Runs `npm run build`.
4. Publishes the generated `dist/` directory to the **`deploy`** branch.

The project's Porkbun static hosting is configured to serve the `deploy` branch at **https://star-pulse.earth/**. Do not edit the generated deployment branch directly. Review the **Actions** tab for build/deployment failures. Depending on static-host routing, direct refreshes of nested React Router URLs may require a hosting fallback to `index.html`.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| `npm ci` fails | Verify Node.js 22 and run the command from the repository root containing `package-lock.json` |
| TypeScript/build error | Fix the reported source error before starting preview; don't rely on an earlier `dist/` |
| Port 5173 or 4173 occupied | Use the URL Vite prints or stop the other process |
| Changes not visible in preview | Stop preview, run `npm run build && npm run preview` again, then refresh |
| Environment panel missing | Confirm you are on the integration branch (or that its PR has merged) and open `/health/overview` |
| Environment data fails to load | Check that `public/rr28-telemetry-hourly.json` exists and the browser Network tab shows a successful request |
| Unexpected demo values | Check browser localStorage; use **Reset demo data** to restore the initial state |
| npm audit warnings | Review `npm audit`; do not run `npm audit fix --force` without assessing breaking changes |

## Project structure

```text
src/
  App.tsx                 Routes and app shell
  components/             Charts, check-in, logging, navigation, UI
  data/
    mockData.ts           Simulated initial state
    store.tsx             React state and localStorage persistence
  pages/                  Health, metric detail, alerts, crew, rewards, environment
  styles/                 App styles and design tokens
public/
  rr28-telemetry-hourly.json
.github/workflows/
  deploy.yml              GitHub Actions → deploy branch
```

Design tokens are defined in `src/styles/tokens.css`.
