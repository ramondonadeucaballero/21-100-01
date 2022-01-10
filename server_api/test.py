import time
import serial
from serial import Serial
import nidaqmx
import os
import threading

ser = serial.Serial('COM3', 9600)
here = os.path.dirname(os.path.abspath(__file__))

# ============ QR READER FUNCITON ====================
# Reads the data from QR reader and stores it in a Queue

def readQR():
    data = ser.readline()
    data = data.split(b"\n")[0].decode()
    f= open(os.path.join(here, 'QRtest.txt'), 'w')
    f.write(str(data))
    f.close()
                
# ============ ESD READER FUNCITON ====================
# Data is read from the USB-6000.
# The ESDconfig file declares how many readings are done, and the time intervals between them.
def readESD(detectTask):
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
        
# ============ Piece Detection Function ====================
# Loops waiting for a detection signal, and then calls ReadESD() and StoreData() functions.
# Once the value is read, the program awaits for the detection sensor to stop giving signal
def pieceDetection():
    global detected

    detectTask = nidaqmx.Task("Detect")
    detectTask.ai_channels.add_ai_voltage_chan("Dev1/ai3,Dev1/ai5")

    detectTask.start()
    leido = False
    while True and not leido:
        time.sleep(0.5)
        read = detectTask.read()
        if(read[0] > 5):
            readESD(detectTask)
            leido=True

    detectTask.close()
    
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
    readQRThread = threading.Thread(target=readQR)
    readQRThread.start()
    detectionThread = threading.Thread(target=pieceDetection)
    detectionThread.start()
    
    
