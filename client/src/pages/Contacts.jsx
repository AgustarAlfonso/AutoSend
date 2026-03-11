import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [formData, setFormData] = useState({ name: '', phoneNumber: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const res = await api.get('/contacts');
            setContacts(res.data);
        } catch (error) {
            toast.error('Gagal mengambil data kontak');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (contact = null) => {
        if (contact) {
            setEditingContact(contact);
            setFormData({ name: contact.name, phoneNumber: contact.phoneNumber });
        } else {
            setEditingContact(null);
            setFormData({ name: '', phoneNumber: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingContact(null);
        setFormData({ name: '', phoneNumber: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.phoneNumber) {
            return toast.error('Nama dan Nomor WA wajib diisi');
        }

        try {
            setIsSubmitting(true);
            if (editingContact) {
                await api.put(`/contacts/${editingContact.id}`, formData);
                toast.success('Kontak berhasil diupdate');
            } else {
                await api.post('/contacts', formData);
                toast.success('Kontak baru berhasil ditambahkan');
            }
            handleCloseModal();
            fetchContacts();
        } catch (error) {
            toast.error(error.response?.data?.error?.message || 'Gagal menyimpan kontak');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus kontak ini?')) return;

        try {
            await api.delete(`/contacts/${id}`);
            toast.success('Kontak berhasil dihapus');
            fetchContacts();
        } catch (error) {
            toast.error('Gagal menghapus kontak');
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phoneNumber.includes(search)
    );

    return (
        <div className="max-w-6xl mx-auto h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <Users className="w-7 h-7 text-[var(--color-primary)]" />
                    <h1 className="text-2xl font-bold">Kontak</h1>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Tambah Kontak
                </button>
            </div>

            <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] flex-1 overflow-hidden flex flex-col">
                {/* Search Bar */}
                <div className="p-4 border-b border-[var(--color-border)]">
                    <div className="relative max-w-md">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Cari nama atau nomor WA..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="p-8 text-center text-[var(--color-text-muted)]">Loading...</div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="p-8 text-center text-[var(--color-text-muted)]">
                            {search ? 'Tidak ada kontak yang cocok dengan pencarian.' : 'Belum ada kontak. Silakan tambah baru.'}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
                                    <th className="p-4 font-medium">Nama</th>
                                    <th className="p-4 font-medium">Nomor WA</th>
                                    <th className="p-4 font-medium">Jadwal Aktif</th>
                                    <th className="p-4 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContacts.map(contact => (
                                    <tr key={contact.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-input)] transition-colors">
                                        <td className="p-4 font-medium">{contact.name}</td>
                                        <td className="p-4 font-mono text-sm">{contact.phoneNumber}</td>
                                        <td className="p-4 text-[var(--color-text-muted)] whitespace-nowrap">
                                            {contact._count?.schedules || 0} jadwal
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleOpenModal(contact)}
                                                className="p-2 text-[var(--color-text-muted)] hover:text-white transition-colors rounded hover:bg-[#334155]"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(contact.id)}
                                                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors rounded hover:bg-[#7f1d1d]/20"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                    <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-[var(--color-border)] flex justify-between items-center">
                            <h2 className="text-xl font-bold">{editingContact ? 'Edit Kontak' : 'Tambah Kontak Baru'}</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nama</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: Budi Santoso"
                                    className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--color-primary)]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Nomor WhatsApp</label>
                                <input
                                    type="text"
                                    value={formData.phoneNumber}
                                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    placeholder="Contoh: 081234567890"
                                    className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--color-primary)] font-mono"
                                    required
                                />
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">Gunakan format 08x atau 628x tanpa spasi/tanda hubung.</p>
                            </div>

                            <div className="flex gap-3 justify-end mt-8">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-input)] transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
