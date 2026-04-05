import React, { useEffect, useMemo, useRef, useState } from "react";
import { endpoints } from "@/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AlertCircle,
} from "lucide-react";

type VehicleData = {
  count_car: number;
  count_motor: number;
  speed_car: number;
  speed_motor: number;
};
type TrafficData = Record<string, VehicleData>;
export type HistoricalData = { time: string; [key: string]: string | number };

interface Props {
  trafficData: TrafficData;
  allowedRoads: string[];
}

const HISTORY_MAX = 1000;
const HISTORY_FETCH_COUNT = 600;
const TREND_VISIBLE_WINDOW = 120;
const TREND_MIN_WINDOW = 20;

const toSecondBucketIso = (value?: string) => {
  const dt = value ? new Date(value) : new Date();
  const ms = dt.getTime();
  const bucketMs = Math.floor(ms / 1000) * 1000;
  return new Date(bucketMs).toISOString();
};

type ChartPayload = {
  road_name: string;
  timestamp?: string;
  time?: string;
  count_car?: number;
  count_motor?: number;
  speed_car?: number;
  speed_motor?: number;
  total?: number;
};

type InternalPoint = HistoricalData & {
  _ts: string;
};

const TrafficAnalytics: React.FC<Props> = ({ trafficData, allowedRoads }) => {
  const [trendsData, setTrendsData] = useState<HistoricalData[]>([]);
  const [visibleRoads, setVisibleRoads] = useState<string[]>([]);
  const [followLatest, setFollowLatest] = useState(true);
  const [trendStartIndex, setTrendStartIndex] = useState(0);
  const [trendEndIndex, setTrendEndIndex] = useState(0);
  const [isDraggingTrend, setIsDraggingTrend] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const dragStartClientXRef = useRef<number | null>(null);
  const dragStartWindowRef = useRef<{ start: number; end: number } | null>(
    null,
  );
  const trendChartWrapperRef = useRef<HTMLDivElement | null>(null);
  const mergedRef = useRef<InternalPoint[]>([]);

  const publishMerged = () => {
    const cleaned = mergedRef.current
      .sort((a, b) => a._ts.localeCompare(b._ts))
      .slice(-HISTORY_MAX)
      .map(({ _ts, ...rest }) => rest);
    setTrendsData(cleaned);
  };

  const upsertMerged = (road: string, payload: ChartPayload) => {
    const ts = toSecondBucketIso(payload.timestamp);
    // Always format from ISO timestamp on client to avoid UTC/local mismatch.
    const time = new Date(ts).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const countCar = Number(payload.count_car || 0);
    const countMotor = Number(payload.count_motor || 0);
    const speedCar = Number(payload.speed_car || 0);
    const speedMotor = Number(payload.speed_motor || 0);
    const total = Number(payload.total ?? countCar + countMotor);

    const idx = mergedRef.current.findIndex((item) => item._ts === ts);
    if (idx >= 0) {
      mergedRef.current[idx] = {
        ...mergedRef.current[idx],
        time,
        [`${road}_cars`]: countCar,
        [`${road}_motors`]: countMotor,
        [`${road}_car_speed`]: speedCar,
        [`${road}_motor_speed`]: speedMotor,
        [`${road}_total`]: total,
      };
    } else {
      mergedRef.current.push({
        _ts: ts,
        time,
        [`${road}_cars`]: countCar,
        [`${road}_motors`]: countMotor,
        [`${road}_car_speed`]: speedCar,
        [`${road}_motor_speed`]: speedMotor,
        [`${road}_total`]: total,
      });
    }
  };

  const loadOlderHistory = async () => {
    if (isLoadingOlder || !hasMoreOlder || allowedRoads.length === 0) {
      return;
    }

    const sorted = [...mergedRef.current].sort((a, b) =>
      a._ts.localeCompare(b._ts),
    );
    const oldestTs = sorted[0]?._ts;
    if (!oldestTs) {
      return;
    }

    setIsLoadingOlder(true);
    try {
      let gotAnyOlder = false;
      const responses = await Promise.all(
        allowedRoads.map((road) =>
          fetch(endpoints.roadHistory(road, HISTORY_FETCH_COUNT, oldestTs)),
        ),
      );

      for (let i = 0; i < responses.length; i += 1) {
        const road = allowedRoads[i];
        const res = responses[i];
        if (!res.ok) continue;

        const json = await res.json();
        const rows: ChartPayload[] = Array.isArray(json?.data) ? json.data : [];

        rows.forEach((row) => {
          const rowTs = toSecondBucketIso(row.timestamp);
          if (rowTs < oldestTs) {
            gotAnyOlder = true;
          }
          upsertMerged(road, row);
        });
      }

      publishMerged();
      setHasMoreOlder(gotAnyOlder);
    } catch {
      // ignore transient network errors, user can drag again
    } finally {
      setIsLoadingOlder(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const wsMap: Record<string, WebSocket> = {};

    const bootstrap = async () => {
      if (allowedRoads.length === 0) {
        mergedRef.current = [];
        setTrendsData([]);
        setVisibleRoads([]);
        return;
      }

      setVisibleRoads(allowedRoads);
      setHasMoreOlder(true);
      mergedRef.current = [];

      try {
        const responses = await Promise.all(
          allowedRoads.map((road) =>
            fetch(endpoints.roadHistory(road, HISTORY_FETCH_COUNT)),
          ),
        );
        if (!mounted) return;
        for (let i = 0; i < responses.length; i += 1) {
          const road = allowedRoads[i];
          const res = responses[i];
          if (!res.ok) continue;

          const json = await res.json();
          const rows: ChartPayload[] = Array.isArray(json?.data)
            ? json.data
            : [];
          rows.forEach((item) => upsertMerged(road, item));
        }
        publishMerged();
      } catch {
        if (!mounted) return;
      }

      allowedRoads.forEach((road) => {
        const ws = new WebSocket(endpoints.chartWs(road));
        wsMap[road] = ws;

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as ChartPayload;
            upsertMerged(road, payload);
            publishMerged();
          } catch {
            // ignore invalid payload
          }
        };
      });
    };

    bootstrap();

    return () => {
      mounted = false;
      Object.values(wsMap).forEach((ws) => ws.close());
    };
  }, [allowedRoads]);

  useEffect(() => {
    setVisibleRoads((prev) => {
      const kept = prev.filter((road) => allowedRoads.includes(road));
      if (kept.length === 0 && allowedRoads.length > 0) {
        return allowedRoads;
      }
      return kept;
    });
  }, [allowedRoads]);

  useEffect(() => {
    if (trendsData.length === 0) {
      setTrendStartIndex(0);
      setTrendEndIndex(0);
      return;
    }

    if (!followLatest) {
      const maxIndex = trendsData.length - 1;
      if (trendEndIndex > maxIndex) {
        const window = Math.max(1, trendEndIndex - trendStartIndex);
        setTrendEndIndex(maxIndex);
        setTrendStartIndex(Math.max(0, maxIndex - window));
      }
      return;
    }

    const end = trendsData.length - 1;
    const start = Math.max(0, end - TREND_VISIBLE_WINDOW + 1);
    setTrendStartIndex(start);
    setTrendEndIndex(end);
  }, [trendsData, followLatest, trendStartIndex, trendEndIndex]);

  const moveWindow = (nextStart: number, windowSize: number) => {
    if (trendsData.length === 0) return;

    const normalizedWindow = Math.max(
      1,
      Math.min(windowSize, trendsData.length),
    );
    const maxStart = Math.max(0, trendsData.length - normalizedWindow);
    const clampedStart = Math.max(0, Math.min(nextStart, maxStart));
    const clampedEnd = Math.min(
      trendsData.length - 1,
      clampedStart + normalizedWindow - 1,
    );
    setTrendStartIndex(clampedStart);
    setTrendEndIndex(clampedEnd);
  };

  const handleTrendMouseDown: React.MouseEventHandler<HTMLDivElement> = (
    event,
  ) => {
    if (event.button !== 0) return;

    event.preventDefault();
    if (typeof window !== "undefined") {
      window.getSelection()?.removeAllRanges();
    }

    setFollowLatest(false);
    setIsDraggingTrend(true);
    dragStartClientXRef.current = event.clientX;
    dragStartWindowRef.current = { start: trendStartIndex, end: trendEndIndex };
  };

  const handleTrendMouseUp = () => {
    setIsDraggingTrend(false);
    dragStartClientXRef.current = null;
    dragStartWindowRef.current = null;
  };

  useEffect(() => {
    if (!isDraggingTrend) {
      return;
    }

    const onWindowMouseMove = (event: MouseEvent) => {
      const dragStartClientX = dragStartClientXRef.current;
      const dragStartWindow = dragStartWindowRef.current;
      const wrapperWidth = trendChartWrapperRef.current?.clientWidth ?? 0;

      if (
        dragStartClientX === null ||
        dragStartWindow === null ||
        wrapperWidth <= 0
      ) {
        return;
      }

      const windowSize = dragStartWindow.end - dragStartWindow.start + 1;
      const deltaPx = event.clientX - dragStartClientX;
      const deltaIndex = Math.round((deltaPx / wrapperWidth) * windowSize);

      // Grab-to-pan: drag right => move to older data, drag left => move newer.
      const intendedStart = dragStartWindow.start - deltaIndex;
      if (intendedStart < 0) {
        void loadOlderHistory();
      }
      moveWindow(intendedStart, windowSize);
    };

    const onWindowMouseUp = () => {
      handleTrendMouseUp();
    };

    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);

    return () => {
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
    };
  }, [isDraggingTrend]);

  const handleTrendWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    if (trendsData.length === 0) return;
    event.preventDefault();

    const currentWindow = Math.max(1, trendEndIndex - trendStartIndex + 1);
    const zoomIn = event.deltaY < 0;
    const step = Math.max(1, Math.round(currentWindow * 0.15));
    const targetWindow = zoomIn ? currentWindow - step : currentWindow + step;
    const nextWindow = Math.max(
      TREND_MIN_WINDOW,
      Math.min(trendsData.length, targetWindow),
    );

    const center = Math.floor((trendStartIndex + trendEndIndex) / 2);
    const nextStart = center - Math.floor(nextWindow / 2);
    setFollowLatest(false);
    moveWindow(nextStart, nextWindow);
  };

  const moveToLatest = () => {
    if (trendsData.length === 0) {
      return;
    }
    setFollowLatest(true);
  };

  const allRoadsSelected =
    allowedRoads.length > 0 && visibleRoads.length === allowedRoads.length;

  const toggleAllRoads = () => {
    if (allRoadsSelected) {
      setVisibleRoads([]);
      return;
    }
    setVisibleRoads(allowedRoads);
  };

  const toggleRoad = (road: string) => {
    setVisibleRoads((prev) => {
      if (prev.includes(road)) {
        return prev.filter((item) => item !== road);
      }
      return [...prev, road];
    });
  };

  const vehicleCountData = useMemo(
    () =>
      allowedRoads.map((road) => {
        const d = trafficData[road];
        return {
          road: road.length > 12 ? `${road.slice(0, 12)}...` : road,
          fullRoad: road,
          cars: d?.count_car || 0,
          motors: d?.count_motor || 0,
          total: (d?.count_car || 0) + (d?.count_motor || 0),
        };
      }),
    [allowedRoads, trafficData],
  );

  const speedData = useMemo(
    () =>
      allowedRoads.map((road) => {
        const d = trafficData[road];
        return {
          road: road.length > 12 ? `${road.slice(0, 12)}...` : road,
          fullRoad: road,
          carSpeed: d?.speed_car || 0,
          motorSpeed: d?.speed_motor || 0,
        };
      }),
    [allowedRoads, trafficData],
  );

  const pieData = useMemo(
    () =>
      allowedRoads
        .map((road) => {
          const d = trafficData[road];
          const total = (d?.count_car || 0) + (d?.count_motor || 0);
          return {
            name: road,
            value: total,
            cars: d?.count_car || 0,
            motors: d?.count_motor || 0,
          };
        })
        .filter((i) => i.value > 0),
    [allowedRoads, trafficData],
  );

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  const trendWindowData = useMemo(() => {
    if (trendsData.length === 0) return [];
    return trendsData.slice(trendStartIndex, trendEndIndex + 1);
  }, [trendsData, trendStartIndex, trendEndIndex]);

  const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
      <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
        {message}
      </p>
      <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
        Dữ liệu sẽ xuất hiện khi hệ thống bắt đầu thu thập
      </p>
    </div>
  );

  const hasData = Object.keys(trafficData).length > 0;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
          <TabsTrigger
            value="overview"
            className="flex items-center space-x-2 text-xs sm:text-sm"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Tổng quan</span>
            <span className="sm:hidden">Tổng</span>
          </TabsTrigger>
          <TabsTrigger
            value="trends"
            className="flex items-center space-x-2 text-xs sm:text-sm"
          >
            <LineChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Xu hướng</span>
            <span className="sm:hidden">Xu hướng</span>
          </TabsTrigger>
          <TabsTrigger
            value="distribution"
            className="flex items-center space-x-2 text-xs sm:text-sm"
          >
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Phân bố</span>
            <span className="sm:hidden">Phân bố</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {!hasData ? (
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <EmptyState message="Chưa có dữ liệu giao thông" />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg">
                    Số lượng xe theo tuyến đường
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center px-2 sm:px-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={vehicleCountData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="road"
                        tick={{ fontSize: 12 }}
                        angle={-15}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value, name) => [
                          value,
                          name === "cars" ? "Ô tô" : "Xe máy",
                        ]}
                        labelFormatter={(label) =>
                          vehicleCountData.find((d) => d.road === label)
                            ?.fullRoad || label
                        }
                        contentStyle={{
                          backgroundColor: "rgba(255,255,255,0.95)",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                        }}
                      />
                      <Bar
                        dataKey="cars"
                        fill="#3B82F6"
                        name="cars"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="motors"
                        fill="#10B981"
                        name="motors"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg">
                    Tốc độ trung bình (km/h)
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center px-2 sm:px-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={speedData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="road"
                        tick={{ fontSize: 12 }}
                        angle={-15}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value, name) => [
                          `${Number(value).toFixed(1)} km/h`,
                          name === "carSpeed" ? "Ô tô" : "Xe máy",
                        ]}
                        labelFormatter={(label) =>
                          speedData.find((d) => d.road === label)?.fullRoad ||
                          label
                        }
                        contentStyle={{
                          backgroundColor: "rgba(255,255,255,0.95)",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                        }}
                      />
                      <Bar
                        dataKey="carSpeed"
                        fill="#F59E0B"
                        name="carSpeed"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="motorSpeed"
                        fill="#8B5CF6"
                        name="motorSpeed"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends">
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg">
                    Xu hướng giao thông theo thời gian
                  </CardTitle>
                  <button
                    type="button"
                    onClick={moveToLatest}
                    className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                  >
                    Về mới nhất
                  </button>
                </div>

                <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      id="toggle-all-roads"
                      type="checkbox"
                      checked={allRoadsSelected}
                      onChange={toggleAllRoads}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor="toggle-all-roads"
                      className="text-sm font-medium"
                    >
                      Hiển thị tất cả
                    </label>
                  </div>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
                    {allowedRoads.map((road) => {
                      const id = `toggle-road-${road}`;
                      return (
                        <label
                          key={road}
                          htmlFor={id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            id={id}
                            type="checkbox"
                            checked={visibleRoads.includes(road)}
                            onChange={() => toggleRoad(road)}
                            className="h-4 w-4"
                          />
                          <span>{road}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-4">
              {trendsData.length === 0 ? (
                <EmptyState message="Chưa có dữ liệu lịch sử" />
              ) : visibleRoads.length === 0 ? (
                <EmptyState message="Hãy chọn ít nhất một tuyến đường để hiển thị" />
              ) : (
                <div
                  ref={trendChartWrapperRef}
                  className={`trend-pan-area select-none rounded-md ${
                    isDraggingTrend
                      ? "cursor-grabbing [&_*]:cursor-grabbing"
                      : "cursor-grab [&_*]:cursor-grab"
                  }`}
                  onMouseDown={handleTrendMouseDown}
                  onWheel={handleTrendWheel}
                >
                  {isLoadingOlder && (
                    <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                      Đang tải thêm dữ liệu quá khứ...
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={trendWindowData}
                      onMouseUp={handleTrendMouseUp}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255,255,255,0.95)",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {visibleRoads.map((road, index) => (
                        <Line
                          key={road}
                          type="linear"
                          dataKey={`${road}_total`}
                          stroke={COLORS[index % COLORS.length]}
                          name={road}
                          connectNulls={true}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-base sm:text-lg">
                Phân bố xe theo tuyến đường
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-4">
              {pieData.length === 0 ? (
                <EmptyState message="Chưa có dữ liệu phân bố" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={window.innerWidth < 640 ? 100 : 130}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, _, props) => [
                        `${value} xe (${props.payload.cars} ô tô, ${props.payload.motors} xe máy)`,
                        "Tổng số xe",
                      ]}
                      contentStyle={{
                        backgroundColor: "rgba(255,255,255,0.95)",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrafficAnalytics;
