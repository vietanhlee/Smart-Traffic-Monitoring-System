import os
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
)

promt = """
Bạn là một trợ lý AI chuyên hỗ trợ người dùng tra cứu và tư vấn tình trạng giao thông theo từng tuyến đường hoặc khu vực.

Dữ liệu bạn có thể được cung cấp bao gồm:
- Số lượng phương tiện (ô tô, xe máy, v.v.)
- Vận tốc trung bình của từng loại phương tiện
- Dữ liệu này được cập nhật theo thời gian thực từ hệ thống giám sát.

Khi người dùng gửi câu hỏi (ví dụ:"Cho tôi tình hình các tuyến đường hiện tại", 
"Đường Nguyễn Trãi hôm nay thế nào?", "Tình trạng giao thông khu vực Hà Đông"), bạn sẽ:
1. Phân tích dữ liệu đã được cung cấp (số xe, vận tốc, v.v.)
2. Trả lời trực tiếp theo định dạng chuẩn sau:

Ví dụ:
- Tuyến Nguyễn Trãi: 10 ô tô, 15 xe máy. Vận tốc trung bình: 18 km/h → Đang hơi đông. Ước tính thời gian di chuyển: 12 phút.
- Tuyến Trần Phú: 7 ô tô, 10 xe máy. Vận tốc trung bình: 25 km/h → Lưu thông bình thường.
- Tuyến Láng Hạ: 20 ô tô. Vận tốc trung bình: 8 km/h → Ùn tắc nghiêm trọng.

Nguyên tắc đánh giá tình trạng:
1. Nhiều xe, vận tốc < 15 km/h → Ùn tắc
2. Nhiều xe, vận tốc >= 15 km/h → Đông, nhưng lưu thông được
3. Vận tốc >= 30 km/h → Thông thoáng
4. Ít xe nhưng vận tốc thấp → Chậm nhưng không tắc

Sau phần trả lời, bạn có thể tương tác thêm với người dùng, ví dụ:
- “Bạn muốn xem thêm chi tiết tuyến nào không?”
- “Bạn có muốn tôi gợi ý tuyến đường nhanh nhất đến Cầu Giấy?”
- “Bạn đang trên đường đi đâu để tôi hỗ trợ chỉ đường?”
- "Tôi biết khá nhiều món ăn trên từng tuyến đường, bạn có muốn tôi liệt kê không"

Yêu cầu về ngôn ngữ:
- Trả lời ngắn gọn, rõ ràng, chuyên nghiệp và thân thiện.
- Không chào hỏi dài dòng.
- Nếu người dùng chưa hỏi thông tin tổng quát về các tuyến đường thì câu trả lời không cần liệt thêm vào
- Không đưa thông tin không có sẵn.
- Nếu không có dữ liệu → nói: “Hiện tại chưa có dữ liệu cho tuyến đường này.”
- Nếu bị hỏi về tương lai (VD: 5h chiều) → nói: “Tôi chỉ hỗ trợ dữ liệu thời gian thực, chưa thể dự báo giao thông tương lai.”
"""


class ChatBot:
    def __init__(self):
        # --- Tải API Key từ file .env ---
        load_dotenv() 

        if os.getenv("GOOGLE_API_KEY") is None:
            raise ValueError("GOOGLE_API_KEY không được tìm thấy. Vui lòng kiểm tra file .env của bạn.")

        # 'temperature' để điều chỉnh mức độ sáng tạo của mô hình (0.0 = chặt chẽ, 1.0 = sáng tạo)
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.9)

        # --- Tạo Prompt Template với phần hướng dẫn (system prompt) ---
        # `MessagesPlaceholder` là một biến đặc biệt sẽ chứa lịch sử trò chuyện từ Memory.
        self.prompt = ChatPromptTemplate(
                    messages=[
                        SystemMessagePromptTemplate.from_template(promt),
                        # Biến `history` sẽ được `ConversationBufferMemory` tự động quản lý.
                        MessagesPlaceholder(variable_name="history"),
                        HumanMessagePromptTemplate.from_template("{input}"),
                    ]
                )

        # --- Khởi tạo bộ nhớ (Memory) ---
        # `ConversationBufferMemory` sẽ lưu trữ các tin nhắn.
        # `return_messages=True` để nó trả về dưới dạng một danh sách các đối tượng tin nhắn,
        # phù hợp với `MessagesPlaceholder`.
        self.memory = ConversationBufferMemory(memory_key= "history", return_messages= True)

        # --- Tạo chuỗi hội thoại (Conversation Chain) ---
        # Kết hợp LLM, Memory, và Prompt lại với nhau.
        # `verbose=True` sẽ in ra các bước xử lý của chain, giúp bạn dễ dàng gỡ lỗi.
        self.conversation_chain = ConversationChain(llm= self.llm,
                                                    memory= self.memory,
                                                    prompt= self.prompt,
                                                    verbose= False)
    def chat(self, user_input):
        """Hàm để gửi tin nhắn từ người dùng và nhận phản hồi từ mô hình AI."""
        response = self.conversation_chain.invoke({"input": user_input})
        return response['response']

# print("\n--- Lịch sử trò chuyện đã được lưu trong memory ---")
# print(conversation_chain.memory.buffer)

# --- Tạo đối tượng ChatLLM ---
# chat_llm = ChatBot()
# while True:
#     user_input = input("Bạn: ")
#     if user_input.lower() in ["exit", "quit", "bye"]:
#         print("Kết thúc cuộc trò chuyện. Tạm biệt!")
#         break
#     response = chat_llm.chat(user_input)
#     print("AI:", response)
    # print("\n--- Lịch sử trò chuyện đã được cập nhật ---")
    # print(chat_llm.memory.buffer)