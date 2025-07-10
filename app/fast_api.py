from fastapi.responses import JSONResponse
from services.AnalyzeOnRoadForMultiProcessing import AnalyzeOnRoadForMultiprocessing
import sys
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Request
from services.CHATBOT import ChatLLM


app = FastAPI()
analyze_multi = None

chat_llm = None

# Cho phép gọi API từ frontend khác port (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Có thể chỉnh lại cho chặt hơn nếu cần
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In ra đường dẫn Python đang chạy để kiểm tra môi trường
print("Python executable:", sys.executable)

# Khi server FastAPI khởi động, tạo đối tượng phân tích đa luồng và bắt đầu xử lý video
@app.on_event("startup")
def startup_event():
    """
    Sự kiện khởi động ứng dụng.
    """
    
    global analyze_multi
    if analyze_multi is None:    
        analyze_multi = AnalyzeOnRoadForMultiprocessing(
            show_log= False,
            show= False,
            is_join_processes= False
        )
        analyze_multi.run_multiprocessing() 
    global chat_llm
    if chat_llm is None:
        chat_llm = ChatLLM()

@app.get("/veheicles")
def get_veheicles():
    global analyze_multi
    if analyze_multi is None:
        # Nếu chưa khởi tạo xong thì trả về lỗi
        return JSONResponse(content={"error": "Analyzer not initialized"}, status_code=500)
    # Lấy kết quả từ tất cả các luồng phân tích video
    infor_veheicles_on_roads = analyze_multi.get_veheicles_info()
    return JSONResponse(content=infor_veheicles_on_roads)

@app.get("/frames")
def get_frames():
    global analyze_multi
    if analyze_multi is None:
        # Nếu chưa khởi tạo xong thì trả về lỗi
        return JSONResponse(content={"error": "Analyzer not initialized"}, status_code=500)
    # Lấy kết quả từ tất cả các luồng phân tích video
    frame_of_roads = analyze_multi.get_frames()
    return JSONResponse(content= frame_of_roads)


# Sử dụng POST thay vì GET cho endpoint chat
from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(request: ChatRequest):
    """
    Nhận một tin nhắn và trả về phản hồi từ mô hình AI.
    """
    if not chat_llm:
        raise HTTPException(status_code=500, detail="ChatLLM chưa được khởi tạo.")
    try:
        response = chat_llm.chat(request.message)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    