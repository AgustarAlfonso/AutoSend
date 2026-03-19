import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Calendar,
    Users,
    History,
    Settings,
    LogOut,
    Zap,
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/schedules', icon: Calendar, label: 'Jadwal' },
    { to: '/contacts', icon: Users, label: 'Kontak' },
    { to: '/history', icon: History, label: 'Riwayat' },
    { to: '/settings', icon: Settings, label: 'Pengaturan' },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Sidebar */}
            <aside style={{
                width: 'var(--sidebar-width)',
                background: 'var(--color-bg-sidebar)',
                borderRight: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                position: 'relative',
            }}>
                {/* Subtle neon line on right edge */}
                <div style={{
                    position: 'absolute',
                    top: 0, right: -1, bottom: 0,
                    width: '1px',
                    background: 'linear-gradient(180deg, transparent, var(--color-primary) 40%, var(--color-secondary) 60%, transparent)',
                    opacity: 0.4,
                }} />

                {/* Logo Area */}
                <div style={{
                    padding: '20px 16px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}>
                    <img
                        src="/logo.png"
                        alt="AutoSend Logo"
                        className="logo-animated"
                        style={{
                            width: '38px',
                            height: '38px',
                            objectFit: 'contain',
                            borderRadius: '8px',
                        }}
                    />
                    <div>
                        <h1 style={{
                            fontSize: '17px',
                            fontWeight: '700',
                            color: '#fff',
                            margin: 0,
                            letterSpacing: '-0.3px',
                        }}>
                            Auto<span style={{ color: 'var(--color-primary)' }}>Send</span>
                        </h1>
                        <p style={{
                            fontSize: '10px',
                            color: 'var(--color-text-muted)',
                            margin: 0,
                            fontFamily: 'JetBrains Mono, monospace',
                            letterSpacing: '0.05em',
                        }}>WA SCHEDULER</p>
                    </div>
                    {/* Live indicator */}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'var(--color-primary)',
                            boxShadow: '0 0 6px var(--color-primary-glow)',
                            animation: 'logo-pulse 2s ease-in-out infinite',
                        }} />
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                fontSize: '13.5px',
                                fontWeight: '500',
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                                borderLeft: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                                paddingLeft: isActive ? '10px' : '12px',
                                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                background: isActive
                                    ? 'linear-gradient(135deg, rgba(0, 230, 118, 0.12) 0%, rgba(0, 229, 255, 0.05) 100%)'
                                    : 'transparent',
                                boxShadow: isActive ? 'inset 0 0 20px rgba(0, 230, 118, 0.04)' : 'none',
                            })}
                            onMouseEnter={(e) => {
                                if (!e.currentTarget.classList.contains('active')) {
                                    e.currentTarget.style.background = 'var(--color-bg-hover)';
                                    e.currentTarget.style.color = '#fff';
                                }
                            }}
                            onMouseLeave={(e) => {
                                // Reset to active or default (handled by NavLink style prop on re-render)
                            }}
                        >
                            <Icon size={16} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Version tag */}
                <div style={{ padding: '0 8px 8px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'rgba(0, 230, 118, 0.04)',
                        border: '1px solid rgba(0, 230, 118, 0.1)',
                    }}>
                        <Zap size={11} style={{ color: 'var(--color-primary)' }} />
                        <span style={{
                            fontSize: '10px',
                            color: 'var(--color-text-muted)',
                            fontFamily: 'JetBrains Mono, monospace',
                        }}>v1.0.0 — beta</span>
                    </div>
                </div>

                {/* User section */}
                <div style={{
                    padding: '12px 8px',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        {/* Avatar */}
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.2), rgba(0, 229, 255, 0.15))',
                            border: '1px solid rgba(0, 230, 118, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontSize: '13px',
                            fontWeight: '700',
                            color: 'var(--color-primary)',
                        }}>
                            {user?.username?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{
                                fontSize: '12.5px',
                                fontWeight: '600',
                                color: '#fff',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>{user?.username}</p>
                            <p style={{
                                fontSize: '10px',
                                color: 'var(--color-primary)',
                                margin: 0,
                                fontFamily: 'JetBrains Mono, monospace',
                            }}>● online</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            padding: '6px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color 0.2s, background 0.2s',
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255, 23, 68, 0.1)';
                            e.currentTarget.style.color = 'var(--color-danger)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--color-text-muted)';
                        }}
                    >
                        <LogOut size={15} />
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '24px',
                position: 'relative',
            }} className="page-enter">
                <Outlet />
            </main>
        </div>
    );
}
