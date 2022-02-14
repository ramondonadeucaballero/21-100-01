from datetime import datetime
import json
import csv
import sys

from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

# You can generate a Token from the "Tokens Tab" in the UI
token = "sb1mNiKmHmo-SUKLXTgJQDCBxGPFPL5lNQ0CnFCLubdiGKFhBicyOdVpIpqq3OWi5Hew83-4-wy-DAtx6rcnGw=="
org = "E7"
bucket = "LearOG"

client = InfluxDBClient(url="http://localhost:8086", token=token)

start = "2022-01-01T11:00:00.000Z"
end = "2022-02-14T11:00:00.000Z"

query = f'from(bucket:"{bucket}") |> range(start: '+start+', stop: '+end+') |> filter(fn: (r) => r._measurement == "Estatica" and r._field == "Estatica"'

query = query + ")"

tables = client.query_api().query(query, org=org)
with open ("C:/Users/ramon/Documents/GitHub/21-100-01/server_api/ESD.csv",'w', newline="") as csvfile:
    filewritter = csv.writer(csvfile, delimiter=",")
    filewritter.writerow(["Time","QR","Line","ESD"])
    
    for table in tables:
        for thing in table:
            time = thing["_time"]
            filewritter.writerow([time.strftime("%d-%m-%Y %H:%M:%S %Z"),thing["QRCode"],thing["Line"],str(thing["_value"]).replace(".", ",")])

