import time
from random import randint
import serial
from serial import Serial
from influxdb import InfluxDBClient
import os
import nidaqmx

detectTask = nidaqmx.Task("Detect")
detectTask.ai_channels.add_ai_voltage_chan("Dev1/ai3,Dev1/ai5")
detectTask.start()

while True:
    time.sleep(0.1)
    read = detectTask.read() 
    print(read)