import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(username, password);
            toast.success('Login berhasil!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Login gagal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Background ambient glow blobs */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
            }}>
                <div style={{
                    position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
                    width: '600px', height: '600px',
                    background: 'radial-gradient(circle, rgba(0, 230, 118, 0.06) 0%, transparent 65%)',
                }} />
                <div style={{
                    position: 'absolute', bottom: '10%', right: '10%',
                    width: '300px', height: '300px',
                    background: 'radial-gradient(circle, rgba(0, 229, 255, 0.05) 0%, transparent 65%)',
                }} />
            </div>

            <div style={{
                width: '100%',
                maxWidth: '380px',
                position: 'relative',
                zIndex: 1,
            }} className="page-enter">

                {/* Logo + Brand */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                        <img
                            src="/logo.png"
                            alt="AutoSend"
                            className="logo-animated"
                            style={{
                                width: '72px',
                                height: '72px',
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                    <h1 style={{
                        fontSize: '30px',
                        fontWeight: '700',
                        margin: '0 0 4px 0',
                        letterSpacing: '-0.5px',
                    }}>
                        Auto<span style={{ color: 'var(--color-primary)', textShadow: '0 0 20px rgba(0,230,118,0.4)' }}>Send</span>
                    </h1>
                    <p style={{
                        color: 'var(--color-text-muted)',
                        margin: 0,
                        fontSize: '13px',
                        fontFamily: 'JetBrains Mono, monospace',
                        letterSpacing: '0.05em',
                    }}>WhatsApp Message Scheduler</p>
                </div>

                {/* Card */}
                <div style={{
                    background: 'var(--color-bg-card)',
                    borderRadius: '18px',
                    border: '1px solid var(--color-border)',
                    padding: '28px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,230,118,0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Top accent line */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: '2px',
                        background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary), var(--color-primary))',
                        boxShadow: '0 0 12px var(--color-primary-glow)',
                    }} />

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {/* Username */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'var(--color-text-muted)',
                                marginBottom: '8px',
                                fontFamily: 'JetBrains Mono, monospace',
                                letterSpacing: '0.07em',
                                textTransform: 'uppercase',
                            }}>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input-field"
                                style={{ padding: '11px 14px', fontSize: '14px' }}
                                placeholder="Masukkan username"
                                autoComplete="username"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: 'var(--color-text-muted)',
                                marginBottom: '8px',
                                fontFamily: 'JetBrains Mono, monospace',
                                letterSpacing: '0.07em',
                                textTransform: 'uppercase',
                            }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field"
                                    style={{ padding: '11px 44px 11px 14px', fontSize: '14px' }}
                                    placeholder="Masukkan password"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none',
                                        color: 'var(--color-text-muted)',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center',
                                        padding: '4px',
                                        transition: 'color 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                                >
                                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            {loading ? (
                                <>
                                    <div style={{
                                        width: '14px', height: '14px',
                                        border: '2px solid rgba(6,13,23,0.3)',
                                        borderTopColor: '#060d17',
                                        borderRadius: '50%',
                                        animation: 'spin-neon 0.7s linear infinite',
                                    }} />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <Send size={14} />
                                    Masuk
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Hint */}
                <p style={{
                    textAlign: 'center',
                    fontSize: '11px',
                    color: 'var(--color-text-subtle)',
                    marginTop: '16px',
                    fontFamily: 'JetBrains Mono, monospace',
                }}>
                    default: <span style={{ color: 'var(--color-text-muted)' }}>admin</span> /{' '}
                    <span style={{ color: 'var(--color-text-muted)' }}>admin123</span>
                </p>
            </div>
        </div>
    );
}
