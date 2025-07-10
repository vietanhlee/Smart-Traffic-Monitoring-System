from services.AnalyzeOnRoadForMultiProcessing import AnalyzeOnRoadForMultiprocessing
from services.ChatBot import ChatLLM
analyzer = AnalyzeOnRoadForMultiprocessing(show= False,
                                           show_log= False,
                                           is_join_processes= False)
chat_bot = ChatLLM()

# analyzer = None
# chat_bot = None

