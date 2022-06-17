from socket import timeout
from tabnanny import check
import time
import serial
from serial import Serial
import nidaqmx
import os
import threading
from sys import stdout

ser = serial.Serial('COM3', 9600, timeout=10)
    
ESD = False
QR = False
here = os.path.dirname(os.path.abspath(__file__))

# ============ Stop Script ====================
# Checks if the script must stop.
def check_stop() :
    file = open(os.path.join(here, "running.txt"))
    closed=(file.read())
    file.close()
    stdout.flush()
    if(ESD and QR):
        print("done")
        return "False"
        
    return closed

# ============ QR READER FUNCITON ====================
# Reads the data from QR reader and stores it in a Queue

def readQR():
    global QR
    print("read QR")
    data = ser.readline()
    print("read Finished")
    data = data.split(b"\n")[0].decode()    
    print(data)
    if(data != ""):
        print("Entra?")
        f= open(os.path.join(here, 'QRtest.txt'), 'w')
        f.write(str(data))
        f.close()
    ser.close()
    QR=True
                
# ============ ESD READER FUNCITON ====================
# Data is read from the USB-6000.
# The ESDconfig file declares how many readings are done, and the time intervals between them.
def readESD(detectTask):
    global ESD
    global readTimes    
    f= open(os.path.join(here, 'ESDtest.txt'),'w')
    writing=""
    value=0
    for timeValue in readTimes:
        time.sleep(float(timeValue))
        read = detectTask.read()
        writing = writing+str((read[1]-3)*200)+":"
        value = value + read[1]

    value = value / len(readTimes)
    value=(value-3)*200
    f.write(writing[:len(writing)-1])
    f.close()
    ESD = True
        
# ============ Piece Detection Function ====================
# Loops waiting for a detection signal, and then calls ReadESD() and StoreData() functions.
# Once the value is read, the program awaits for the detection sensor to stop giving signal
def pieceDetection():
    global detected

    detectTask = nidaqmx.Task("Detect")
    detectTask.ai_channels.add_ai_voltage_chan("Dev1/ai3,Dev1/ai5")

    detectTask.start()
    leido = False
    while True and not leido and check_stop() == "Test":
        read = detectTask.read()
        if(read[0] > 5):      
            ser.flushInput()     
            readQRThread = threading.Thread(target=readQR)
            readQRThread.start()   
            readESD(detectTask)  
            print("Leido")
            leido=True

    detectTask.close()
    print("Closed")
    
# ============ Load Configuration ====================
# Reads the configuration file and then it's loaded into the script
def loadConf():

    global readTimes
    global machineName

    file = open(os.path.join(here, 'ESDconfig.txt'))

    config=(file.read())
    config=config.split(":")
    machineName = config[0]
    del config[0]
    readTimes=config

    file.close()
    
# ====================== Main ======================
if __name__ == '__main__':
    stopThreads = False
    loadConf()
    detectionThread = threading.Thread(target=pieceDetection)
    detectionThread.start()    
    while check_stop()  == "Test":
       time.sleep(1)
    
    
    f= open(os.path.join(here, 'running.txt'),'w') 
    f.write("False")
    f.close()
    ser.close()
    
