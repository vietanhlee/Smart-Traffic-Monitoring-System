import numpy as np

regions = [np.array([[50, 400], [50, 265], [370, 130], [540, 130], [490, 400]]), 
            np.array([[230, 400], [90, 260], [350, 200], [600, 320], [600, 400]]),                  
            np.array([[50, 400], [50, 340], [400, 125], [530, 185], [470, 400]]),
            np.array([[140, 400], [400, 200], [550, 200], [530, 400]]),
            np.array([[50, 400], [50, 320], [390, 130], [550, 220], [480, 400]])
            ]

path_videos = [
    "./video_test/Văn Quán.mp4",
    "./video_test/Văn Phú.mp4",
    "./video_test/Nguyễn Trãi.mp4",
    "./video_test/Ngã Tư Sở.mp4",
    "./video_test/Đường Láng.mp4",
]

meter_per_pixels = [0.03,
                    0.09,
                    0.3,
                    0.11,
                    0.06
                    ]

models_path = r'./AI models/model N/openvino models/best_int8_openvino_model'

device = 'cpu'

