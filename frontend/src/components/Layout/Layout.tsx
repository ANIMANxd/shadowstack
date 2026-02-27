import { useState, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from '../Header/Header'
import Sidebar from '../Sidebar/Sidebar'
import './Layout.css'

// Page imports
import Dashboard from '../../pages/Dashboard/Dashboard'
import PlaceholderPage from '../../pages/PlaceholderPage/PlaceholderPage'

/**
 * Layout – root application shell
 * Manages sidebar collapsed/mobile state and renders all routes.
 */
export default function Layout(): JSX.Element {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    const handleMenuClick = useCallback(() => {
        setMobileOpen(prev => !prev)
    }, [])

    const handleSidebarToggle = useCallback(() => {
        setSidebarCollapsed(prev => !prev)
    }, [])

    const handleOverlayClick = useCallback(() => {
        setMobileOpen(false)
    }, [])

    return (
        <div className="layout">
            {/* Sticky header */}
            <Header onMenuClick={handleMenuClick} />

            <div className="layout__body">
                {/* Navigation sidebar */}
                <Sidebar
                    isCollapsed={sidebarCollapsed}
                    onToggle={handleSidebarToggle}
                    mobileOpen={mobileOpen}
                />

                {/* Mobile backdrop overlay */}
                <div
                    className={`layout__overlay${mobileOpen ? ' layout__overlay--visible' : ''}`}
                    onClick={handleOverlayClick}
                    aria-hidden="true"
                />

                {/* Main scrollable content */}
                <main
                    className={`layout__main${sidebarCollapsed ? ' layout__main--collapsed' : ''}`}
                    id="main-content"
                >
                    <div className="layout__content">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/costs" element={<PlaceholderPage title="Cost Analysis" icon="💰" description="Drill into per-service, per-team, and per-region spend breakdowns." />} />
                            <Route path="/predict" element={<PlaceholderPage title="Predictions" icon="📈" description="ML-powered 30/60/90-day cost forecasting powered by historical spend trends." />} />
                            <Route path="/resources" element={<PlaceholderPage title="Resources" icon="🗄️" description="Live inventory of all cloud resources with tagging and grouping." />} />
                            <Route path="/alerts" element={<PlaceholderPage title="Alerts" icon="🔔" description="Budget threshold alerts and anomaly detection notifications." />} />
                            <Route path="/reports" element={<PlaceholderPage title="Reports" icon="📋" description="Scheduled cost reports and executive summary exports." />} />
                            <Route path="/settings" element={<PlaceholderPage title="Settings" icon="⚙️" description="Configure integrations, API keys, team members and billing preferences." />} />
                        </Routes>
                    </div>
                </main>
            </div>
        </div>
    )
}
