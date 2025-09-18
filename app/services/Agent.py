from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from .tools import get_frame_road
import os

load_dotenv()

class Agent():
    def __init__(self) -> None:
        # Check if Google API key is set
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key or api_key == "your_google_api_key_here":
            raise ValueError(
                "GOOGLE_API_KEY not found or not set. Please set your Google API key in the .env file. "
                "You can get an API key from https://makersuite.google.com/app/apikey"
            )
            
        self.llm = ChatGoogleGenerativeAI(model= 'gemini-2.5-flash')
        # Include the tools in the agent
        self.agent = create_react_agent(model= self.llm, tools=[get_frame_road])
    def chat(self, message: str):
        """Chat with the agent and return the response"""
        try:
            # Invoke the agent with the message
            result = self.agent.invoke({"messages": [message]})
            
            # Extract the response from the agent's output
            if "messages" in result and len(result["messages"]) > 0:
                # Get the last message (the agent's response)
                response = result["messages"][-1].content
                return {"response": response}
            else:
                return {"response": "Xin lỗi, tôi không thể xử lý tin nhắn của bạn lúc này."}
                
        except Exception as e:
            print(f"Error in Agent.chat: {e}")
            return {"response": f"Đã xảy ra lỗi: {str(e)}"}