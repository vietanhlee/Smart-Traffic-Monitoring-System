from fastapi.responses import JSONResponse
from tracking_information_veheicle import AnalyzeOnRoadForMultiThreading
import sys
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Request
from CHATBOT import ChatLLM


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
        analyze_multi = AnalyzeOnRoadForMultiThreading(show=False, show_log=False, )
        analyze_multi.process()
        
    global chat_llm
    if chat_llm is None:
        chat_llm = ChatLLM()

# API endpoint lấy kết quả phân tích cho frontend
@app.get("/results")
def get_results():
    global analyze_multi
    if analyze_multi is None:
        # Nếu chưa khởi tạo xong thì trả về lỗi
        return JSONResponse(content={"error": "Analyzer not initialized"}, status_code=500)
    # Lấy kết quả từ tất cả các luồng phân tích video
    results = analyze_multi.get_results_for_all_threads()
    return JSONResponse(content=results)


@app.get("/veheicles")
def get_veheicles():
    global analyze_multi
    if analyze_multi is None:
        # Nếu chưa khởi tạo xong thì trả về lỗi
        return JSONResponse(content={"error": "Analyzer not initialized"}, status_code=500)
    # Lấy kết quả từ tất cả các luồng phân tích video
    infor_veheicles_on_roads = analyze_multi.get_info_veheicles_on_roads()
    return JSONResponse(content=infor_veheicles_on_roads)

@app.get("/frames")
def get_frames():
    global analyze_multi
    if analyze_multi is None:
        # Nếu chưa khởi tạo xong thì trả về lỗi
        return JSONResponse(content={"error": "Analyzer not initialized"}, status_code=500)
    # Lấy kết quả từ tất cả các luồng phân tích video
    frame_of_roads = analyze_multi.get_frame_of_roads()
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
    
# Các chú thích dưới đây là giải thích chi tiết cho từng phần code, bạn có thể xóa nếu muốn code gọn hơn.

# 1. @app.on_event("startup")
#    Khi server FastAPI khởi động, hàm này sẽ được gọi tự động.
#    Mục đích: Khởi tạo đối tượng analyze_multi (phân tích đa luồng) nếu chưa có.
#    Gọi analyze_multi.process() để bắt đầu xử lý các video ngay khi server chạy.

# 2. @app.get("/results")
#    Đây là endpoint GET, trả về kết quả phân tích cho frontend.
#    Nếu analyze_multi chưa khởi tạo, trả về lỗi 500 và thông báo.
#    Nếu đã có, gọi analyze_multi.get_results_for_all_threads() để lấy kết quả của tất cả các video/luồng.
#    Trả về kết quả dưới dạng JSON cho frontend.

# Lưu ý về luồng:
# - Khi chạy FastAPI (bằng uvicorn/gunicorn), server sẽ giữ tiến trình chạy liên tục để lắng nghe request
#  HTTP.
# - Các thread bạn tạo trong analyze_multi.process() (mặc định daemon=False) sẽ tiếp tục chạy song song 
# với main thread của FastAPI.
# - FastAPI/uvicorn sẽ KHÔNG kết thúc chương trình cho đến khi bạn dừng server (Ctrl+C hoặc kill process).
# - Vì vậy, không cần join() các thread phân tích video, chương trình vẫn không bị thoát vì event loop 
# của FastAPI vẫn giữ tiến trình sống.
# - Nếu chạy script này như một script Python bình thường (không phải FastAPI server), main thread kết 
# thúc sẽ làm các thread con daemon=True bị dừng theo.
# - Nhưng với FastAPI, tiến trình server luôn sống, nên các thread phân tích vẫn tiếp tục chạy song song.