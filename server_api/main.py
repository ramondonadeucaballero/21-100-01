import os
from os import close, read
from platform import machine
from random import randint
from sys import stdout
import time
from influxdb.resultset import ResultSet
import serial
from serial import Serial
from influxdb import InfluxDBClient
import threading
from threading import Lock
import nidaqmx
from queue import Queue
import numpy as np

here = os.path.dirname(os.path.abspath(__file__))


# ============= TESTING VALUES ==============
detected = True
daqConnected = True
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
def readESD(detectTask):
    global readTimes

    if daqConnected:
        value=0
        for timeValue in readTimes:
            time.sleep(float(timeValue))
            read = detectTask.read()
            print(read)
            value = value + read[1]


        value = value / len(readTimes)
        value=(value-3)*200
        ESDList.put(value)

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
                "Estatica": (valueESD),
                "QRCode": valueQR,
                "Temp": 20,
                "Hum": 60,
            }
        }
        json.append(data)
        client.write_points(json)

# ============ CPK Function ====================
def cpk():
    while True and not stopThreads:
        time.sleep(10)
        USL = 100
        LSL = -100

        query = 'SELECT Estatica FROM Estatica WHERE time > now() - 1d AND Line=\''+machineName+'\''
        result = client.query(query)
        if(len(result)):
            data_list=[]
            for measurement in result.get_points(measurement="Estatica"):
                data_list.append(measurement["Estatica"])

            standard_deviation = np.std(data_list)

            cpl = (np.mean(data_list)-LSL)/(3*standard_deviation)
            cpu=(USL-np.mean(data_list))/(3*standard_deviation)

            cpk=(min(cpl,cpu))
            json = []
            data = {
                "measurement": "CPK",
                "tags": {
                    "Line": machineName
                },
                "fields":{
                    "cpk": cpk
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
        detectTask = nidaqmx.Task("Detect")
        detectTask.ai_channels.add_ai_voltage_chan("Dev1/ai3,Dev1/ai5")

        detectTask.start()
        while True and not stopThreads:

            time.sleep(1.1)
            if(detected):
                start = time.time()
                readESD()

                storeData()

    else:
        detectTask = nidaqmx.Task("Detect")
        detectTask.ai_channels.add_ai_voltage_chan("Dev1/ai3,Dev1/ai5")

        detectTask.start()
        while True and not stopThreads:
            time.sleep(0.5)
            read = detectTask.read()
            print(read)
            if(read[0] > 5):
                readESD(detectTask)
                storeData()
                while read[0] > 5:
                    time.sleep(0.5)
                    read = detectTask.read()

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

# ============ Stop Script ====================
# Checks if the script must stop.
def check_stop():
    file = open(os.path.join(here, "stop.txt"))
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
    cpkThread = threading.Thread(target=cpk)
    cpkThread.start()

    while check_stop() == "False":
       time.sleep(1)

    client.close()
    stopThreads = True
    detectionThread.join()
    readQRThread.join()
    cpkThread.join()

