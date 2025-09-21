from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv
from tools import get_frame_road, get_info_road

load_dotenv()


class AgentReact:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(model='gemini-2.5-flash')
        self.agent = create_react_agent(model=self.llm, tools=[get_info_road, get_frame_road])

    def chat(self, message: str):
        # LangGraph agents expect a dict input. Use message list format.
        result = self.agent.invoke({"messages": [HumanMessage(content=message)]})
        messages = result.get("messages", []) if isinstance(result, dict) else []
        if messages:
            last = messages
            try:
                return last.content
            except AttributeError:
                return str(last)
        return str(result)

        # Script test cho AgentReact
if __name__ == "__main__":
    agent = AgentReact()
    while True:
        user_input = input("Bạn: ")
        if user_input.lower() in ["exit", "quit"]:
            break
        try:
            response = agent.chat(user_input)
            print("Agent:", response)
        except Exception as e:
            print("Lỗi:", e)
