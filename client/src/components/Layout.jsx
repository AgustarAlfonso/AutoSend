import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Calendar,
    Users,
    History,
    Settings,
    LogOut,
    MessageCircle,
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
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-[var(--color-bg-sidebar)] border-r border-[var(--color-border)] flex flex-col shrink-0">
                {/* Logo */}
                <div className="p-5 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">AutoSend</h1>
                            <p className="text-xs text-[var(--color-text-muted)]">WA Scheduler</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-indigo-500/25'
                                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-input)] hover:text-white'
                                }`
                            }
                        >
                            <Icon className="w-5 h-5" />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div className="p-3 border-t border-[var(--color-border)]">
                    <div className="flex items-center justify-between px-3 py-2">
                        <div>
                            <p className="text-sm font-medium text-white">{user?.username}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">Online</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-input)] hover:text-[var(--color-danger)] transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto p-6">
                <Outlet />
            </main>
        </div>
    );
}
