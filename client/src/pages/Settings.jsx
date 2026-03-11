import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, QrCode, LogOut, Smartphone, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
    const { logout } = useAuth();
    const { on } = useSocket();
    const [waStatus, setWaStatus] = useState({ connected: false, status: 'DISCONNECTED' });
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        fetchStatus();

        const unsubStatus = on('wa:status', (data) => {
            setWaStatus({ connected: data.connected, status: data.status });
            if (data.status !== 'WAITING_QR') {
                setQrCode(null);
            }
        });

        const unsubQr = on('wa:qr', (qr) => {
            // whatsapp-web.js sends QR as string, we can use a library to render it, 
            // or for simplicity, in a real app use an npm package like `qrcode.react` 
            // Since we don't have it, we'll suggest installing it next or show RAW
            // Actually we'll just display a placeholder prompting the backend scanner 
            // OR better, we can render the raw string into a Google Chart API link for a quick fix
            setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qr)}`);
        });

        const unsubReady = on('wa:ready', () => {
            setWaStatus({ connected: true, status: 'CONNECTED' });
            setQrCode(null);
            toast.success('WhatsApp berhasil terhubung!');
        });

        return () => {
            unsubStatus();
            unsubQr();
            unsubReady();
        };
    }, [on]);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/whatsapp/status');
            setWaStatus({ connected: res.data.connected, status: res.data.status });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleWaLogout = async () => {
        if (!window.confirm('Yakin ingin logout WhatsApp? Anda harus scan QR lagi nanti.')) return;

        setIsLoggingOut(true);
        try {
            await api.post('/whatsapp/logout');
            toast.success('Device WhatsApp berhasil di-logout');
            fetchStatus();
        } catch (error) {
            toast.error('Gagal logout WhatsApp');
        } finally {
            setIsLoggingOut(false);
        }
    };

    if (loading) return null;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <SettingsIcon className="w-7 h-7 text-[var(--color-primary)]" />
                <h1 className="text-2xl font-bold">Pengaturan</h1>
            </div>

            <div className="space-y-6">
                {/* WhatsApp Connection Section */}
                <section className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
                    <div className="p-5 border-b border-[var(--color-border)] flex items-center gap-3">
                        <Smartphone className="w-6 h-6 text-emerald-500" />
                        <h2 className="text-xl font-bold">Koneksi WhatsApp</h2>
                    </div>

                    <div className="p-6">
                        <div className="flex flex-col md:flex-row items-center gap-8">

                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className="text-sm text-[var(--color-text-muted)] font-medium mb-1">Status Saat Ini</h3>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3.5 h-3.5 rounded-full ${waStatus.connected ? 'bg-[var(--color-success)]' :
                                            waStatus.status === 'CONNECTING' ? 'bg-[var(--color-warning)] animate-pulse' :
                                                'bg-[var(--color-danger)]'
                                            }`}></div>
                                        <span className="font-bold text-lg">
                                            {waStatus.connected ? 'Terhubung (Ready)' :
                                                waStatus.status === 'CONNECTING' ? 'Menghubungkan...' :
                                                    waStatus.status === 'WAITING_QR' ? 'Menunggu Scan QR Code' :
                                                        'Terputus'}
                                        </span>
                                    </div>
                                </div>

                                {waStatus.connected ? (
                                    <div className="pt-4 border-t border-[var(--color-border)]">
                                        <button
                                            onClick={handleWaLogout}
                                            disabled={isLoggingOut}
                                            className="flex items-center gap-2 px-4 py-2 bg-[#ef4444]/20 text-[var(--color-danger)] border border-[#ef4444]/50 rounded-lg hover:bg-[#ef4444]/30 transition-colors disabled:opacity-50"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            {isLoggingOut ? 'Logging out...' : 'Putuskan Koneksi (Logout WA)'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-[var(--color-bg-input)] p-4 rounded-lg flex items-start gap-3 border border-[var(--color-border)]">
                                        <AlertTriangle className="w-5 h-5 text-[var(--color-warning)] shrink-0" />
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            Silakan buka WhatsApp di HP Anda, buka menu <strong>Perangkat Taut</strong> (Linked Devices), dan scan QR code di samping ini.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* QR Code Area */}
                            <div className="shrink-0 w-64 flex flex-col items-center">
                                {waStatus.connected ? (
                                    <div className="w-48 h-48 bg-[#22c55e]/10 border border-[var(--color-success)] rounded-2xl flex flex-col items-center justify-center text-[var(--color-success)]">
                                        <CheckCircle2 className="w-16 h-16 mb-2" />
                                        <span className="font-bold">Connected</span>
                                    </div>
                                ) : qrCode ? (
                                    <div className="bg-white p-4 rounded-xl">
                                        <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48" />
                                    </div>
                                ) : (
                                    <div className="w-48 h-48 bg-[var(--color-bg-input)] border-2 border-dashed border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center text-[var(--color-text-muted)]">
                                        {waStatus.status === 'CONNECTING' ? (
                                            <div className="w-8 h-8 border-4 border-gray-600 border-t-[var(--color-primary)] rounded-full animate-spin mb-3"></div>
                                        ) : (
                                            <QrCode className="w-12 h-12 mb-3 opacity-30" />
                                        )}
                                        <span className="text-sm font-medium">
                                            {waStatus.status === 'CONNECTING' ? 'Loading...' : 'Menunggu QR'}
                                        </span>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </section>

                {/* Account Section */}
                <section className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
                    <div className="p-5 border-b border-[var(--color-border)]">
                        <h2 className="text-xl font-bold">Akun Aplikasi</h2>
                    </div>
                    <div className="p-6">
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#334155] text-white rounded-lg hover:bg-[#475569] transition-colors font-medium"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout dari AutoSend
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
