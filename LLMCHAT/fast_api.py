
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from chat import ChatLLM
app = FastAPI()


chat_llm = None

# Cấu hình CORS cho phép FE gọi từ domain/port khác
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Có thể thay * bằng domain FE cụ thể nếu muốn bảo mật hơn
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.on_event("startup")
def startup_event():
    """
    Sự kiện khởi động ứng dụng.
    """
    global chat_llm
    chat_llm = ChatLLM()

@app.get("/chat/{message}")
def chat(message: str):
    """
    Nhận một tin nhắn và trả về phản hồi từ mô hình AI.
    """
    
    if not chat_llm:
        raise HTTPException(status_code=500, detail="ChatLLM chưa được khởi tạo.")
    
    try:
        response = chat_llm.chat(message)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))