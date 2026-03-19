import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Send,
  AlertCircle,
  ListCheck,
  Smartphone,
  CalendarClock,
  ChevronRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import { format } from "date-fns";
import api from "../api/client";
import { useSocket } from "../hooks/useSocket";

const StatCard = ({ label, value, icon: Icon, accentColor, bgColor, glowColor }) => (
  <div style={{
    background: 'var(--color-bg-card)',
    borderRadius: '14px',
    border: `1px solid ${accentColor}22`,
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
  }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = `0 8px 30px ${glowColor}`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    {/* Top accent bar */}
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
      background: `linear-gradient(90deg, ${accentColor}, ${accentColor}44)`,
      boxShadow: `0 0 8px ${glowColor}`,
    }} />
    <div>
      <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '0 0 8px 0', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </p>
      <p style={{ fontSize: '32px', fontWeight: '700', color: accentColor, margin: 0, lineHeight: 1, textShadow: `0 0 20px ${glowColor}` }}>
        {value}
      </p>
    </div>
    <div style={{
      width: '44px', height: '44px', borderRadius: '10px',
      background: bgColor,
      border: `1px solid ${accentColor}33`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: accentColor,
    }}>
      <Icon size={20} />
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { on } = useSocket();
  const [stats, setStats] = useState({
    sentToday: 0, failedToday: 0, pendingToday: 0,
    activeSchedules: 0, hasMissedMessages: false,
  });
  const [upcoming, setUpcoming] = useState([]);
  const [waStatus, setWaStatus] = useState({ connected: false, status: "DISCONNECTED" });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, upcomingRes, waRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/upcoming"),
        api.get("/whatsapp/status"),
      ]);
      setStats(statsRes.data);
      setUpcoming(upcomingRes.data);
      setWaStatus({ connected: waRes.data.connected, status: waRes.data.status });
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const unsubStatus = on("wa:status", (data) => setWaStatus({ connected: data.connected, status: data.status }));
    const unsubReady = on("wa:ready", () => setWaStatus({ connected: true, status: "CONNECTED" }));
    const unsubComplete = on("schedule:complete", () => fetchData());
    return () => { unsubStatus(); unsubReady(); unsubComplete(); };
  }, [on]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <div className="spinner-neon" />
        <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontFamily: 'JetBrains Mono, monospace' }}>loading dashboard...</p>
      </div>
    );
  }

  const waConnected = waStatus.connected;
  const waConnecting = waStatus.status === "CONNECTING";
  const waWaiting = waStatus.status === "WAITING_QR";

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }} className="page-enter">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(0,230,118,0.2), rgba(0,229,255,0.1))',
            border: '1px solid rgba(0,230,118,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LayoutDashboard size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#fff' }}>Dashboard</h1>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>overview &amp; monitoring</p>
          </div>
        </div>
        {/* WhatsApp status pill — compact header version */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', borderRadius: '999px',
          background: waConnected ? 'rgba(0,230,118,0.1)' : waConnecting ? 'rgba(255,171,0,0.1)' : 'rgba(255,23,68,0.08)',
          border: `1px solid ${waConnected ? 'rgba(0,230,118,0.3)' : waConnecting ? 'rgba(255,171,0,0.3)' : 'rgba(255,23,68,0.25)'}`,
        }}>
          {waConnected ? <Wifi size={13} style={{ color: 'var(--color-primary)' }} /> : <WifiOff size={13} style={{ color: waConnecting ? 'var(--color-warning)' : 'var(--color-danger)' }} />}
          <span style={{
            fontSize: '12px', fontWeight: '600', fontFamily: 'JetBrains Mono, monospace',
            color: waConnected ? 'var(--color-primary)' : waConnecting ? 'var(--color-warning)' : 'var(--color-danger)',
          }}>
            {waConnected ? 'WA Connected' : waConnecting ? 'Connecting...' : waWaiting ? 'Scan QR' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Missed messages alert */}
      {stats.hasMissedMessages && (
        <div style={{
          background: 'rgba(255,171,0,0.07)', border: '1px solid rgba(255,171,0,0.3)',
          borderRadius: '12px', padding: '14px 18px', marginBottom: '22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-warning)', fontWeight: '500' }}>
              Ada pesan yang terlewat (Missed) saat server mati.
            </p>
          </div>
          <button
            onClick={() => navigate("/history?status=MISSED")}
            style={{
              background: 'var(--color-warning)', color: '#1a0a00',
              border: 'none', borderRadius: '8px', padding: '6px 16px',
              fontSize: '12px', fontWeight: '700', cursor: 'pointer',
              whiteSpace: 'nowrap', fontFamily: 'Space Grotesk, sans-serif',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Lihat &amp; Retry
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Terkirim Hari Ini" value={stats.sentToday} icon={Send}
          accentColor="#00e676" bgColor="rgba(0,230,118,0.08)" glowColor="rgba(0,230,118,0.2)" />
        <StatCard label="Gagal Hari Ini" value={stats.failedToday} icon={AlertCircle}
          accentColor="#ff1744" bgColor="rgba(255,23,68,0.08)" glowColor="rgba(255,23,68,0.2)" />
        <StatCard label="Pending Hari Ini" value={stats.pendingToday} icon={CalendarClock}
          accentColor="#ffab00" bgColor="rgba(255,171,0,0.08)" glowColor="rgba(255,171,0,0.2)" />
        <StatCard label="Jadwal Aktif" value={stats.activeSchedules} icon={ListCheck}
          accentColor="#00e5ff" bgColor="rgba(0,229,255,0.08)" glowColor="rgba(0,229,255,0.2)" />
      </div>

      {/* Bottom section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        {/* Upcoming Schedules */}
        <div style={{
          background: 'var(--color-bg-card)', borderRadius: '14px',
          border: '1px solid var(--color-border)', padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>Jadwal Terdekat</h2>
            <button
              onClick={() => navigate("/schedules")}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                color: 'var(--color-primary)', background: 'none', border: 'none',
                fontSize: '12px', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif',
                padding: '4px 0',
              }}
            >
              Lihat Semua <ChevronRight size={14} />
            </button>
          </div>

          {upcoming.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '36px 0',
              color: 'var(--color-text-muted)', fontSize: '13px',
            }}>
              <CalendarClock size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p style={{ margin: 0 }}>Tidak ada jadwal aktif terdekat.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcoming.map((schedule) => (
                <div key={schedule.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', borderRadius: '10px',
                  background: 'var(--color-bg-input)', border: '1px solid var(--color-border)',
                  transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,230,118,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                >
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#fff', margin: '0 0 3px 0' }}>{schedule.title}</p>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                      {schedule._count.recipients} penerima · {schedule.scheduleType}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                      {format(new Date(schedule.scheduledAt), "dd MMM")}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                      {format(new Date(schedule.scheduledAt), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WhatsApp Status Card */}
        <div style={{
          background: 'var(--color-bg-card)', borderRadius: '14px',
          border: '1px solid var(--color-border)', padding: '20px',
          height: 'fit-content',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Smartphone size={16} style={{ color: 'var(--color-text-muted)' }} />
            <h2 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>Status WhatsApp</h2>
          </div>

          {/* Big status indicator */}
          <div style={{
            background: waConnected ? 'rgba(0,230,118,0.06)' : waConnecting ? 'rgba(255,171,0,0.06)' : 'rgba(255,23,68,0.06)',
            border: `1px solid ${waConnected ? 'rgba(0,230,118,0.2)' : waConnecting ? 'rgba(255,171,0,0.2)' : 'rgba(255,23,68,0.2)'}`,
            borderRadius: '12px', padding: '20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: waConnected ? 'rgba(0,230,118,0.15)' : waConnecting ? 'rgba(255,171,0,0.15)' : 'rgba(255,23,68,0.15)',
              position: 'relative',
            }}>
              {waConnected
                ? <Wifi size={22} style={{ color: 'var(--color-primary)' }} />
                : waConnecting
                ? <Wifi size={22} style={{ color: 'var(--color-warning)' }} />
                : <WifiOff size={22} style={{ color: 'var(--color-danger)' }} />
              }
              {/* Pulse ring for connected */}
              {waConnected && (
                <div style={{
                  position: 'absolute', inset: '-4px', borderRadius: '50%',
                  border: '1px solid rgba(0,230,118,0.3)',
                  animation: 'logo-pulse 2s ease-in-out infinite',
                }} />
              )}
            </div>
            <div>
              <p style={{
                fontSize: '14px', fontWeight: '700', margin: '0 0 4px 0',
                color: waConnected ? 'var(--color-primary)' : waConnecting ? 'var(--color-warning)' : 'var(--color-danger)',
              }}>
                {waConnected ? "Terhubung" : waConnecting ? "Menghubungkan..." : waWaiting ? "Menunggu Scan QR" : "Terputus"}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: 0, fontFamily: 'JetBrains Mono, monospace' }}>
                {waStatus.status}
              </p>
            </div>
            {!waConnected && (
              <button
                onClick={() => navigate("/settings")}
                style={{
                  padding: '8px 20px', borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid rgba(0,229,255,0.3)',
                  color: 'var(--color-secondary)', fontSize: '12px',
                  fontWeight: '600', cursor: 'pointer',
                  fontFamily: 'Space Grotesk, sans-serif',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(0,229,255,0.1)';
                  e.currentTarget.style.borderColor = 'var(--color-secondary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)';
                }}
              >
                Buka Pengaturan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
