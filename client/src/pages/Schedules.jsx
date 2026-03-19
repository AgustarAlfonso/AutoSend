import { useState, useEffect } from 'react';
import { CalendarClock, Plus, Trash2, PauseCircle, PlayCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api/client';
import ScheduleForm from './ScheduleForm'; // We will create this next

export default function Schedules() {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const res = await api.get('/schedules');
            setSchedules(res.data);
        } catch (error) {
            toast.error('Gagal mengambil data jadwal');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePause = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
            await api.patch(`/schedules/${id}/pause`, { status: newStatus });
            toast.success(`Jadwal di-${newStatus.toLowerCase()}`);
            fetchSchedules();
        } catch (error) {
            toast.error('Gagal mengubah status jadwal');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus jadwal ini?')) return;

        try {
            await api.delete(`/schedules/${id}`);
            toast.success('Jadwal berhasil dihapus');
            fetchSchedules();
        } catch (error) {
            toast.error('Gagal menghapus jadwal');
        }
    };

    const filteredSchedules = schedules.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <CalendarClock className="w-7 h-7 text-[var(--color-primary)]" />
                    <h1 className="text-2xl font-bold">Jadwal Pesan</h1>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Buat Jadwal
                </button>
            </div>

            {!isFormOpen ? (
                <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] flex-1 overflow-hidden flex flex-col">
                    {/* Search Bar */}
                    <div className="p-4 border-b border-[var(--color-border)]">
                        <div className="relative max-w-md">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                            <input
                                type="text"
                                placeholder="Cari judul jadwal..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-auto">
                        {loading ? (
                            <div className="p-8 flex items-center justify-center gap-3 text-[var(--color-text-muted)]"><div className="spinner-neon" style={{width:'24px',height:'24px',borderWidth:'2px'}} />loading jadwal...</div>
                        ) : filteredSchedules.length === 0 ? (
                            <div className="p-8 text-center text-[var(--color-text-muted)]">
                                {search ? 'Tidak ada jadwal yang cocok.' : 'Belum ada jadwal. Silakan buat yang baru.'}
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
                                        <th className="p-4 font-medium">Judul</th>
                                        <th className="p-4 font-medium">Jadwal (Mulai)</th>
                                        <th className="p-4 font-medium">Tipe</th>
                                        <th className="p-4 font-medium">Penerima</th>
                                        <th className="p-4 font-medium">Status</th>
                                        <th className="p-4 font-medium text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSchedules.map(schedule => (
                                        <tr key={schedule.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-input)] transition-colors">
                                            <td className="p-4">
                                                <p className="font-medium text-sm">{schedule.title}</p>
                                            </td>
                                            <td className="p-4 font-medium text-sm">
                                                {format(new Date(schedule.scheduledAt), 'dd MMM yyyy, HH:mm')}
                                            </td>
                                            <td className="p-4 text-xs font-medium">
                                                <span className="bg-[#334155] px-2 py-1 rounded-md text-white">
                                                    {schedule.scheduleType}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-[var(--color-text-muted)]">
                                                {schedule._count?.recipients || 0} kontak
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${schedule.status === 'ACTIVE' ? 'bg-[#22c55e]/20 text-[var(--color-success)]' :
                                                    schedule.status === 'COMPLETED' ? 'bg-[#3b82f6]/20 text-[var(--color-info)]' :
                                                        'bg-[#f59e0b]/20 text-[var(--color-warning)]'
                                                    }`}>
                                                    {schedule.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                {schedule.status !== 'COMPLETED' && (
                                                    <button
                                                        onClick={() => handleTogglePause(schedule.id, schedule.status)}
                                                        className="p-2 text-[var(--color-text-muted)] hover:text-white transition-colors rounded hover:bg-[var(--color-bg-input)]"
                                                        title={schedule.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                                                    >
                                                        {schedule.status === 'ACTIVE' ? <PauseCircle className="w-5 h-5 text-[var(--color-warning)]" /> : <PlayCircle className="w-5 h-5 text-[var(--color-success)]" />}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(schedule.id)}
                                                    className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors rounded hover:bg-[#7f1d1d]/20"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ) : (
                <ScheduleForm
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={() => {
                        setIsFormOpen(false);
                        fetchSchedules();
                    }}
                />
            )}
        </div>
    );
}
