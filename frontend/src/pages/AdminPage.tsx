import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getApiUrl, getWsUrl } from "@/config/settings";
import { authConfig } from "@/config";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { endpoints } from "@/config";
import {
  Shield,
  Server,
  Route,
  RefreshCw,
  Cpu,
  HardDrive,
  MemoryStick,
  Play,
  Square,
} from "lucide-react";

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

type TrafficRoadRuntime = {
  active: boolean;
  pid: number | null;
};

type TrafficStatusResponse = {
  roads: Record<string, TrafficRoadRuntime>;
};

// (no helper needed: chart shows percentages only)

export default function AdminPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [history, setHistory] = useState<
    { time: string; cpu: number; mem: number; disk: number }[]
  >([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [roadStatuses, setRoadStatuses] = useState<
    Record<string, TrafficRoadRuntime>
  >({});
  const [trafficLoading, setTrafficLoading] = useState<boolean>(false);
  const [trafficActionLoading, setTrafficActionLoading] = useState<
    Record<string, boolean>
  >({});
  const [trafficError, setTrafficError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"resources" | "roads">(
    "resources",
  );
  const resourcesSectionRef = useRef<HTMLDivElement | null>(null);
  const roadsSectionRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const goToSection = (section: "resources" | "roads") => {
    setActiveSection(section);
    const target =
      section === "resources"
        ? resourcesSectionRef.current
        : roadsSectionRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const token = useMemo(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem(authConfig.TOKEN_KEY)
        : null,
    [],
  );

  // Centralized fetch so we can call it from refresh button or initial load
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

  const fetchTrafficStatuses = async () => {
    if (!token) return;
    setTrafficLoading(true);
    setTrafficError(null);

    try {
      const res = await fetch(endpoints.adminTrafficStatus, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 403) {
          setTrafficError("Chỉ admin mới được phép quản lý subprocess.");
          return;
        }
        if (res.status === 401) {
          setTrafficError("Vui lòng đăng nhập lại.");
          return;
        }
        setTrafficError("Không thể tải trạng thái subprocess.");
        return;
      }

      const data = (await res.json()) as TrafficStatusResponse;
      setRoadStatuses(data?.roads ?? {});
    } catch {
      setTrafficError("Lỗi kết nối khi tải trạng thái subprocess.");
    } finally {
      setTrafficLoading(false);
    }
  };

  const manageRoadProcess = async (
    roadName: string,
    action: "start" | "stop",
  ) => {
    if (!token) return;

    const actionKey = `${action}:${roadName}`;
    setTrafficActionLoading((prev) => ({ ...prev, [actionKey]: true }));
    setTrafficError(null);

    try {
      const url =
        action === "start"
          ? endpoints.adminStartRoadProcess(roadName)
          : endpoints.adminStopRoadProcess(roadName);

      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setTrafficError(err?.detail || "Không thể thao tác subprocess.");
        return;
      }

      await fetchTrafficStatuses();
    } catch {
      setTrafficError("Lỗi kết nối khi thao tác subprocess.");
    } finally {
      setTrafficActionLoading((prev) => {
        const next = { ...prev };
        delete next[actionKey];
        return next;
      });
    }
  };
  // Verify admin role before loading content
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

  // Initial fetch of metrics
  useEffect(() => {
    if (isAdmin) {
      fetchMetrics();
      fetchTrafficStatuses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    const timer = window.setInterval(() => {
      fetchTrafficStatuses();
    }, 8000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, token]);

  // Live updates via WebSocket
  const wsUrl = useMemo(() => getWsUrl("/admin/ws/resources"), []);
  const { data: wsData, isConnected } = useWebSocket(isAdmin ? wsUrl : null, {
    authToken: token,
    maxReconnectAttempts: 10,
  });

  useEffect(() => {
    if (wsData && typeof wsData === "object") {
      const m = wsData as Metrics;
      setMetrics(m);
      // Append to history
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
      setHistory((prev) => [...prev, point].slice(-60));
      setLastUpdate(new Date().toLocaleTimeString("vi-VN"));
    }
  }, [wsData]);

  // Seed first point from initial HTTP fetch if not yet seeded
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="ml-3 text-muted-foreground">Đang tải...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center p-12">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive">
              Truy cập bị từ chối
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {error || "Bạn không có quyền truy cập trang admin."}
            </p>
            <Button onClick={() => navigate("/home")}>Về trang chủ</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                Bảng điều khiển hệ thống
              </h2>
              <div className="mt-1 flex items-center gap-3 text-sm">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isConnected
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isConnected
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-destructive"
                    }`}
                  />
                  {isConnected ? "Đã kết nối" : "Mất kết nối"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMetrics()}
              className="gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTrafficStatuses()}
              className="gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh Subprocess
            </Button>
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 px-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Điều hướng Admin
            </h3>
            <nav className="space-y-1.5">
              <button
                type="button"
                onClick={() => goToSection("resources")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                  activeSection === "resources"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Server className="h-4 w-4 shrink-0" />
                Quản lý tài nguyên
              </button>
              <button
                type="button"
                onClick={() => goToSection("roads")}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                  activeSection === "roads"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Route className="h-4 w-4 shrink-0" />
                Quản lý tuyến đường
              </button>
            </nav>
          </div>
        </aside>

        <div className="space-y-6">
          {/* ── Resources section ─────────────────────────── */}
          <section ref={resourcesSectionRef} className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Quản lý tài nguyên
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* CPU */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-md">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        CPU
                      </p>
                      <p className="text-2xl font-bold tabular-nums text-foreground">
                        {metrics?.cpu_percent ?? 0}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{
                        width: `${metrics?.cpu_percent ?? 0}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* RAM */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md">
                      <MemoryStick className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        RAM
                      </p>
                      <p className="text-2xl font-bold tabular-nums text-foreground">
                        {metrics?.memory?.percent ?? 0}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${metrics?.memory?.percent ?? 0}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Disk */}
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
                      <HardDrive className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Disk
                      </p>
                      <p className="text-2xl font-bold tabular-nums text-foreground">
                        {metrics?.disk?.percent ?? 0}%
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{
                        width: `${metrics?.disk?.percent ?? 0}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Hiệu suất theo thời gian</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {lastUpdate
                    ? `Cập nhật: ${lastUpdate}`
                    : "Chưa có dữ liệu"}
                </p>
              </CardHeader>
              <CardContent className="px-2 sm:px-4">
                <ResponsiveContainer width="100%" height={380}>
                  <LineChart data={history} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                      opacity={0.5}
                    />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      domain={[0, 100]}
                      unit="%"
                      className="fill-muted-foreground"
                    />
                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toFixed(1)}%`,
                        "",
                      ]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: 8,
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Line
                      type="monotone"
                      dataKey="cpu"
                      name="CPU %"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="mem"
                      name="RAM %"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="disk"
                      name="Disk %"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </section>

          {/* ── Roads section ────────────────────────────── */}
          <section ref={roadsSectionRef} className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Quản lý tuyến đường
            </h3>

            <Card>
              <CardHeader>
                <CardTitle>Subprocess tuyến đường</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Admin có thể dừng hoặc bật lại từng tuyến road runtime.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {trafficLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
                    <span className="ml-3 text-sm text-muted-foreground">
                      Đang tải trạng thái subprocess...
                    </span>
                  </div>
                ) : Object.keys(roadStatuses).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-10 text-center">
                    <p className="text-sm text-muted-foreground">
                      Chưa có dữ liệu subprocess.
                    </p>
                  </div>
                ) : (
                  Object.entries(roadStatuses).map(([roadName, runtime]) => {
                    const startKey = `start:${roadName}`;
                    const stopKey = `stop:${roadName}`;

                    return (
                      <div
                        key={roadName}
                        className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 space-y-1.5">
                          <p className="truncate font-semibold text-foreground">
                            {roadName}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                runtime.active
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  runtime.active
                                    ? "bg-emerald-500 animate-pulse"
                                    : "bg-destructive"
                                }`}
                              />
                              {runtime.active ? "Đang chạy" : "Đã dừng"}
                            </span>
                            {runtime.pid ? (
                              <span className="text-xs text-muted-foreground">
                                PID:{" "}
                                <span className="font-mono font-medium text-foreground">
                                  {runtime.pid}
                                </span>
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={
                              runtime.active ||
                              Boolean(trafficActionLoading[startKey])
                            }
                            onClick={() =>
                              manageRoadProcess(roadName, "start")
                            }
                          >
                            <Play className="h-3.5 w-3.5" />
                            {trafficActionLoading[startKey]
                              ? "Đang bật..."
                              : "Bật"}
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1.5"
                            disabled={
                              !runtime.active ||
                              Boolean(trafficActionLoading[stopKey])
                            }
                            onClick={() =>
                              manageRoadProcess(roadName, "stop")
                            }
                          >
                            <Square className="h-3.5 w-3.5" />
                            {trafficActionLoading[stopKey]
                              ? "Đang dừng..."
                              : "Dừng"}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}

                {trafficError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {trafficError}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* ── Error warning ────────────────────────────── */}
          {metrics?.error && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Cảnh báo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{metrics.error}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
