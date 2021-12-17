from os import close, read
import time
import serial
from serial import Serial
from influxdb import InfluxDBClient
import threading
from threading import Lock
import nidaqmx

client = InfluxDBClient(host='localhost',port=8086, username='admin', password='P12345wd!', database='Lear')

ser = serial.Serial('COM3', 9600)

QRList = []
readTimes = []
machineName = ""
detected = True


# ============ QR READER FUNCITON ====================
# Reads the data from QR reader and stores it in a Queue

def readQR():
    global QRList
    #Sotres the las QR read to avoid repeated lecutres
    lastdata=-1
    #Value for testing, allows a repeat QR to be read.
    repeat = False
    while True:
        data = ser.readline()    
        data = data.split(b"\n")[0]
        if(data != "ERROR\n"):
            if(data!=lastdata or repeat):
                lastdata=data
                Lock.acquire()
                QRList.append(data)
                Lock.release()
                print(data)

# ============ ESD READER FUNCITON ====================
# Data is read from the USB-6000. 
# The ESDconfig file declares how many readings are done, and the time intervals between them.
def readESD():
    global readTimes
    
    task = nidaqmx.Task()

    task.ai_channels.add_ai_voltage_chan("Dev1/ai5")

    task.start()
    value=0
    for timeValue in readTimes:
        time.sleep(float(timeValue)) 
        value = value + task.read()
    
    value = value / len(readTimes)
    
    task.stop()
    task.close()
    
    return value
    
def pieceDetection():
    global detected
    while True:
        if(detected):
            valueESD=readESD()
            print()
        
 

  
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

def testingConcurrency():
    while True:
        print(QRList)
        time.sleep(1)   
                
if __name__ == '__main__':

    loadConf()
    QRListLock = Lock()
    pieceDetection()
    
    # readQRThread = threading.Thread(target=readQR)
    # testThread = threading.Thread(target=testingConcurrency)

    # readQRThread.start()    
    # testThread.start()