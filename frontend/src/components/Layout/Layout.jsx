import { useState, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from '../Header/Header'
import Sidebar from '../Sidebar/Sidebar'
import './Layout.css'

// Page imports
import Dashboard from '../../pages/Dashboard/Dashboard'
import CostAnalysis from '../../pages/CostAnalysis/CostAnalysis'
import Predictions from '../../pages/Predictions/Predictions'
import CodeAnalyzer from '../../pages/CodeAnalyzer/CodeAnalyzer'
import Alerts from '../../pages/Alerts/Alerts'
import Reports from '../../pages/Reports/Reports'
import Settings from '../../pages/Settings/Settings'

/**
 * Layout – root application shell
 * Manages sidebar collapsed/mobile state and renders all routes.
 */
export default function Layout() {
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
                            <Route path="/costs" element={<CostAnalysis />} />
                            <Route path="/predict" element={<Predictions />} />
                            <Route path="/analyze" element={<CodeAnalyzer />} />
                            <Route path="/alerts" element={<Alerts />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/settings" element={<Settings />} />
                        </Routes>
                    </div>
                </main>
            </div>
        </div>
    )
}
