from datetime import datetime,timezone
from time import time

utc_dt = datetime.now(timezone.utc)
print(utc_dt)
dt = utc_dt.astimezone()
print(dt)
print(utc_dt.replace(tzinfo=timezone.utc).astimezone(tz=None))