from AnalyzeOnRoadForMultiThreading import AnalyzeOnRoadForMultiThreading
import threading
import time

def main():
    object = AnalyzeOnRoadForMultiThreading()
    object.process()
    
    
#***************************************************  Code for testing script  *********************************************************************#
              
if __name__ == '__main__':
    t = threading.Thread(target= main, daemon= True)
    t.start()
    
    
    
    while True:
        print('xin chào lúc: ', time.strftime('%H:%M:%S'))
        time.sleep(2.5)
        
        
    t.join()