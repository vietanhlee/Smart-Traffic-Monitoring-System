import { Badge } from "@/components/ui/badge";
import {
  Video,
  Car,
  Bike,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
} from "lucide-react";
import { motion } from "framer-motion";
import { useFrameStream } from "../hooks/useWebSocket";

interface VehicleData {
  count_car: number;
  count_motor: number;
  speed_car: number;
  speed_motor: number;
}

interface RoadCameraProps {
  roadName: string;
  trafficData?: VehicleData;
  isSelected: boolean;
  showFrames: boolean;
  onClick: () => void;
}

const RoadCamera = ({
  roadName,
  trafficData,
  isSelected,
  showFrames,
  onClick,
}: RoadCameraProps) => {
  const { data: frameData, isConnected, error } = useFrameStream(roadName);

  const getTrafficStatus = () => {
    if (!trafficData) return {
      status: "unknown",
      color: "gray",
      icon: Clock,
      text: "Không rõ",
    };

    const totalVehicles = trafficData.count_car + trafficData.count_motor;
    if (totalVehicles > 20)
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

  const { color, icon: Icon, text } = getTrafficStatus();

  return (
    <motion.div
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
      onClick={onClick}
    >
      {/* Video Frame */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {showFrames && frameData?.frame && isConnected ? (
          <img
            src={`data:image/jpeg;base64,${frameData.frame}`}
            alt={`Camera ${roadName}`}
            className="w-full h-full object-fit"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="h-12 w-12 text-gray-400" />
            {error && (
              <div className="absolute bottom-2 left-2 text-xs text-red-500 bg-black/70 px-2 py-1 rounded">
                Lỗi kết nối
              </div>
            )}
          </div>
        )}

        {/* Status Overlay */}
        <div className="absolute top-2 right-2 z-10">
          <Badge
            variant={getStatusBadgeVariant(color)}
            className="flex items-center space-x-1 bg-black/70 text-white border-none backdrop-blur-sm"
          >
            <Icon className="h-3 w-3" />
            <span className="text-xs">{text}</span>
          </Badge>
        </div>

        {/* Live Indicator */}
        <div className="absolute top-2 left-2 z-10">
          <div
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
              isConnected
                ? "bg-red-500/90 text-white"
                : "bg-gray-500/90 text-white"
            }`}
          >
            <div
              className={`w-1.5 h-1.5 bg-white rounded-full ${
                isConnected ? "animate-pulse" : ""
              }`}
            ></div>
            <span>{isConnected ? "LIVE" : "OFFLINE"}</span>
          </div>
        </div>

        {/* Click to expand hint */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
          <div className="bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
            Click để phóng to
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="p-4 bg-white dark:bg-gray-900">
        <h3 className="font-semibold text-lg mb-3 flex items-center space-x-2">
          <span>{roadName}</span>
        </h3>

        {trafficData ? (
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
                <p className="font-semibold">{trafficData.count_car}</p>
                <p className="text-xs text-gray-500">
                  {trafficData.speed_car.toFixed(1)} km/h
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
                <p className="font-semibold">{trafficData.count_motor}</p>
                <p className="text-xs text-gray-500">
                  {trafficData.speed_motor.toFixed(1)} km/h
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <Gauge className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RoadCamera;