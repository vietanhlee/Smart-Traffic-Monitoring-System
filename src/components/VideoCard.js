import React from "react";
import {
  Video,
  Car,
  Bike,
  Gauge,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function VideoCard({ videoName, info, onClick, isFocused }) {
  const getStatusColor = () => {
    const totalVehicles = (info.count_car || 0) + (info.count_motor || 0);
    if (totalVehicles > 15) return "#ef4444";
    if (totalVehicles > 8) return "#f59e0b";
    return "#10b981";
  };

  const getStatusIcon = () => {
    const totalVehicles = (info.count_car || 0) + (info.count_motor || 0);
    if (totalVehicles > 15) return <AlertCircle size={16} />;
    if (totalVehicles > 8) return <Clock size={16} />;
    return <CheckCircle size={16} />;
  };

  return (
    <div
      onClick={onClick}
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: 28,
        padding: 36,
        cursor: "pointer",
        transform: isFocused ? "scale(1.08)" : "scale(1)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: isFocused
          ? "0 24px 48px rgba(102, 126, 234, 0.4), 0 0 0 3px #667eea"
          : "0 12px 32px rgba(0, 0, 0, 0.14)",
        color: "white",
        position: "relative",
        overflow: "hidden",
        minWidth: 400,
        maxWidth: 420,
        minHeight: 420,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Hiển thị frame nếu có */}
      {info.frame && (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 12,
            overflow: "hidden",
            border: "2px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <img
            src={
              info.frame ? `data:image/jpeg;base64,${info.frame}` : undefined
            }
            alt="Video frame"
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Video size={20} />
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
            }}
          >
            {videoName}
          </h3>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: getStatusColor(),
            padding: "4px 8px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {getStatusIcon()}
          <span>
            {(info.count_car || 0) + (info.count_motor || 0) > 15
              ? "Tắc"
              : (info.count_car || 0) + (info.count_motor || 0) > 8
              ? "Đông"
              : "Thông"}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            padding: 12,
            borderRadius: 12,
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Car size={16} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Ô tô</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {info.count_car || 0}
          </div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {info.speed_car || 0} km/h
          </div>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            padding: 12,
            borderRadius: 12,
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Bike size={16} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Xe máy</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {info.count_motor || 0}
          </div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {info.speed_motor || 0} km/h
          </div>
        </div>
      </div>

      <div
        style={{
          background: "rgba(255, 255, 255, 0.15)",
          padding: 12,
          borderRadius: 12,
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Gauge size={16} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>
          Tổng phương tiện: {(info.count_car || 0) + (info.count_motor || 0)}
        </span>
      </div>
    </div>
  );
}
