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


class ChatLLM:
    def __init__(self):
        # --- Bước 1: Tải API Key từ file .env ---
        # Đảm bảo bạn đã có file .env với nội dung: GOOGLE_API_KEY="your_key"
        load_dotenv() 

        # Kiểm tra xem API key đã được tải thành công chưa
        if os.getenv("GOOGLE_API_KEY") is None:
            raise ValueError("GOOGLE_API_KEY không được tìm thấy. Vui lòng kiểm tra file .env của bạn.")

        # --- Bước 2: Khởi tạo mô hình Gemini ---
        # Chúng ta sẽ sử dụng mô hình gemini-1.5-flash-latest, bạn có thể thay đổi
        # 'temperature' để điều chỉnh mức độ sáng tạo của mô hình (0.0 = chặt chẽ, 1.0 = sáng tạo)
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.5)

        # --- Bước 3: Tạo Prompt Template với phần hướng dẫn (system prompt) ---
        # Đây là nơi bạn "dạy" cho AI cách hành xử và thêm các hướng dẫn đặc biệt.
        # `MessagesPlaceholder` là một biến đặc biệt sẽ chứa lịch sử trò chuyện từ Memory.
        self.prompt = ChatPromptTemplate(
                    messages=[
                        SystemMessagePromptTemplate.from_template(
                            "Bạn là một trợ lý AI hữu ích và thân thiện. Hãy trả lời câu hỏi của người dùng một cách ngắn gọn và chính xác."
                        ),
                        # Biến `history` sẽ được `ConversationBufferMemory` tự động quản lý.
                        MessagesPlaceholder(variable_name="history"),
                        HumanMessagePromptTemplate.from_template("{input}"),
                    ]
                )

        # --- Bước 4: Khởi tạo bộ nhớ (Memory) ---
        # `ConversationBufferMemory` sẽ lưu trữ các tin nhắn.
        # `return_messages=True` để nó trả về dưới dạng một danh sách các đối tượng tin nhắn,
        # phù hợp với `MessagesPlaceholder`.
        self.memory = ConversationBufferMemory(memory_key="history", return_messages=True)

        # --- Bước 5: Tạo chuỗi hội thoại (Conversation Chain) ---
        # Kết hợp LLM, Memory, và Prompt lại với nhau.
        # `verbose=True` sẽ in ra các bước xử lý của chain, giúp bạn dễ dàng gỡ lỗi.
        self.conversation_chain = ConversationChain(llm=self.llm, memory=self.memory, prompt=self.prompt, verbose=False)
    def chat(self, user_input):
        """
        Hàm để gửi tin nhắn từ người dùng và nhận phản hồi từ mô hình AI.
        """
        response = self.conversation_chain.invoke({"input": user_input})
        return response['response']
# # --- Bước 6: Chạy thử nghiệm ---
# print("--- Bắt đầu cuộc trò chuyện ---")

# # Câu hỏi đầu tiên
# response1 = conversation_chain.invoke({"input": "Chào bạn, tôi tên là Nam."})
# print("AI:", response1['response'])

# # Câu hỏi thứ hai, AI sẽ nhớ tên từ câu trước
# response2 = conversation_chain.invoke({"input": "Bạn có biết tên của tôi là gì không?"})
# print("AI:", response2['response'])

# # Câu hỏi tiếp theo
# response3 = conversation_chain.invoke({"input": "Thủ đô của Việt Nam là gì?"})
# print("AI:", response3['response'])

# print("\n--- Lịch sử trò chuyện đã được lưu trong memory ---")
# print(conversation_chain.memory.buffer)

# --- Bước 6: Tạo đối tượng ChatLLM ---
# chat_llm = ChatLLM()
# while True:
#     user_input = input("Bạn: ")
#     if user_input.lower() in ["exit", "quit", "bye"]:
#         print("Kết thúc cuộc trò chuyện. Tạm biệt!")
#         break
#     response = chat_llm.chat(user_input)
#     print("AI:", response)
    # print("\n--- Lịch sử trò chuyện đã được cập nhật ---")
    # print(chat_llm.memory.buffer)