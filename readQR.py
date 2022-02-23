import time
from random import randint
import serial
from serial import Serial
from influxdb import InfluxDBClient
import os

#client = InfluxDBClient(host='localhost',port=8086, username='admin', password='P12345wd!', database='Lear')


value = 100
temp= 23
hum= 63
ser = serial.Serial('COM3', 9600)
lastdata=-1
print(ser)
while True:
    data = ser.readline()    
    data = data.split(b"\n")[0]
    print(data)
    if(data != "ERROR\n"):
        if(data!=lastdata):
            lastdata=0
            print(data)
            value = value + randint(0,2) - 1
            aux = randint(0,10)
            if(aux == 0):
                temp = temp -1
            elif(aux == 10):
                temp = temp +1
            
            aux = randint(0,10)
            if(aux == 0):
                hum = hum -1
            elif(aux == 10):
                hum = hum +1
                
            json = []
            data = {
                "measurement": "Estatica",
                "fields":{
                    "Estatica": value, 
                    "QRCode": data,
                    "Temp": temp,
                    "Hum": hum,
                }
            }
            #json.append(data)
            #client.write_points(json)
    
    
    