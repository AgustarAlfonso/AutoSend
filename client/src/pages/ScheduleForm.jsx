import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function ScheduleForm({ onClose, onSuccess }) {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        contactIds: [],
        scheduledAt: '',
        scheduleType: 'ONCE',
        cronExpression: '',
        endsAt: '',
        maxRepeats: ''
    });

    useEffect(() => {
        // Fetch contacts for selection
        const fetchContacts = async () => {
            try {
                const res = await api.get('/contacts');
                setContacts(res.data);
            } catch (error) {
                toast.error('Gagal memuat daftar kontak');
            }
        };
        fetchContacts();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContactToggle = (contactId) => {
        setFormData(prev => {
            const isSelected = prev.contactIds.includes(contactId);
            if (isSelected) {
                return { ...prev, contactIds: prev.contactIds.filter(id => id !== contactId) };
            } else {
                return { ...prev, contactIds: [...prev.contactIds, contactId] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.contactIds.length === 0) {
            return toast.error('Pilih minimal satu penerima');
        }

        try {
            setLoading(true);
            await api.post('/schedules', formData);
            toast.success('Jadwal berhasil dibuat');
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Gagal menyimpan jadwal');
        } finally {
            setLoading(false);
        }
    };

    // Convert empty strings to null/undefined before submission for optional fields if needed, 
    // but handled ok by backend (except string to date)

    return (
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] flex-1 overflow-hidden flex flex-col relative w-full h-full">
            <div className="p-5 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-bg-card)] sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 text-[var(--color-text-muted)] hover:text-white transition-colors rounded hover:bg-[var(--color-bg-input)]"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold">Buat Jadwal Baru</h2>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-5 py-2 rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>

            <form className="p-6 overflow-y-auto flex-1 h-full space-y-6" id="schedule-form" onSubmit={handleSubmit}>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Judul Jadwal</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Contoh: Meeting Mingguan"
                                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Pesan (Teks)</label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={6}
                                placeholder="Tulis pesan yang akan dikirim..."
                                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--color-primary)] resize-none"
                                required
                            ></textarea>
                        </div>
                    </div>

                    {/* Timing & Type */}
                    <div className="space-y-4 p-5 rounded-xl border border-[var(--color-border)] bg-[#334155]/20">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tanggal & Waktu Mulai</label>
                            <input
                                type="datetime-local"
                                name="scheduledAt"
                                value={formData.scheduledAt}
                                onChange={handleChange}
                                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--color-primary)] [color-scheme:dark]"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Tipe Jadwal</label>
                            <select
                                name="scheduleType"
                                value={formData.scheduleType}
                                onChange={handleChange}
                                className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                            >
                                <option value="ONCE">Sekali (ONCE)</option>
                                <option value="DAILY">Harian (DAILY)</option>
                                <option value="WEEKLY">Mingguan (WEEKLY)</option>
                                <option value="MONTHLY">Bulanan (MONTHLY)</option>
                                <option value="CUSTOM">Custom Cron</option>
                            </select>
                        </div>

                        {formData.scheduleType === 'CUSTOM' && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Cron Expression</label>
                                <input
                                    type="text"
                                    name="cronExpression"
                                    value={formData.cronExpression}
                                    onChange={handleChange}
                                    placeholder="* * * * *"
                                    className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--color-primary)] font-mono"
                                    required
                                />
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">Gunakan format CRON Unix (ex: 0 8 * * * untuk jam 8 pagi).</p>
                            </div>
                        )}

                        {formData.scheduleType !== 'ONCE' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[var(--color-text-muted)]">Berakhir Pada (Opsional)</label>
                                    <input
                                        type="date"
                                        name="endsAt"
                                        value={formData.endsAt}
                                        onChange={handleChange}
                                        className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--color-primary)] [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-[var(--color-text-muted)]">Maks Pengulangan</label>
                                    <input
                                        type="number"
                                        name="maxRepeats"
                                        value={formData.maxRepeats}
                                        onChange={handleChange}
                                        min="1"
                                        placeholder="Ex: 5"
                                        className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recipients (Contacts) */}
                <div>
                    <label className="block text-sm font-medium mb-3">Pilih Penerima ({formData.contactIds.length} dipilih)</label>
                    {contacts.length === 0 ? (
                        <div className="p-6 text-center border border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-text-muted)]">
                            Belum ada kontak. Silakan tambah kontak terlebih dahulu dari halaman Kontak.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {contacts.map(contact => (
                                <div
                                    key={contact.id}
                                    onClick={() => handleContactToggle(contact.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center gap-3 ${formData.contactIds.includes(contact.id)
                                        ? 'border-[var(--color-primary)] bg-[#6366f1]/10'
                                        : 'border-[var(--color-border)] bg-[var(--color-bg-input)] hover:border-gray-500'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${formData.contactIds.includes(contact.id) ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-gray-500'
                                        }`}>
                                        {formData.contactIds.includes(contact.id) && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm leading-none mb-1">{contact.name}</h4>
                                        <p className="text-xs text-[var(--color-text-muted)] font-mono">{contact.phoneNumber}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </form>
        </div>
    );
}
