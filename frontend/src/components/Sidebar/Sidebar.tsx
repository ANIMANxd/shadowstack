import { NavLink } from 'react-router-dom'
import './Sidebar.css'

// ── Inline SVG Icons (no external deps) ────────────────────────────────────
const DashboardIcon = (): JSX.Element => (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
)

const CostIcon = (): JSX.Element => (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v2m0 8v2M8.5 9.5a3.5 3.5 0 0 1 7 0c0 2-3.5 3-3.5 3" />
        <circle cx="12" cy="16.5" r=".5" fill="currentColor" />
    </svg>
)

const PredictIcon = (): JSX.Element => (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
)

const ResourcesIcon = (): JSX.Element => (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
)

const AlertsIcon = (): JSX.Element => (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
)

const ReportsIcon = (): JSX.Element => (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
    </svg>
)

const SettingsIcon = (): JSX.Element => (
    <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
)

const CollapseIcon = (): JSX.Element => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
)

// ── Types ─────────────────────────────────────────────────────────────────────
interface NavItem {
    to: string
    label: string
    Icon: () => JSX.Element
    count?: number
}

interface SidebarProps {
    isCollapsed: boolean
    onToggle: () => void
    mobileOpen: boolean
}

// ── Navigation Config ────────────────────────────────────────────────────────
const PRIMARY_NAV: NavItem[] = [
    { to: '/', label: 'Overview', Icon: DashboardIcon },
    { to: '/costs', label: 'Cost Analysis', Icon: CostIcon },
    { to: '/predict', label: 'Predictions', Icon: PredictIcon },
    { to: '/resources', label: 'Resources', Icon: ResourcesIcon },
]

const SECONDARY_NAV: NavItem[] = [
    { to: '/alerts', label: 'Alerts', Icon: AlertsIcon, count: 3 },
    { to: '/reports', label: 'Reports', Icon: ReportsIcon },
]

const TERTIARY_NAV: NavItem[] = [
    { to: '/settings', label: 'Settings', Icon: SettingsIcon },
]

// ── Component ────────────────────────────────────────────────────────────────
/**
 * Sidebar – collapsible navigation panel
 */
export default function Sidebar({ isCollapsed, onToggle, mobileOpen }: SidebarProps): JSX.Element {
    const sidebarClass = [
        'sidebar',
        isCollapsed ? 'sidebar--collapsed' : '',
        mobileOpen ? 'sidebar--mobile-open' : '',
    ].filter(Boolean).join(' ')

    return (
        <aside className={sidebarClass} aria-label="Main navigation">
            <nav className="sidebar__inner">
                {/* Primary navigation */}
                <span className="sidebar__section-label">Main</span>
                {PRIMARY_NAV.map(({ to, label, Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        className={({ isActive }) =>
                            `sidebar__link${isActive ? ' active' : ''}`
                        }
                        aria-label={label}
                    >
                        <Icon />
                        <span className="sidebar__link-text">{label}</span>
                    </NavLink>
                ))}

                <div className="sidebar__divider" role="separator" />

                {/* Secondary navigation */}
                <span className="sidebar__section-label">Monitor</span>
                {SECONDARY_NAV.map(({ to, label, Icon, count }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `sidebar__link${isActive ? ' active' : ''}`
                        }
                        aria-label={label}
                    >
                        <Icon />
                        <span className="sidebar__link-text">{label}</span>
                        {count && (
                            <span className="sidebar__count" aria-label={`${count} unread`}>
                                {count}
                            </span>
                        )}
                    </NavLink>
                ))}

                <div className="sidebar__divider" role="separator" />

                {/* Tertiary */}
                {TERTIARY_NAV.map(({ to, label, Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `sidebar__link${isActive ? ' active' : ''}`
                        }
                        aria-label={label}
                    >
                        <Icon />
                        <span className="sidebar__link-text">{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Collapse toggle */}
            <button
                className="sidebar__collapse-btn"
                onClick={onToggle}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={isCollapsed ? 'Expand' : 'Collapse'}
            >
                <span className="sidebar__collapse-icon">
                    <CollapseIcon />
                </span>
                {!isCollapsed && <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-medium)' }}>Collapse</span>}
            </button>
        </aside>
    )
}
