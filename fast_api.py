from fastapi import FastAPI
from fastapi.responses import JSONResponse
from AnalyzeOnRoadForMultiThreading import AnalyzeOnRoadForMultiThreading
import sys
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
analyze_multi = None

# 👇 THÊM ĐOẠN NÀY để cho phép gọi từ frontend khác port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hoặc ["http://127.0.0.1:5500"] nếu muốn chặt chẽ hơn
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check if the ultralytics package is installed
print("Python executable:", sys.executable)

@app.on_event("startup")
def startup_event():
    global analyze_multi
    if analyze_multi is None:
        analyze_multi = AnalyzeOnRoadForMultiThreading(show= False)
        analyze_multi.process()

@app.get("/results")
def get_results():
    global analyze_multi
    if analyze_multi is None:
        return JSONResponse(content={"error": "Analyzer not initialized"}, status_code=500)
    
    results = analyze_multi.get_results_for_all_threads()
    return JSONResponse(content=results)
    return JSONResponse(content=results)
