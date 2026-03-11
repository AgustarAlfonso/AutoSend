import { useState, useEffect } from 'react';
import { History as HistoryIcon, Clock, CheckCircle2, XCircle, RotateCcw, FileWarning } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useSearchParams } from 'react-router-dom';

export default function History() {
    const [searchParams] = useSearchParams();
    const initialStatus = searchParams.get('status') || '';

    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(initialStatus);
    const [page, setPage] = useState(0);
    const limit = 20;

    useEffect(() => {
        fetchLogs();
    }, [filter, page]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/logs', {
                params: { status: filter !== '' ? filter : undefined, limit, skip: page * limit }
            });
            setLogs(res.data.logs);
            setTotal(res.data.total);
        } catch (error) {
            toast.error('Gagal memuat log pesan');
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = async (id) => {
        try {
            await api.post(`/logs/${id}/retry`);
            toast.success('Pesan dikembalikan ke antrean (Pending) dan akan segera diproses');
            fetchLogs();
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Gagal retry pesan');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'SENT': return <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />;
            case 'FAILED': return <XCircle className="w-5 h-5 text-[var(--color-danger)]" />;
            case 'PENDING': return <Clock className="w-5 h-5 text-[var(--color-warning)]" />;
            case 'MISSED': return <FileWarning className="w-5 h-5 text-[var(--color-warning)]" />;
            default: return <Clock className="w-5 h-5" />;
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <HistoryIcon className="w-7 h-7 text-[var(--color-primary)]" />
                    <h1 className="text-2xl font-bold">Riwayat Pesan</h1>
                </div>

                <div className="flex bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border)] p-1">
                    {['', 'SENT', 'FAILED', 'PENDING', 'MISSED'].map(status => (
                        <button
                            key={status}
                            onClick={() => { setFilter(status); setPage(0); }}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === status ? 'bg-[var(--color-bg-input)] text-white shadow-sm' : 'text-[var(--color-text-muted)] hover:text-white'
                                }`}
                        >
                            {status === '' ? 'Semua' : status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="p-8 text-center text-[var(--color-text-muted)]">Loading...</div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 flex flex-col items-center justify-center text-[var(--color-text-muted)] h-full min-h-[300px]">
                            <HistoryIcon className="w-12 h-12 mb-4 opacity-50" />
                            <p>Tidak ada riwayat pesan ditemukan.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--color-border)] text-sm text-[var(--color-text-muted)] bg-[#1e293b] sticky top-0">
                                    <th className="p-4 font-medium w-12 text-center">Status</th>
                                    <th className="p-4 font-medium">Jadwal Asal</th>
                                    <th className="p-4 font-medium">Penerima</th>
                                    <th className="p-4 font-medium">Waktu (Target)</th>
                                    <th className="p-4 font-medium text-right">Aksi / Info</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-[var(--color-bg-input)] transition-colors group">
                                        <td className="p-4 flex justify-center">
                                            <div title={log.status}>{getStatusIcon(log.status)}</div>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-medium text-sm truncate max-w-[200px]">
                                                {log.schedule?.title || 'Unknown Schedule'}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-medium text-sm">{log.contact?.name || 'Unknown Route'}</p>
                                            <p className="text-xs text-[var(--color-text-muted)] font-mono">{log.phoneNumber}</p>
                                        </td>
                                        <td className="p-4 text-sm text-[var(--color-text-muted)]">
                                            <div>Diinginkan: {format(new Date(log.scheduledFor), 'dd MMM, HH:mm')}</div>
                                            {log.sentAt && (
                                                <div className="text-xs text-[var(--color-success)] mt-1">
                                                    Terkirim: {format(new Date(log.sentAt), 'dd MMM, HH:mm')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {log.errorMessage ? (
                                                <div className="text-xs text-[var(--color-danger)] max-w-[200px] truncate ml-auto" title={log.errorMessage}>
                                                    {log.errorMessage}
                                                </div>
                                            ) : null}

                                            {(log.status === 'FAILED' || log.status === 'MISSED') && (
                                                <button
                                                    onClick={() => handleRetry(log.id)}
                                                    className="mt-2 inline-flex items-center gap-1.5 text-xs bg-[#334155] border border-gray-600 hover:bg-gray-700 px-3 py-1.5 rounded-md transition-colors"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    Retry
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">
                            Menampilkan {page * limit + 1}-{Math.min((page + 1) * limit, total)} dari {total}
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 0}
                                onClick={() => setPage(prev => prev - 1)}
                                className="px-3 py-1 rounded bg-[var(--color-bg-input)] hover:bg-[#334155] disabled:opacity-50"
                            >
                                &larr; Prev
                            </button>
                            <button
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(prev => prev + 1)}
                                className="px-3 py-1 rounded bg-[var(--color-bg-input)] hover:bg-[#334155] disabled:opacity-50"
                            >
                                Next &rarr;
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
