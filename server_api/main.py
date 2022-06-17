from ast import Store
from json import load
import os
from os import close, read
from platform import machine
from random import randint
from sys import stdout
import time
import traceback
from xml.etree.ElementTree import tostring
from influxdb.resultset import ResultSet
from rx import catch
import serial
from serial import Serial
import threading
from threading import Lock
import nidaqmx
from queue import Queue
import numpy as np
from dotenv import load_dotenv
import tracemalloc

tracemalloc.start()


load_dotenv()

here = os.path.dirname(os.path.abspath(__file__))


# ============= TESTING VALUES ==============

daqConnected = True
detectionConnected = True


# ============= SERIAL VALUES ===============
from datetime import datetime

from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

# You can generate a Token from the "Tokens Tab" in the UI
from datetime import datetime

from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

# You can generate a Token from the "Tokens Tab" in the UI
token = os.getenv('ADMIN_TOKEN')
org = os.getenv('ORG')
bucket = os.getenv('BUCKET')

print(token)
print(org)
print(bucket)

client = InfluxDBClient(url="http://localhost:8086", token=token)
ser = serial.Serial('COM3', 9600, timeout = 5)

write_api = client.write_api(write_options=SYNCHRONOUS)
query_api = client.query_api()

# ============ GLOBAL VALUES ================
QRValue = b""
ESDValue = None
readTimes = []
machineName = ""
QRValueLock = Lock()
ESDValueLock = Lock()
StoreLock = Lock()


# ============ QR READER FUNCITON ====================
# Reads the data from QR reader and stores it in a Queue

def readQR():
    global QRValue
    global QRValueLock
    global stopThreads
    global StoreLock
    global ESDValue
    
    print("ESD DESDE QR INICIO: " + str(ESDValue))
    stdout.flush()
    data = ser.readline()
    data = data.split(b"\n")[0]
    print(data)
    if(check_stop() == "True"):
        if(data != "ERROR" or data != b''):
            print("ReadQR")
            QRValueLock.acquire()
            QRValue = data
            QRValueLock.release()
            print("read Finished")
            print("ESD VALUE DESDE QR = "+ str(ESDValue))
            StoreLock.acquire()
            if(ESDValue is not None):
                print("Store desde QR")
                storeData()
            StoreLock.release()
    
    
            
# ============ ESD READER FUNCITON ====================
# Data is read from the USB-6000.
# The ESDconfig file declares how many readings are done, and the time intervals between them.
def readESD(detectTask):
    global readTimes
    global ESDValueLock
    global ESDValue
    
    if daqConnected:
        print("ReadESD")
        value=0
        for timeValue in readTimes:
            time.sleep(float(timeValue))
            read = detectTask.read()
            value = value + read[1]

        value = value / len(readTimes)
        value=(value-3)*200
        ESDValue=value
        stdout.flush()

    else:
        ESDValue=(randint(10000, 50000)/10000)

# ============ Store Data Function ====================
# An ESD Value and a QRcode are taken, joined into a json and uploaded to the DB
def storeData():
    global QRValueLock
    global QRValue
    global ESDValue

    valueQR=QRValue
    print("QRValue = " +  str(valueQR))
    print("ESDValue = " + str(ESDValue))
    if(QRValue != b'' and ESDValue is not None):
        try:   
            print("Store")   
            QRValueLock.acquire()
            valueQR=QRValue
            valueQR=valueQR.decode('UTF-8')
            QRValueLock.release()
            valueESD=ESDValue
            point = Point("Estatica").tag("Line", machineName).field("Estatica", valueESD).field("QR", valueQR).tag("QRCode", str(valueQR))
            write_api.write(bucket, org, point)
            stdout.flush()
        except:
            print("Error")
    else:
        print("No se guarda")     
    
# ============ CPK Function ====================
def cpk():
    while True and not stopThreads:
        if(check_stop()  == "False"):
            return
        time.sleep(1)
        USL = 100
        LSL = -100
        stdout.flush()
        query = f'from(bucket:"{bucket}") |> range(start: -1d) |> filter(fn: (r) => r._measurement == "Estatica" and r._field == "Estatica" and r.Line == "'+machineName+'")'
        tables = client.query_api().query(query, org=org)
        if(len(tables)):
            data_list=[]
            for x in range(len(tables)):
                for x in tables[x]:
                    data_list.append(x["_value"])

            standard_deviation = np.std(data_list)

            cpl = (np.mean(data_list)-LSL)/(3*standard_deviation)
            cpu=(USL-np.mean(data_list))/(3*standard_deviation)

            cpk=(min(cpl,cpu))
            point = Point("CPK").tag("Line", machineName).field("cpk", cpk)
            write_api.write(bucket, org, point)
    
    client.close()
            



# ============ Piece Detection Function ====================
# Loops waiting for a detection signal, and then calls ReadESD() and StoreData() functions.
# Once the value is read, the program awaits for the detection sensor to stop giving signal
def pieceDetection():
    global StoreLock
    global QRValue
    global ESDValue
    detected = True
    if(not detectionConnected):
        detectTask = nidaqmx.Task("Detect")
        detectTask.ai_channels.add_ai_voltage_chan("Dev1/ai3,Dev1/ai5")
        detectTask.start()
        while True and not stopThreads:
            if(check_stop()  == "False"):                
                return
            time.sleep(10)     
            ser.cancel_read()
            ser.read_all()
            ESDValue = None
            print(ESDValue)
            QRValue = b""                
            readQRThread = threading.Thread(target=readQR)
            readQRThread.start()   
            readESD(detectTask)
            StoreLock.acquire()                          
            storeData()       
            StoreLock.release()        
            stdout.flush()    
    else:
        detectTask = nidaqmx.Task("Detect")
        detectTask.ai_channels.add_ai_voltage_chan("Dev1/ai3,Dev1/ai5")
        detectTask.start()
        while True and not stopThreads:
            time.sleep(0.1)
            read = detectTask.read() 
            if(check_stop()  == "False"):
                return         
            if(read[0] > 5):
                ser.cancel_read()
                ser.flushInput()
                ESDValue = None
                QRValue = b""                 
                readQRThread = threading.Thread(target=readQR)
                readQRThread.start()   
                readESD(detectTask)   
                StoreLock.acquire()                         
                if(QRValue != b""):                   
                    print("Store desde ESD")
                    storeData()
                StoreLock.release()  
                while read[0] > 5 and not stopThreads:
                    time.sleep(0.1)
                    read = detectTask.read()

    detectTask.stop()
    detectTask.close()
    ser.close()


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
def check_stop() :
    file = open(os.path.join(here, "running.txt"))
    closed=(file.read())

    file.close()
    return closed


# ====================== Main ======================
if __name__ == '__main__':
    stopThreads = False
    loadConf()
    detectionThread = threading.Thread(target=pieceDetection)
    detectionThread.start()
    cpkThread = threading.Thread(target=cpk)
    cpkThread.start()

    while check_stop()  == "True":
       time.sleep(2)

    stopThreads = True
    
    ser.close()

