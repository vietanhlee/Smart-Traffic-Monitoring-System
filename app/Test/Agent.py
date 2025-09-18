from langgraph.prebuilt import create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()
class Agent():
    def __init__(self) -> None:
        self.llm = ChatGoogleGenerativeAI(model= 'gemini-2.5-flash')
        self.agent = create_react_agent(model= self.llm, tools=[])
    def chat(message : str):
        
    