import os
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
)

system_prompt = """BẠN LÀ TRỢ LÝ AI TƯ VẤN GIAO THÔNG THÔNG MINH.

NHIỆM VỤ CHÍNH:
- Phân tích câu hỏi của người dùng để hiểu ý định cụ thể
- Nếu hỏi thông tin về tuyến đường nào đó thì buộc phải đưa đầy đủ thông tin về số lượng và tốc độ của oto lẫn xe máy
- Đưa ra lời khuyên và phân tích dựa trên dữ liệu giao thông 

NGUYÊN TẮC PHÂN LOẠI:
   - Nhiều xe + vận tốc < 12 km/h → Ùn tắc
   - Nhiều xe + vận tốc 12-30 km/h → Đông
   - Vận tốc >= 30 km/h → Thông thoáng
   - Ít xe + vận tốc thấp → Chậm nhưng không tắc
"""

# code lại phần chain thay vì dùng built-in conversation chain thì tự custom chain riêng
# Giúp quản lý luồng tốt hơn, bao quát hơn và dễ tích hợp thêm agent hoặc toolcalling
# Đổi lại là việc bất tiện hơn trong việc lưu context (lịch sử và ngữ cảnh) cho chain

class ChatBot:
    def __init__(self):
        # --- Tải API Key từ file .env ---
        load_dotenv()

        if os.getenv("GOOGLE_API_KEY") is None:
            raise ValueError("GOOGLE_API_KEY không được tìm thấy. Vui lòng kiểm tra file .env của bạn.")

        # 'temperature' để điều chỉnh mức độ sáng tạo của mô hình (0.0 = chặt chẽ, 1.0 = sáng tạo)
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0.6)

        # --- Khởi tạo bộ nhớ (Memory) ---
        # Này chỉ là thuộc tính giúp lưu lại context, phải tự save và load thủ công để lấy và đưa vào chain
        self.memory = ConversationBufferMemory(memory_key= "history", return_messages= True)

        # --- Tạo Prompt Template với phần hướng dẫn (system prompt) ---
        # `MessagesPlaceholder` là một biến đặc biệt sẽ chứa lịch sử trò chuyện từ Memory.
        self.prompt = ChatPromptTemplate(
                    messages=[
                        SystemMessagePromptTemplate.from_template(system_prompt),
                        # Biến `history` sẽ được `ConversationBufferMemory` tự động quản lý.
                        MessagesPlaceholder(variable_name="history"),
                        HumanMessagePromptTemplate.from_template("{input}"),
                    ]
                )
        
        # --- Tạo chuỗi hội thoại (Conversation Chain) ---
        # Kết hợp LLM, Memory, và Prompt lại với nhau.
        self.conversation_chain = self.prompt | self.llm
    def chat(self, user_input):
        """Hàm để gửi tin nhắn từ người dùng và nhận phản hồi từ mô hình AI."""
        # chain được build gồm prompt --> llm mà prompt gồm "history" và "input" nên
        # chain đầu vào là một dict có các key là "input" và "history"
        input_for_chain = {
            "input": user_input,
            "history": self.memory.load_memory_variables({})['history'] # Load ra history
        }
        response = self.conversation_chain.invoke(input= input_for_chain)
        # Do tự handel chain nên việc quản lý memory phải tự handel thủ công lại
        # Lưu context cho memory
        self.memory.save_context(inputs= {"input": user_input}, outputs= {'output': response.content})
        return response.content


# # --- Tạo đối tượng ChatLLM --- for testing
# chat_llm = ChatBot()
# while True:
#     user_input = input("Bạn: ")
#     if user_input.lower() in ["exit", "quit", "bye"]:
#         print("Kết thúc cuộc trò chuyện. Tạm biệt!")
#         break
#     response = chat_llm.chat(user_input)
#     print("AI:", response)
#     # print("\n--- Lịch sử trò chuyện đã được cập nhật ---")
#     # print(chat_llm.memory.buffer)
#     print("-" * 100)
    
    
    