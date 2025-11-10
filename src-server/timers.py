import time

import datetime as dt

import json

from pathlib import Path

import os

 

import psycopg2

 

from logbook import timers as logbook

import utils

 

DB_CONNECT = "dbname='postgres' host='localhost' port='8000' user='postgres' password='n3ur01S'"

SLEEP_ERROR = 1 / 60  # seconds

TIMER_INTERVAL = 1  # seconds

 

def sleep(t: int) -> None:

    sleep_time = t - time.time()

    if sleep_time > SLEEP_ERROR:

        time.sleep(sleep_time - SLEEP_ERROR)

 

def active_wait(t: int) -> int:

    while t > time.time():

        pass

    else:

        return t + TIMER_INTERVAL

       

def main(send_files_pipe) -> None:

 

    def send_files(mode: str, file: str, call: str, data: list[tuple]) -> bytes:

        send_files_pipe.send((

            mode,

            os.path.sep + os.path.normpath(file),

            utils.format_data(call, data)

        ))

 

    db = psycopg2.connect(DB_CONNECT)

    cursor = db.cursor()

   

    t = int(time.time()) + TIMER_INTERVAL

 

    EVENTS = (

        logbook.Timer(t),

        logbook.Date(t),

        logbook.Timeslot(t),

    )

 

    while True:

        sleep(t)

        t = active_wait(t)

        for event in EVENTS:

            if event.time != event.time_check(t):

                event.start_interval(cursor, send_files)

 

        db.commit()

 

if __name__ == "__main__":

    pass