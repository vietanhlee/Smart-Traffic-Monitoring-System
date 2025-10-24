import TrafficAnalytics from "../modules/dashboard/components/TrafficAnalytics";
import { useMultipleTrafficInfo } from "../hooks/useWebSocket";
import { useEffect, useState } from "react";
import { endpoints } from "../config";

const AnalyticsPage = () => {
  const [allowedRoads, setAllowedRoads] = useState<string[]>([]);

  useEffect(() => {
    const fetchRoads = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setAllowedRoads([]);
          return;
        }
        const res = await fetch(endpoints.roadNames, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          setAllowedRoads([]);
          return;
        }
        const json = await res.json();
        const names: string[] = json?.road_names ?? [];
        setAllowedRoads(names);
      } catch {
        setAllowedRoads([]);
      }
    };
    fetchRoads();
  }, []);

  const { trafficData } = useMultipleTrafficInfo(allowedRoads);

  return (
    <TrafficAnalytics trafficData={trafficData} allowedRoads={allowedRoads} />
  );
};

export default AnalyticsPage;
