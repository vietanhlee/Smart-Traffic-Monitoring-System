import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Button } from "@/ui/button";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getApiUrl } from "@/config/settings";
import { authConfig, endpoints } from "@/config";
import AdminLayout from "./AdminLayout";
import { RefreshCw, Cpu, HardDrive, MemoryStick } from "lucide-react";

type Metrics = {
  cpu_percent: number | null;
  memory: {
    total: number;
    available: number;
    percent: number;
    used: number;
    free: number;
  } | null;
  disk: {
    total: number;
    used: number;
    free: number;
    percent: number;
  } | null;
  gpu: unknown;
  error?: string;
};

const MAX_HISTORY = 50;

/** Helper to convert bytes to GB */
const toGB = (bytes: number | undefined) => {
  if (!bytes) return 0;
  return bytes / (1024 * 1024 * 1024);
};

/** Thanh progress dùng cho CPU / RAM / Disk */
function ResourceBar({
  label,
  value,
  icon: Icon,
  colorClass,
  details,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  details?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-border p-5 shadow-sm backdrop-blur-sm transition-all hover:shadow-md">
      <div
        className={`absolute top-0 left-0 w-1.5 h-full ${colorClass} opacity-80`}
      />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass} text-white shadow-sm`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <h4 className="text-xl font-bold text-foreground tabular-nums">
              {value.toFixed(1)}%
            </h4>
          </div>
        </div>
        {details && (
          <div className="text-right">
            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">
              Sử dụng
            </span>
            <p className="text-xs font-bold text-foreground">{details}</p>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.1)]`}
            style={{ width: `${Math.min(value, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminResourcesPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [history, setHistory] = useState<
    { time: string; cpu: number; mem: number; disk: number }[]
  >([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const navigate = useNavigate();

  const token = useMemo(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem(authConfig.TOKEN_KEY)
        : null,
    [],
  );

  const fetchMetrics = async () => {
    if (!token) return;

    try {
      const res = await fetch(getApiUrl("/admin/resources"), {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (res.ok) {
        const data = (await res.json()) as Metrics;
        setMetrics(data);
        setLastUpdate(new Date().toLocaleTimeString("vi-VN"));
      } else if (res.status === 403) {
        setError("Chỉ admin mới được phép truy cập");
      } else if (res.status === 401) {
        setError("Vui lòng đăng nhập lại");
      } else {
        setError("Không thể tải dữ liệu hệ thống");
      }
    } catch {
      setError("Lỗi kết nối tới server");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const checkRole = async () => {
      try {
        if (!token) {
          setIsAdmin(false);
          setError("Chưa đăng nhập");
          setLoading(false);
          return;
        }

        const res = await fetch(getApiUrl("/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        if (!res.ok) {
          setIsAdmin(false);
          setError(
            res.status === 401
              ? "Không có quyền truy cập"
              : "Không thể xác thực người dùng",
          );
          setLoading(false);
          return;
        }

        const me = await res.json();
        if (!cancelled) {
          const admin = me?.role_id === 0;
          setIsAdmin(admin);
          if (!admin) {
            setError("Bạn không có quyền truy cập trang này");
          }
        }
      } catch {
        setIsAdmin(false);
        setError("Lỗi kết nối tới server");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkRole();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const wsUrl = useMemo(() => endpoints.adminResourcesWs(), []);
  const { data: wsData, isConnected } = useWebSocket(isAdmin ? wsUrl : null, {
    authToken: token,
    maxReconnectAttempts: 10,
  });

  useEffect(() => {
    if (wsData && typeof wsData === "object") {
      const m = wsData as Metrics;
      setMetrics(m);
      const point = {
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        cpu: Number(m.cpu_percent || 0),
        mem: Number(m.memory?.percent || 0),
        disk: Number(m.disk?.percent || 0),
      };
      setHistory((prev) => [...prev, point].slice(-MAX_HISTORY));
      setLastUpdate(new Date().toLocaleTimeString("vi-VN"));
    }
  }, [wsData]);

  useEffect(() => {
    if (!metrics) return;
    setHistory((prev) => {
      if (prev.length > 0) return prev;
      const point = {
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        cpu: Number(metrics.cpu_percent || 0),
        mem: Number(metrics.memory?.percent || 0),
        disk: Number(metrics.disk?.percent || 0),
      };
      return [point];
    });
  }, [metrics]);

  /* ── Loading ───────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <span className="text-sm font-semibold text-slate-500">
          Đang tải tài nguyên...
        </span>
      </div>
    );
  }

  /* ── Access denied ─────────────────────────────────────── */
  if (!isAdmin) {
    return (
      <div className="flex h-[60vh] items-center justify-center p-8">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-xl">
          <div className="mx-auto h-16 w-16 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 text-rose-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Truy cập bị từ chối
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {error || "Bạn không có quyền truy cập trang quản trị."}
            </p>
          </div>
          <Button
            onClick={() => navigate("/home")}
            className="w-full h-11 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold"
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  /* ── Main ──────────────────────────────────────────────── */
  return (
    <AdminLayout
      subtitle="Admin — Hệ thống"
      title="Giám sát tài nguyên"
      headerActions={
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
              isConnected
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/30 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/30 dark:bg-rose-900/20 dark:text-rose-400"
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            {isConnected ? "Live" : "Offline"}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            className="h-9 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-2 font-semibold transition-all hover:bg-slate-50 dark:hover:bg-indigo-600 dark:hover:text-white dark:hover:border-indigo-600 text-slate-700 dark:text-slate-200 active:bg-indigo-700 active:text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>
      }
    >
      <div className="space-y-6 pb-10">
        {/* ── Resource cards ─────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <ResourceBar
            label="CPU"
            value={metrics?.cpu_percent ?? 0}
            icon={Cpu}
            colorClass="bg-blue-600"
            details="8 Cores"
          />
          <ResourceBar
            label="RAM"
            value={metrics?.memory?.percent ?? 0}
            icon={MemoryStick}
            colorClass="bg-emerald-600"
            details={`${toGB(metrics?.memory?.used).toFixed(1)} / ${toGB(metrics?.memory?.total).toFixed(0)} GB`}
          />
          <ResourceBar
            label="Ổ đĩa"
            value={metrics?.disk?.percent ?? 0}
            icon={HardDrive}
            colorClass="bg-amber-600"
            details={`${toGB(metrics?.disk?.used).toFixed(1)} / ${toGB(metrics?.disk?.total).toFixed(0)} GB`}
          />
        </div>

        {/* ── Chart ──────────────────────────────────────── */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden">
          <div className="mb-6 flex items-end justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Lịch sử hiệu suất
              </h3>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {lastUpdate ? `Cập nhật: ${lastUpdate}` : "Đang chờ..."}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-600"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  CPU
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-600"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  RAM
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-600"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Disk
                </span>
              </div>
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={history}
                margin={{ left: -20, right: 10, top: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  className="fill-slate-400"
                />
                <YAxis
                  tick={{ fontSize: 10, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                  domain={[0, 100]}
                  className="fill-slate-400"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg bg-slate-900 p-3 shadow-xl border border-slate-800">
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 border-b border-slate-800 pb-1">
                            {payload[0].payload.time}
                          </p>
                          <div className="space-y-1.5">
                            {payload.map((p: any) => (
                              <div
                                key={p.name}
                                className="flex items-center justify-between gap-4"
                              >
                                <span className="text-[10px] font-bold text-slate-300 uppercase">
                                  {p.name}
                                </span>
                                <span className="text-xs font-bold text-white">
                                  {Number(p.value).toFixed(1)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  name="CPU"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="mem"
                  name="Memory"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="disk"
                  name="Disk"
                  stroke="#d97706"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Error card ─────────────────────────────────── */}
        {metrics?.error && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/10 p-5 flex items-center gap-4 text-rose-600 dark:text-rose-400 shadow-sm">
            {/* <AlertTriangle className="h-5 w-5 shrink-0" /> */}
            <p className="text-sm font-semibold">{metrics.error}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
