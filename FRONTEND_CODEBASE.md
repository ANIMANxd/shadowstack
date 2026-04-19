# ShadowStack Frontend Architecture & Codebase Map

This document outlines the entire frontend architecture, directory structure, and the exact responsibilities of every major file within the ShadowStack **React + Vite** web application.

> **Important:** This project uses React with Vite as the bundler. There is no Next.js, no server-side rendering, and no file-based routing. Routing is handled by React Router v7.

---

## 🔐 0. Authentication Layer (`/src/context/` & `/src/pages/Login/` & `/src/pages/Callback/`)

Authentication is handled via GitHub OAuth. The flow is: Login → GitHub → Callback → Dashboard.

- **`src/context/AuthContext.jsx`**
  - **The Auth Hub:** Provides `{ token, isAuthenticated, setToken, logout }` globally via React Context.
  - **Persistence:** Reads/writes to `localStorage('shadowstack_token')` so the session survives page reloads.
  - **Integration:** The `apiClient.ts` interceptor automatically reads this same localStorage key to attach `Authorization: Bearer <token>` to every API request.

- **`src/pages/Login/Login.jsx`**
  - Renders a "Continue with GitHub" button.
  - Redirects to `https://github.com/login/oauth/authorize` with `client_id`, `redirect_uri`, and `scope=repo admin:repo_hook`.
  - Uses `VITE_GITHUB_CLIENT_ID` from `.env`.

- **`src/pages/Callback/Callback.jsx`**
  - Handles the OAuth redirect from GitHub.
  - Reads `?code=` from the URL, sends it to `POST /api/auth/github` on the backend.
  - Stores the returned `access_token` in AuthContext, then navigates to `/`.

- **`src/components/ProtectedRoute/ProtectedRoute.jsx`**
  - Wraps all dashboard routes. If `isAuthenticated` is false, redirects to `/login`.
  - Used in `App.jsx` to gate the entire Layout shell.

---

## 🏗️ 1. Core State & Data Engineering (`/src/hooks/` & `/src/services/`)

The data layer is fully isolated from the visual components, meaning our charts don't know *how* data is fetched, only *how* to render it.

- **`src/hooks/useDashboardData.ts`**
  - **The Engine:** This is the most critical file. It handles a 30-second polling interval using `setInterval`. It executes API calls to fetch data concurrently.
  - **The Filter Sync:** It reads the browser URL (e.g., `?range=30D&service=EC2`) and passes those variables into the API layer.
  - **The Fallback:** If the API is genuinely unreachable (network error or 5xx), this hook catches the error and falls back to `mockAdapter.ts` in development mode. Importantly, it does **not** fall back on empty data responses — an empty array is treated as valid state (no PRs analysed yet).

- **`src/services/apiClient.ts`**
  - Uses `axios` to define all of the exact network requests sent to `http://localhost:8000/api/v1/...`.
  - Contains interceptors for:
    - **Auth:** Attaches `Authorization: Bearer <token>` from `localStorage('shadowstack_token')` to every request.
    - **Logging:** Debug logs in development mode.
    - **Retry:** Automatic retry on 5xx and network errors (up to 2 retries).
    - **Error handling:** Wraps errors in typed `ApiError` class.

- **`src/data/mockAdapter.ts`**
  - Acts as a "fake backend" during development when the real API is unreachable. Transforms static data from `mockData.js` into the typed API response shapes.
  - **Important:** This only activates on genuine network failures in dev mode, not on empty API responses.

- **`src/types/api.types.ts`**
  - Strict TypeScript interfaces (`DashboardData`, `HistoricalCost`, etc.) mapping out exactly what the API JSON responses should look like.

---

## 🎨 2. Visualizations (`/src/components/`)

We use **React** + **D3.js** for our charts. React manages the div container and ResizeObservers, while D3 directly manipulates the low-level SVG elements to draw the math.

- **`ForecastChart/ForecastChart.jsx`**
  - Renders the Area/Line chart on the Cost Analysis page. Visually draws historical cost lines converging into dotted ML predictions with shadowed gradient confidence intervals.
- **`DonutChart/DonutChart.jsx`**
  - Animates the circular service breakdown. Contains custom HTML scrolling legends on the right side.
- **`GroupedBarChart/GroupedBarChart.jsx`**
  - Uses absolute positioning logic to draw the Predicted vs. Actual Variance bars. Features a custom tooltip tracking over/under metrics.
- **`ModelMetrics/ModelMetrics.jsx`**
  - Renders the "Scoring Metrics" panel displaying `Accuracy (92.4%)` and `R² Score` alongside animated horizontal progress bars.

---

## 🧭 3. Pages & Routing (`/src/pages/`)

These act as the "glue", pulling the data from `useDashboardData` and piping it directly into our visualizations.

- **`Login/Login.jsx` (Route: `/login`)** — Public
  - GitHub OAuth entry point. No sidebar or header.
- **`Callback/Callback.jsx` (Route: `/callback`)** — Public
  - OAuth redirect handler. No sidebar or header.
- **`Dashboard/Dashboard.jsx` (Route: `/`)** — Protected
  - The root dashboard component with KPI cards, charts, alerts, and top resources.
- **`CostAnalysis/CostAnalysis.jsx` (Route: `/costs`)** — Protected
  - Focuses on the trend analysis. Mounts the `GlobalFilters`, the `ForecastChart`, and the `DonutChart`.
- **`Predictions/Predictions.jsx` (Route: `/predict`)** — Protected
  - Focuses on evaluating the machine learning models. Mounts the `GlobalFilters`, the `GroupedBarChart` (variance), and the `ModelMetrics` widgets.
- **`Settings/Settings.jsx` (Route: `/settings`)** — Protected
  - Repository connection form (`POST /api/integrations/github/webhook`) and account management (logout).

---

## 🛠️ 4. Shared Utilities & Layout

- **`src/components/GlobalFilters/GlobalFilters.jsx`**
  - A simple UI bar containing buttons like `7 Days | 30 Days` and a Cloud Service Dropdown. Clicking these *doesn't* change state directly; instead, it updates the window URL search params, which triggers `useDashboardData` to pull new data.
- **`src/components/StatusBar/StatusBar.jsx`**
  - The small control bar at the top right of the screen displaying "🟢 Live", the "Updated 10s ago" timestamp, and Pause/Refresh buttons.
- **`src/components/Layout/` & `Sidebar/` & `Header/`**
  - The structural "shell" of the app. The Layout holds the Sidebar routing navigation (the left menu) and renders child routes in the centre.

---

## ⚙️ 5. Configuration & Setup files

- **`package.json`**
  - Stores all NPM dependencies (React Router, Vite, D3). Includes `"test": "vitest run"` for unit testing.
- **`vite.config.js`**
  - Tells Vite how to compile the React code and tells Vitest how to execute JSDOM simulated browser environments for unit testing.
- **`src/setupTests.js`**
  - Imports JSDOM extensions and manually "mocks" the `ResizeObserver` so that when D3 charts render inside terminal tests, they don't instantly crash.
- **`.env`**
  - Declares environment variables:
    - `VITE_API_BASE_URL` — Backend API URL
    - `VITE_POLLING_INTERVAL_MS` — Dashboard polling interval
    - `VITE_GITHUB_CLIENT_ID` — GitHub OAuth App client ID
