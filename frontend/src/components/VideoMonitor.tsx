import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Video,
  Car,
  Bike,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VehicleData {
  count_car: number;
  count_motor: number;
  speed_car: number;
  speed_motor: number;
}

interface FrameData {
  [roadName: string]: {
    frame: string;
  };
}

interface TrafficData {
  [roadName: string]: VehicleData;
}

interface VideoMonitorProps {
  frameData: FrameData;
  trafficData: TrafficData;
  allowedRoads: string[];
  selectedRoad: string | null;
  setSelectedRoad: (road: string | null) => void;
  loading: boolean;
  isFullscreen: boolean;
}

const VideoMonitor = ({
  frameData,
  trafficData,
  allowedRoads,
  selectedRoad,
  setSelectedRoad,
  loading,
  isFullscreen,
}: VideoMonitorProps) => {
  const [showFrames, setShowFrames] = useState(true);

  const getTrafficStatus = (roadName: string) => {
    const data = trafficData[roadName];
    if (!data)
      return {
        status: "unknown",
        color: "gray",
        icon: Clock,
        text: "Không rõ",
      };

    const totalVehicles = data.count_car + data.count_motor;
    if (totalVehicles > 15)
      return {
        status: "congested",
        color: "red",
        icon: AlertTriangle,
        text: "Tắc nghẽn",
      };
    if (totalVehicles > 8)
      return { status: "busy", color: "yellow", icon: Clock, text: "Đông đúc" };
    return {
      status: "clear",
      color: "green",
      icon: CheckCircle,
      text: "Thông thoáng",
    };
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
            <Video className="h-5 w-5" />
            <span>Giám Sát Video</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`grid gap-4 ${
              isFullscreen
                ? "grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            {allowedRoads.map((road) => (
              <div key={road} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Video className="h-5 w-5" />
            <span>Giám Sát Video</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFrames(!showFrames)}
          >
            {showFrames ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="ml-2">{showFrames ? "Ẩn" : "Hiện"} Video</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={`grid gap-6 ${
            isFullscreen
              ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2"
          }`}
        >
          <AnimatePresence>
            {allowedRoads.map((roadName) => {
              const frame = frameData[roadName];
              const data = trafficData[roadName];
              const { color, icon: Icon, text } = getTrafficStatus(roadName);
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
                  className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? "border-blue-500 shadow-lg shadow-blue-500/25"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  onClick={() => setSelectedRoad(isSelected ? null : roadName)}
                >
                  {/* Video Frame */}
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                    {showFrames && frame?.frame ? (
                      <img
                        src={`data:image/jpeg;base64,${frame.frame}`}
                        alt={`Camera ${roadName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-12 w-12 text-gray-400" />
                      </div>
                    )}

                    {/* Status Overlay */}
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant={getStatusBadgeVariant(color)}
                        className="flex items-center space-x-1"
                      >
                        <Icon className="h-3 w-3" />
                        <span>{text}</span>
                      </Badge>
                    </div>

                    {/* Live Indicator */}
                    <div className="absolute top-3 left-3">
                      <div className="flex items-center space-x-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>LIVE</span>
                      </div>
                    </div>
                  </div>

                  {/* Info Panel */}
                  <div className="p-4 bg-white dark:bg-gray-900">
                    <h3 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                      <span>{roadName}</span>
                    </h3>

                    {data ? (
                      <div className="grid grid-cols-2 gap-4">
                        {/* Car Stats */}
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Ô tô
                            </p>
                            <p className="font-semibold">{data.count_car}</p>
                            <p className="text-xs text-gray-500">
                              {data.speed_car.toFixed(1)} km/h
                            </p>
                          </div>
                        </div>

                        {/* Motorbike Stats */}
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Bike className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Xe máy
                            </p>
                            <p className="font-semibold">{data.count_motor}</p>
                            <p className="text-xs text-gray-500">
                              {data.speed_motor.toFixed(1)} km/h
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-4">
                        <div className="text-center">
                          <Gauge className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
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

        {selectedRoad && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Đang xem: {selectedRoad}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Click vào camera khác để chuyển đổi hoặc click lại để bỏ chọn
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoMonitor;
