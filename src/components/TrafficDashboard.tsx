import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Car,
  Bike,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  MessageCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import VideoMonitor from "./VideoMonitor";
import ChatInterface from "./ChatInterface";
import TrafficAnalytics from "./TrafficAnalytics";
import { motion, AnimatePresence } from "framer-motion";
import { useMultipleTrafficInfo, useMultipleFrameStreams } from "../hooks/useWebSocket";
import { endpoints } from "../config";

// Import types from the WebSocket hook
type VehicleData = {
  count_car: number;
  count_motor: number;
  speed_car: number;
  speed_motor: number;
};

const TrafficDashboard = () => {
  const [selectedRoad, setSelectedRoad] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { theme, setTheme } = useTheme();

  const [allowedRoads, setAllowedRoads] = useState<string[]>([]);

  useEffect(() => {
    const fetchRoads = async () => {
      try {
        const res = await fetch(endpoints.roadNames);
        const json = await res.json();
        const names: string[] = json?.road_names ?? [];
        setAllowedRoads(names);
      } catch {
        // fallback to known demo names if API not ready
        setAllowedRoads(["Văn Phú", "Nguyễn Trãi", "Ngã Tư Sở", "Đường Láng", "Văn Quán"]);
      }
    };
    fetchRoads();
  }, []);

  // Use WebSocket for traffic data
  const { trafficData, isAnyConnected } = useMultipleTrafficInfo(allowedRoads);
  const { frameData: frames } = useMultipleFrameStreams(allowedRoads);

  const loading = !isAnyConnected;

  const getTrafficStatus = (roadName: string) => {
    const data = trafficData[roadName] as VehicleData | undefined;
    if (!data) return { status: "unknown", color: "gray", icon: Clock };

    const totalVehicles = data.count_car + data.count_motor;
    if (totalVehicles > 15)
      return { status: "congested", color: "red", icon: AlertTriangle };
    if (totalVehicles > 8)
      return { status: "busy", color: "yellow", icon: Clock };
    return { status: "clear", color: "green", icon: CheckCircle };
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
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
            <MapPin className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Hệ Thống Giám Sát Giao Thông Thông Minh
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Giám sát và phân tích giao thông thời gian thực
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <Tabs defaultValue="monitor" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger
            value="monitor"
            className="text-base py-3 px-6 font-medium"
          >
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Giám Sát</span>
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="text-base py-3 px-6 font-medium"
          >
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Phân Tích</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="chat" className="text-base py-3 px-6 font-medium">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Trợ Lý AI</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="space-y-6">
          <div
            className={`grid gap-6 ${
              isFullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-4"
            }`}
          >
            {/* Video Monitoring */}
            <div className={isFullscreen ? "col-span-1" : "col-span-3"}>
              <VideoMonitor
                frameData={frames}
                trafficData={trafficData}
                allowedRoads={allowedRoads}
                selectedRoad={selectedRoad}
                setSelectedRoad={setSelectedRoad}
                loading={loading}
                isFullscreen={isFullscreen}
              />
            </div>

            {/* Traffic Status Cards */}
            {!isFullscreen && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Tình Trạng Giao Thông</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <AnimatePresence>
                      {allowedRoads.map((road) => {
                        const {
                          status,
                          color,
                          icon: Icon,
                        } = getTrafficStatus(road);
                        const data = trafficData[road];

                        return (
                          <motion.div
                            key={road}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                            onClick={() => setSelectedRoad(road)}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon className={`h-4 w-4 text-${color}-500`} />
                              <span className="font-medium">{road}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant={
                                  color === "red"
                                    ? "destructive"
                                    : color === "yellow"
                                    ? "secondary"
                                    : "default"
                                }
                              >
                                {getStatusText(status)}
                              </Badge>
                              {data && (
                                <div className="text-xs text-gray-500 flex items-center space-x-1">
                                  <Car className="h-3 w-3" />
                                  <span>{String(data.count_car)}</span>
                                  <Bike className="h-3 w-3" />
                                  <span>{String(data.count_motor)}</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <TrafficAnalytics
            trafficData={trafficData}
            allowedRoads={allowedRoads}
          />
        </TabsContent>

        <TabsContent value="chat">
          <ChatInterface trafficData={trafficData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrafficDashboard;
