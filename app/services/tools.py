from langchain_core.tools import tool


@tool
def get_frame_road(road_name: str) -> str:
    """Get traffic frame information for a specific road.
    
    Args:
        road_name: The name of the road to get traffic information for
        
    Returns:
        str: Traffic information for the specified road
    """
    # Placeholder implementation - you can integrate with your traffic analysis system
    return f"Thông tin giao thông cho {road_name}: Hiện tại chưa có dữ liệu thời gian thực."