from dotenv import load_dotenv
import os
from langchain_google_genai import ChatGoogleGenerativeAI

# Load biến môi trường
load_dotenv()

# Kiểm tra API key
if os.getenv("GOOGLE_API_KEY") is None:
    raise ValueError("GOOGLE_API_KEY không được tìm thấy. Vui lòng kiểm tra file .env của bạn.")

# Định nghĩa tool
def add_numbers(a: float, b: float) -> float:
    return a + b  # Bạn có thể đổi thành `return 2` để test sai

# Dạng mô tả tool giống OpenAI
tools = [
    {
        "function_declarations": [
            {
                "name": "add_numbers",
                "description": "Tính tổng của hai số",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "a": {"type": "number", "description": "Số thứ nhất"},
                        "b": {"type": "number", "description": "Số thứ hai"},
                    },
                    "required": ["a", "b"],
                },
            }
        ]
    }
]

# Tạo model Gemini có tool
model = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.7,
    tools=tools
)

# Khởi tạo cuộc hội thoại
chat = model.start_chat()

# Gửi tin nhắn người dùng
response = chat.send_message("Tính tổng của 3.2 và 5.1")

# Kiểm tra Gemini có muốn gọi tool không
tool_calls = response.tool_calls
if tool_calls:
    for tool_call in tool_calls:
        fn_name = tool_call["name"]
        fn_args = tool_call["args"]

        # Gọi hàm thật
        if fn_name == "add_numbers":
            result = add_numbers(**fn_args)

            # Gửi lại kết quả vào hội thoại
            final_response = chat.send_message(f"Kết quả là: {result}")
            print(f"✅ Gemini phản hồi: {final_response.text}")
else:
    print("❌ Gemini không gọi tool. Phản hồi:")
    print(response.text)
