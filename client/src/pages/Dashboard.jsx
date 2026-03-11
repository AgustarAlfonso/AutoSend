import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Send,
  AlertCircle,
  ListCheck,
  Smartphone,
  CalendarClock,
} from "lucide-react";
import { format } from "date-fns";
import api from "../api/client";
import { useSocket } from "../hooks/useSocket";

export default function Dashboard() {
  const navigate = useNavigate();
  const { on } = useSocket();
  const [stats, setStats] = useState({
    sentToday: 0,
    failedToday: 0,
    pendingToday: 0,
    activeSchedules: 0,
    hasMissedMessages: false,
  });
  const [upcoming, setUpcoming] = useState([]);
  const [waStatus, setWaStatus] = useState({
    connected: false,
    status: "DISCONNECTED",
  });
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
      setWaStatus({
        connected: waRes.data.connected,
        status: waRes.data.status,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to real-time updates
    const unsubStatus = on("wa:status", (data) => {
      setWaStatus({ connected: data.connected, status: data.status });
    });

    const unsubReady = on("wa:ready", () => {
      setWaStatus({ connected: true, status: "CONNECTED" });
    });

    const unsubComplete = on("schedule:complete", () => {
      // Refresh stats when a schedule completes
      fetchData();
    });

    return () => {
      unsubStatus();
      unsubReady();
      unsubComplete();
    };
  }, [on]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">Loading...</div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <LayoutDashboard className="w-7 h-7 text-[var(--color-primary)]" />
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      {stats.hasMissedMessages && (
        <div className="bg-[#f59e0b]/10 border border-[var(--color-warning)] rounded-xl p-4 mb-6 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-3 text-[var(--color-warning)]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">
              Ada pesan yang terlewat (Missed) saat server mati.
            </p>
          </div>
          <button
            onClick={() => navigate("/history?status=MISSED")}
            className="text-xs bg-[var(--color-warning)] text-yellow-900 font-bold px-4 py-2 rounded-lg hover:bg-[#d97706] transition-colors whitespace-nowrap"
          >
            Lihat & Retry
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Terkirim Hari Ini",
            value: stats.sentToday,
            icon: Send,
            color: "text-[var(--color-success)]",
            bg: "bg-[#22c55e]/10",
          },
          {
            label: "Gagal Hari Ini",
            value: stats.failedToday,
            icon: AlertCircle,
            color: "text-[var(--color-danger)]",
            bg: "bg-[#ef4444]/10",
          },
          {
            label: "Pending Hari Ini",
            value: stats.pendingToday,
            icon: CalendarClock,
            color: "text-[var(--color-warning)]",
            bg: "bg-[#f59e0b]/10",
          },
          {
            label: "Jadwal Aktif",
            value: stats.activeSchedules,
            icon: ListCheck,
            color: "text-[var(--color-info)]",
            bg: "bg-[#3b82f6]/10",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[var(--color-bg-card)] rounded-xl p-5 border border-[var(--color-border)] flex items-center justify-between"
          >
            <div>
              <p className="text-sm text-[var(--color-text-muted)] mb-1">
                {stat.label}
              </p>
              <p className={`text-2xl font-bold ${stat.color} `}>
                {stat.value}
              </p>
            </div>
            <div
              className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center ${stat.color} `}
            >
              <stat.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming List */}
        <div className="lg:col-span-2 bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Jadwal Terdekat</h2>
            <button
              onClick={() => navigate("/schedules")}
              className="text-sm text-[var(--color-primary)] hover:underline"
            >
              Lihat Semua
            </button>
          </div>

          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">
              Tidak ada jadwal aktif terdekat.
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-input)] border border-[var(--color-border)]"
                >
                  <div>
                    <h3 className="font-medium text-sm">{schedule.title}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      {schedule._count.recipients} penerima •{" "}
                      {schedule.scheduleType}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[var(--color-primary)]">
                      {format(new Date(schedule.scheduledAt), "dd MMM, HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WhatsApp Status */}
        <div className="bg-[var(--color-bg-card)] rounded-xl p-5 border border-[var(--color-border)] h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-5 h-5 text-[var(--color-text-muted)]" />
            <h2 className="text-lg font-semibold">Status WhatsApp</h2>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-input)]">
            <div
              className={`w-3 h-3 rounded-full ${waStatus.connected
                  ? "bg-[var(--color-success)]"
                  : waStatus.status === "CONNECTING"
                    ? "bg-[var(--color-warning)] animate-pulse"
                    : "bg-[var(--color-danger)]"
                } `}
            ></div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {waStatus.connected
                  ? "Terhubung"
                  : waStatus.status === "CONNECTING"
                    ? "Menghubungkan..."
                    : waStatus.status === "WAITING_QR"
                      ? "Menunggu Scan QR"
                      : "Terputus"}
              </p>
              {!waStatus.connected && (
                <button
                  onClick={() => navigate("/settings")}
                  className="text-xs text-[var(--color-primary)] hover:underline mt-1 block"
                >
                  Buka Pengaturan
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
