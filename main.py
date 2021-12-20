from os import close, read
from random import randint
import time
import serial
from serial import Serial
from influxdb import InfluxDBClient
import threading
from threading import Lock
import nidaqmx
from queue import Queue

# ============= TESTING VALUES ==============
detected = True
daqConnected = False
detectionConnected = False


# ============= SERIAL VALUES ===============
client = InfluxDBClient(host='localhost',port=8086, username='admin', password='P12345wd!', database='Lear')

ser = serial.Serial('COM3', 9600)

# ============ GLOBAL VALUES ================
QRList = Queue()
ESDList = Queue()
readTimes = []
machineName = ""
QRListLock = Lock()


# ============ QR READER FUNCITON ====================
# Reads the data from QR reader and stores it in a Queue

def readQR():
    global QRList
    global QRListLock
    global stopThreads
    #Sotres the las QR read to avoid repeated lecutres
    lastdata=-1
    #Value for testing, allows a repeat QR to be read.
    repeat = True
    while True and not stopThreads:
        time.sleep(2)
        data = ser.readline()    
        data = data.split(b"\n")[0]
        if(data != "ERROR\n"):
            if(data!=lastdata or repeat):
                lastdata=data
                QRListLock.acquire()
                QRList.put(data)
                QRListLock.release()
    
    
# ============ ESD READER FUNCITON ====================
# Data is read from the USB-6000. 
# The ESDconfig file declares how many readings are done, and the time intervals between them.
def readESD():
    global readTimes
    
    if daqConnected:
        ESDTask = nidaqmx.Task()

        ESDTask.ai_channels.add_ai_voltage_chan("Dev1/ai5")

        ESDTask.start()
        value=0
        for timeValue in readTimes:
            time.sleep(float(timeValue)) 
            read = ESDTask.read()
            value = value + read
            
        
        value = value / len(readTimes)
        ESDList.put(value)
        
        ESDTask.stop()
        ESDTask.close()
    
    else:
        ESDList.put(randint(10000, 50000)/10000)
    
# ============ Store Data Function ====================
# An ESD Value and a QRcode are taken, joined into a json and uploaded to the DB
def storeData():
    global QRListLock
    global QRList
    valueQR = ""
    if(QRList.qsize() != 0):  
        QRListLock.acquire()
        valueQR=QRList.get()
        QRListLock.release() 
        valueESD=ESDList.get()
        json = []
        data = {
            "measurement": "Estatica",
            "tags": {
                "Line": machineName
            },
            "fields":{
                "Estatica": (valueESD-1)*100, 
                "QRCode": valueQR,
                "Temp": 20,
                "Hum": 60,
            }
        }
        json.append(data)
        client.write_points(json)   
    
    
# ============ Piece Detection Function ====================
# Loops waiting for a detection signal, and then calls ReadESD() and StoreData() functions.
# Once the value is read, the program awaits for the detection sensor to stop giving signal
def pieceDetection():
    global detected   
    
    if(not detectionConnected):
        while True and not stopThreads:
            time.sleep(1.1)
            if(detected):
                start = time.time()
                readESD()
                
                storeData()
                
    else:
        detectTask = nidaqmx.Task()
        detectTask.ai_channels.add_ai_voltage_chan("Dev1/aiX")

        detectTask.start() 
        while True and not stopThreads:
            read = detectTask.read() 
            if(read > 5):
                readESD()
                storeData() 
                while read > 5:
                    time.sleep(0.5) 
                    read = detectTask.read()
                    
    
                
        
# ============ Load Configuration ====================
# Reads the configuration file and then it's loaded into the script
def loadConf():
    global readTimes
    global machineName
    
    file = open("ESDconfig.txt","r")
    config=(file.read())
    config=config.split(":")
    machineName = config[0]
    del config[0]
    readTimes=config
    file.close()
    
# ============ Stop Script ====================
# Checks if the script must stop.
def check_stop():
    file = open("stop.txt","r")
    closed=(file.read())
    
    file.close()
    return closed  


# ====================== Main ======================     
if __name__ == '__main__':
    stopThreads = False
    loadConf()
        
    readQRThread = threading.Thread(target=readQR)
    readQRThread.start() 
    
    detectionThread = threading.Thread(target=pieceDetection)
    detectionThread.start()
    
    while check_stop() == "False":
       time.sleep(1) 
       
    client.close()
    stopThreads = True
    detectionThread.join()
    readQRThread.join()
    
     