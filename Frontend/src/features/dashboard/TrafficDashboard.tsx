import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import {
  MapPin,
  Car,
  Bike,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  MessageCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import VideoMonitor from "./VideoMonitor";
import ChatInterface from "../chat/ChatInterface";
import TrafficAnalytics from "./TrafficAnalytics";
import { motion, AnimatePresence } from "framer-motion";
import {
  useMultipleTrafficInfo,
  useMultipleFrameStreams,
} from "../../hooks/useWebSocket";
import { endpoints } from "../../config";

// Import types from the WebSocket hook
type VehicleData = {
  count_car: number;
  count_motor: number;
  speed_car: number;
  speed_motor: number;
};

const TrafficDashboard = () => {
  const [selectedRoad, setSelectedRoad] = useState<string | null>(null);
  const [localFullscreen] = useState(false);

  const [allowedRoads, setAllowedRoads] = useState<string[]>([]);

  useEffect(() => {
    const fetchRoads = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setAllowedRoads([]);
          alert("Bạn cần đăng nhập để sử dụng chức năng này!");
          return;
        }
        const res = await fetch(endpoints.roadNames, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          setAllowedRoads([]);
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
          return;
        }
        const json = await res.json();
        const names: string[] = json?.road_names ?? [];
        setAllowedRoads(names);
      } catch {
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
    <div className="min-h-screen pt-2 px-4 space-y-4">
      {/* Header: removed all controls */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-2" // reduced spacing
      />

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
              localFullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-4"
            }`}
          >
            {/* Video Monitoring */}
            <div className={localFullscreen ? "col-span-1" : "col-span-3"}>
              <VideoMonitor
                frameData={frames}
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
