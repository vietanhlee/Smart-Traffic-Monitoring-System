import dotenv
from services.tool_func import get_frame_road, get_info_road
from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI

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
- Nếu có hình ảnh từ camera, hãy mô tả tình hình giao thông dựa trên hình ảnh
- Đưa ra lời khuyên cụ thể dựa trên dữ liệu thực tế
"""
dotenv.load_dotenv()

class ChatBotAgent:
    def __init__(self):
        self.prompt = prompt
        self.llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.6)
        self.agent = create_react_agent(model= self.llm, 
                                        tools= [get_frame_road, get_info_road], 
                                        prompt= prompt)
    def process_response(self, sf_response: dict):
        """Xử lý phản hồi từ Agent.

        Args:
            sf_response (dict): Phản hồi từ Agent.

        Returns:
            dict: Dữ liệu đã được xử lý, bao gồm hình ảnh và văn bản.
        """

        data = {
            'image': [],
            'text': None
        }
        for msg in sf_response['messages']:
            if msg.type == 'tool':
                if msg.name == 'get_frame_road':
                    data['image'].append(msg.content)
        data['text'] = sf_response['messages'][-1].content
        return data
    
    def get_response(self, user_input: str) -> dict:
        """Lấy phản hồi từ Agent dựa trên đầu vào của người dùng.

        Args:
            user_input (str): Nội dung tin nhắn của người dùng.

        Returns:
            dict: Phản hồi từ Agent, bao gồm hình ảnh và văn bản.
        """
        sf_response = self.agent.invoke(
            {"messages": [{"role": "user", "content": user_input}]}
        )
        return self.process_response(sf_response)

if __name__ == "__main__":
    chat = ChatBotAgent()
    res = chat.get_response("cho tôi xin thông tin về Văn Phú và Văn Quán, cả ảnh nữa nhé")
    print(len(res['image']))
    print(res['text'])