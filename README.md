# ShadowStack — Frontend

> Predict the cost impact of every pull request before it merges.

ShadowStack is a developer-facing dashboard that integrates with GitHub via OAuth to analyze pull requests and predict their infrastructure cost impact using machine learning.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 |
| **Bundler** | Vite 7 |
| **Routing** | React Router v7 |
| **Charts** | D3.js v7 |
| **HTTP** | Axios |
| **Testing** | Vitest + Testing Library |
| **Language** | JavaScript (JSX) + TypeScript (data layer) |

> **Note:** This project uses **React + Vite**, not Next.js. There is no server-side rendering or file-based routing.

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Setup
```bash
# Install dependencies
npm install

# Copy environment template and fill in values
cp .env.example .env
```

### Environment Variables
| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL (default: `http://localhost:8000/api/v1`) |
| `VITE_POLLING_INTERVAL_MS` | Dashboard polling interval in ms (default: `30000`) |
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth App client ID (required for login) |

### Development
```bash
npm run dev
```
Opens at [http://localhost:5173](http://localhost:5173)

### Build
```bash
npm run build
npm run preview
```

### Testing
```bash
npm run test              # Run all tests
npm run test:coverage     # Run with coverage report
```

### Linting
```bash
npm run lint
```

---

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── D3Chart/         # Area chart (D3.js)
│   ├── DonutChart/      # Animated donut chart
│   ├── ErrorBanner/     # Error notification bar
│   ├── ForecastChart/   # ML prediction line chart
│   ├── GlobalFilters/   # URL-synced filter controls
│   ├── GroupedBarChart/  # Predicted vs Actual bars
│   ├── Header/          # Top navigation bar
│   ├── Layout/          # App shell (sidebar + content)
│   ├── ModelMetrics/    # ML model performance panel
│   ├── ProtectedRoute/  # Auth gate component
│   ├── Sidebar/         # Collapsible navigation
│   ├── Skeleton/        # Loading skeleton states
│   └── StatusBar/       # Live polling status
├── context/
│   └── AuthContext.jsx  # Global auth state (GitHub OAuth)
├── data/
│   ├── mockAdapter.ts   # Dev fallback adapter
│   └── mockData.js      # Static mock data
├── hooks/
│   └── useDashboardData.ts  # Real-time data polling hook
├── pages/
│   ├── Callback/        # OAuth redirect handler
│   ├── CostAnalysis/    # Cost trend analysis
│   ├── Dashboard/       # Main dashboard
│   ├── Login/           # GitHub OAuth login
│   ├── PlaceholderPage/ # Coming-soon fallback
│   ├── Predictions/     # ML predictions view
│   └── Settings/        # Repo connection & account
├── services/
│   └── apiClient.ts     # Axios instance + interceptors
├── types/
│   └── api.types.ts     # TypeScript API interfaces
├── App.jsx              # Root routes
├── main.jsx             # Entry point (AuthProvider + Router)
└── index.css            # Global design system
```

---

## Authentication Flow

1. User visits `/login` → clicks "Continue with GitHub"
2. Redirected to GitHub OAuth with `repo` + `admin:repo_hook` scopes
3. GitHub redirects back to `/callback?code=...`
4. Frontend sends `code` to `POST /api/auth/github`
5. Backend exchanges code for access token, returns it
6. Token stored in `localStorage` via `AuthContext`
7. All subsequent API calls include `Authorization: Bearer <token>`

---

## License

This project is part of an academic BCA capstone submission.
