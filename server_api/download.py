from datetime import datetime
import json
import csv
import sys

from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

# You can generate a Token from the "Tokens Tab" in the UI
from datetime import datetime

from influxdb_client import InfluxDBClient, Point, WritePrecision
from influxdb_client.client.write_api import SYNCHRONOUS

# You can generate a Token from the "Tokens Tab" in the UI
token = "sTcIzlzmiWy0Ri23Woop1gLF4cSuTwBRyaSH2f530dXfr3dEolQ8u_-0UzJc-rcWp_72MOmtSQKx-lwhffCB5g=="
org = "E7"
bucket = "Lear"

client = InfluxDBClient(url="http://localhost:8086", token=token)

start = sys.argv[1]
end = sys.argv[2]
query = f'from(bucket:"{bucket}") |> range(start: '+start+', stop: '+end+') |> filter(fn: (r) => r._measurement == "Estatica" and r._field == "Estatica"'

query = query + ")"
tables = client.query_api().query(query, org=org)
print(tables)
with open ("ESD.csv",'w', newline="") as csvfile:
    filewritter = csv.writer(csvfile, delimiter=",")
    filewritter.writerow(["Time","QR","Line","ESD"])
    
    for table in tables:
        for thing in table:
            time = thing["_time"]
            filewritter.writerow([time.strftime("%d-%m-%Y %H:%M:%S %Z"),thing["QRCode"],thing["Line"],str(thing["_value"]).replace(".", ",")])

