import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getApiUrl } from "@/config/settings";
import { authConfig, endpoints } from "@/config";

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
      setHistory((prev) => [...prev, point].slice(-60));
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

  if (loading) {
    return (
      <div className="p-6">
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Truy cập bị từ chối</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {error || "Bạn không có quyền truy cập trang admin."}
            </p>
            <Button onClick={() => navigate("/home")}>Về trang chủ</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Admin - Quản lý tài nguyên</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            WebSocket:{" "}
            {isConnected ? (
              <span className="text-green-600">Đã kết nối</span>
            ) : (
              <span className="text-red-600">Mất kết nối</span>
            )}
          </div>
          <Button variant="ghost" onClick={fetchMetrics}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <NavLink
                to="/admin/resources"
                className={({ isActive }) =>
                  `block rounded-md border px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  }`
                }
              >
                Quản lý tài nguyên
              </NavLink>
              <NavLink
                to="/admin/roads"
                className={({ isActive }) =>
                  `block rounded-md border px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  }`
                }
              >
                Quản lý tuyến đường
              </NavLink>
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">CPU</div>
                  <div className="text-2xl font-bold">
                    {metrics?.cpu_percent ?? 0}%
                  </div>
                </div>
                <div className="w-24 h-6 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${metrics?.cpu_percent ?? 0}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">RAM</div>
                  <div className="text-2xl font-bold">
                    {metrics?.memory?.percent ?? 0}%
                  </div>
                </div>
                <div className="w-24 h-6 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${metrics?.memory?.percent ?? 0}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Disk</div>
                  <div className="text-2xl font-bold">
                    {metrics?.disk?.percent ?? 0}%
                  </div>
                </div>
                <div className="w-24 h-6 bg-gray-200 rounded overflow-hidden">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${metrics?.disk?.percent ?? 0}%` }}
                  />
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Hiệu suất theo thời gian</CardTitle>
              <div className="text-sm text-gray-500">
                {lastUpdate ? `Cập nhật: ${lastUpdate}` : "Chưa có dữ liệu"}
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-4">
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={history} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toFixed(1)}%`, ""]}
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

          {metrics?.error && (
            <Card className="border-red-300">
              <CardHeader>
                <CardTitle className="text-red-600">Cảnh báo</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{metrics.error}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
