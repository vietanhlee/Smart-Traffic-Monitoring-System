from aiortc import RTCRtpSender

def build_video_codec_preferences():
    capabilities = RTCRtpSender.getCapabilities("video")
    preferred_order = {"video/H264": 0, "video/VP8": 1, "video/AV1": 2}
    return sorted(
        capabilities.codecs,
        key=lambda codec: preferred_order.get(codec.mimeType, 99),
    )

async def close_peer_connection(pc, active_peer_connections=None):
    if active_peer_connections is not None:
        active_peer_connections.discard(pc)
    if pc.connectionState != "closed":
        await pc.close()
