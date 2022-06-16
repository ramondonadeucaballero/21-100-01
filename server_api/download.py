from datetime import datetime, timezone, tzinfo
import json
import csv
import sys
from dotenv import load_dotenv
import os
from sys import stdout

load_dotenv()

from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

from datetime import datetime

from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

# You can generate a Token from the "Tokens Tab" in the UI
token = os.getenv('ADMIN_TOKEN')
org = os.getenv('ORG')
bucket = os.getenv('BUCKET')

client = InfluxDBClient(url="http://localhost:8086", token=token)

start = sys.argv[1]
end = sys.argv[2]
query = f'from(bucket:"{bucket}") |> range(start: '+start+', stop: '+end+') |> filter(fn: (r) => r._measurement == "Estatica" and r._field == "Estatica"'

query = query + ")"
stdout.flush()

tables = client.query_api().query(query, org=org)
print(tables)
with open ("ESD.csv",'w', newline="") as csvfile:
    filewritter = csv.writer(csvfile, delimiter=",")
    filewritter.writerow(["Time","QR","Line","ESD"])
    
    for table in tables:
        for thing in table:
            time = thing["_time"]
            time = time.replace(tzinfo=timezone.utc).astimezone(tz=None)
            filewritter.writerow([time.strftime("%d-%m-%Y %H:%M:%S"),thing["QRCode"],thing["Line"],str(thing["_value"]).replace(".", ",")])

