import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { getApiUrl } from "@/config/settings";
import { authConfig, endpoints } from "@/config";

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
        <h2 className="text-2xl font-bold">Admin - Quản lý tuyến đường</h2>
        <Button variant="outline" onClick={fetchTrafficStatuses}>
          Refresh Subprocess
        </Button>
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

        <Card>
          <CardHeader>
            <CardTitle>Quản lý subprocess tuyến đường</CardTitle>
            <div className="text-sm text-gray-500">
              Admin có thể dừng hoặc bật lại từng tuyến road runtime.
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {trafficLoading ? (
              <p className="text-sm text-gray-500">
                Đang tải trạng thái subprocess...
              </p>
            ) : Object.keys(roadStatuses).length === 0 ? (
              <p className="text-sm text-gray-500">
                Chưa có dữ liệu subprocess.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(roadStatuses).map(([roadName, runtime]) => {
                  const startKey = `start:${roadName}`;
                  const stopKey = `stop:${roadName}`;

                  return (
                    <div
                      key={roadName}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-semibold">{roadName}</div>
                          <div className="text-sm text-gray-500">
                            Trạng thái:{" "}
                            {runtime.active ? "Đang chạy" : "Đã dừng"}
                            {runtime.pid ? ` | PID: ${runtime.pid}` : ""}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={
                              runtime.active ||
                              Boolean(trafficActionLoading[startKey])
                            }
                            onClick={() => manageRoadProcess(roadName, "start")}
                          >
                            {trafficActionLoading[startKey]
                              ? "Đang bật..."
                              : "Bật"}
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={
                              !runtime.active ||
                              Boolean(trafficActionLoading[stopKey])
                            }
                            onClick={() => manageRoadProcess(roadName, "stop")}
                          >
                            {trafficActionLoading[stopKey]
                              ? "Đang dừng..."
                              : "Dừng"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {trafficError && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {trafficError}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
