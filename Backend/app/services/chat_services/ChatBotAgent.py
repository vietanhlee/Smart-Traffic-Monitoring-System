import dotenv
from services.chat_services.tool_func import get_frame_road, get_info_road
from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.memory import InMemorySaver
from schemas.ChatResponse import ChatResponse
from utils.chatbot_utils import pre_model_hook


prompt = """BẠN LÀ TRỢ LÝ AI TƯ VẤN GIAO THÔNG THÔNG MINH.
NHIỆM VỤ CHÍNH:
- Phân tích câu hỏi của người dùng để hiểu ý định cụ thể
- Nếu hỏi thông tin về tuyến đường nào đó thì buộc phải đưa đầy đủ thông tin về số lượng và tốc độ của oto lẫn xe máy
- Đưa ra lời khuyên và phân tích dựa trên dữ liệu giao thông 
- Khi cần thiết, sử dụng tools để lấy thông tin và hình ảnh thực tế
NGUYÊN TẮC PHÂN LOẠI:
   - Nhiều xe + vận tốc < 12 km/h → Ùn tắc
   - Nhiều xe + vận tốc 12-30 km/h → Đông
   - Vận tốc >= 30 km/h → Thông thoáng
   - Ít xe + vận tốc thấp → Chậm nhưng không tắc
KHI TRẢ LỜI:
- Luôn cung cấp thông tin chi tiết và chính xác
- Đưa ra lời khuyên cụ thể dựa trên dữ liệu thực tế, có thể hỏi vài câu quan tâm như là đi ăn, đi chơi, đi làm ...
"""

dotenv.load_dotenv()

class ChatBotAgent:
    def __init__(self):
        self.prompt = prompt
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash",
                                          temperature=0.6)
        self.checkpointer = InMemorySaver()
        self.agent = create_react_agent(model= self.llm, 
                                        tools= [get_frame_road, get_info_road], 
                                        prompt= prompt,
                                        response_format= ChatResponse,
                                        pre_model_hook= pre_model_hook,
                                        checkpointer= self.checkpointer)


    async def get_response(self, user_input: str, id: int) -> dict:
        """Lấy phản hồi từ Agent dựa trên đầu vào của người dùng.

        Args:
            user_input (str): Nội dung tin nhắn của người dùng.

        Returns:
            dict: Phản hồi từ Agent, bao gồm hình ảnh và văn bản.
        """
        
        
        config = {"configurable": {"thread_id": f"{id}"}}
        response = await self.agent.ainvoke(
            {"messages": [{"role": "user", "content": user_input}]},
            config
        )
        return response['structured_response'].model_dump()


# ************ TESTING ************
if __name__ == "__main__":
    chat = ChatBotAgent()
    res = chat.get_response("cho tôi xin thông tin về Văn Phú và Văn Quán, cả ảnh nữa nhé", id= 1)
    print(len(res['image']))
    print(res['message'])