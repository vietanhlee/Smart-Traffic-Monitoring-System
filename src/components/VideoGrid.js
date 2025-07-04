import React, { useState, useEffect } from "react";
import VideoCard from "./VideoCard";

export default function VideoGrid({ focused, setFocused }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timer;
    const fetchResults = () => {
      fetch("http://127.0.0.1:8000/results")
        .then((res) => res.json())
        .then((data) => {
          setData(data);
          setLoading(false);
        })
        .catch(() => {
          setData(null);
          setLoading(false);
        });
      timer = setTimeout(fetchResults, 201);
    };
    fetchResults();
    return () => clearTimeout(timer);
  }, []);

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
