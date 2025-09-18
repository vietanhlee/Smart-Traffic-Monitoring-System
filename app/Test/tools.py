from langchain_core import tools


@tools
def get_frame_road(road_name : str) -> str:
    