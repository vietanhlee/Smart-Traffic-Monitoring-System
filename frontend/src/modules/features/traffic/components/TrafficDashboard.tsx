import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import {
  MapPin,
  Car,
  Bike,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
} from "lucide-react";
import VideoMonitor from "../../video/components/VideoMonitor";
import { motion, AnimatePresence } from "framer-motion";
import { useMultipleTrafficInfo } from "../../../../hooks/useWebSocket";
import { useMultipleWebRTCFrameStreams } from "../../../../hooks/useWebRTC";
import { endpoints } from "../../../../config";
import { getThresholdForRoad } from "../../../../config/trafficThresholds";

// Import types from the WebSocket hook
type VehicleData = {
  count_car: number;
  count_motor: number;
  speed_car: number;
  speed_motor: number;
};

type TrafficBackendData = VehicleData & {
  density_status?: string;
  speed_status?: string;
};

const TrafficDashboard = () => {
  const [selectedRoad, setSelectedRoad] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false); // QR load fallback
  const [localFullscreen] = useState(false);

  const [allowedRoads, setAllowedRoads] = useState<string[]>([]);

  useEffect(() => {
    const fetchRoads = async () => {
      try {
        // roads_name endpoint không cần authentication
        const res = await fetch(endpoints.roadNames);
        if (!res.ok) {
          console.error("Failed to fetch road names");
          setAllowedRoads([
            "Văn Phú",
            "Nguyễn Trãi",
            "Ngã Tư Sở",
            "Đường Láng",
          ]);
          return;
        }
        const json = await res.json();
        const names: string[] = json?.road_names ?? [];
        setAllowedRoads(names);
      } catch (error) {
        console.error("Error fetching roads:", error);
        setAllowedRoads([
          "Văn Phú",
          "Nguyễn Trãi",
          "Ngã Tư Sở",
          "Đường Láng",
          "Văn Quán",
        ]);
      }
    };
    fetchRoads();
  }, []);

  // Use WebSocket for traffic data
  const { trafficData, isAnyConnected } = useMultipleTrafficInfo(allowedRoads);
  const { streamData, connections: streamConnections } =
    useMultipleWebRTCFrameStreams(allowedRoads);

  const loading = !isAnyConnected;

  const getTrafficStatus = (roadName: string) => {
    const data = trafficData[roadName] as VehicleData | undefined;
    if (!data) return { status: "unknown", color: "gray", icon: Clock };
    // Prefer backend-provided classification when available
    const densityFromBackend = (data as TrafficBackendData).density_status;
    if (densityFromBackend) {
      if (densityFromBackend === "Tắc nghẽn")
        return { status: "congested", color: "red", icon: AlertTriangle };
      if (densityFromBackend === "Đông đúc")
        return { status: "busy", color: "yellow", icon: Clock };
      if (densityFromBackend === "Thông thoáng")
        return { status: "clear", color: "green", icon: CheckCircle };
    }
    // Fallback: compute from local thresholds when backend doesn't provide classification
    const threshold = getThresholdForRoad(roadName);
    const totalVehicles = (data.count_car ?? 0) + (data.count_motor ?? 0);
    if (totalVehicles > threshold.c2)
      return { status: "congested", color: "red", icon: AlertTriangle };
    if (totalVehicles > threshold.c1)
      return { status: "busy", color: "yellow", icon: Clock };
    return { status: "clear", color: "green", icon: CheckCircle };
  };

  const getSpeedStatus = (roadName: string) => {
    const data = trafficData[roadName] as VehicleData | undefined;
    if (!data) return { speedText: "Không rõ", speedColor: "gray" };
    const speedFromBackend = (data as TrafficBackendData).speed_status;
    if (speedFromBackend) {
      if (speedFromBackend === "Nhanh chóng")
        return { speedText: "Nhanh chóng", speedColor: "green" };
      if (speedFromBackend === "Chậm chạp")
        return { speedText: "Chậm chạp", speedColor: "orange" };
    }
    // Fallback: compute from local thresholds
    const threshold = getThresholdForRoad(roadName);
    const avgSpeed = ((data.speed_car ?? 0) + (data.speed_motor ?? 0)) / 2;
    if (avgSpeed >= threshold.v)
      return { speedText: "Nhanh chóng", speedColor: "green" };
    return { speedText: "Chậm chạp", speedColor: "orange" };
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "congested":
        return "Tắc nghẽn";
      case "busy":
        return "Đông đúc";
      case "clear":
        return "Thông thoáng";
      default:
        return "Không rõ";
    }
  };

  return (
    <div className="min-h-screen pt-4 px-2 sm:px-4 space-y-4 sm:space-y-6">
      {/* Connection Status Banner - REMOVED, now inside VideoMonitor */}

      {/* Main Content */}
      <div className="space-y-4 sm:space-y-6">
        <div
          className={`grid gap-4 sm:gap-6 ${
            localFullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-4"
          }`}
        >
          {/* Video Monitoring */}
          <div className={localFullscreen ? "col-span-1" : "col-span-3"}>
            <VideoMonitor
              streamData={streamData}
              streamConnections={streamConnections}
              trafficData={trafficData}
              allowedRoads={allowedRoads}
              selectedRoad={selectedRoad}
              setSelectedRoad={setSelectedRoad}
              loading={loading}
              isFullscreen={localFullscreen}
            />
          </div>

          {/* Traffic Status Cards */}
          {!localFullscreen && (
            <div className="space-y-4 w-full lg:max-w-xs lg:justify-self-end">
              <Card className="shadow-lg border border-stone-300 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95">
                <CardHeader className="py-2 bg-transparent border-b border-stone-200 dark:border-zinc-700">
                  <CardTitle className="flex items-center space-x-2 text-base text-zinc-900 dark:text-zinc-100">
                    <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span>Tình Trạng Giao Thông</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-4 max-h-60 overflow-y-auto overscroll-contain">
                  {loading ? (
                    // Loading skeleton
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                        >
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-6 w-20" />
                        </div>
                      ))}
                    </>
                  ) : allowedRoads.length === 0 ? (
                    // Empty state
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Không có tuyến đường nào
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {allowedRoads.map((road) => {
                        const { status, color } = getTrafficStatus(road);
                        const { speedText, speedColor } = getSpeedStatus(road);
                        const data = trafficData[road];

                        return (
                          <motion.div
                            key={road}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col p-3 rounded-lg bg-white dark:bg-zinc-800 border border-stone-300 dark:border-zinc-700 hover:bg-purple-50/50 dark:hover:bg-zinc-700 hover:border-purple-300 dark:hover:border-zinc-600 transition-all cursor-pointer hover:shadow-lg space-y-2"
                            onClick={() => setSelectedRoad(road)}
                          >
                            {/* Tên đường và nhãn mật độ */}
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                {road}
                              </span>
                              <Badge
                                variant={
                                  color === "red"
                                    ? "destructive"
                                    : color === "yellow"
                                      ? "secondary"
                                      : "default"
                                }
                                className="text-xs h-5 leading-none px-2 py-0"
                              >
                                {getStatusText(status)}
                              </Badge>
                            </div>

                            {/* Thông tin số lượng và tốc độ */}
                            <div className="flex items-center justify-between gap-2">
                              {data && (
                                <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center space-x-1">
                                  <Car className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                  <span>{String(data.count_car)}</span>
                                  <Bike className="h-3 w-3 ml-2 text-violet-600 dark:text-violet-400" />
                                  <span>{String(data.count_motor)}</span>
                                </div>
                              )}
                              <Badge
                                variant="outline"
                                className={`flex items-center space-x-1 text-xs px-2 py-0 h-5 leading-none ${
                                  speedColor === "green"
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                    : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                }`}
                              >
                                <Gauge className="h-3 w-3" />
                                <span className="font-medium">{speedText}</span>
                              </Badge>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      {/* Floating QR bottom-right */}
      <a
        href="https://t.me/Smart_Traffic_System_LVA_bot"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-4 right-4 z-50 group"
        title="Mở Telegram: @Smart_Traffic_System_LVA_bot"
      >
        <div className="rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-900/70 p-2 transition-transform group-hover:scale-[1.02] w-40">
          <div className="text-center text-xs font-semibold mb-1 text-gray-800 dark:text-gray-200">
            Bot Telegram
          </div>
          {!qrError ? (
            <img
              src="/images/bot-qr.png"
              alt="QR Telegram @Smart_Traffic_System_LVA_bot"
              className="w-36 h-36 object-contain mx-auto rounded-lg"
              loading="lazy"
              onError={() => setQrError(true)}
            />
          ) : (
            <div className="w-36 h-36 flex items-center justify-center text-center text-[11px] font-medium text-gray-600 dark:text-gray-300 select-none">
              Chưa tìm thấy ảnh QR (đặt file vào
              <br /> public/images/bot-qr.png)
            </div>
          )}
          <div className="mt-1 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
            QR: @Smart Traffic System
          </div>
        </div>
      </a>
    </div>
  );
};

export default TrafficDashboard;
