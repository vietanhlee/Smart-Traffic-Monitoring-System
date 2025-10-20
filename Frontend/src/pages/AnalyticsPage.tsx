import TrafficAnalytics from "../modules/dashboard/components/TrafficAnalytics";
import { useMultipleTrafficInfo } from "../hooks/useWebSocket";
import { useEffect, useState } from "react";

const AnalyticsPage = () => {
  const [allowedRoads, setAllowedRoads] = useState<string[]>([]);

  useEffect(() => {
    // You may want to fetch allowedRoads from API or context
    // For demo, use static or localStorage fallback
    const token = localStorage.getItem("access_token");
    if (!token) {
      setAllowedRoads([]);
      return;
    }
    // Example: fetch from API if needed
    // setAllowedRoads(["Văn Phú", "Nguyễn Trãi", ...]);
    // For now, just use a fallback
    setAllowedRoads([
      "Văn Phú",
      "Nguyễn Trãi",
      "Ngã Tư Sở",
      "Đường Láng",
      "Văn Quán",
    ]);
  }, []);

  const { trafficData } = useMultipleTrafficInfo(allowedRoads);

  return (
    <TrafficAnalytics trafficData={trafficData} allowedRoads={allowedRoads} />
  );
};

export default AnalyticsPage;
