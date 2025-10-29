# Lưu ý về luồng:
- Khi chạy FastAPI (bằng uvicorn/gunicorn), server sẽ giữ tiến trình chạy liên tục để lắng nghe request
 HTTP.
- Các thread tạo trong analyze_multi.process() (mặc định daemon=False) sẽ tiếp tục chạy song song 
với main thread của FastAPI.
- FastAPI/uvicorn sẽ KHÔNG kết thúc chương trình cho đến khi bạn dừng server (Ctrl+C hoặc kill process).
- Vì vậy, không cần join() các thread phân tích video, chương trình vẫn không bị thoát vì event loop 
của FastAPI vẫn giữ tiến trình sống.
- Nếu chạy script này như một script Python bình thường (không phải FastAPI server), main thread kết 
thúc sẽ làm các thread con daemon=True bị dừng theo.
- Nhưng với FastAPI, tiến trình server luôn sống, nên các thread phân tích vẫn tiếp tục chạy song song."""