import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Header.css'

// ── Icons ────────────────────────────────────────────────────────────────────
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
        viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
)

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none"
        viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
)

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none"
        viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
)

const StackLogo = () => (
    <svg className="header__logo" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="url(#logoGrad)" />
        <rect x="8" y="22" width="24" height="5" rx="2.5" fill="white" fillOpacity="0.9" />
        <rect x="8" y="14" width="24" height="5" rx="2.5" fill="white" fillOpacity="0.6" />
        <rect x="8" y="6" width="24" height="5" rx="2.5" fill="white" fillOpacity="0.3" />
        <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop stopColor="#63B3ED" />
                <stop offset="1" stopColor="#9F7AEA" />
            </linearGradient>
        </defs>
    </svg>
)

// ── Simple dropdown hook ─────────────────────────────────────────────────────
function useDropdown() {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])
    return { open, setOpen, ref }
}

/**
 * Header – top application bar
 */
export default function Header({ onMenuClick }) {
    const [hasNotifications] = useState(true)
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const notif = useDropdown()
    const settings = useDropdown()
    const account = useDropdown()

    const handleLogout = () => {
        logout()
        navigate('/login', { replace: true })
    }

    const notifications = [
        { id: 1, text: 'High complexity prediction detected', time: '2m ago', type: 'high' },
        { id: 2, text: 'Repository webhook connected', time: '1h ago', type: 'info' },
        { id: 3, text: 'Model retrained successfully', time: '3h ago', type: 'success' },
    ]

    return (
        <header className="header" role="banner">
            {/* Brand */}
            <div className="header__brand">
                <button className="header__menu-btn" aria-label="Toggle navigation" onClick={onMenuClick}>
                    <MenuIcon />
                </button>
                <StackLogo />
                <span className="header__wordmark">ShadowStack</span>
            </div>

            {/* Right controls */}
            <div className="header__right" role="navigation" aria-label="Top bar actions">
                <div className="header__status-pill" aria-label="Data stream live">
                    <span className="header__status-dot" aria-hidden="true" />
                    Live
                </div>

                {/* Notification bell dropdown */}
                <div className="header__dropdown-wrap" ref={notif.ref}>
                    <button className="header__icon-btn" aria-label="View notifications" onClick={() => notif.setOpen(!notif.open)}>
                        <BellIcon />
                        {hasNotifications && <span className="header__badge" aria-label="Unread notifications" />}
                    </button>
                    {notif.open && (
                        <div className="header__dropdown">
                            <div className="header__dropdown-header">Notifications</div>
                            {notifications.map((n) => (
                                <div key={n.id} className="header__dropdown-item">
                                    <span className={`header__dropdown-dot header__dropdown-dot--${n.type}`} />
                                    <div>
                                        <div className="header__dropdown-text">{n.text}</div>
                                        <div className="header__dropdown-time">{n.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Settings quick dropdown */}
                <div className="header__dropdown-wrap" ref={settings.ref}>
                    <button className="header__icon-btn" aria-label="Open settings" onClick={() => settings.setOpen(!settings.open)}>
                        <SettingsIcon />
                    </button>
                    {settings.open && (
                        <div className="header__dropdown">
                            <div className="header__dropdown-header">Quick Settings</div>
                            <button className="header__dropdown-item header__dropdown-action" onClick={() => { settings.setOpen(false); navigate('/settings') }}>
                                <span>⚙️</span> Go to Settings
                            </button>
                            <button className="header__dropdown-item header__dropdown-action" onClick={() => { settings.setOpen(false); window.location.reload() }}>
                                <span>🔄</span> Refresh Data
                            </button>
                        </div>
                    )}
                </div>

                {/* Account dropdown */}
                <div className="header__dropdown-wrap" ref={account.ref}>
                    <button className="header__avatar" aria-label="User profile" onClick={() => account.setOpen(!account.open)}>
                        {(user?.name || user?.login || 'U')[0].toUpperCase()}
                    </button>
                    {account.open && (
                        <div className="header__dropdown header__dropdown--right">
                            <div className="header__dropdown-header">{user?.name || user?.login || 'User'}</div>
                            <div className="header__dropdown-item" style={{ opacity: 0.7, fontSize: 'var(--fs-xs)' }}>
                                {user?.login || user?.email || 'GitHub OAuth'}
                            </div>
                            <div className="header__dropdown-divider" />
                            <button className="header__dropdown-item header__dropdown-action" onClick={() => { account.setOpen(false); navigate('/settings') }}>
                                <span>⚙️</span> Settings
                            </button>
                            <button className="header__dropdown-item header__dropdown-action" onClick={() => { account.setOpen(false); handleLogout() }}>
                                <span>🚪</span> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
