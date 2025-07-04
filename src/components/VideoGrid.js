import React, { useState, useEffect } from "react";
import VideoCard from "./VideoCard";

export default function VideoGrid({ focused, setFocused }) {
  const [framesData, setFramesData] = useState(null);
  const [vehiclesData, setVehiclesData] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch frames every 200ms
  useEffect(() => {
    let timer;
    const fetchFrames = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/frames");
        const frames = await res.json();
        setFramesData(frames);
      } catch (e) {
        setFramesData(null);
      }
      timer = setTimeout(fetchFrames, 201);
    };
    fetchFrames();
    return () => clearTimeout(timer);
  }, []);

  // Fetch vehicles every 1000ms
  useEffect(() => {
    let timer;
    const fetchVehicles = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/veheicles");
        const vehicles = await res.json();
        setVehiclesData(vehicles);
      } catch (e) {
        setVehiclesData(null);
      }
      timer = setTimeout(fetchVehicles, 4000);
    };
    fetchVehicles();
    return () => clearTimeout(timer);
  }, []);

  // Merge data when either framesData or vehiclesData changes
  useEffect(() => {
    if (!framesData && !vehiclesData) {
      setData(null);
      setLoading(true);
      return;
    }
    const merged = {};
    const allRoads = new Set([
      ...Object.keys(framesData || {}),
      ...Object.keys(vehiclesData || {}),
    ]);
    allRoads.forEach((road) => {
      merged[road] = {
        ...(vehiclesData && vehiclesData[road] ? vehiclesData[road] : {}),
        ...(framesData && framesData[road] ? framesData[road] : {}),
      };
    });
    setData(merged);
    setLoading(false);
  }, [framesData, vehiclesData]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: 16,
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            border: "4px solid #e2e8f0",
            borderTop: "4px solid #667eea",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <div
          style={{
            fontSize: 18,
            color: "#64748b",
            fontWeight: 600,
          }}
        >
          Đang tải dữ liệu giám sát...
        </div>
      </div>
    );
  }

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 36,
    width: "100%",
    padding: "32px 0 32px 0",
    justifyItems: "start",
    alignItems: "start",
    marginLeft: -200, // đẩy sát trái hơn nữa
    maxWidth: 1200,
  };

  // Only show the specified roads, even if API returns more or less
  const allowedRoads = [
    "Văn Phú",
    "Nguyễn Trãi",
    "Ngã Tư Sở",
    "Đường Láng",
    "Văn Quán",
  ];

  if (!data) {
    return (
      <div style={gridStyle}>
        {allowedRoads.map((videoName) => (
          <VideoCard
            key={videoName}
            videoName={videoName}
            info={{}}
            onClick={() => setFocused(videoName)}
            isFocused={focused === videoName}
          />
        ))}
      </div>
    );
  }

  // Filter data to only include allowed roads
  const filteredData = Object.entries(data).filter(([videoName]) =>
    allowedRoads.includes(videoName)
  );

  return (
    <div style={gridStyle}>
      {filteredData.map(([videoName, info]) => (
        <VideoCard
          key={videoName}
          videoName={videoName}
          info={info}
          onClick={() => setFocused(videoName)}
          isFocused={focused === videoName}
        />
      ))}
    </div>
  );
}
