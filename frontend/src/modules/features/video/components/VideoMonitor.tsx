import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import {
  Video,
  Car,
  Bike,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
  Wifi,
  WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VideoModal from "./VideoModal";
import { getThresholdForRoad } from "../../../../config/trafficThresholds";

interface VehicleData {
  count_car: number;
  count_motor: number;
  speed_car: number;
  speed_motor: number;
}

interface StreamData {
  [roadName: string]: {
    stream: MediaStream | null;
  };
}

interface TrafficData {
  [roadName: string]: VehicleData;
}

interface VideoMonitorProps {
  streamData: StreamData;
  streamConnections: Record<string, boolean>;
  trafficData: TrafficData;
  allowedRoads: string[];
  selectedRoad: string | null;
  setSelectedRoad: (road: string | null) => void;
  loading: boolean;
  isFullscreen: boolean;
}

type StreamVideoProps = {
  stream: MediaStream | null;
  className: string;
};

const StreamVideo = ({ stream, className }: StreamVideoProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) {
      return;
    }

    if (node.srcObject !== stream) {
      node.srcObject = stream;
    }

    if (stream) {
      void node.play().catch(() => {
        // Ignore autoplay errors; user interaction will resume playback.
      });
    }
  }, [stream]);

  return (
    <video ref={videoRef} autoPlay playsInline muted className={className} />
  );
};

const VideoMonitor = ({
  streamData,
  streamConnections,
  trafficData,
  allowedRoads,
  selectedRoad,
  setSelectedRoad,
  loading,
  isFullscreen,
}: VideoMonitorProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRoadName, setModalRoadName] = useState<string>("");

  const getTrafficStatus = (roadName: string) => {
    const data = trafficData[roadName];
    if (!data)
      return {
        status: "unknown",
        color: "gray",
        icon: Clock,
        text: "Không rõ",
      };

    // Prefer backend-provided classification when available
    const densityFromBackend = (data as any)?.density_status;
    if (densityFromBackend) {
      if (densityFromBackend === "Tắc nghẽn")
        return {
          status: "congested",
          color: "red",
          icon: AlertTriangle,
          text: densityFromBackend,
        };
      if (densityFromBackend === "Đông đúc")
        return {
          status: "busy",
          color: "yellow",
          icon: Clock,
          text: densityFromBackend,
        };
      if (densityFromBackend === "Thông thoáng")
        return {
          status: "clear",
          color: "green",
          icon: CheckCircle,
          text: densityFromBackend,
        };
    }

    // Fallback to previous local thresholds if backend not providing
    const threshold = getThresholdForRoad(roadName);
    const totalVehicles = data.count_car + data.count_motor;

    if (totalVehicles > threshold.c2)
      return {
        status: "congested",
        color: "red",
        icon: AlertTriangle,
        text: "Tắc nghẽn",
      };
    if (totalVehicles > threshold.c1)
      return { status: "busy", color: "yellow", icon: Clock, text: "Đông đúc" };
    return {
      status: "clear",
      color: "green",
      icon: CheckCircle,
      text: "Thông thoáng",
    };
  };

  const getSpeedStatus = (roadName: string) => {
    const data = trafficData[roadName];
    if (!data) return { speedText: "Không rõ", speedColor: "gray" };

    const speedFromBackend = (data as any)?.speed_status;
    if (speedFromBackend) {
      if (speedFromBackend === "Nhanh chóng")
        return { speedText: "Nhanh chóng", speedColor: "green" };
      if (speedFromBackend === "Chậm chạp")
        return { speedText: "Chậm chạp", speedColor: "orange" };
    }

    // Fallback
    const threshold = getThresholdForRoad(roadName);
    const avgSpeed = (data.speed_car + data.speed_motor) / 2;

    if (avgSpeed >= threshold.v)
      return { speedText: "Nhanh chóng", speedColor: "green" };
    return { speedText: "Chậm chạp", speedColor: "orange" };
  };

  const getStatusBadgeVariant = (color: string) => {
    switch (color) {
      case "red":
        return "destructive";
      case "yellow":
        return "secondary";
      case "green":
        return "default";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Video className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Giám Sát Video</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`grid gap-3 sm:gap-4 ${isFullscreen
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}
          >
            {allowedRoads.map((road) => (
              <div key={road} className="space-y-2 sm:space-y-3">
                <Skeleton className="aspect-[3/2] w-full max-w-sm mx-auto rounded-lg" />
                <Skeleton className="h-3 sm:h-4 w-3/4" />
                <Skeleton className="h-3 sm:h-4 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="px-3 sm:px-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center space-x-2">
            <Video className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Camera Giao Thông</span>
          </CardTitle>
          {/* Connection Status */}
          {allowedRoads.length > 0 && (
            <div
              className={`flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium ${Object.values(streamConnections).some(Boolean)
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                }`}
            >
              {Object.values(streamConnections).some(Boolean) ? (
                <>
                  <Wifi className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>
                    Đang kết nối với{" "}
                    {Object.values(streamConnections).filter(Boolean).length}/
                    {allowedRoads.length} camera
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Đang kết nối...</span>
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 max-h-[calc(100vh-12rem)] overflow-y-auto overscroll-contain">
        <div
          className={`grid gap-4 sm:gap-6 ${isFullscreen
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
        >
          <AnimatePresence>
            {allowedRoads.map((roadName) => {
              const streamEntry = streamData[roadName];
              const data = trafficData[roadName];
              const { color, icon: Icon, text } = getTrafficStatus(roadName);
              const { speedText, speedColor } = getSpeedStatus(roadName);
              const isSelected = selectedRoad === roadName;

              return (
                <motion.div
                  key={roadName}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{
                    opacity: 1,
                    scale: isSelected ? 1.05 : 1,
                    transition: { duration: 0.3 },
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }}
                  className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer inline-block w-full max-w-sm mx-auto ${isSelected
                      ? "border-blue-500 shadow-lg shadow-blue-500/25"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  onClick={() => {
                    setModalRoadName(roadName);
                    setModalOpen(true);
                    if (setSelectedRoad) setSelectedRoad(roadName);
                  }}
                >
                  {/* Video Frame (responsive) */}
                  <div className="relative w-full max-w-sm mx-auto aspect-[3/2] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    {streamEntry?.stream ? (
                      <StreamVideo
                        stream={streamEntry.stream}
                        className="w-full h-full object-contain block"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                      </div>
                    )}

                    {/* Click to expand hint */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                      <div className="bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium backdrop-blur-sm">
                        Click để phóng to
                      </div>
                    </div>
                  </div>

                  {/* Info Panel (responsive) */}
                  <div className="bg-white dark:bg-gray-900 p-2 sm:p-3">
                    <h3 className="font-semibold text-sm sm:text-lg mb-2 sm:mb-3 flex items-center space-x-2">
                      <span className="truncate">{roadName}</span>
                    </h3>

                    {/* Status Badges */}
                    <div className="mb-2 sm:mb-3 flex flex-wrap gap-1.5 sm:gap-2">
                      {/* Mật độ Badge */}
                      <Badge
                        variant={getStatusBadgeVariant(color)}
                        className="flex items-center space-x-1 text-xs"
                      >
                        <Icon className="h-3 w-3" />
                        <span>{text}</span>
                      </Badge>

                      {/* Tốc độ Badge */}
                      {data && (
                        <Badge
                          variant={
                            speedColor === "green" ? "default" : "secondary"
                          }
                          className={`flex items-center space-x-1 text-xs ${speedColor === "green"
                              ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                              : "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
                            }`}
                        >
                          <Gauge className="h-3 w-3" />
                          <span>{speedText}</span>
                        </Badge>
                      )}
                    </div>

                    {data ? (
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        {/* Car Stats */}
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <div className="p-1 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Car className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                              Ô tô
                            </p>
                            <p className="font-semibold text-xs sm:text-base text-gray-900 dark:text-white">
                              {data.count_car}
                            </p>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {data.speed_car.toFixed(1)} km/h
                            </p>
                          </div>
                        </div>

                        {/* Motorbike Stats */}
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <div className="p-1 sm:p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Bike className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                              Xe máy
                            </p>
                            <p className="font-semibold text-xs sm:text-base text-gray-900 dark:text-white">
                              {data.count_motor}
                            </p>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {data.speed_motor.toFixed(1)} km/h
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-2 sm:py-4">
                        <div className="text-center">
                          <Gauge className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-1 sm:mb-2" />
                          <p className="text-xs sm:text-sm text-gray-500">
                            Đang tải dữ liệu...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>

      {/* Video Modal */}
      <VideoModal
        isOpen={modalOpen && !!modalRoadName}
        onClose={() => {
          setModalOpen(false);
          setModalRoadName("");
        }}
        roadName={modalRoadName}
        stream={
          modalRoadName ? streamData[modalRoadName]?.stream || null : null
        }
        trafficData={modalRoadName ? trafficData[modalRoadName] : undefined}
      />
    </Card>
  );
};

export default VideoMonitor;