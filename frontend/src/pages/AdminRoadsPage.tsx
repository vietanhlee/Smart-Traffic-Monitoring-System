import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/ui/button";
import { getApiUrl } from "@/config/settings";
import { authConfig, endpoints } from "@/config";
import AdminLayout from "./AdminLayout";
import { RefreshCw, Play, Square } from "lucide-react";

type TrafficRoadRuntime = {
  active: boolean;
  pid: number | null;
};

type TrafficStatusResponse = {
  roads: Record<string, TrafficRoadRuntime>;
};

export default function AdminRoadsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [roadStatuses, setRoadStatuses] = useState<
    Record<string, TrafficRoadRuntime>
  >({});
  const [trafficLoading, setTrafficLoading] = useState<boolean>(false);
  const [trafficActionLoading, setTrafficActionLoading] = useState<
    Record<string, boolean>
  >({});
  const [trafficError, setTrafficError] = useState<string | null>(null);
  const navigate = useNavigate();

  const token = useMemo(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem(authConfig.TOKEN_KEY)
        : null,
    [],
  );

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
    fetchTrafficStatuses();
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

  /* ── Loading ───────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <span className="ml-3 text-sm font-semibold text-slate-500">
          Đang tải dữ liệu...
        </span>
      </div>
    );
  }

  /* ── Access denied ─────────────────────────────────────── */
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-lg">
          <h2 className="text-xl font-bold text-rose-600">
            Truy cập bị từ chối
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {error || "Bạn không có quyền truy cập trang admin."}
          </p>
          <Button
            onClick={() => navigate("/home")}
            className="w-full h-11 rounded-lg"
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  /* ── Helpers ────────────────────────────────────────────── */
  const roadEntries = Object.entries(roadStatuses);
  const activeCount = roadEntries.filter(([, r]) => r.active).length;

  /* ── Main ──────────────────────────────────────────────── */
  return (
    <AdminLayout
      subtitle="Admin — Hệ thống"
      title="Quản lý tiến trình"
      headerActions={
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTrafficStatuses}
          className="h-9 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-2 font-semibold transition-all hover:bg-slate-50 dark:hover:bg-indigo-600 dark:hover:text-white dark:hover:border-indigo-600 text-slate-700 dark:text-slate-200 active:bg-indigo-700 active:text-white"
        >
          <RefreshCw
            className={`h-4 w-4 ${trafficLoading ? "animate-spin" : ""}`}
          />
          Làm mới trạng thái
        </Button>
      }
    >
      <div className="space-y-6 pb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Danh sách Tuyến đường
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Điều khiển các tiến trình xử lý AI thời gian thực
            </p>
          </div>

          {/* Summary badges */}
          {roadEntries.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeCount} Đang chạy
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Tổng: {roadEntries.length}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {trafficLoading && roadEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Đang quét hệ thống...
              </p>
            </div>
          ) : roadEntries.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-16 text-center">
              <p className="text-sm font-semibold text-slate-400">
                Không tìm thấy subprocess khả dụng
              </p>
            </div>
          ) : (
            roadEntries.map(([roadName, runtime]) => {
              const startKey = `start:${roadName}`;
              const stopKey = `stop:${roadName}`;

              return (
                <div
                  key={roadName}
                  className={`flex flex-col gap-4 rounded-xl bg-white dark:bg-slate-900 border p-5 transition-all sm:flex-row sm:items-center sm:justify-between shadow-sm ${
                    runtime.active
                      ? "border-emerald-200 dark:border-emerald-800/40 shadow-emerald-500/5"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {/* Info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                        runtime.active
                          ? "bg-emerald-600 text-white shadow-md"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      }`}
                    >
                      {runtime.active ? (
                        <Play className="h-6 w-6 fill-current" />
                      ) : (
                        <Square className="h-6 w-6 fill-current" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="truncate text-lg font-bold text-slate-900 dark:text-white">
                        {roadName}
                      </h4>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            runtime.active
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {runtime.active ? "Đang chạy" : "Đã dừng"}
                        </span>
                        {runtime.pid && (
                          <span className="text-[10px] font-semibold text-slate-400">
                            PID:{" "}
                            <span className="text-slate-700 dark:text-slate-300 font-mono">
                              {runtime.pid}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!runtime.active ? (
                      <Button
                        size="sm"
                        className="h-10 px-6 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs transition-all hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50"
                        disabled={Boolean(trafficActionLoading[startKey])}
                        onClick={() => manageRoadProcess(roadName, "start")}
                      >
                        {trafficActionLoading[startKey]
                          ? "Đang chạy..."
                          : "Kích hoạt"}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-10 px-6 rounded-lg font-bold text-xs transition-all disabled:opacity-50"
                        disabled={Boolean(trafficActionLoading[stopKey])}
                        onClick={() => manageRoadProcess(roadName, "stop")}
                      >
                        {trafficActionLoading[stopKey]
                          ? "Đang dừng..."
                          : "Dừng tiến trình"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Error */}
        {trafficError && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/10 p-4 flex items-center gap-3 text-rose-600 dark:text-rose-400 shadow-sm">
            <RefreshCw className="h-4 w-4 shrink-0" />
            <p className="text-xs font-bold uppercase tracking-wider">
              {trafficError}
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
