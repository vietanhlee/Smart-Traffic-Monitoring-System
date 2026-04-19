import { useEffect, useRef, useState } from "react";
import { endpoints, authConfig } from "@/config";

type StreamState = {
  stream: MediaStream | null;
};

type OfferPayload = {
  sdp: string;
  type: RTCSdpType;
};

type AnswerPayload = {
  sdp: string;
  type: RTCSdpType;
};

const ICE_SERVERS: RTCIceServer[] = [
  {
    urls: ["stun:stun.l.google.com:19302"],
  },
];

const waitForIceGatheringComplete = (pc: RTCPeerConnection): Promise<void> => {
  if (pc.iceGatheringState === "complete") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const onChange = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", onChange);
        resolve();
      }
    };

    pc.addEventListener("icegatheringstatechange", onChange);
  });
};

export const useMultipleWebRTCFrameStreams = (roadNames: string[]) => {
  const [streamData, setStreamData] = useState<Record<string, StreamState>>({});
  const [connections, setConnections] = useState<Record<string, boolean>>({});

  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const reconnectTimersRef = useRef<Record<string, number>>({});
  const mountedRef = useRef(true);

  const clearReconnectTimer = (road: string) => {
    const timerId = reconnectTimersRef.current[road];
    if (!timerId) {
      return;
    }
    window.clearTimeout(timerId);
    delete reconnectTimersRef.current[road];
  };

  const closePeerConnection = (road: string) => {
    clearReconnectTimer(road);

    const existing = peerConnectionsRef.current[road];
    if (existing) {
      existing.ontrack = null;
      existing.onconnectionstatechange = null;
      existing.oniceconnectionstatechange = null;
      existing.close();
      delete peerConnectionsRef.current[road];
    }

    setConnections((prev) => ({ ...prev, [road]: false }));
    setStreamData((prev) => {
      const next = { ...prev };
      const stream = next[road]?.stream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      delete next[road];
      return next;
    });
  };

  const scheduleReconnect = (road: string) => {
    if (!mountedRef.current) {
      return;
    }
    if (reconnectTimersRef.current[road]) {
      return;
    }

    reconnectTimersRef.current[road] = window.setTimeout(() => {
      delete reconnectTimersRef.current[road];
      void connectRoad(road);
    }, 1500);
  };

  const connectRoad = async (road: string) => {
    if (!mountedRef.current) {
      return;
    }

    const existing = peerConnectionsRef.current[road];
    if (
      existing &&
      ["new", "connecting", "connected"].includes(existing.connectionState)
    ) {
      return;
    }

    closePeerConnection(road);

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerConnectionsRef.current[road] = pc;

    pc.addTransceiver("video", { direction: "recvonly" });

    pc.ontrack = (event: RTCTrackEvent) => {
      if ("contentHint" in event.track) {
        try {
          event.track.contentHint = "detail";
        } catch {
          // Ignore browsers that don't allow changing this hint.
        }
      }

      const [stream] = event.streams;
      if (!stream) {
        return;
      }
      setStreamData((prev) => ({ ...prev, [road]: { stream } }));
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") {
        clearReconnectTimer(road);
        setConnections((prev) => ({ ...prev, [road]: true }));
        return;
      }

      if (state === "failed" || state === "disconnected") {
        setConnections((prev) => ({ ...prev, [road]: false }));
        scheduleReconnect(road);
        return;
      }

      if (state === "closed") {
        setConnections((prev) => ({ ...prev, [road]: false }));
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        scheduleReconnect(road);
      }
    };

    try {
      console.log(`WebRTC start connectRoad for road=${road}`);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGatheringComplete(pc);

      const local = pc.localDescription;
      console.log(`WebRTC local description for road=${road}:`, {
        signalingState: pc.signalingState,
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        hasLocalSdp: Boolean(local?.sdp),
        localType: local?.type,
      });

      if (!local?.sdp || !local?.type) {
        throw new Error("Cannot create local SDP offer");
      }

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem(authConfig.TOKEN_KEY)
          : null;

      const response = await fetch(endpoints.framesWebRtcOffer(road), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          sdp: local.sdp,
          type: local.type,
        } as OfferPayload),
      });

      if (!response.ok) {
        throw new Error(
          `WebRTC negotiation failed with status ${response.status}`,
        );
      }

      const answer = (await response.json()) as AnswerPayload;
      console.log(`WebRTC got answer for road=${road}:`, answer);

      if (pc.connectionState === "closed" || pc.signalingState === "closed") {
        throw new Error(
          `PeerConnection already closed before remote description was applied (connectionState=${pc.connectionState}, signalingState=${pc.signalingState})`,
        );
      }

      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      setConnections((prev) => ({ ...prev, [road]: true }));
    } catch (error) {
      console.error(`WebRTC connection failed for road ${road}:`, error);
      setConnections((prev) => ({ ...prev, [road]: false }));
      scheduleReconnect(road);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    const reconnectTimers = reconnectTimersRef.current;
    const peerConnections = peerConnectionsRef.current;

    const currentRoads = new Set(roadNames);

    Object.keys(peerConnections).forEach((road) => {
      if (!currentRoads.has(road)) {
        closePeerConnection(road);
      }
    });

    roadNames.forEach((road) => {
      void connectRoad(road);
    });

    return () => {
      mountedRef.current = false;
      Object.keys(reconnectTimers).forEach((road) => clearReconnectTimer(road));
      Object.keys(peerConnections).forEach((road) => closePeerConnection(road));
      peerConnectionsRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(roadNames)]);

  const isAnyConnected = Object.values(connections).some(Boolean);
  const areAllConnected =
    roadNames.length > 0 && roadNames.every((road) => connections[road]);

  return {
    streamData,
    connections,
    isAnyConnected,
    areAllConnected,
  };
};
