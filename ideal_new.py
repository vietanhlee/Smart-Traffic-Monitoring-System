import cv2
from ultralytics import YOLO
import numpy as np
from collections import defaultdict
import time
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

cap = cv2.VideoCapture("./app/video_test/Ngã Tư Sở.mp4")
assert cap.isOpened(), "Error reading video file"

# Load model
model = YOLO("app/best.pt")

# Định nghĩa vùng quan tâm
roi_x1, roi_y1 = 0, 300
roi_x2, roi_y2 = 800, 600

# Track object positions and times
track_history = defaultdict(lambda: [])
fps = cap.get(cv2.CAP_PROP_FPS)
if fps == 0:
    fps = 30  # default fps

# Process video
while cap.isOpened():
    success, im0 = cap.read()
    if not success:
        break
    
    # Resize frame
    im0 = cv2.resize(im0, (800, 600))
    
    # Crop frame chỉ lấy vùng quan tâm
    roi_frame = im0[roi_y1:roi_y2, roi_x1:roi_x2]
    
    # Chạy prediction chỉ trên vùng ROI
    results = model.track(roi_frame, persist=True)
    
    # Vẽ khung ROI
    cv2.rectangle(im0, (roi_x1, roi_y1), (roi_x2, roi_y2), (0, 255, 0), 2)
    
    if results[0].boxes is not None and results[0].boxes.id is not None:
        # Get boxes and track IDs
        boxes = results[0].boxes.xyxy.cpu().numpy()
        track_ids = results[0].boxes.id.int().cpu().numpy()
        
        for box, track_id in zip(boxes, track_ids):
            x1, y1, x2, y2 = box
            # Convert ROI coordinates to full frame coordinates
            center_x = int((x1 + x2) / 2) + roi_x1
            center_y = int((y1 + y2) / 2) + roi_y1
            
            # Store track history
            track_history[track_id].append((center_x, center_y, time.time()))
            
            # Calculate speed if we have enough history
            if len(track_history[track_id]) >= 10:
                # Get last 10 positions
                recent_positions = track_history[track_id][-10:]
                
                # Calculate distance and time
                start_pos = recent_positions[0]
                end_pos = recent_positions[-1]
                
                distance = np.sqrt((end_pos[0] - start_pos[0])**2 + 
                                 (end_pos[1] - start_pos[1])**2)
                time_diff = end_pos[2] - start_pos[2]
                
                if time_diff > 0:
                    # Speed in pixels per second
                    speed_pps = distance / time_diff
                    # Convert to km/h (bạn cần calibrate tỷ lệ pixel/meter)
                    speed_kmh = speed_pps * 0.1  # example conversion factor
                    
                    # Draw speed on frame
                    cv2.putText(im0, f"Speed: {speed_kmh:.1f} km/h", 
                               (center_x, center_y - 10), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
            
            # Draw center point
            cv2.circle(im0, (center_x, center_y), 5, (0, 0, 255), -1)
    
    cv2.imshow("Speed Detection in ROI", im0)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()