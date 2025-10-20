import ChatInterface from "@/modules/chat/components/ChatInterface";
import { useMultipleTrafficInfo } from "../hooks/useWebSocket";
import { useEffect, useState } from "react";

export default function ChatPage() {
  const [allowedRoads, setAllowedRoads] = useState<string[]>([]);
  useEffect(() => {
    // You can refactor this logic as needed
    setAllowedRoads([
      "Văn Phú",
      "Nguyễn Trãi",
      "Ngã Tư Sở",
      "Đường Láng",
      "Văn Quán",
    ]);
  }, []);
  const { trafficData } = useMultipleTrafficInfo(allowedRoads);
  return <ChatInterface trafficData={trafficData} />;
}
