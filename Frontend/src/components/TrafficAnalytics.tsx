import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TrendingUp,
  Activity,
  Car,
  Bike,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react";
import { motion } from "framer-motion";

interface VehicleData {
  count_car: number;
  count_motor: number;
  speed_car: number;
  speed_motor: number;
}

interface TrafficData {
  [roadName: string]: VehicleData;
}

interface TrafficAnalyticsProps {
  trafficData: TrafficData;
  allowedRoads: string[];
}

interface HistoricalData {
  time: string;
  [key: string]: string | number;
}

const TrafficAnalytics = ({
  trafficData,
  allowedRoads,
}: TrafficAnalyticsProps) => {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  // const [selectedMetric, setSelectedMetric] = useState<"vehicles" | "speed">(
  //   "vehicles"
  // );

  // Store historical data
  useEffect(() => {
    if (Object.keys(trafficData).length > 0) {
      const now = new Date();
      const timeString = now.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const newDataPoint: HistoricalData = {
        time: timeString,
        ...Object.entries(trafficData).reduce((acc, [road, data]) => {
          acc[`${road}_cars`] = data.count_car;
          acc[`${road}_motors`] = data.count_motor;
          acc[`${road}_car_speed`] = data.speed_car;
          acc[`${road}_motor_speed`] = data.speed_motor;
          acc[`${road}_total`] = data.count_car + data.count_motor;
          return acc;
        }, {} as Record<string, number>),
      };

      setHistoricalData((prev) => {
        const updated = [...prev, newDataPoint];
        // Keep only last 20 data points
        return updated.slice(-20);
      });
    }
  }, [trafficData]);

  // Prepare data for charts
  const vehicleCountData = allowedRoads.map((road) => {
    const data = trafficData[road];
    return {
      road: road.length > 10 ? road.substring(0, 10) + "..." : road,
      fullRoad: road,
      cars: data?.count_car || 0,
      motors: data?.count_motor || 0,
      total: (data?.count_car || 0) + (data?.count_motor || 0),
    };
  });

  const speedData = allowedRoads.map((road) => {
    const data = trafficData[road];
    return {
      road: road.length > 10 ? road.substring(0, 10) + "..." : road,
      fullRoad: road,
      carSpeed: data?.speed_car || 0,
      motorSpeed: data?.speed_motor || 0,
    };
  });

  const pieData = allowedRoads
    .map((road) => {
      const data = trafficData[road];
      const total = (data?.count_car || 0) + (data?.count_motor || 0);
      return {
        name: road,
        value: total,
        cars: data?.count_car || 0,
        motors: data?.count_motor || 0,
      };
    })
    .filter((item) => item.value > 0);

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

  const getTotalVehicles = () => {
    return Object.values(trafficData).reduce(
      (sum, data) => sum + data.count_car + data.count_motor,
      0
    );
  };

  const getAverageSpeed = () => {
    const roads = Object.values(trafficData);
    if (roads.length === 0) return { car: 0, motor: 0 };

    const avgCarSpeed =
      roads.reduce((sum, data) => sum + data.speed_car, 0) / roads.length;
    const avgMotorSpeed =
      roads.reduce((sum, data) => sum + data.speed_motor, 0) / roads.length;

    return { car: avgCarSpeed, motor: avgMotorSpeed };
  };

  const getBusiestRoad = () => {
    let maxVehicles = 0;
    let busiestRoad = "";

    Object.entries(trafficData).forEach(([road, data]) => {
      const total = data.count_car + data.count_motor;
      if (total > maxVehicles) {
        maxVehicles = total;
        busiestRoad = road;
      }
    });

    return { road: busiestRoad, vehicles: maxVehicles };
  };

  const totalVehicles = getTotalVehicles();
  const averageSpeed = getAverageSpeed();
  const busiestRoad = getBusiestRoad();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tổng xe
                  </p>
                  <p className="text-2xl font-bold">{totalVehicles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Car className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tốc độ TB ô tô
                  </p>
                  <p className="text-2xl font-bold">
                    {averageSpeed.car.toFixed(1)} km/h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Bike className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tốc độ TB xe máy
                  </p>
                  <p className="text-2xl font-bold">
                    {averageSpeed.motor.toFixed(1)} km/h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Đông nhất
                  </p>
                  <p className="text-lg font-bold">
                    {busiestRoad.road || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {busiestRoad.vehicles} xe
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Tổng quan</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center space-x-2">
            <LineChartIcon className="h-4 w-4" />
            <span>Xu hướng</span>
          </TabsTrigger>
          <TabsTrigger
            value="distribution"
            className="flex items-center space-x-2"
          >
            <PieChartIcon className="h-4 w-4" />
            <span>Phân bố</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Count Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Số lượng xe theo tuyến đường</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vehicleCountData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="road" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        value,
                        name === "cars" ? "Ô tô" : "Xe máy",
                      ]}
                      labelFormatter={(label) => {
                        const item = vehicleCountData.find(
                          (d) => d.road === label
                        );
                        return item?.fullRoad || label;
                      }}
                    />
                    <Bar dataKey="cars" fill="#3B82F6" name="cars" />
                    <Bar dataKey="motors" fill="#10B981" name="motors" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Speed Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Tốc độ trung bình (km/h)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={speedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="road" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        `${Number(value).toFixed(1)} km/h`,
                        name === "carSpeed" ? "Ô tô" : "Xe máy",
                      ]}
                      labelFormatter={(label) => {
                        const item = speedData.find((d) => d.road === label);
                        return item?.fullRoad || label;
                      }}
                    />
                    <Bar dataKey="carSpeed" fill="#F59E0B" name="carSpeed" />
                    <Bar
                      dataKey="motorSpeed"
                      fill="#8B5CF6"
                      name="motorSpeed"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Xu hướng giao thông theo thời gian</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {allowedRoads.map((road, index) => (
                    <Line
                      key={road}
                      type="monotone"
                      dataKey={`${road}_total`}
                      stroke={COLORS[index % COLORS.length]}
                      name={road}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Phân bố xe theo tuyến đường</CardTitle>
            </CardHeader>
            <CardContent>
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
                    outerRadius={120}
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
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrafficAnalytics;
