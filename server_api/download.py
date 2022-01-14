from datetime import datetime
import json
import csv
import sys

from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

# You can generate a Token from the "Tokens Tab" in the UI
token = "sb1mNiKmHmo-SUKLXTgJQDCBxGPFPL5lNQ0CnFCLubdiGKFhBicyOdVpIpqq3OWi5Hew83-4-wy-DAtx6rcnGw=="
org = "E7"
bucket = "Lear"

client = InfluxDBClient(url="http://localhost:8086", token=token)


query = f'from(bucket:"{bucket}") |> range(start: - '+sys.argv[1]+') |> filter(fn: (r) => r._measurement == "Estatica" and r._field == "Estatica"'

if(sys.argv[2] != "all"):
    query = query + ' and r.Line == "' + sys.argv[2] + '"'
    
query = query + ")"

tables = client.query_api().query(query, org=org)
with open ("ESD.csv",'w', newline="") as csvfile:
    filewritter = csv.writer(csvfile, delimiter=",")
    filewritter.writerow(["Time","QR","Line","ESD"])
    
    for table in tables:
        for thing in table:
            filewritter.writerow([thing["_time"],thing["QRCode"],thing["Line"],str(thing["_value"]).replace(".", ",")])

