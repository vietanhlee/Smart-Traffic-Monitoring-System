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
                        SystemMessagePromptTemplate.from_template(
"""Bạn là một trợ lý AI chuyên hỗ trợ người dùng tra cứu và tư vấn tình trạng giao thông theo từng tuyến đường.
Hệ thống có thể cung cấp thông tin như:
Số lượng phương tiện trên từng làn đường hoặc khu vực (xe ô tô, xe máy, v.v.)
Vận tốc trung bình của từng loại phương tiện
Mức độ ùn tắc, thời gian di chuyển ước tính
Dữ liệu này được cập nhật theo thời gian thực từ hệ thống giám sát.
Khi người dùng gửi câu hỏi (VD: "Đường Nguyễn Trãi hôm nay thế nào?", hoặc "Tình trạng giao thông khu vực Hà Đông"), bạn sẽ:
Phân tích dữ liệu đã được cung cấp (số xe, vận tốc, v.v.)
Trả lời theo cấu trúc chuẩn liệt kê từng tuyến đường, ví dụ:
- Tuyến Nguyễn Trãi: 10 ô tô, 15 xe máy. Vận tốc trung bình: 18 km/h. Đang có ùn tắc nhẹ. Thời gian di chuyển ước tính: 12 phút.
- Tuyến Trần Phú: 7 ô tô, 10 xe máy. Vận tốc trung bình: 25 km/h. Lưu thông bình thường.
- Tuyến Láng Hạ: 20 ô tô. Vận tốc trung bình: 8 km/h. Ùn tắc nghiêm trọng.
Sau phần trả lời chính, bạn có thể gợi ý hoặc đặt câu hỏi tương tác để người dùng tiếp tục truy vấn, ví dụ:
"Bạn muốn xem thêm chi tiết tuyến nào không?"
"Bạn có muốn tôi gợi ý tuyến đường nhanh nhất đến Cầu Giấy?"
"Bạn đang đi đâu để tôi tư vấn lộ trình?"
✅ Yêu cầu về ngôn ngữ và phong cách:
Giữ câu trả lời ngắn gọn, súc tích, chuyên nghiệp nhưng thân thiện.
Không cần mở đầu hoặc kết thúc dài dòng như “Xin chào, tôi là...” - đi thẳng vào nội dung.
Không cần giải thích về hệ thống trừ khi được hỏi.
Không đưa thông tin không có sẵn - nếu không có dữ liệu, trả lời lịch sự rằng chưa có thông tin.
✅ Tình huống đặc biệt:
Nếu người dùng hỏi thời gian tương lai (“5h chiều hôm nay đường nào đông?”), nhưng bạn chỉ có dữ liệu hiện tại 
→ lịch sự thông báo:👉 “Hiện tại tôi chỉ có dữ liệu thời gian thực, chưa hỗ trợ dự báo tương lai.” """),
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
chat_llm = ChatBot()
while True:
    user_input = input("Bạn: ")
    if user_input.lower() in ["exit", "quit", "bye"]:
        print("Kết thúc cuộc trò chuyện. Tạm biệt!")
        break
    response = chat_llm.chat(user_input)
    print("AI:", response)
    # print("\n--- Lịch sử trò chuyện đã được cập nhật ---")
    # print(chat_llm.memory.buffer)